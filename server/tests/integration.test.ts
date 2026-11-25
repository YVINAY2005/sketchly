import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import express from 'express';
import { ClientToServerEvents, ServerToClientEvents } from '@sketchly/shared';
import { setupSocketHandlers } from '../src/socket/socketHandler.js';

type TestSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

describe('End-to-End Multiplayer Flow via Socket.IO', () => {
  let httpServer: HttpServer;
  let ioServer: Server;
  let port: number;
  let hostSocket: TestSocket;
  let player2Socket: TestSocket;
  let roomCode: string;
  let drawerSocket: TestSocket;
  let guesserSocket: TestSocket;

  beforeAll(async () => {
    const app = express();
    httpServer = createServer(app);
    ioServer = new Server(httpServer, {
      cors: { origin: '*' },
    });
    setupSocketHandlers(ioServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (addr && typeof addr === 'object') {
          port = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (hostSocket?.connected) hostSocket.disconnect();
    if (player2Socket?.connected) player2Socket.disconnect();
    ioServer.close();
    httpServer.close();
  });

  it('Step 1: Host connects and creates a room', async () => {
    hostSocket = ClientIO(`http://localhost:${port}`, {
      transports: ['websocket'],
    }) as TestSocket;

    await new Promise<void>((resolve) => {
      hostSocket.on('connect', resolve);
    });

    expect(hostSocket.connected).toBe(true);

    const createRes = await new Promise<{ success: boolean; roomCode?: string }>((resolve) => {
      hostSocket.emit(
        'room:create',
        {
          hostName: 'AliceHost',
          avatar: '🎨',
          settings: {
            rounds: 2,
            drawTime: 60,
            wordCount: 3,
            hints: 2,
            wordMode: 'Normal',
            category: 'animals',
          },
        },
        resolve
      );
    });

    expect(createRes.success).toBe(true);
    expect(createRes.roomCode).toBeDefined();
    roomCode = createRes.roomCode!;
  });

  it('Step 2: Player 2 connects and joins the room via roomCode', async () => {
    player2Socket = ClientIO(`http://localhost:${port}`, {
      transports: ['websocket'],
    }) as TestSocket;

    await new Promise<void>((resolve) => {
      player2Socket.on('connect', resolve);
    });

    const joinRes = await new Promise<{ success: boolean; playerId?: string }>((resolve) => {
      player2Socket.emit(
        'room:join',
        {
          roomCode,
          playerName: 'BobGuesser',
          avatar: '🦊',
        },
        resolve
      );
    });

    expect(joinRes.success).toBe(true);
    expect(joinRes.playerId).toBeDefined();
  });

  it('Step 3: Host starts the game and drawer is identified', async () => {
    const roundStartPromise = new Promise<{ drawerId: string; drawerName: string }>((resolve) => {
      hostSocket.once('game:round_start', (data) => {
        resolve(data);
      });
    });

    hostSocket.emit('game:start');

    const roundData = await roundStartPromise;
    expect(roundData.drawerName).toBeDefined();

    if (roundData.drawerName === 'AliceHost') {
      drawerSocket = hostSocket;
      guesserSocket = player2Socket;
    } else {
      drawerSocket = player2Socket;
      guesserSocket = hostSocket;
    }

    expect(drawerSocket).toBeDefined();
    expect(guesserSocket).toBeDefined();
  });

  it('Step 4: Drawer selects a word and guesser receives masked hint', async () => {
    const wordChosenPromise = new Promise<any>((resolve) => {
      guesserSocket.once('game:word_chosen', resolve);
    });

    drawerSocket.emit('game:select_word', { word: 'elephant' });

    const chosenData = await wordChosenPromise;
    expect(chosenData.maskedWord).toBeDefined();
    expect(chosenData.wordLength).toBe(8);
  });

  it('Step 5: Drawer draws a stroke and guesser receives real-time stroke points', async () => {
    const strokeStartPromise = new Promise<any>((resolve) => {
      guesserSocket.once('draw:stroke_start', resolve);
    });

    drawerSocket.emit('draw:start', {
      x: 0.25,
      y: 0.5,
      color: '#ef4444',
      size: 10,
      isEraser: false,
    });

    const strokeData = await strokeStartPromise;
    expect(strokeData.x).toBe(0.25);
    expect(strokeData.y).toBe(0.5);
    expect(strokeData.color).toBe('#ef4444');
  });

  it('Step 6: Guesser sends correct guess, server validates and awards points', async () => {
    const guessResultPromise = new Promise<any>((resolve) => {
      guesserSocket.once('guess:result', resolve);
    });

    guesserSocket.emit('chat:send', { text: '  elephant  ' });

    const result = await guessResultPromise;
    expect(result.correct).toBe(true);
    expect(result.points).toBeGreaterThan(0);
  });
});
