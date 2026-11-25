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

  WORD_SELECTION_TIME: 15, // seconds for drawer to choose word
  ROUND_END_DELAY: 5,      // seconds before moving to next turn
  GAME_OVER_DELAY: 15,     // seconds display of podium before return to lobby

  MAX_CHAT_LENGTH: 140,
  MAX_PLAYER_NAME_LENGTH: 20,
  MIN_PLAYER_NAME_LENGTH: 2,

  // Scoring configuration
  MAX_GUESS_POINTS: 400,
  MIN_GUESS_POINTS: 50,
  FIRST_GUESSER_BONUS: 50,
  DRAWER_BONUS_PER_GUESS: 40,
} as const;
