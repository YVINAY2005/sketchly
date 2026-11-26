# Sketchly WebSocket Specification

This document details all real-time Socket.IO events, payload interfaces, acknowledgment callbacks, directionality, and validation rules used across Sketchly.

---

## 1. Overview & Conventions

- **Transport Protocol:** Socket.IO over WebSocket (with long-polling fallback during initial connection negotiation).
- **Socket Rooms:** Each match uses a dedicated Socket.IO room identified by a 6-character alphanumeric uppercase code (e.g., `E8DV7L`).
- **Authorization & Security:** The server authoritatively validates socket actions against the room's current state and player ID. Spoofed draws, rogue word selections, and unauthorized settings updates are rejected.
- **Direction Labels:**
  - `Client -> Server`: Emitted by a specific client.
  - `Server -> Client`: Emitted by the server exclusively to the requesting socket.
  - `Server -> Room`: Broadcasted by the server to all sockets in the room.
  - `Server -> Room (except sender)`: Broadcasted to everyone in the room except the acting socket.

---

## 2. Room Management Events

### `room:create`
Creates a brand-new game room with custom settings and assigns the creator as the Host.
- **Direction:** `Client -> Server` (Acknowledgment Callback)
- **Client Payload:**
  ```ts
  {
    hostName: string;                 // Display name (1-20 characters)
    avatar: string;                   // Emoji string (e.g., "🎨", "🚀")
    settings: Partial<RoomSettings>;  // Custom match parameters
  }
  ```
- **Acknowledgment Response:**
  ```ts
  {
    success: boolean;
    roomCode?: string;                // 6-character room identifier
    playerId?: string;                // Server-assigned player UUID
    error?: string;                   // Error description if rejected
  }
  ```

---

### `room:join`
Adds an existing or new player into a room by its room code.
- **Direction:** `Client -> Server` (Acknowledgment Callback)
- **Client Payload:**
  ```ts
  {
    roomCode: string;                 // 6-character uppercase code
    playerName: string;               // Display name
    avatar: string;                   // Avatar emoji
    playerId?: string;                // Optional existing ID (for reconnections)
  }
  ```
- **Acknowledgment Response:**
  ```ts
  {
    success: boolean;
    roomCode?: string;
    playerId?: string;
    error?: string;                   // e.g., "Room is full", "Room not found"
  }
  ```

---

### `room:state`
Broadcasted automatically to any client upon joining or reconnecting, providing an initial full snapshot.
- **Direction:** `Server -> Client`
- **Server Payload:**
  ```ts
  {
    roomCode: string;
    settings: RoomSettings;
    players: Player[];
    hostId: string;
    gameState: GameStateSnapshot;     // Sanitized for the recipient
  }
  ```

---

### `room:player_joined`
Emitted to all other players in the room when a new peer joins the lobby.
- **Direction:** `Server -> Room (except sender)`
- **Server Payload:**
  ```ts
  {
    player: Player;                   // The newly joined player object
    players: Player[];                // Updated complete roster
  }
  ```

---

### `room:player_left`
Emitted when a player leaves voluntarily or disconnects.
- **Direction:** `Server -> Room`
- **Server Payload:**
  ```ts
  {
    playerId: string;
    playerName: string;
    players: Player[];                // Updated complete roster
    newHostId?: string;               // Populated if host migration occurred
  }
  ```

---

### `room:toggle_ready`
Toggles a player's ready state in the pre-game lobby.
- **Direction:** `Client -> Server`
- **Client Payload:** `{}`

---

### `room:update_settings`
Host-only action to modify match rules (rounds, draw time, hint count, categories).
- **Direction:** `Client -> Server`
- **Client Payload:**
  ```ts
  {
    settings: Partial<RoomSettings>;
  }
  ```
- **Server Broadcast:** `room:settings_updated` -> `{ settings: RoomSettings }`

---

### `room:kick_player`
Host-only action to evict an unwanted player.
- **Direction:** `Client -> Server`
- **Client Payload:**
  ```ts
  {
    playerId: string;                 // Target player UUID
  }
  ```

---

## 3. Game Lifecycle & State Events

### `game:start`
Initiates match progression from `LOBBY` to `WORD_SELECTION`. Can only be invoked by the host when $\ge 2$ players are in the room.
- **Direction:** `Client -> Server`
- **Client Payload:** `{}`

---

### `game:round_start`
Signals the beginning of a turn. Sent to all players, but contains `wordOptions` **only** for the drawer.
- **Direction:** `Server -> Room`
- **Server Payload:**
  ```ts
  {
    round: number;                    // Current round number (1-based)
    totalRounds: number;              // Total rounds configured
    drawerId: string;                 // Player UUID of the active drawer
    drawerName: string;               // Display name of drawer
    drawTime: number;                 // Configured turn duration in seconds
    wordOptions?: string[];           // Array of 3 secret words (DRAWER ONLY)
  }
  ```

---

### `game:select_word`
Drawer submits their chosen word from the provided options.
- **Direction:** `Client -> Server`
- **Client Payload:**
  ```ts
  {
    word: string;                     // Selected word string
  }
  ```

---

### `game:word_chosen`
Broadcasted to all non-drawers to start the drawing timer and display masked letter tiles.
- **Direction:** `Server -> Room`
- **Server Payload:**
  ```ts
  {
    maskedWord: string;               // e.g. "_ _ _ _ _ _"
    wordLength: number;               // Character count
    category: string;                 // Category hint (e.g., "Animals")
    drawTime: number;                 // Active countdown duration
  }
  ```

---

