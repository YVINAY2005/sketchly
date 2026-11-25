# Sketchly 🎨 — Real-Time Multiplayer Drawing & Guessing Game

Sketchly is a production-quality, server-authoritative multiplayer drawing and guessing game inspired by the mechanics of classic pictionary games. Built with React, TypeScript, Vite, Tailwind CSS, Node.js, Express, Socket.IO, and MongoDB, it features real-time canvas stroke synchronization, server-validated turn rotation, intelligent guess proximity matching, letter hints, and responsive mobile-ready gameplay.

---

## 🌟 Key Features

### 1. Room & Lobby System
- **Host Configuration:** Customizable match parameters including player limits (2–20), rounds (2–10), draw time (15–240s), word choices (1–5), hints count (0–5), word mode (`Normal`, `Hidden`, `Combination`), and custom word lists.
- **Invite Codes & Links:** One-click invite link copying (`/room/AB7KQ2`) and friendly 6-character room codes.
- **Roster & Moderation:** Live player roster, host migration on disconnect, ready status indicators, and host kick capability.
- **Public Room Discovery:** Live directory of open games joinable directly from the home screen.

### 2. Real-Time Drawing Canvas
- **Stroke-Based Protocol:** Captures point arrays instead of heavy canvas image frames. Points are streamed with delta batching (20ms intervals) for silky 60fps performance and minimal network overhead.
- **Normalized Coordinate Space:** Coordinates are normalized to `[0.0, 1.0]`, allowing players on desktop 4K screens, laptops, and mobile devices to view identical artwork regardless of local canvas aspect ratios.
- **Smoothing:** Quadratic Bézier curve interpolation prevents jagged lines.
- **Full Drawing Toolkit:** 14-color palette + custom color picker, 5 brush sizes, eraser, undo last stroke, and canvas wipe.
- **Canvas Resync:** Server maintains an active stroke history stack for the round, allowing reconnecting players or spectators to instantly paint up to the current state.

### 3. Server-Authoritative Game Engine
- **Turn Rotation:** Fair, deterministic turn order ensures every player draws an equal number of times per round.
- **Word System:** Curated dataset of 250+ family-safe words categorized across Animals, Food, Objects, Nature, Actions, Places, Professions, and Technology.
- **Security & Secret Words:** Non-drawers never receive the secret word or word options over the socket until the round completes.
- **Progressive Hint Engine:** Server gradually unmasks letters based on elapsed time milestones without revealing more than 50% of the word.
- **Normalized Guessing & Proximity Detection:** Guesses are trimmed, lowercased, and whitespace-collapsed. Levenshtein distance detects near-misses (e.g. 1 typo) and privately whispers `"{guess}" is very close!` to the guesser.
- **Anti-Spoiler Protection:** Players who have already guessed correctly cannot spoil the answer for others in chat.

### 4. Scoring & Leaderboard
- **Time-Decay Scoring:** Guessers earn points scaled by remaining time:
  $$\text{points} = \max\left(50, \text{round}\left(400 \times \frac{\text{timeRemaining}}{\text{totalDrawTime}}\right)\right) + \text{FirstGuesserBonus}(50)$$
- **Drawer Incentive:** Drawers earn bonus points ($+40$ pts) for each player who successfully deciphers their artwork.
- **Podium & Celebration:** Game-over screen with confetti fireworks, gold/silver/bronze podium, full match rankings, and "Play Again" restart.

### 5. Web Audio Sound Synthesizer
- Built-in zero-dependency Web Audio API synthesizer for clean sound effects:
  - Correct guess major chord ding
  - Near-miss soft double beep
  - Tick-tock urgency countdown for $<10$ seconds
  - Winner victory fanfare
  - Persistent volume mute toggle stored in `localStorage`.

---

## 🏗️ Architecture & Monorepo Structure

Sketchly is organized as a clean ES Module (ESM) monorepo:

