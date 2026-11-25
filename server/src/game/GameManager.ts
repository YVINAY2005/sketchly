import { Server } from 'socket.io';
import { PublicRoomSummary, RoomSettings } from '../types/index.js';
import { ClientToServerEvents, ServerToClientEvents } from '../socket/events.js';
import { Room, TypedServer } from './Room.js';

export class GameManager {
  private static instance: GameManager;
  private rooms: Map<string, Room> = new Map();
  private io: TypedServer | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Characters used for generating friendly room codes (avoiding 0/O, 1/I/L)
  private readonly CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  private constructor() {
    // Run cleanup check every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanupDeadRooms(), 60000);
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public setIO(io: TypedServer): void {
    this.io = io;
  }

  /**
   * Generates a unique 6-character room code.
   */
  public generateRoomCode(): string {
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * this.CODE_CHARS.length);
        code += this.CODE_CHARS[randomIndex];
      }
    } while (this.rooms.has(code));

    return code;
  }

  /**
   * Creates a new room.
   */
  public createRoom(initialSettings?: Partial<RoomSettings>): Room {
    if (!this.io) {
      throw new Error('Socket.IO instance has not been initialized on GameManager.');
    }

    const code = this.generateRoomCode();
    const room = new Room(code, this.io, initialSettings);
    this.rooms.set(code, room);
    console.log(`[GameManager] Room created: ${code}`);
    return room;
  }

  /**
   * Retrieves a room by its code (case-insensitive).
   */
  public getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase().trim());
  }

  /**
   * Finds the room a given socket belongs to.
   */
  public getRoomBySocketId(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.socketToPlayerMap.has(socketId)) {
        return room;
      }
    }
    return undefined;
  }

  /**
   * Removes a room.
   */
  public removeRoom(code: string): void {
    const room = this.rooms.get(code);
    if (room) {
      room.game.clearAllTimers();
      this.rooms.delete(code);
      console.log(`[GameManager] Room removed: ${code}`);
    }
  }

  /**
   * Returns summaries of all active public rooms.
   */
  public getPublicRooms(): PublicRoomSummary[] {
    const list: PublicRoomSummary[] = [];
    for (const room of this.rooms.values()) {
      if (room.settings.isPublic) {
        list.push(room.getSummary());
      }
    }
    return list;
  }

  /**
   * Cleans up empty or abandoned rooms.
   */
  private cleanupDeadRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      const activeCount = Array.from(room.players.values()).filter(p => p.isConnected).length;
      const ageHours = (now - room.createdAt.getTime()) / (1000 * 60 * 60);

      // If no active players for more than 5 minutes or room older than 6 hours
      if (activeCount === 0 || ageHours > 6) {
        this.removeRoom(code);
      }
    }
  }

  public getStats(): { totalRooms: number; activePlayers: number } {
    let activePlayers = 0;
    for (const room of this.rooms.values()) {
      activePlayers += Array.from(room.players.values()).filter(p => p.isConnected).length;
    }
    return {
      totalRooms: this.rooms.size,
      activePlayers,
    };
  }
}

