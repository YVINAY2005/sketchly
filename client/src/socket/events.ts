import {
  ChatMessage,
  GameStateSnapshot,
  GameWinner,
  Player,
  Point,
  RoomSettings,
  RoundResult,
  Stroke,
} from '../types/index';

export interface ClientToServerEvents {
  // Room management
  'room:create': (
    payload: {
      hostName: string;
      avatar: string;
      settings: Partial<RoomSettings>;
    },
    callback: (response: {
      success: boolean;
      roomCode?: string;
      playerId?: string;
      error?: string;
    }) => void
  ) => void;

  'room:join': (
    payload: {
      roomCode: string;
      playerName: string;
      avatar: string;
      playerId?: string;
    },
    callback: (response: {
      success: boolean;
      roomCode?: string;
      playerId?: string;
      error?: string;
    }) => void
  ) => void;

  'room:leave': () => void;
  'room:update_settings': (payload: { settings: Partial<RoomSettings> }) => void;
  'room:toggle_ready': () => void;
  'room:kick_player': (payload: { playerId: string }) => void;

  // Game control
  'game:start': () => void;
  'game:select_word': (payload: { word: string }) => void;
  'game:restart': () => void;

  // Drawing
  'draw:start': (payload: {
    x: number;
    y: number;
    color: string;
    size: number;
    isEraser: boolean;
  }) => void;
  'draw:move': (payload: { points: Point[] }) => void;
  'draw:end': () => void;
  'draw:undo': () => void;
  'draw:clear': () => void;

  // Chat & Guessing
  'chat:send': (payload: { text: string }) => void;
}

export interface ServerToClientEvents {
  // Room state
  'room:state': (payload: {
    roomCode: string;
    settings: RoomSettings;
    players: Player[];
    hostId: string;
    gameState: GameStateSnapshot;
  }) => void;

  'room:player_joined': (payload: { player: Player; players: Player[] }) => void;
  'room:player_left': (payload: {
    playerId: string;
    playerName: string;
    players: Player[];
    newHostId?: string;
  }) => void;
  'room:settings_updated': (payload: { settings: RoomSettings }) => void;
  'room:error': (payload: { message: string; code?: string }) => void;

  // Game lifecycle
  'game:state': (payload: GameStateSnapshot) => void;
  'game:round_start': (payload: {
    round: number;
    totalRounds: number;
    drawerId: string;
    drawerName: string;
    drawTime: number;
    wordOptions?: string[];
  }) => void;
  'game:word_chosen': (payload: {
    maskedWord: string;
    wordLength: number;
    category: string;
    drawTime: number;
  }) => void;
  'game:private_word': (payload: { word: string }) => void;
  'game:hint': (payload: { maskedWord: string; hintsRevealed: number }) => void;
  'game:round_end': (payload: RoundResult) => void;
  'game:over': (payload: GameWinner) => void;

  // Drawing sync
  'draw:stroke_start': (payload: {
    strokeId: string;
    x: number;
    y: number;
    color: string;
    size: number;
    isEraser: boolean;
  }) => void;
  'draw:stroke_points': (payload: { strokeId: string; points: Point[] }) => void;
  'draw:stroke_end': (payload: { strokeId: string }) => void;
  'draw:undo_broadcast': () => void;
  'draw:clear_broadcast': () => void;
  'draw:history': (payload: { strokes: Stroke[] }) => void;

  // Chat & Guesses
  'chat:message': (payload: ChatMessage) => void;
  'guess:result': (payload: {
    correct: boolean;
    isClose?: boolean;
    playerId: string;
    playerName: string;
    points?: number;
  }) => void;
}

