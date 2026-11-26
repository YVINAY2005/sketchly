# Sketchly Setup, Development & Testing Guide

This guide walks through configuring, running, testing, and debugging Sketchly on local and staging environments.

---

## 1. Prerequisites

- **Node.js:** v20.x or v22.x LTS (Recommended)
- **Package Manager:** npm v10.x+
- **Database (Optional):** MongoDB running locally (`mongodb://localhost:27017/sketchly`) or MongoDB Atlas.
  > [!NOTE]
  > MongoDB is entirely optional for local development. If no connection string is provided, Sketchly automatically engages **high-speed in-memory mode** without throwing errors or halting execution.

---

## 2. Environment Variables Configuration

Sketchly uses distinct environment files for the `client/` and `server/` packages.

### Client Configuration (`client/.env`)
Copy the example template:
```bash
cp client/.env.example client/.env
```
Default values:
```env
# URL of the backend Express + Socket.IO server
VITE_SERVER_URL=http://localhost:3001
```

### Server Configuration (`server/.env`)
Copy the example template:
```bash
cp server/.env.example server/.env
```
Default values:
```env
# HTTP & WebSocket port
PORT=3001

# Allowed CORS client origin
CLIENT_URL=http://localhost:5173

# Optional MongoDB Connection String (leave blank for in-memory mode)
MONGODB_URI=mongodb://localhost:27017/sketchly

# Execution environment
NODE_ENV=development
```

---

## 3. Installation & Local Development

### 1. Install All Dependencies
Run from the root directory:
```bash
npm install
```
This automatically installs dependencies across both `client/` and `server/`.

### 2. Start Both Services Concurrently
From the root directory, run:
```bash
npm run dev
```
This executes:
- **Backend API & WebSockets:** Running on [http://localhost:3001](http://localhost:3001) with `tsx watch`.
- **Frontend Vite Dev Server:** Running on [http://localhost:5173](http://localhost:5173) with Hot Module Replacement (HMR).

### 3. Alternative: Running Separately in Two Terminals

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```

Open your browser to [http://localhost:5173](http://localhost:5173).

---

## 4. Production Build & Static Serving

The Express server in `server/src/server.ts` is configured to serve the compiled React Vite production build directly from `client/dist`.

### Build & Run Production:
```bash
# 1. Build client and compile server TypeScript
npm run build

# 2. Start the unified production server
npm run start
```
The entire application will now be available on a single port: [http://localhost:3001](http://localhost:3001).

---

## 5. Automated Testing Suite

Sketchly features a unit and integration test suite built with **Vitest**:

```bash
npm run test --prefix server
```

### Test Suite Structure:
- `server/tests/game.test.ts` (11 tests):
  - State machine transitions (`LOBBY` $\to$ `WORD_SELECTION` $\to$ `DRAWING` $\to$ `ROUND_END` $\to$ `GAME_OVER`).
  - Word masking and secret word security filters.
  - Levenshtein proximity detection and string normalization.
  - Time-decay scoring formulas and first-guesser bonuses.
  - Stroke history operations (add, undo, clear).
- `server/tests/room.test.ts` (4 tests):
  - Player admission, maximum capacity limits.
  - Ready status toggling.
  - Host migration upon host disconnect.
  - Custom match rule updates.
- `server/tests/integration.test.ts` (6 tests):
  - End-to-end Socket.IO client-server test.
  - Real TCP socket loopback connections simulating multiple players in a room.
  - Room creation, guest join, match initiation, turn rotation, drawing strokes, and chat message delivery.

---

## 6. Manual End-to-End Multi-Player Testing

To verify real-time multiplayer functionality on your local computer:

### Step 1: Open Two Separate Browser Windows
1. Open [http://localhost:5173](http://localhost:5173) in your normal browser (e.g. Chrome).
2. Open [http://localhost:5173](http://localhost:5173) in an **Incognito / Private Window** (or a different browser like Edge / Firefox) to ensure separate session storage.

### Step 2: Create a Room as Host (Window 1)
1. Enter player name (e.g. `"Alice"`), pick an avatar, and click **"CREATE A NEW ROOM"**.
2. Configure settings (e.g., 3 rounds, 75s draw time) and click **"CREATE ROOM"**.
3. You will land in the lobby with a 6-character room code (e.g. `ABC123`).

### Step 3: Join Room as Guest (Window 2)
1. On Window 2, enter player name (e.g. `"Bob"`).
2. Enter the 6-character code into the **"JOIN"** box, OR click **"COPY LINK"** in Window 1 and paste the URL into Window 2.
3. Both windows will instantly display 2 players in the lobby.

### Step 4: Ready Up & Start Game
1. Window 2 (Bob) clicks **"READY UP!"**.
2. Window 1 (Alice - Host) clicks **"START GAME"**.

### Step 5: Test Gameplay & Security
1. **Word Selection:** The drawer sees 3 word cards; the guesser sees "Waiting for drawer to pick a word...".
2. **Secret Word Security:**
   - Open Chrome DevTools $\to$ Network $\to$ WS $\to$ inspect Socket messages on Window 2 (Bob).
   - Verify that the secret word is **never** sent to Bob's socket during the round.
3. **Drawing Sync:**
   - Draw on the canvas in Window 1.
   - Verify strokes appear on Window 2 smoothly in real time.
   - Test Undo and Clear canvas buttons.
4. **Chat & Guessing:**
   - Type an incorrect word in Window 2: appears as a chat message.
   - Type a word 1 letter away (e.g. `aple` for `apple`): Window 2 receives a private whisper `"aple is very close!"`.
   - Type the correct word: Window 2 receives points, audio ding plays, and Window 1 sees `"🎉 Bob guessed the word!"` without revealing the word.

### Step 6: Test Host Disconnect & Migration
1. Close Window 1 (Alice).
2. Window 2 (Bob) will immediately receive `room:player_left` and Bob's avatar will automatically gain the **Host 👑** badge.

---

## 7. Common Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `EADDRINUSE: address already in use :::3001` | Another process is holding port 3001 | Terminate the zombie process using `netstat -ano \| findstr :3001` followed by `taskkill /PID <PID> /F`, or set `PORT=3002` in `.env`. |
| Cross-Origin WebSocket Blocked | `CLIENT_URL` mismatch in `server/.env` | Ensure `CLIENT_URL` matches your frontend origin (e.g., `http://localhost:5173`). |
| MongoDB Connection Failed | Local MongoDB daemon is not started | No action needed unless persistence is required. Sketchly automatically continues in memory. |
| Vite Hot Reloading Not Updating | Cache issue | Clear browser cache or start Vite with `npm run dev -- --force`. |
