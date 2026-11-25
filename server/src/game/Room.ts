import { Server } from 'socket.io';
import { GAME_CONSTANTS } from '../constants/game.js';
import { Player as IPlayer, PublicRoomSummary, RoomSettings } from '../types/index.js';
import { ClientToServerEvents, ServerToClientEvents } from '../socket/events.js';
import { Player } from './Player.js';
import { Game } from './Game.js';
import { RoomModel } from '../models/RoomModel.js';
import { isDbConnected } from '../services/dbService.js';

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export class Room {
  public code: string;
  public hostId: string = '';
  public settings: RoomSettings;
  public players: Map<string, Player> = new Map(); // key: playerId
  public socketToPlayerMap: Map<string, string> = new Map(); // socketId -> playerId
  public game: Game;
  public io: TypedServer;
  public createdAt: Date = new Date();

  constructor(code: string, io: TypedServer, initialSettings?: Partial<RoomSettings>) {
    this.code = code;
    this.io = io;
    this.settings = {
      maxPlayers: initialSettings?.maxPlayers ?? GAME_CONSTANTS.DEFAULT_MAX_PLAYERS,
      rounds: initialSettings?.rounds ?? GAME_CONSTANTS.DEFAULT_ROUNDS,
      drawTime: initialSettings?.drawTime ?? GAME_CONSTANTS.DEFAULT_DRAW_TIME,
      wordCount: initialSettings?.wordCount ?? GAME_CONSTANTS.DEFAULT_WORD_CHOICES,
      hints: initialSettings?.hints ?? GAME_CONSTANTS.DEFAULT_HINTS,
      wordMode: initialSettings?.wordMode ?? 'Normal',
      isPublic: initialSettings?.isPublic ?? false,
      category: initialSettings?.category ?? 'all',
      customWords: initialSettings?.customWords ?? [],
    };

    // Instantiate game engine with decoupled callbacks
    this.game = new Game(
      this.code,
      this.settings,
      () => this.players,
      {
        onStateChange: () => this.broadcastRoomState(),
        onRoundStart: (drawerId, wordOptions) => {
          const drawer = this.players.get(drawerId);
          // Broadcast to everyone without secret choices
          this.io.to(this.code).emit('game:round_start', {
            round: this.game.currentRound,
            totalRounds: this.game.totalRounds,
            drawerId,
            drawerName: drawer?.name || 'Unknown',
            drawTime: this.settings.drawTime,
          });

          // Send word options ONLY to drawer's socket
          if (drawer) {
            this.io.to(drawer.socketId).emit('game:round_start', {
              round: this.game.currentRound,
              totalRounds: this.game.totalRounds,
              drawerId,
              drawerName: drawer.name,
              drawTime: this.settings.drawTime,
              wordOptions,
            });
          }
        },
        onWordChosen: (maskedWord, wordLength, category, drawTime) => {
          this.io.to(this.code).emit('game:word_chosen', {
            maskedWord,
            wordLength,
            category,
            drawTime,
          });
        },
        onPrivateWord: (drawerSocketId, word) => {
          this.io.to(drawerSocketId).emit('game:private_word', { word });
        },
        onHintRevealed: (maskedWord, hintsRevealed) => {
          this.io.to(this.code).emit('game:hint', { maskedWord, hintsRevealed });
        },
        onRoundEnd: (result) => {
          this.io.to(this.code).emit('game:round_end', result);
        },
        onGameOver: (winner) => {
          this.io.to(this.code).emit('game:over', winner);
        },
        onTimerTick: (timeRemaining) => {
          // Timer ticks can be sent or synced via game:state snapshots
        },
      }
    );
  }

  /**
   * Adds or reconnects a player to this room.
   */
  public addPlayer(
    socketId: string,
    name: string,
    avatar: string,
    existingPlayerId?: string
  ): { player: Player; isReconnect: boolean; error?: string } {
    // Check if room is full
    const connectedCount = Array.from(this.players.values()).filter(p => p.isConnected).length;
    if (connectedCount >= this.settings.maxPlayers && !existingPlayerId) {
      return { player: null as any, isReconnect: false, error: 'Room is full' };
    }

    // Handle reconnection
    if (existingPlayerId && this.players.has(existingPlayerId)) {
      const existing = this.players.get(existingPlayerId)!;
      // Re-map socket
      this.socketToPlayerMap.delete(existing.socketId);
      existing.socketId = socketId;
      existing.isConnected = true;
      this.socketToPlayerMap.set(socketId, existing.id);

      return { player: existing, isReconnect: true };
    }

    // New player creation
    const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isHost = this.players.size === 0;
    const player = new Player(playerId, socketId, name, avatar, isHost);

    if (isHost) {
      this.hostId = playerId;
    }

    this.players.set(playerId, player);
    this.socketToPlayerMap.set(socketId, playerId);

    return { player, isReconnect: false };
  }

  /**
   * Disconnects or removes a player by socket ID.
   */
  public handleDisconnect(socketId: string): { player: Player | null; roomEmpty: boolean } {
    const playerId = this.socketToPlayerMap.get(socketId);
    if (!playerId) return { player: null, roomEmpty: false };

    const player = this.players.get(playerId);
    if (!player) return { player: null, roomEmpty: false };

    player.isConnected = false;
    this.socketToPlayerMap.delete(socketId);

    // If still in lobby, remove player completely
    if (this.game.phase === 'LOBBY') {
      this.players.delete(playerId);
    } else {
      // In active game, handle turn skip if needed
      this.game.handlePlayerDisconnect(playerId);
    }

    // If host disconnected, transfer host to next connected player
    if (this.hostId === playerId) {
      const nextHost = Array.from(this.players.values()).find(p => p.isConnected && p.id !== playerId);
      if (nextHost) {
        this.hostId = nextHost.id;
        nextHost.isHost = true;
      }
    }

    const connectedPlayers = Array.from(this.players.values()).filter(p => p.isConnected);
    const roomEmpty = connectedPlayers.length === 0;

    if (!roomEmpty) {
      this.io.to(this.code).emit('room:player_left', {
        playerId,
        playerName: player.name,
        players: this.getPlayerList(),
        newHostId: this.hostId,
      });
      this.broadcastRoomState();
    }

    return { player, roomEmpty };
  }

  /**
   * Allows host to kick a player.
   */
  public kickPlayer(requesterSocketId: string, targetPlayerId: string): boolean {
    const requesterId = this.socketToPlayerMap.get(requesterSocketId);
    if (requesterId !== this.hostId) return false;
    if (targetPlayerId === this.hostId) return false;

    const target = this.players.get(targetPlayerId);
    if (!target) return false;

    // Disconnect target socket from room
    this.io.to(target.socketId).emit('room:error', { message: 'You have been kicked by the host.' });
    this.players.delete(targetPlayerId);
    this.socketToPlayerMap.delete(target.socketId);

    this.io.to(this.code).emit('room:player_left', {
      playerId: targetPlayerId,
      playerName: target.name,
      players: this.getPlayerList(),
    });
    this.broadcastRoomState();
    return true;
  }

  /**
   * Updates room settings (host only).
   */
  public updateSettings(requesterSocketId: string, newSettings: Partial<RoomSettings>): boolean {
    const requesterId = this.socketToPlayerMap.get(requesterSocketId);
    if (requesterId !== this.hostId) return false;
    if (this.game.phase !== 'LOBBY') return false;

    if (newSettings.maxPlayers !== undefined) {
      this.settings.maxPlayers = Math.max(
        GAME_CONSTANTS.MIN_PLAYERS,
        Math.min(GAME_CONSTANTS.MAX_PLAYERS, newSettings.maxPlayers)
      );
    }
    if (newSettings.rounds !== undefined) {
      this.settings.rounds = Math.max(
        GAME_CONSTANTS.MIN_ROUNDS,
        Math.min(GAME_CONSTANTS.MAX_ROUNDS, newSettings.rounds)
      );
      this.game.totalRounds = this.settings.rounds;
    }
    if (newSettings.drawTime !== undefined) {
      this.settings.drawTime = Math.max(
        GAME_CONSTANTS.MIN_DRAW_TIME,
        Math.min(GAME_CONSTANTS.MAX_DRAW_TIME, newSettings.drawTime)
      );
      this.game.totalDrawTime = this.settings.drawTime;
    }
    if (newSettings.wordCount !== undefined) {
      this.settings.wordCount = Math.max(
        GAME_CONSTANTS.MIN_WORD_CHOICES,
        Math.min(GAME_CONSTANTS.MAX_WORD_CHOICES, newSettings.wordCount)
      );
    }
    if (newSettings.hints !== undefined) {
      this.settings.hints = Math.max(
        GAME_CONSTANTS.MIN_HINTS,
        Math.min(GAME_CONSTANTS.MAX_HINTS, newSettings.hints)
      );
    }
    if (newSettings.wordMode !== undefined) {
      this.settings.wordMode = newSettings.wordMode;
    }
    if (newSettings.isPublic !== undefined) {
      this.settings.isPublic = newSettings.isPublic;
    }
    if (newSettings.category !== undefined) {
      this.settings.category = newSettings.category;
    }
    if (newSettings.customWords !== undefined) {
      this.settings.customWords = newSettings.customWords;
    }

    this.io.to(this.code).emit('room:settings_updated', { settings: this.settings });
    this.broadcastRoomState();
    return true;
  }

  public toggleReady(socketId: string): boolean {
    const playerId = this.socketToPlayerMap.get(socketId);
    if (!playerId) return false;
    const player = this.players.get(playerId);
    if (!player) return false;

    player.isReady = !player.isReady;
    this.broadcastRoomState();
    return true;
  }

  public startGame(requesterSocketId: string): { success: boolean; error?: string } {
    const requesterId = this.socketToPlayerMap.get(requesterSocketId);
    if (requesterId !== this.hostId) {
      return { success: false, error: 'Only the host can start the game.' };
    }

    const connectedCount = Array.from(this.players.values()).filter(p => p.isConnected).length;
    if (connectedCount < GAME_CONSTANTS.MIN_PLAYERS) {
      return { success: false, error: `At least ${GAME_CONSTANTS.MIN_PLAYERS} players are required to start.` };
    }

    const started = this.game.start();
    if (!started) {
      return { success: false, error: 'Failed to start game.' };
    }

    // Persist room record in MongoDB if connected
    if (isDbConnected()) {
      RoomModel.findOneAndUpdate(
        { roomCode: this.code },
        {
          hostName: this.players.get(this.hostId)?.name || 'Host',
          settings: this.settings,
          $inc: { gamesPlayed: 1 },
        },
        { upsert: true }
      ).catch(() => {});
    }

    this.broadcastRoomState();
    return { success: true };
  }

  public restartGame(requesterSocketId: string): boolean {
    const requesterId = this.socketToPlayerMap.get(requesterSocketId);
    if (requesterId !== this.hostId) return false;

    this.game.restart();
    this.broadcastRoomState();
    return true;
  }

  public getPlayerList(): IPlayer[] {
    return Array.from(this.players.values()).map(p => p.toJSON());
  }

  /**
   * Broadcasts room state to all sockets in the room, sanitizing the secret word per player!
   */
  public broadcastRoomState(): void {
    for (const player of this.players.values()) {
      if (!player.isConnected) continue;

      const playerSnapshot = this.game.getSnapshot(player.id);
      this.io.to(player.socketId).emit('room:state', {
        roomCode: this.code,
        settings: this.settings,
        players: this.getPlayerList(),
        hostId: this.hostId,
        gameState: playerSnapshot,
      });
    }
  }

  public getSummary(): PublicRoomSummary {
    const host = this.players.get(this.hostId);
    return {
      roomCode: this.code,
      hostName: host?.name || 'Anonymous',
      playerCount: Array.from(this.players.values()).filter(p => p.isConnected).length,
      maxPlayers: this.settings.maxPlayers,
      phase: this.game.phase,
      currentRound: this.game.currentRound,
      totalRounds: this.settings.rounds,
      isPublic: this.settings.isPublic,
    };
  }
}

