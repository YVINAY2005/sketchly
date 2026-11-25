import { Socket } from 'socket.io';
import { Point, Stroke } from '@sketchly/shared';
import { Room } from '../game/Room.js';

export class DrawHandler {
  /**
   * Validates if a coordinate is within normalized bounds [0.0, 1.0].
   */
  private static isValidCoordinate(val: number): boolean {
    return typeof val === 'number' && !isNaN(val) && val >= 0 && val <= 1;
  }

  /**
   * Registers drawing-related socket events.
   */
  public static register(socket: Socket, room: Room): void {
    // 1. Draw Start
    socket.on('draw:start', (payload: {
      x: number;
      y: number;
      color: string;
      size: number;
      isEraser: boolean;
    }) => {
      const playerId = room.socketToPlayerMap.get(socket.id);
      if (!playerId || room.game.currentDrawerId !== playerId || room.game.phase !== 'DRAWING') {
        return;
      }

      if (!this.isValidCoordinate(payload.x) || !this.isValidCoordinate(payload.y)) {
        return;
      }

      const size = Math.max(1, Math.min(60, Number(payload.size) || 5));
      const color = typeof payload.color === 'string' ? payload.color.slice(0, 30) : '#000000';
      const isEraser = Boolean(payload.isEraser);
      const strokeId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const started = room.game.startStroke(
        playerId,
        strokeId,
        payload.x,
        payload.y,
        color,
        size,
        isEraser
      );

      if (started) {
        // Broadcast stroke start to all other players in room
        socket.to(room.code).emit('draw:stroke_start', {
          strokeId,
          x: payload.x,
          y: payload.y,
          color,
          size,
          isEraser,
        });
      }
    });

    // 2. Draw Move (batched points)
    socket.on('draw:move', (payload: { points: Point[] }) => {
      const playerId = room.socketToPlayerMap.get(socket.id);
      if (!playerId || room.game.currentDrawerId !== playerId || room.game.phase !== 'DRAWING') {
        return;
      }

      if (!Array.isArray(payload.points) || payload.points.length === 0) {
        return;
      }

      // Filter and clamp points
      const validPoints: Point[] = [];
      for (const pt of payload.points.slice(0, 50)) { // limit max points per batch to prevent flood
        if (this.isValidCoordinate(pt.x) && this.isValidCoordinate(pt.y)) {
          validPoints.push({ x: pt.x, y: pt.y });
        }
      }

      if (validPoints.length === 0) return;

      // Append points to active stroke in game engine
      // Note: active stroke is tracked by player ID in the game
      const currentStroke = room.game.strokes[room.game.strokes.length - 1];
      // Broadcast points delta to all other players
      socket.to(room.code).emit('draw:stroke_points', {
        strokeId: currentStroke?.id || '',
        points: validPoints,
      });
    });

    // 3. Draw End
    socket.on('draw:end', () => {
      const playerId = room.socketToPlayerMap.get(socket.id);
      if (!playerId || room.game.currentDrawerId !== playerId || room.game.phase !== 'DRAWING') {
        return;
      }

      const currentStroke = room.game.strokes[room.game.strokes.length - 1];
      const strokeId = currentStroke?.id || '';
      room.game.endStroke(playerId, strokeId);

      socket.to(room.code).emit('draw:stroke_end', { strokeId });
    });

    // 4. Draw Undo
    socket.on('draw:undo', () => {
      const playerId = room.socketToPlayerMap.get(socket.id);
      if (!playerId || room.game.currentDrawerId !== playerId || room.game.phase !== 'DRAWING') {
        return;
      }

      const undone = room.game.undoStroke(playerId);
      if (undone) {
        room.io.to(room.code).emit('draw:undo_broadcast');
      }
    });

    // 5. Draw Clear
    socket.on('draw:clear', () => {
      const playerId = room.socketToPlayerMap.get(socket.id);
      if (!playerId || room.game.currentDrawerId !== playerId || room.game.phase !== 'DRAWING') {
        return;
      }

      const cleared = room.game.clearCanvas(playerId);
      if (cleared) {
        room.io.to(room.code).emit('draw:clear_broadcast');
      }
    });
  }
}
