import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  GAME_CONSTANTS,
  ServerToClientEvents,
} from '@sketchly/shared';
import { GameManager } from '../game/GameManager.js';
import { DrawHandler } from './drawHandler.js';
import { ChatHandler } from './chatHandler.js';

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  const gameManager = GameManager.getInstance();
  gameManager.setIO(io);

  io.on('connection', (socket: Socket) => {
    // 1. Create Room
    socket.on('room:create', (payload, callback) => {
      try {
        const hostName = (payload.hostName || 'Host').trim().slice(0, GAME_CONSTANTS.MAX_PLAYER_NAME_LENGTH);
        const avatar = payload.avatar || '🎨';

        const room = gameManager.createRoom(payload.settings);
        const { player } = room.addPlayer(socket.id, hostName, avatar);

        socket.join(room.code);
        DrawHandler.register(socket, room);
        ChatHandler.register(socket, room);

        if (typeof callback === 'function') {
          callback({ success: true, roomCode: room.code });
        }

        room.broadcastRoomState();
      } catch (err: unknown) {
        console.error('[Socket] room:create error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to create room.' });
        }
      }
    });

    // 2. Join Room
    socket.on('room:join', (payload, callback) => {
      try {
        const roomCode = (payload.roomCode || '').toUpperCase().trim();
        const playerName = (payload.playerName || 'Player').trim().slice(0, GAME_CONSTANTS.MAX_PLAYER_NAME_LENGTH);
        const avatar = payload.avatar || '🎨';

        const room = gameManager.getRoom(roomCode);
        if (!room) {
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Room not found. Check the code and try again.' });
          }
          return;
        }

        const { player, isReconnect, error } = room.addPlayer(
          socket.id,
          playerName,
          avatar,
          payload.playerId
        );

        if (error) {
          if (typeof callback === 'function') {
            callback({ success: false, error });
          }
          return;
        }

        socket.join(room.code);
        DrawHandler.register(socket, room);
        ChatHandler.register(socket, room);

        if (typeof callback === 'function') {
          callback({ success: true, roomCode: room.code, playerId: player.id });
        }

        // Notify room of joined player
        if (!isReconnect) {
          room.io.to(room.code).emit('room:player_joined', {
            player: player.toJSON(),
            players: room.getPlayerList(),
          });
        }

        // Send canvas stroke history to newly joined/reconnected player
        if (room.game.phase === 'DRAWING' && room.game.strokes.length > 0) {
          socket.emit('draw:history', { strokes: room.game.strokes });
        }

        room.broadcastRoomState();
      } catch (err: unknown) {
        console.error('[Socket] room:join error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to join room.' });
        }
      }
    });

    // 3. Leave Room
    socket.on('room:leave', () => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (room) {
        socket.leave(room.code);
        const { roomEmpty } = room.handleDisconnect(socket.id);
        if (roomEmpty) {
          gameManager.removeRoom(room.code);
        }
      }
    });

    // 4. Update Settings (Host only)
    socket.on('room:update_settings', (payload) => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (room && payload.settings) {
        room.updateSettings(socket.id, payload.settings);
      }
    });

    // 5. Toggle Ready State
    socket.on('room:toggle_ready', () => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (room) {
        room.toggleReady(socket.id);
      }
    });

    // 6. Kick Player (Host only)
    socket.on('room:kick_player', (payload) => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (room && payload.playerId) {
        room.kickPlayer(socket.id, payload.playerId);
      }
    });

    // 7. Start Game (Host only)
    socket.on('game:start', () => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const res = room.startGame(socket.id);
      if (!res.success && res.error) {
        socket.emit('room:error', { message: res.error });
      }
    });

    // 8. Select Word (Drawer only)
    socket.on('game:select_word', (payload) => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const playerId = room.socketToPlayerMap.get(socket.id);
      if (playerId && payload.word) {
        room.game.selectWord(payload.word, playerId);
      }
    });

    // 9. Restart Game (Host only)
    socket.on('game:restart', () => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (room) {
        room.restartGame(socket.id);
      }
    });

    // 10. Disconnect
    socket.on('disconnect', () => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (room) {
        const { roomEmpty } = room.handleDisconnect(socket.id);
        if (roomEmpty) {
          gameManager.removeRoom(room.code);
        }
      }
    });
  });
}
