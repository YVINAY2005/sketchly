import { describe, it, expect, beforeEach } from 'vitest';
import { Room } from '../src/game/Room.js';
import { GameManager } from '../src/game/GameManager.js';
import { Server } from 'socket.io';

describe('Room & GameManager', () => {
  let mockIo: any;

  beforeEach(() => {
    mockIo = {
      to: () => ({
        emit: () => {},
      }),
    };
  });

  it('generates friendly 6-character room codes', () => {
    const gameManager = GameManager.getInstance();
    const code = gameManager.generateRoomCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[2-9A-Z]+$/);
    // Ensure no confusing 0, 1, O, I
    expect(code).not.toMatch(/[01OI]/);
  });

  it('assigns first player as host and handles player join', () => {
    const room = new Room('TEST99', mockIo);
    const { player: p1 } = room.addPlayer('sock_1', 'Alice', '🎨');
    expect(p1.isHost).toBe(true);
    expect(room.hostId).toBe(p1.id);

    const { player: p2 } = room.addPlayer('sock_2', 'Bob', '🚀');
    expect(p2.isHost).toBe(false);
    expect(room.players.size).toBe(2);
  });

  it('migrates host role when host disconnects', () => {
    const room = new Room('TEST88', mockIo);
    const { player: p1 } = room.addPlayer('sock_1', 'Alice', '🎨');
    const { player: p2 } = room.addPlayer('sock_2', 'Bob', '🚀');

    expect(room.hostId).toBe(p1.id);

    room.handleDisconnect('sock_1');

    expect(room.hostId).toBe(p2.id);
    expect(p2.isHost).toBe(true);
  });

  it('supports reconnection of existing player', () => {
    const room = new Room('TEST77', mockIo);
    const { player: p1 } = room.addPlayer('sock_1', 'Alice', '🎨');

    // Simulate refresh/reconnect
    const { player: reconnected, isReconnect } = room.addPlayer(
      'sock_new_99',
      'Alice',
      '🎨',
      p1.id
    );

    expect(isReconnect).toBe(true);
    expect(reconnected.id).toBe(p1.id);
    expect(reconnected.socketId).toBe('sock_new_99');
    expect(reconnected.isConnected).toBe(true);
  });
});