### `game:private_word`
Sent strictly to the active drawer to display the plaintext secret word on their HUD.
- **Direction:** `Server -> Client (Drawer only)`
- **Server Payload:**
  ```ts
  {
    word: string;                     // Plaintext secret word
  }
  ```

---

### `game:hint`
Broadcasted when an incremental letter hint is unmasked by the server timer.
- **Direction:** `Server -> Room`
- **Server Payload:**
  ```ts
  {
    maskedWord: string;               // e.g. "E _ _ P H _ _ T"
    hintsRevealed: number;            // Total count of revealed letters
  }
  ```

---

### `game:round_end`
Signals the conclusion of a turn. Reveals the secret word and tabulates turn scores.
- **Direction:** `Server -> Room`
- **Server Payload (`RoundResult`):**
  ```ts
  {
    word: string;                     // Plaintext secret word revealed to all
    scores: Array<{
      playerId: string;
      playerName: string;
      scoreGained: number;            // Points gained this turn
      totalScore: number;             // Updated match score
      guessedCorrectly: boolean;
      isDrawer: boolean;
    }>;
    reason: 'TIMEOUT' | 'ALL_GUESSED' | 'DRAWER_LEFT';
    nextDrawerName?: string;
  }
  ```

---

### `game:over`
Emitted at the end of the final round to display the winner podium.
- **Direction:** `Server -> Room`
- **Server Payload (`GameWinner`):**
  ```ts
  {
    winner: Player;                   // 1st place player
    podium: Player[];                 // Top 3 players (Gold, Silver, Bronze)
    allPlayers: Player[];             // Full roster sorted by total score descending
  }
  ```

---

## 4. Drawing & Canvas Events

All drawing coordinates are **strictly normalized** to values between `0.0` and `1.0`.

### `draw:start`
Begins a new stroke. Only valid if emitted by `drawerId`.
- **Direction:** `Client -> Server`
- **Client Payload:**
  ```ts
  {
    x: number;                        // Normalized X (0.0 to 1.0)
    y: number;                        // Normalized Y (0.0 to 1.0)
    color: string;                    // Hex color code (e.g., "#000000")
    size: number;                     // Brush diameter in pixels (e.g., 5)
    isEraser: boolean;                // Flag for eraser tool
  }
  ```
- **Server Broadcast:** `draw:stroke_start` -> `{ strokeId, x, y, color, size, isEraser }`

---

### `draw:move`
Transmits a batch of continuous interpolated points along the current stroke.
- **Direction:** `Client -> Server`
- **Client Payload:**
  ```ts
  {
    points: Array<{
      x: number;                      // Normalized X
      y: number;                      // Normalized Y
    }>;
  }
  ```
- **Server Broadcast:** `draw:stroke_points` -> `{ strokeId, points }`

---

### `draw:end`
Signals completion of the active stroke.
- **Direction:** `Client -> Server`
- **Client Payload:** `{}`
- **Server Broadcast:** `draw:stroke_end` -> `{ strokeId }`

---

### `draw:undo`
Removes the most recent stroke from the server's stroke history stack.
- **Direction:** `Client -> Server`
- **Client Payload:** `{}`
- **Server Broadcast:** `draw:undo_broadcast` -> `{}`

---

### `draw:clear`
Wipes the entire canvas stroke history on both the server and all client screens.
- **Direction:** `Client -> Server`
- **Client Payload:** `{}`
- **Server Broadcast:** `draw:clear_broadcast` -> `{}`

---

### `draw:history`
Transmitted to newly connecting or reconnecting players to immediately reconstruct the artwork up to the current moment.
- **Direction:** `Server -> Client`
- **Server Payload:**
  ```ts
  {
    strokes: Stroke[];                // Full history of completed & active strokes
  }
  ```

---

## 5. Chat & Guessing Events

### `chat:send`
Submits a message or guess from a player.
- **Direction:** `Client -> Server`
- **Client Payload:**
  ```ts
  {
    text: string;                     // Guesser input (max 200 chars)
  }
  ```

### Server Evaluation Logic:
1. **Drawer Lockout:** If `isDrawer`, message is treated as normal chat and broadcast with type `'chat'`.
2. **Correct Guess:** If `text` matches `secretWord`:
   - Award points based on time decay formula.
   - Emit `guess:result` -> `{ correct: true, points, playerId, playerName }` privately to the guesser.
   - Broadcast system announcement: `"🎉 [Player] guessed the word!"` to the room.
3. **Close Guess (Levenshtein Distance $\le 1$):**
   - Emit `guess:result` -> `{ correct: false, isClose: true, playerId, playerName }` privately to the guesser.
   - Broadcast the guess as normal chat to other players.
4. **Regular Chat / Incorrect Guess:**
   - Broadcast `chat:message` to the room.

---

### `chat:message`
Broadcasted to display a message in the chat feed.
- **Direction:** `Server -> Room`
- **Server Payload (`ChatMessage`):**
  ```ts
  {
    id: string;                       // Message UUID
    senderId?: string;                // Player ID (omitted for SYSTEM)
    senderName: string;               // Display name or "System"
    avatar?: string;
    text: string;
    type: 'chat' | 'guess' | 'correct' | 'close' | 'system' | 'round_end';
    timestamp: number;                // Epoch milliseconds
  }
  ```

---

### `guess:result`
Privately delivered to the guessing player to provide instant UI feedback and trigger audio cues.
- **Direction:** `Server -> Client (Guesser only)`
- **Server Payload:**
  ```ts
  {
    correct: boolean;
    isClose?: boolean;
    playerId: string;
    playerName: string;
    points?: number;
  }
  ```