```
sketchly/
├── shared/                     # Shared types, events, constants & words
│   ├── src/
│   │   ├── types.ts            # Domain entities (Player, Room, Stroke, GameState)
│   │   ├── events.ts           # Strongly-typed Socket.IO client/server events
│   │   ├── constants.ts        # Game rules, palette, scoring parameters
│   │   └── words.ts            # 250+ Categorized words dataset
├── server/                     # Node.js + Express + Socket.IO + Mongoose
│   ├── src/
│   │   ├── config/             # Environment configuration (env.ts)
│   │   ├── models/             # Mongoose schemas (RoomModel, GameSessionModel)
│   │   ├── game/               # OOP Game Engine
│   │   │   ├── Player.ts       # Player entity & round score tracker
│   │   │   ├── Game.ts         # Turn machine, timer, strokes, hint engine
│   │   │   ├── Room.ts         # Room roster, host authority, socket bridge
│   │   │   └── GameManager.ts  # Room registry, room code generator, cleanup
│   │   ├── socket/             # Socket routing & handler classes
│   │   │   ├── drawHandler.ts  # Stroke validation, undo, clear
│   │   │   ├── chatHandler.ts  # Guess normalization & proximity check
│   │   │   └── socketHandler.ts# Connection lifecycle & event dispatch
│   │   ├── routes/             # REST API (/api/health, /api/rooms)
│   │   └── server.ts           # Express HTTP + Socket.IO bootstrap
│   └── tests/                  # Unit and integration test suite
└── client/                     # React 18 + Vite + TypeScript + Tailwind CSS
    └── src/
        ├── components/         # Reusable primitives (Button, Modal, Input, Avatar)
        ├── features/
        │   ├── home/           # Landing, Room code input, Public rooms
        │   ├── create/         # Room settings configuration form
        │   ├── lobby/          # Roster, ready up, invite copy, host controls
        │   └── game/           # Canvas, DrawingToolbar, Sidebar, Header, Chat, Modals
        ├── services/           # Socket client & Web Audio synthesizer
        └── utils/              # Coordinate transforms
```

---

## 🔄 State Machine & Turn Lifecycle

```
             [ LOBBY ]
                 |  (Host clicks "Start Game" with 2+ players)
                 v
        [ WORD_SELECTION ]  (Drawer offered 3 choices; 15s timer)
                 |  (Drawer selects word OR auto-select timeout)
                 v
            [ DRAWING ]     (Round timer: 60–120s)
                 |          - Drawer draws strokes; others submit guesses
                 |          - Hints revealed as time elapses
                 |          - Concludes on timeout OR all guessers succeed
                 v
           [ ROUND_END ]    (Word revealed, round scores tallied; 5s break)
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

| Event | Direction | Payload | Description |
|---|---|---|---|
| `room:create` | Client -> Server | `{ hostName, avatar, settings }` | Creates room and assigns host |
| `room:join` | Client -> Server | `{ roomCode, playerName, avatar }` | Joins room by code |
| `room:state` | Server -> Client | `{ roomCode, settings, players, gameState }` | Sanitized game & room snapshot |
| `game:start` | Client -> Server | `{}` | Host initiates the match |
| `game:round_start`| Server -> Client | `{ round, drawerId, wordOptions? }` | Starts turn (`wordOptions` only to drawer) |
| `game:select_word`| Client -> Server | `{ word }` | Drawer selects their chosen word |
| `game:word_chosen`| Server -> Client | `{ maskedWord, wordLength, category }` | Starts drawing timer with masked blanks |
| `draw:start` | Client -> Server | `{ x, y, color, size, isEraser }` | Drawer begins stroke (normalized 0–1) |
| `draw:move` | Client -> Server | `{ points: [{x, y}] }` | Batched delta points |
| `draw:end` | Client -> Server | `{}` | Drawer releases stroke |
| `draw:undo` | Client -> Server | `{}` | Drawer pops last stroke |
| `draw:clear` | Client -> Server | `{}` | Drawer clears entire canvas |
| `draw:stroke_start`| Server -> Client | `{ strokeId, x, y, color, size }` | Broadcasts stroke begin |
| `draw:stroke_points`| Server -> Client| `{ strokeId, points }` | Broadcasts point delta to spectators |
| `chat:send` | Client -> Server | `{ text }` | Submits guess or chat |
| `guess:result` | Server -> Client | `{ correct, isClose, playerId, points }`| Correct/close guess notification |
| `chat:message` | Server -> Client | `{ senderName, text, type }` | Chat or system announcement |
| `game:round_end`| Server -> Client | `{ word, scores, nextDrawerName }` | Turn results summary |
| `game:over` | Server -> Client | `{ podium, allPlayers }` | Match podium and winner |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v20+ or v22+)
- npm (v10+)
- (Optional) MongoDB running locally or MongoDB Atlas connection string. If MongoDB is not present, the server automatically runs in **in-memory mode** without interruption.

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd game
npm install
```

