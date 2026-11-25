export type GamePhase =
  | 'LOBBY'
  | 'WORD_SELECTION'
  | 'DRAWING'
  | 'ROUND_END'
  | 'GAME_OVER';

export type WordMode = 'Normal' | 'Hidden' | 'Combination';

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hints: number;
  wordMode: WordMode;
  isPublic: boolean;
  category: string;
  customWords: string[];
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  score: number;
  roundScore: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  hasGuessedCorrectly: boolean;
  guessTime: number | null;
}

export interface Point {
  x: number; // 0.0 to 1.0 (normalized)
  y: number; // 0.0 to 1.0 (normalized)
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  isEraser: boolean;
}

export type ChatMessageType =
  | 'chat'
  | 'guess'
  | 'correct'
  | 'close'
  | 'system'
  | 'drawer';

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName?: string;
  text: string;
  type: ChatMessageType;
  timestamp: number;
}

export interface GameStateSnapshot {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  drawerId: string | null;
  drawerName: string | null;
  maskedWord: string;
  wordLength: number;
  category: string;
  timeRemaining: number;
  totalDrawTime: number;
  selectedWord: string | null;
  wordChoices: string[] | null;
  hintsRevealed: number;
}

export interface RoundScoreEntry {
  playerId: string;
  name: string;
  score: number;
  roundScore: number;
  guessed: boolean;
  isDrawer: boolean;
}

export interface RoundResult {
  word: string;
  drawerId: string;
  drawerName: string;
  scores: RoundScoreEntry[];
  nextDrawerName: string | null;
}

export interface GameWinner {
  podium: {
    rank: 1 | 2 | 3;
    player: Player;
  }[];
  allPlayers: Player[];
}

export interface PublicRoomSummary {
  roomCode: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  isPublic: boolean;
}
