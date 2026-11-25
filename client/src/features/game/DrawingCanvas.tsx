import React, { useRef, useEffect, useCallback } from 'react';
import { Point, Stroke } from '@sketchly/shared';
import { socket } from '../../services/socket';

export interface DrawingCanvasProps {
  isDrawer: boolean;
  currentColor: string;
  currentSize: number;
  isEraser: boolean;
  onStrokeRecorded?: (stroke: Stroke) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawer,
  currentColor,
  currentSize,
  isEraser,
  onStrokeRecorded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // In-memory strokes for local re-renders (undo / redraw)
  const strokesRef = useRef<Stroke[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<Point[]>([]);
  const pendingBatchRef = useRef<Point[]>([]);
  const batchTimerRef = useRef<number | null>(null);

  // Remote active strokes map: strokeId -> Stroke
  const remoteStrokesRef = useRef<Map<string, Stroke>>(new Map());

  /**
   * Clears the HTML canvas.
   */
  const clearLocalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  /**
   * Redraws all strokes in `strokesRef.current`.
   */
  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearLocalCanvas();

    const w = canvas.width;
    const h = canvas.height;

    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 0) continue;

      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
      ctx.lineWidth = (stroke.size / 800) * Math.min(w, h);

      if (stroke.points.length === 1) {
        const pt = stroke.points[0];
        ctx.arc(pt.x * w, pt.y * h, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else {
        ctx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const xc = ((stroke.points[i].x + stroke.points[i + 1].x) / 2) * w;
          const yc = ((stroke.points[i].y + stroke.points[i + 1].y) / 2) * h;
          ctx.quadraticCurveTo(stroke.points[i].x * w, stroke.points[i].y * h, xc, yc);
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x * w, last.y * h);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [clearLocalCanvas]);

  /**
   * Resizes canvas to match container while keeping aspect ratio.
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    redrawAllStrokes();
  }, [redrawAllStrokes]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  /**
   * Flushes batched points to server over socket.
   */
  const flushBatch = useCallback(() => {
    if (pendingBatchRef.current.length > 0) {
      socket.emit('draw:move', { points: [...pendingBatchRef.current] });
      pendingBatchRef.current = [];
    }
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
  }, []);

  // --- Pointer Handlers (Drawer Only) ---

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    isDrawingRef.current = true;
    currentPointsRef.current = [{ x: nx, y: ny }];
    pendingBatchRef.current = [];

    // Capture pointer
    e.currentTarget.setPointerCapture(e.pointerId);

    // Emit draw:start
    socket.emit('draw:start', {
      x: nx,
      y: ny,
      color: currentColor,
      size: currentSize,
      isEraser,
    });

    // Create local stroke
    const stroke: Stroke = {
      id: `local_${Date.now()}`,
      points: [{ x: nx, y: ny }],
      color: currentColor,
      size: currentSize,
      isEraser,
    };
    strokesRef.current.push(stroke);

    // Paint initial dot
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const w = canvas.width;
      const h = canvas.height;
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = isEraser ? '#ffffff' : currentColor;
      const strokeWidth = (currentSize / 800) * Math.min(w, h);
      ctx.arc(nx * w, ny * h, Math.max(1, strokeWidth / 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const pt = { x: nx, y: ny };
    currentPointsRef.current.push(pt);
    pendingBatchRef.current.push(pt);

    // Draw segment on local canvas
    const currentStroke = strokesRef.current[strokesRef.current.length - 1];
    if (currentStroke) {
      currentStroke.points.push(pt);

      const ctx = canvas.getContext('2d');
      if (ctx && currentStroke.points.length >= 2) {
        const pts = currentStroke.points;
        const p1 = pts[pts.length - 2];
        const p2 = pts[pts.length - 1];

        const w = canvas.width;
        const h = canvas.height;

        ctx.save();
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentStroke.isEraser ? '#ffffff' : currentStroke.color;
        ctx.lineWidth = (currentStroke.size / 800) * Math.min(w, h);
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Throttle socket delta emissions to ~20ms
    if (!batchTimerRef.current) {
      batchTimerRef.current = window.setTimeout(() => {
        flushBatch();
      }, 20);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawingRef.current) return;

    isDrawingRef.current = false;
    flushBatch();
    socket.emit('draw:end');

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const lastStroke = strokesRef.current[strokesRef.current.length - 1];
    if (lastStroke && onStrokeRecorded) {
      onStrokeRecorded(lastStroke);
    }
  };

  // --- Remote Socket Listeners (All clients) ---

  useEffect(() => {
    const onRemoteStart = (payload: {
      strokeId: string;
      x: number;
      y: number;
      color: string;
      size: number;
      isEraser: boolean;
    }) => {
      const stroke: Stroke = {
        id: payload.strokeId,
        points: [{ x: payload.x, y: payload.y }],
        color: payload.color,
        size: payload.size,
        isEraser: payload.isEraser,
      };

      remoteStrokesRef.current.set(payload.strokeId, stroke);
      strokesRef.current.push(stroke);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = payload.isEraser ? '#ffffff' : payload.color;
      const strokeWidth = (payload.size / 800) * Math.min(w, h);
      ctx.arc(payload.x * w, payload.y * h, Math.max(1, strokeWidth / 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const onRemotePoints = (payload: { strokeId: string; points: Point[] }) => {
      let stroke = remoteStrokesRef.current.get(payload.strokeId);
      if (!stroke) {
        // Fallback to last stroke in array
        stroke = strokesRef.current[strokesRef.current.length - 1];
      }
      if (!stroke) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
      ctx.lineWidth = (stroke.size / 800) * Math.min(w, h);

      for (const pt of payload.points) {
        const last = stroke.points[stroke.points.length - 1];
        stroke.points.push(pt);
        if (last) {
          ctx.moveTo(last.x * w, last.y * h);
          ctx.lineTo(pt.x * w, pt.y * h);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const onRemoteEnd = (payload: { strokeId: string }) => {
      remoteStrokesRef.current.delete(payload.strokeId);
    };

    const onRemoteUndo = () => {
      strokesRef.current.pop();
      redrawAllStrokes();
    };

    const onRemoteClear = () => {
      strokesRef.current = [];
      remoteStrokesRef.current.clear();
      clearLocalCanvas();
    };

    const onHistory = (payload: { strokes: Stroke[] }) => {
      strokesRef.current = payload.strokes || [];
      redrawAllStrokes();
    };

    socket.on('draw:stroke_start', onRemoteStart);
    socket.on('draw:stroke_points', onRemotePoints);
    socket.on('draw:stroke_end', onRemoteEnd);
    socket.on('draw:undo_broadcast', onRemoteUndo);
    socket.on('draw:clear_broadcast', onRemoteClear);
    socket.on('draw:history', onHistory);

    return () => {
      socket.off('draw:stroke_start', onRemoteStart);
      socket.off('draw:stroke_points', onRemotePoints);
      socket.off('draw:stroke_end', onRemoteEnd);
      socket.off('draw:undo_broadcast', onRemoteUndo);
      socket.off('draw:clear_broadcast', onRemoteClear);
      socket.off('draw:history', onHistory);
    };
  }, [clearLocalCanvas, redrawAllStrokes]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[350px] sm:min-h-[460px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden select-none touch-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full block ${isDrawer ? 'canvas-cursor-draw' : 'canvas-cursor-default'}`}
        aria-label="Multiplayer drawing canvas"
        role="img"
      >
        Your browser does not support HTML5 Canvas.
      </canvas>

      {!isDrawer && (
        <div className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/60 backdrop-blur-sm rounded-lg text-[11px] font-medium text-white pointer-events-none">
          Spectating
        </div>
      )}
    </div>
  );
};
