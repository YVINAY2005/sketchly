# Sketchly Canvas Engine & Frontend Architecture

This document details the implementation of the HTML5 Canvas synchronization engine, coordinate normalization, Bézier curve smoothing, performance optimizations, procedural audio synthesis, and the arcade gaming UI design system.

---

## 1. Real-Time Vector Canvas Engine

Sketchly eschews heavy raster bitmap streaming (which causes network lag and requires megabytes of bandwidth) in favor of **vector stroke streaming**.

### 1. The Stroke Data Model
A drawing operation is represented as a structured vector object:
```ts
export interface Point {
  x: number; // Normalized coordinate in range [0.0, 1.0]
  y: number; // Normalized coordinate in range [0.0, 1.0]
}

export interface Stroke {
  id: string;         // Unique stroke UUID
  points: Point[];    // Sequence of recorded points
  color: string;      // CSS Hex color (e.g., "#ea580c")
  size: number;       // Relative brush diameter (e.g., 2 to 24)
  isEraser: boolean;  // True if erasing to white background
}
```

---

## 2. Coordinate Normalization & Device Independence

Players may participate using diverse screen sizes: mobile phones (e.g. 390px wide), laptops (1440px wide), or ultrawide desktop monitors (3840px wide).

### Why Normalized Coordinates?
If raw physical pixels $(x, y)$ were broadcast:
- A stroke drawn across 300px on an iPhone would occupy only a tiny fraction of a 4K desktop monitor.
- Aspect ratio mismatches would displace lines, destroying the artwork.

### Normalization Pipeline:
1. **Input Normalization (Drawer Client):**
   When the mouse or touch moves across the canvas:
   $$x_{\text{norm}} = \frac{e.\text{clientX} - \text{rect}.\text{left}}{\text{rect}.\text{width}}$$
   $$y_{\text{norm}} = \frac{e.\text{clientY} - \text{rect}.\text{top}}{\text{rect}.\text{height}}$$
   Values are clamped to $[0.0, 1.0]$.

2. **Output Denormalization (Viewer / Spectator Client):**
   When rendering remote points onto the local HTML5 Canvas:
   $$x_{\text{pixel}} = x_{\text{norm}} \times \text{canvas}.\text{width}$$
   $$y_{\text{pixel}} = y_{\text{norm}} \times \text{canvas}.\text{height}$$

3. **Relative Brush Thickness:**
   Brush thickness scales proportionally with canvas dimensions, ensuring lines appear consistent regardless of canvas size:
   $$\text{lineWidth} = \left(\frac{\text{stroke}.\text{size}}{800}\right) \times \min(\text{canvas}.\text{width}, \text{canvas}.\text{height})$$

---

## 3. High-Performance Curve Smoothing

Drawing individual line segments between discrete mouse points often results in jagged, polygonal lines. Sketchly applies **Quadratic Bézier Curve Interpolation** through point midpoints:

```ts
ctx.moveTo(points[0].x * w, points[0].y * h);

for (let i = 1; i < points.length - 1; i++) {
  // Compute midpoint between current point and next point
  const midX = ((points[i].x + points[i + 1].x) / 2) * w;
  const midY = ((points[i].y + points[i + 1].y) / 2) * h;

  // Curve through current point towards the midpoint
  ctx.quadraticCurveTo(points[i].x * w, points[i].y * h, midX, midY);
}

// Connect final segment
const last = points[points.length - 1];
ctx.lineTo(last.x * w, last.y * h);
ctx.stroke();
```

---

## 4. 20ms Delta Point Batching & Zero React State

### Why Batching?
High-resolution gaming mice emit pointer events at up to 1,000Hz (1,000 events/second). Emitting a Socket.IO event for every raw pointer event causes network buffer saturation and severe frame rate drops.

### The 20ms Accumulator:
1. When the drawer moves, normalized points are appended to an in-memory buffer (`pendingBatchRef.current`).
2. An interval timer flushes the buffer every **20 milliseconds** ($\approx 50\text{Hz}$):
   ```ts
   if (pendingBatchRef.current.length > 0) {
     socket.emit('draw:move', { points: [...pendingBatchRef.current] });
     pendingBatchRef.current = [];
   }
   ```
3. This guarantees continuous 60fps rendering while capping socket throughput at less than **1KB per second**.

### Zero React State for Drawing
React component re-renders are CPU-intensive. Storing drawing coordinates in React `useState` would trigger thousands of unnecessary virtual DOM diffs during a single stroke.
- Drawing states are stored strictly in mutable `useRef` handles (`strokesRef`, `isDrawingRef`, `currentPointsRef`).
- Rendering writes directly to the 2D canvas context via `requestAnimationFrame`.
- React re-renders are triggered **only** for game phase changes, player list updates, and chat messages.

---

## 5. Web Audio API Procedural Synthesizer

Sketchly features a built-in sound engine (`client/src/services/audio.ts`) implemented entirely with the native browser **Web Audio API**. It requires zero external `.mp3` or `.wav` files, eliminating 404 asset errors, loading delays, and CDN overhead.

### Synthesized Sound Types:

| Sound | Oscillators | Frequencies / Waveform | Usage |
|---|---|---|---|
| **Pop** | 1 Oscillator + Gain Ramp | Sine: 400Hz $\to$ 800Hz (80ms decay) | Button clicks, color selections |
| **Correct Guess** | 2 Oscillators (Major 3rd) | Sine: 523.25Hz ($C_5$) + 659.25Hz ($E_5$) | When user or opponent solves word |
| **Near Miss** | 1 Oscillator (Two pulses) | Triangle: 350Hz (Double pulse) | When guess is 1 letter away |
| **Urgent Tick** | 1 Oscillator + High-pass | Woodblock click: 900Hz $\to$ 300Hz | Timer countdown $<10$ seconds |
| **Victory Fanfare** | 4-Note Arpeggio | $C_5 \to E_5 \to G_5 \to C_6$ (500ms duration) | Match completion / Podium screen |

- **User Gesture Autoplay Unlock:** Re-engages suspended `AudioContext` on first user click.
- **Persistent Mute:** Saved in `localStorage.getItem('sketchly_muted')`.

---

## 6. Arcade Gaming Design System

Sketchly features an intentional **tactile arcade gaming aesthetic**:

1. **Dark Gaming Arena Backdrop:**
   - Deep midnight navy base: `#0a0f24`
   - Radial ambient energy glows: `#1e294b`
   - Dual-color star & arcade dot grid pattern
2. **Tactile 3D Physical Buttons (`Button.tsx`):**
   - Chunky 3px/4px border outlines (`border-slate-900`)
   - 4px solid drop shadows (`shadow-[0_4px_0_#18181b]`)
   - 4px downward travel on click (`active:translate-y-1 active:shadow-none`)
3. **Scrabble Tile Letter Hint Displays (`GameHeader.tsx`):**
   - Each unmasked letter renders inside an individual tactile block.
   - Letters reveal with an energetic pop-in spring animation.
4. **Drawing Easel Frame (`DrawingCanvas.tsx`):**
   - Framed within a bold 4px arcade bezel.
   - Fixed 16:10 / 4:3 responsive drawing ratio with high-contrast active color rings.
5. **Scoreboard & Leaderboard Podium (`PlayerSidebar.tsx`, `GameOverModal.tsx`):**
   - Real-time score ordering with custom rank medals (👑, 🥇, 🥈, 🥉).
   - Animated paint brushes indicating the current drawer.
   - Green pulse badges for players who have correctly solved the secret word.
