export const GAME_CONSTANTS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 20,
  DEFAULT_MAX_PLAYERS: 8,

  MIN_ROUNDS: 2,
  MAX_ROUNDS: 10,
  DEFAULT_ROUNDS: 3,

  MIN_DRAW_TIME: 15,
  MAX_DRAW_TIME: 240,
  DEFAULT_DRAW_TIME: 75,

  MIN_WORD_CHOICES: 1,
  MAX_WORD_CHOICES: 5,
  DEFAULT_WORD_CHOICES: 3,

  MIN_HINTS: 0,
  MAX_HINTS: 5,
  DEFAULT_HINTS: 2,

  WORD_SELECTION_TIME: 15,
  ROUND_END_DELAY: 5,
  GAME_OVER_DELAY: 15,

  MAX_CHAT_LENGTH: 140,
  MAX_PLAYER_NAME_LENGTH: 20,
  MIN_PLAYER_NAME_LENGTH: 2,

  MAX_GUESS_POINTS: 400,
  MIN_GUESS_POINTS: 50,
  FIRST_GUESSER_BONUS: 50,
  DRAWER_BONUS_PER_GUESS: 40,
} as const;

export const DEFAULT_PALETTE = [
  '#000000', // Black
  '#ffffff', // White
  '#64748b', // Slate
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#78350f', // Brown
] as const;

export const BRUSH_SIZES = [2, 5, 10, 20, 35] as const;

export const WORD_CATEGORIES = [
  'all',
  'animals',
  'food',
  'objects',
  'nature',
  'actions',
  'places',
  'professions',
  'technology',
] as const;

