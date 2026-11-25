import { Socket } from 'socket.io';
import { GAME_CONSTANTS } from '../constants/game.js';
import { ChatMessage } from '../types/index.js';
import { Room } from '../game/Room.js';

export class ChatHandler {
  // Simple in-memory rate limiting map: socketId -> lastMessageTimestamp[]
  private static rateLimitMap: Map<string, number[]> = new Map();

  private static isRateLimited(socketId: string): boolean {
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(socketId) || [];
    const recent = timestamps.filter(t => now - t < 2000);
    recent.push(now);
    this.rateLimitMap.set(socketId, recent);

    return recent.length > 5; // more than 5 messages in 2 seconds
  }

  public static register(socket: Socket, room: Room): void {
    socket.on('chat:send', (payload: { text: string }) => {
      const playerId = room.socketToPlayerMap.get(socket.id);
      if (!playerId) return;

      const player = room.players.get(playerId);
      if (!player) return;

      if (this.isRateLimited(socket.id)) {
        socket.emit('chat:message', {
          id: `sys_${Date.now()}`,
          text: 'Please slow down your messages.',
          type: 'system',
          timestamp: Date.now(),
        });
        return;
      }

      const text = typeof payload.text === 'string' ? payload.text.trim().slice(0, GAME_CONSTANTS.MAX_CHAT_LENGTH) : '';
      if (!text) return;

      const now = Date.now();
      const messageId = `msg_${now}_${Math.random().toString(36).substring(2, 6)}`;

      // In DRAWING phase, validate guesses
      if (room.game.phase === 'DRAWING') {
        // If drawer attempts to guess:
        if (room.game.currentDrawerId === playerId) {
          // Drawer cannot guess or spoil the word
          socket.emit('chat:message', {
            id: `sys_${now}`,
            text: 'You are the drawer! You cannot guess.',
            type: 'system',
            timestamp: now,
          });
          return;
        }

        // If player already guessed correctly this round:
        if (player.hasGuessedCorrectly) {
          // Only broadcast to other players who have already guessed correctly so word isn't spoiled
          for (const p of room.players.values()) {
            if (p.hasGuessedCorrectly || p.id === room.game.currentDrawerId) {
              room.io.to(p.socketId).emit('chat:message', {
                id: messageId,
                senderId: player.id,
                senderName: player.name,
                text,
                type: 'chat',
                timestamp: now,
              });
            }
          }
          return;
        }

        // Check guess against target word
        const guessResult = room.game.submitGuess(playerId, text);

        if (guessResult.isCorrect) {
          // Notify room of successful guess (do NOT reveal the word text!)
          room.io.to(room.code).emit('guess:result', {
            correct: true,
            playerId: player.id,
            playerName: player.name,
            points: guessResult.pointsAwarded,
          });

          // System announcement
          const successMsg: ChatMessage = {
            id: `correct_${now}_${player.id}`,
            senderId: player.id,
            senderName: player.name,
            text: `${player.name} guessed the word! (+${guessResult.pointsAwarded} pts)`,
            type: 'correct',
            timestamp: now,
          };
          room.io.to(room.code).emit('chat:message', successMsg);

          // Broadcast updated scores
          room.broadcastRoomState();
          return;
        }

        if (guessResult.isClose) {
          // Send private notice ONLY to this player
          socket.emit('chat:message', {
            id: `close_${now}`,
            text: `"${text}" is very close!`,
            type: 'close',
            timestamp: now,
          });
          // Broadcast wrong guess to room as well
        }

        // Incorrect guess: broadcast normally
        const guessMsg: ChatMessage = {
          id: messageId,
          senderId: player.id,
          senderName: player.name,
          text,
          type: 'guess',
          timestamp: now,
        };
        room.io.to(room.code).emit('chat:message', guessMsg);
        return;
      }

      // Outside drawing phase: normal chat message
      const chatMsg: ChatMessage = {
        id: messageId,
        senderId: player.id,
        senderName: player.name,
        text,
        type: 'chat',
        timestamp: now,
      };
      room.io.to(room.code).emit('chat:message', chatMsg);
    });
  }
}