### 2. Build Shared Package
```bash
npm run build --workspace=shared
```

### 3. Start Development Servers
```bash
# Runs backend on http://localhost:3001 and Vite frontend on http://localhost:5173
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

Sketchly features a unit and integration test suite using **Vitest**:
- State machine transitions (`LOBBY` -> `WORD_SELECTION` -> `DRAWING` -> `ROUND_END` -> `GAME_OVER`)
- Secret word sanitization (ensuring non-drawers cannot inspect target words over payloads)
- Levenshtein proximity matching & case/whitespace normalization
- Scoring equations, first guesser bonus, drawer bonuses
- Stroke normalization and undo/clear mechanics
- Room manager code generation and host migration on disconnect
- Real Socket.IO client-server multi-player integration flow

Run the test suite:
```bash
npm run test --workspace=server
```

---

## 🐳 Docker Setup

Run the full production stack (Sketchly + MongoDB) using Docker Compose:

```bash
docker-compose up --build
```
Access the application at [http://localhost:3001](http://localhost:3001).

---

## 🌐 Production Deployment

### Option A: Render (Full-Stack Single Web Service)
1. Fork or push this repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Connect your repository.
4. Set:
   - **Environment:** `Node`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
5. Configure environment variables in the Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `CLIENT_URL`: `https://your-service-name.onrender.com`
6. Deploy! Render will build shared, client, and server, and serve the application with WebSocket support.

### Option B: Separate Frontend (Vercel) + Backend (Render/Railway)
1. **Backend (Render / Railway):**
   - Deploy `server/` with `npm start`
   - Set `CLIENT_URL=https://your-app.vercel.app`
2. **Frontend (Vercel):**
   - Root Directory: `client`
   - Build Command: `npm run build --workspace=shared && npm run build --workspace=client`
   - Output Directory: `dist`
   - Environment Variable: `VITE_SERVER_URL=https://your-backend.onrender.com`

---

## 💡 How to Explain the Implementation in an Interview

1. **Why Normalized Coordinates?**
   - Different clients have varying screen sizes (e.g. mobile 360px vs desktop 800px).
   - If raw pixel coordinates `(x, y)` were sent, drawings would appear distorted or off-screen on different devices.
   - Normalized coordinates `(x / width, y / height)` map values to `[0.0, 1.0]`. Each receiving client multiplies by their own canvas dimensions, ensuring synchronization across all devices.

2. **Why Delta Streaming Instead of Full Canvas Frames?**
   - Sending canvas images (`toDataURL` or PNG blobs) on every mouse movement consumes massive bandwidth (megabytes per second per client) and creates visual lag.
   - Streaming batched point deltas (`[{x, y}]` every 20ms) consumes less than 1KB/sec per drawer, resulting in 60fps real-time strokes.

3. **How is Security & Anti-Cheat Guaranteed?**
   - The game engine is strictly server-authoritative.
   - The secret word is **never** sent to non-drawers during the round. The `getSnapshot(requestingPlayerId)` method dynamically filters `selectedWord` and `wordChoices` to `null` for everyone except the active drawer.
   - The server validates that only the current drawer can emit drawing strokes, undo, or clear events.

4. **How Does Guess Matching Work?**
   - Guess strings are sanitized through a normalization pipeline: `text.trim().toLowerCase().replace(/\s+/g, ' ')`.
   - Exact normalized matches trigger points calculation and notify the room without revealing the plaintext word.
   - Proximity checking uses the Levenshtein distance algorithm: words with distance $\le 1$ trigger an ephemeral private hint to guide the guesser.

5. **How are Disconnects Handled?**
   - If a drawer leaves mid-round, the server automatically ends the turn safely, tallies scores, and rotates to the next drawer.
   - If the host disconnects, host authority is migrated to the next connected player.
   - If a player refreshes, their session token rebinds their socket connection without disrupting match state.
