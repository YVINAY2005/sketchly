# Sketchly 🎨 — Real-Time Multiplayer Drawing & Guessing Game

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B%20%7C%20v22%2B-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest Tests](https://img.shields.io/badge/Tests-21%2F21%20Passing-brightgreen?logo=vitest)](https://vitest.dev/)

Sketchly is a production-quality, server-authoritative multiplayer drawing and guessing game built with modern web technologies. Designed with a clean **two-tier architecture** (`client/` and `server/`), Sketchly delivers real-time vector stroke synchronization, server-validated turn rotations, progressive letter hints, Levenshtein proximity matching, zero-dependency procedural audio synthesis, and an immersive arcade gaming design system.

---

## 📚 Complete Project Documentation

For deep technical dives, refer to the dedicated guides in the [**`docs/`**](./docs/) directory:

- 🏛️ [**System Architecture (`docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md): Two-tier layout, authoritative state machine, REST vs WebSocket boundaries, and security model.
- 📡 [**Socket.IO Specification (`docs/SOCKET_SPECIFICATION.md`)**](./docs/SOCKET_SPECIFICATION.md): Full typed WebSocket event reference, payloads, callbacks, and normalized coordinates.
- ⚙️ [**Game Engine & Rules (`docs/GAME_ENGINE.md`)**](./docs/GAME_ENGINE.md): `GameManager`, `Room`, `Player`, `Game` entities, turn queues, time-decay scoring equations, hints, and proximity algorithms.
- 🖌️ [**Canvas & Audio Engine (`docs/FRONTEND_CANVAS.md`)**](./docs/FRONTEND_CANVAS.md): HTML5 Canvas vector streaming, Bézier smoothing, 20ms delta batching, zero-React-state loop, Web Audio synthesizer, and arcade UI.
- 🧪 [**Setup & Testing Guide (`docs/SETUP_AND_TESTING.md`)**](./docs/SETUP_AND_TESTING.md): Environment configuration, running dev and production servers, Vitest test suite, and multi-tab QA scenarios.
- 🚀 [**Deployment Guide (`docs/DEPLOYMENT_GUIDE.md`)**](./docs/DEPLOYMENT_GUIDE.md): Step-by-step production setup on Vercel (Frontend) and Render (Backend) with live MongoDB Atlas.

---

## 🌟 Key Features

### 1. Room & Lobby System
- **Custom Match Rules:** Configurable player limits (2–20), rounds (2–10), draw time (15–240s), word choices (1–5), hints (0–5), and custom word lists.
- **Instant Sharing:** Dedicated **"COPY CODE"** (6-character code) and **"COPY LINK"** (full invite URL) buttons with clipboard confirmation.
- **Roster & Moderation:** Live player readiness indicators, avatar selection, host kick controls, and automated host migration if the room owner leaves.
- **Public Room Discovery:** Live directory of open matches joinable directly from the homepage via REST API.

### 2. Real-Time Drawing Canvas
- **Vector Stroke Streaming:** Transmits point arrays instead of heavy canvas image bitmaps, enabling 60fps real-time drawing with $<1\text{KB/s}$ bandwidth.
- **Normalized Coordinates:** All stroke coordinates are normalized to $[0.0, 1.0]$, ensuring identical rendering across 4K desktop screens, laptops, and mobile phones.
- **Quadratic Bézier Smoothing:** Midpoint curve interpolation eliminates jagged polygonal lines.
- **Complete Drawing Suite:** 14-color palette + custom color picker, 5 brush sizes, eraser, undo last stroke, and canvas wipe.
- **Canvas Resync:** Server stores active stroke history, allowing reconnecting players or spectators to instantly reconstruct current artwork.

### 3. Server-Authoritative Game Engine
- **Strict Authority:** The client cannot choose its own drawer, calculate its own score, validate its own guess, or advance rounds.
- **Secret Word Security:** Non-drawers never receive the secret word or word choices over the network until the turn concludes. Words are dynamically masked (`_ _ _ _`) by the server.
- **Progressive Hint Engine:** Server gradually reveals letter blanks based on countdown milestones (capped at $\le 50\%$ of the word).
- **Intelligent Proximity Matching:** Guesses are sanitized (trimmed, lowercased, punctuation removed). Levenshtein distance detects near-misses ($\le 1$ typo) and whispers `"very close!"` privately to the guesser.
- **Anti-Spoiler Protection:** Players who have guessed correctly can only chat with fellow successful guessers, preventing answer leaks.

### 4. Dynamic Scoring System
- **Time-Decay Guesser Scoring:**
  $$\text{points} = \max\left(50, \text{round}\left(400 \times \frac{\text{timeRemaining}}{\text{totalDrawTime}}\right)\right) + \text{FirstGuesserBonus}(50)$$
- **Drawer Incentive:** Drawers receive $+40\text{ pts}$ for each player who successfully deciphers their artwork.
- **Arcade Podium:** Final game-over screen with confetti, Gold/Silver/Bronze medals, full match rankings, and host "Play Again" reset.

### 5. Web Audio API Procedural Synthesizer
- Built-in zero-dependency Web Audio synthesizer (no missing `.mp3` files or external asset loading):
  - Pop sound (button clicks, palette tools)
  - Ding chord (correct guess)
  - Double pulse (near-miss whisper)
  - Tick-tock urgency click ($<10$ seconds remaining)
  - Victory fanfare arpeggio (winner podium)
  - Persistent volume mute toggle stored in `localStorage`.

### 6. Arcade Gaming Design System
- Deep midnight gaming arena background (`#0a0f24`) with ambient radial glow and star/grid pattern.
- Tactile 3D physical buttons with 4px border depth and downward press travel.
- Scrabble-tile letter hint blocks with spring pop-in animations.
- Dark HUD navbar with live pulsing room connection badge.

---

## 🏗️ Project Architecture & Directory Layout

Sketchly strictly adheres to a **two-tier architecture** with zero `shared/` package dependencies:

```text
game/
│
├── client/                     # Frontend Application (React 18 + Vite + TS + Tailwind)
│   ├── src/
│   │   ├── components/         # Reusable primitives (Button, Modal, Input, Avatar, Badge)
│   │   ├── constants/          # UI constants, color palettes, brush sizes
│   │   ├── features/           # Feature views (home, create, join, lobby, game)
│   │   ├── services/           # Socket.IO client instance & Web Audio synthesizer
│   │   ├── socket/             # Client typed Socket.IO event definitions
│   │   ├── types/              # Frontend view models & UI state
│   │   ├── utils/              # Coordinate transforms
│   │   ├── App.tsx             # Routes & RouterProvider
│   │   ├── main.tsx            # React entrypoint
│   │   └── index.css           # Tailwind base, dark arcade arena theme
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                     # Backend Service (Node.js + Express + Socket.IO + TS)
│   ├── src/
│   │   ├── config/             # Environment validation (env.ts)
│   │   ├── constants/          # Scoring parameters, time limits, default rules
│   │   ├── data/               # 250+ Curated words across 8 categories
│   │   ├── game/               # OOP Game Engine (GameManager, Room, Player, Game)
│   │   ├── models/             # Mongoose schemas (Room, GameSession)
│   │   ├── routes/             # REST endpoints (/api/health, /api/rooms)
│   │   ├── socket/             # Socket.IO handlers (drawHandler, chatHandler, socketHandler)
│   │   ├── types/              # Backend domain interfaces & state snapshots
│   │   ├── utils/              # Levenshtein distance, string sanitization
│   │   └── server.ts           # Express HTTP + Socket.IO bootstrap & static serving
│   ├── tests/                  # Vitest unit and integration tests (21 tests)
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                       # Comprehensive Technical Documentation
│   ├── ARCHITECTURE.md         # Architecture, authority, state flow, security
│   ├── SOCKET_SPECIFICATION.md # Full typed WebSocket events dictionary
│   ├── GAME_ENGINE.md          # State machine, scoring, hints, proximity
│   ├── FRONTEND_CANVAS.md      # Canvas engine, Bézier curves, Web Audio, UI
│   ├── SETUP_AND_TESTING.md    # Setup, running, Vitest tests, manual QA
│   └── README.md               # Docs index
│
├── .gitignore
├── package.json                # Workspace orchestration scripts
└── README.md                   # This document
```

---

## 🔄 Turn Lifecycle State Machine

```text
             [ LOBBY ]
                 |  (Host clicks "Start Game" with 2+ players)
                 v
        [ WORD_SELECTION ]  (Drawer offered 3 choices; 15s timer)
                 |  (Drawer selects word OR auto-select timeout)
                 v
            [ DRAWING ]     (Round timer: 15–240s)
                 |          - Drawer draws strokes; others submit guesses
                 |          - Progressive hints unmasked as time elapses
                 |          - Ends on timeout OR all guessers succeed
                 v
           [ ROUND_END ]    (Word revealed, turn scores tallied; 5s break)
                 |
        +────────┴──────────────────────────+
        | Has everyone drawn this round?    |
        | - No:  Next turn -> [ WORD_SELECTION ]
        | - Yes: If rounds left -> Next Round
        | - Yes: If all rounds done ->      |
        +───────────────────────────────────+
                 |
                 v
           [ GAME_OVER ]    (Podium, winner fanfare, confetti, Play Again)
                 |
                 v
             [ LOBBY ]
```

---

## 📡 WebSocket Event Architecture

| Event | Direction | Payload Summary | Description |
|---|---|---|---|
| `room:create` | Client -> Server | `{ hostName, avatar, settings }` | Creates room and assigns host |
| `room:join` | Client -> Server | `{ roomCode, playerName, avatar }` | Joins room by 6-char code |
| `room:state` | Server -> Client | `{ roomCode, settings, players, gameState }` | Sanitized room snapshot |
| `room:toggle_ready` | Client -> Server | `{}` | Toggles player readiness |
| `room:update_settings`| Client -> Server| `{ settings }` | Host updates match rules |
| `game:start` | Client -> Server | `{}` | Host starts match ($\ge 2$ players) |
| `game:round_start`| Server -> Room | `{ round, drawerId, wordOptions? }` | Starts turn (`wordOptions` to drawer only) |
| `game:select_word`| Client -> Server | `{ word }` | Drawer selects chosen word |
| `game:word_chosen`| Server -> Room | `{ maskedWord, wordLength, category }` | Starts drawing timer with masked blanks |
| `game:hint` | Server -> Room | `{ maskedWord, hintsRevealed }` | Unmasks incremental letter hint |
| `draw:start` | Client -> Server | `{ x, y, color, size, isEraser }` | Drawer begins stroke (normalized 0–1) |
| `draw:move` | Client -> Server | `{ points: [{x, y}] }` | 20ms batched delta points |
| `draw:end` | Client -> Server | `{}` | Drawer releases stroke |
| `draw:undo` | Client -> Server | `{}` | Drawer removes last stroke |
| `draw:clear` | Client -> Server | `{}` | Drawer wipes canvas |
| `chat:send` | Client -> Server | `{ text }` | Submits guess or chat |
| `guess:result` | Server -> Client | `{ correct, isClose, points }` | Private guess feedback & audio cue |
| `chat:message` | Server -> Room | `{ senderName, text, type }` | Chat or system announcement |
| `game:round_end`| Server -> Room | `{ word, scores, reason }` | Turn results summary |
| `game:over` | Server -> Room | `{ winner, podium, allPlayers }` | Match podium and winner |

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v20+ or v22+ LTS)
- npm (v10+)
- (Optional) MongoDB running locally. If omitted, Sketchly runs automatically in **in-memory mode** without interruption.

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd game
npm install
```

### 2. Configure Environment Files
```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### 3. Start Development Servers
```bash
# Starts Express backend on http://localhost:3001 and Vite frontend on http://localhost:5173
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing Suite

Sketchly features a unit and integration test suite using **Vitest**:
- State machine transitions (`LOBBY` $\to$ `WORD_SELECTION` $\to$ `DRAWING` $\to$ `ROUND_END` $\to$ `GAME_OVER`)
- Secret word sanitization (non-drawers cannot inspect target words over socket payloads)
- Levenshtein proximity matching & case/whitespace normalization
- Scoring equations, first guesser bonus, drawer bonuses
- Stroke normalization, undo, and clear mechanics
- Room manager code generation and host migration on disconnect
- Real Socket.IO client-server multi-player integration flow

Run tests:
```bash
npm run test --prefix server
```

Expected result:
```text
 ✓ tests/game.test.ts (11 tests)
 ✓ tests/room.test.ts (4 tests)
 ✓ tests/integration.test.ts (6 tests)

 Test Files  3 passed (3)
      Tests  21 passed (21)
```

---

## 💡 Technical Interview Highlights & Architectural Justifications

1. **Why Normalized Coordinates?**
   - Players use devices ranging from 390px mobile screens to 4K ultrawide monitors.
   - Broadcasting raw pixel coordinates $(x, y)$ breaks synchronization across different aspect ratios.
   - Normalizing coordinates to $[0.0, 1.0]$ allows each client to multiply by its local canvas width and height, guaranteeing pixel-perfect scaling across all devices.

2. **Why Delta Vector Streaming Instead of Canvas Images?**
   - Capturing canvas images via `toDataURL` or PNG blobs consumes megabytes per second per client, leading to network lag.
   - Streaming lightweight point deltas every 20ms consumes $<1\text{KB/s}$, achieving silky 60fps real-time strokes.

3. **How is Secret Word Security Guaranteed?**
   - The game engine is strictly server-authoritative.
   - The `getSnapshot(requestingPlayerId)` method dynamically filters `selectedWord` and `wordChoices` to `null` for everyone except the active drawer.
   - The server validates that only the active drawer can emit drawing strokes, undo, or clear events.

4. **How Does Guess Matching & Proximity Detection Work?**
   - Guesses pass through a sanitization pipeline: `text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').replace(/\s+/g, ' ')`.
   - Exact matches calculate time-decay scores and notify the room without exposing the plaintext answer.
   - Non-matching guesses are evaluated using the Levenshtein distance algorithm: words with distance $\le 1$ trigger an ephemeral private whisper `"'{guess}' is very close!"` to assist the guesser.

5. **How are Disconnections & Host Migration Handled?**
   - If a drawer leaves mid-round, the server automatically ends the turn safely, tallies scores, and rotates to the next drawer.
   - If the room host disconnects, host authority is automatically migrated to the next connected player.
   - Reconnecting players retrieve the complete stroke history stack to reconstruct canvas artwork up to the current second.
