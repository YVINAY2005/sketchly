import { GAME_CONSTANTS } from '../constants/game.js';
import {
  GamePhase,
  GameStateSnapshot,
  GameWinner,
  Player as IPlayer,
  Point,
  RoomSettings,
  RoundResult,
  RoundScoreEntry,
  Stroke,
} from '../types/index.js';
import { Player } from './Player.js';
import { WordService } from '../services/wordService.js';
import { GameSessionModel } from '../models/GameSessionModel.js';
import { isDbConnected } from '../services/dbService.js';

export interface GameCallbacks {
  onStateChange: () => void;
  onRoundStart: (drawerId: string, wordOptions: string[]) => void;
  onWordChosen: (maskedWord: string, wordLength: number, category: string, drawTime: number) => void;
  onPrivateWord: (drawerSocketId: string, word: string) => void;
  onHintRevealed: (maskedWord: string, hintsRevealed: number) => void;
  onRoundEnd: (result: RoundResult) => void;
  onGameOver: (winner: GameWinner) => void;
  onTimerTick: (timeRemaining: number) => void;
}

export class Game {
  public roomCode: string;
  public settings: RoomSettings;
  public phase: GamePhase = 'LOBBY';
  public currentRound: number = 1;
  public totalRounds: number = 3;

  public turnOrder: string[] = []; // Array of player IDs in turn order
  public currentTurnIndex: number = 0;
  public currentDrawerId: string | null = null;

  public currentWord: string | null = null;
  public wordChoices: string[] = [];
  public maskedWord: string = '';
  public revealedIndices: Set<number> = new Set();
  public hintsRevealedCount: number = 0;

  public timeRemaining: number = 0;
  public totalDrawTime: number = 75;

  public strokes: Stroke[] = [];
  private activeStrokeMap: Map<string, Stroke> = new Map();

  private timerInterval: NodeJS.Timeout | null = null;
  private selectionTimeout: NodeJS.Timeout | null = null;
  private intermissionTimeout: NodeJS.Timeout | null = null;

  private callbacks: GameCallbacks;
  private getPlayers: () => Map<string, Player>;

  constructor(
    roomCode: string,
    settings: RoomSettings,
    getPlayers: () => Map<string, Player>,
    callbacks: GameCallbacks
  ) {
    this.roomCode = roomCode;
    this.settings = settings;
    this.totalRounds = settings.rounds;
    this.totalDrawTime = settings.drawTime;
    this.getPlayers = getPlayers;
    this.callbacks = callbacks;
  }

  /**
   * Initializes and starts a new game.
   */
  public start(): boolean {
    const players = Array.from(this.getPlayers().values()).filter(p => p.isConnected);
    if (players.length < GAME_CONSTANTS.MIN_PLAYERS) {
      return false;
    }

    // Reset all player scores
    players.forEach(p => p.resetForNewGame());

    // Deterministic turn order: shuffle connected players at game start
    this.turnOrder = players.map(p => p.id).sort(() => 0.5 - Math.random());
    this.currentRound = 1;
    this.currentTurnIndex = 0;
    this.totalRounds = this.settings.rounds;
    this.totalDrawTime = this.settings.drawTime;

    this.startWordSelection();
    return true;
  }

  /**
   * Begins the word selection phase for the current drawer.
   */
  private startWordSelection(): void {
    this.clearAllTimers();
    this.strokes = [];
    this.activeStrokeMap.clear();

    // Ensure valid drawer
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
      this.currentRound++;
      if (this.currentRound > this.totalRounds) {
        this.endGame();
        return;
      }
    }

    const drawerId = this.turnOrder[this.currentTurnIndex];
    const drawer = this.getPlayers().get(drawerId);

    // If drawer disconnected or missing, advance turn
    if (!drawer || !drawer.isConnected) {
      this.currentTurnIndex++;
      this.startWordSelection();
      return;
    }

    this.currentDrawerId = drawerId;
    this.phase = 'WORD_SELECTION';

    // Reset per-round states for all players
    for (const player of this.getPlayers().values()) {
      player.resetForNewRound();
    }

    // Pick 3 random words
    this.wordChoices = WordService.getWordChoices(
      this.settings.wordCount || GAME_CONSTANTS.DEFAULT_WORD_CHOICES,
      this.settings.category,
      this.settings.customWords
    );

    this.timeRemaining = GAME_CONSTANTS.WORD_SELECTION_TIME;
    this.currentWord = null;
    this.maskedWord = '';
    this.revealedIndices.clear();
    this.hintsRevealedCount = 0;

    this.callbacks.onRoundStart(drawerId, this.wordChoices);
    this.callbacks.onStateChange();

    // Word selection countdown
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.callbacks.onTimerTick(this.timeRemaining);

      if (this.timeRemaining <= 0) {
        this.clearAllTimers();
        // Auto-select first word if drawer timed out
        const fallbackWord = this.wordChoices[0] || 'apple';
        this.selectWord(fallbackWord, drawerId);
      }
    }, 1000);
  }

  /**
   * Called when drawer selects a word.
   */
  public selectWord(word: string, playerId: string): boolean {
    if (this.phase !== 'WORD_SELECTION' || this.currentDrawerId !== playerId) {
      return false;
    }

    this.clearAllTimers();
    this.currentWord = word.trim();
    this.phase = 'DRAWING';
    this.timeRemaining = this.totalDrawTime;
    this.revealedIndices.clear();
    this.hintsRevealedCount = 0;

    // Word mode handling:
    // Normal: shows underscores representing letters with word length
    // Hidden: blank or generic question marks without length
    // Combination: custom mode
    if (this.settings.wordMode === 'Hidden') {
      this.maskedWord = '???';
    } else {
      this.maskedWord = WordService.generateMask(this.currentWord, this.revealedIndices);
    }

    const drawer = this.getPlayers().get(this.currentDrawerId);
    if (drawer) {
      this.callbacks.onPrivateWord(drawer.socketId, this.currentWord);
    }

    this.callbacks.onWordChosen(
      this.maskedWord,
      this.currentWord.length,
      this.settings.category,
      this.totalDrawTime
    );
    this.callbacks.onStateChange();

    this.startDrawingTimer();
    return true;
  }

  /**
   * Starts the countdown timer during the drawing phase.
   */
  private startDrawingTimer(): void {
    const hintThresholds: number[] = [];
    if (this.settings.hints > 0 && this.settings.wordMode !== 'Hidden') {
      const step = this.totalDrawTime / (this.settings.hints + 1);
      for (let i = 1; i <= this.settings.hints; i++) {
        hintThresholds.push(Math.round(this.totalDrawTime - step * i));
      }
    }

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.callbacks.onTimerTick(this.timeRemaining);

      // Check if it's time to reveal a hint
      if (
        hintThresholds.length > 0 &&
        hintThresholds.includes(this.timeRemaining) &&
        this.currentWord
      ) {
        this.revealNextHint();
      }

      if (this.timeRemaining <= 0) {
        this.clearAllTimers();
        this.endRound();
      }
    }, 1000);
  }

  /**
   * Reveals a random unrevealed letter in the masked word.
   */
  private revealNextHint(): void {
    if (!this.currentWord || this.settings.wordMode === 'Hidden') return;

    const chars = this.currentWord.split('');
    const unrevealedIndices: number[] = [];

    chars.forEach((char, index) => {
      if (char !== ' ' && char !== '-' && char !== '\'' && !this.revealedIndices.has(index)) {
        unrevealedIndices.push(index);
      }
    });

    // Don't reveal more than 50% of the letters
    const maxReveal = Math.floor(chars.filter(c => c !== ' ').length * 0.5);
    if (this.revealedIndices.size >= maxReveal || unrevealedIndices.length === 0) {
      return;
    }

    // Pick a random unrevealed index
    const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    this.revealedIndices.add(randomIndex);
    this.hintsRevealedCount++;

    this.maskedWord = WordService.generateMask(this.currentWord, this.revealedIndices);
    this.callbacks.onHintRevealed(this.maskedWord, this.hintsRevealedCount);
  }

  /**
   * Validates a player's guess.
   */
  public submitGuess(playerId: string, text: string): {
    isCorrect: boolean;
    isClose: boolean;
    pointsAwarded: number;
    drawerBonus: number;
    player: Player | null;
  } {
    const player = this.getPlayers().get(playerId);
    if (!player || this.phase !== 'DRAWING' || !this.currentWord) {
      return { isCorrect: false, isClose: false, pointsAwarded: 0, drawerBonus: 0, player: null };
    }

    // Drawer cannot guess
    if (playerId === this.currentDrawerId) {
      return { isCorrect: false, isClose: false, pointsAwarded: 0, drawerBonus: 0, player };
    }

    // Already guessed correctly this round
    if (player.hasGuessedCorrectly) {
      return { isCorrect: false, isClose: false, pointsAwarded: 0, drawerBonus: 0, player };
    }

    const normGuess = WordService.normalize(text);
    const normTarget = WordService.normalize(this.currentWord);

    // Exact Match
    if (normGuess === normTarget) {
      player.hasGuessedCorrectly = true;
      player.guessTime = this.timeRemaining;

      // Count how many non-drawers have already guessed
      const previousCorrectCount = Array.from(this.getPlayers().values()).filter(
        p => p.hasGuessedCorrectly && p.id !== playerId
      ).length;

      // Scoring formula:
      // Base points based on remaining time percentage
      const timeRatio = Math.max(0.1, this.timeRemaining / this.totalDrawTime);
      let points = Math.max(
        GAME_CONSTANTS.MIN_GUESS_POINTS,
        Math.round(GAME_CONSTANTS.MAX_GUESS_POINTS * timeRatio)
      );

      // First guesser bonus
      if (previousCorrectCount === 0) {
        points += GAME_CONSTANTS.FIRST_GUESSER_BONUS;
      }

      player.addScore(points);

      // Drawer earns bonus points for each player who guesses correctly
      let drawerBonus = 0;
      if (this.currentDrawerId) {
        const drawer = this.getPlayers().get(this.currentDrawerId);
        if (drawer) {
          drawerBonus = GAME_CONSTANTS.DRAWER_BONUS_PER_GUESS;
          drawer.addScore(drawerBonus);
        }
      }

      // Check if ALL active non-drawers have guessed correctly
      const activeGuessers = Array.from(this.getPlayers().values()).filter(
        p => p.isConnected && p.id !== this.currentDrawerId
      );
      const allGuessed = activeGuessers.every(p => p.hasGuessedCorrectly);

      if (allGuessed && activeGuessers.length > 0) {
        this.clearAllTimers();
        // Give a tiny 1-second pause so players see the last guess, then end round
        setTimeout(() => this.endRound(), 1000);
      }

      return { isCorrect: true, isClose: false, pointsAwarded: points, drawerBonus, player };
    }

    // Close guess check
    const isClose = WordService.isCloseGuess(text, this.currentWord);
    return { isCorrect: false, isClose, pointsAwarded: 0, drawerBonus: 0, player };
  }

  /**
   * Concludes the current round.
   */
  private endRound(): void {
    this.clearAllTimers();
    this.phase = 'ROUND_END';

    const drawer = this.currentDrawerId ? this.getPlayers().get(this.currentDrawerId) : null;
    const scores: RoundScoreEntry[] = Array.from(this.getPlayers().values()).map(p => ({
      playerId: p.id,
      name: p.name,
      score: p.score,
      roundScore: p.roundScore,
      guessed: p.hasGuessedCorrectly,
      isDrawer: p.id === this.currentDrawerId,
    }));

    // Find who draws next
    let nextDrawerName: string | null = null;
    const nextIndex = this.currentTurnIndex + 1;
    if (nextIndex < this.turnOrder.length) {
      const nextId = this.turnOrder[nextIndex];
      nextDrawerName = this.getPlayers().get(nextId)?.name || null;
    } else if (this.currentRound < this.totalRounds) {
      const firstId = this.turnOrder[0];
      nextDrawerName = this.getPlayers().get(firstId)?.name || null;
    }

    const result: RoundResult = {
      word: this.currentWord || '',
      drawerId: this.currentDrawerId || '',
      drawerName: drawer?.name || 'Unknown',
      scores,
      nextDrawerName,
    };

    this.callbacks.onRoundEnd(result);
    this.callbacks.onStateChange();

    // 5-second intermission before next turn
    this.intermissionTimeout = setTimeout(() => {
      this.currentTurnIndex++;
      this.startWordSelection();
    }, GAME_CONSTANTS.ROUND_END_DELAY * 1000);
  }

  /**
   * Concludes the entire game.
   */
  private endGame(): void {
    this.clearAllTimers();
    this.phase = 'GAME_OVER';

    const sortedPlayers = Array.from(this.getPlayers().values())
      .filter(p => p.isConnected)
      .sort((a, b) => b.score - a.score);

    const podium: { rank: 1 | 2 | 3; player: IPlayer }[] = [];
    if (sortedPlayers[0]) podium.push({ rank: 1, player: sortedPlayers[0].toJSON() });
    if (sortedPlayers[1]) podium.push({ rank: 2, player: sortedPlayers[1].toJSON() });
    if (sortedPlayers[2]) podium.push({ rank: 3, player: sortedPlayers[2].toJSON() });

    const winner: GameWinner = {
      podium,
      allPlayers: sortedPlayers.map(p => p.toJSON()),
    };

    // Asynchronously save to MongoDB if connected
    this.persistGameSession(winner).catch(err => {
      console.error('[Game] Error saving game session to MongoDB:', err);
    });

    this.callbacks.onGameOver(winner);
    this.callbacks.onStateChange();
  }

  /**
   * Persists game session result to MongoDB.
   */
  private async persistGameSession(winner: GameWinner): Promise<void> {
    if (!isDbConnected() || winner.podium.length === 0) return;

    try {
      const firstPlace = winner.podium[0].player;
      await GameSessionModel.create({
        roomCode: this.roomCode,
        winner: {
          name: firstPlace.name,
          score: firstPlace.score,
          avatar: firstPlace.avatar,
        },
        leaderboard: winner.allPlayers.map((p, idx) => ({
          name: p.name,
          score: p.score,
          avatar: p.avatar,
          rank: idx + 1,
        })),
        totalRounds: this.totalRounds,
      });
      console.log(`[Game] Persisted session for room ${this.roomCode} to MongoDB.`);
    } catch (e) {
      console.warn('[Game] Could not save game session:', e);
    }
  }

  /**
   * Restarts the game to LOBBY state.
   */
  public restart(): void {
    this.clearAllTimers();
    this.phase = 'LOBBY';
    this.currentRound = 1;
    this.currentTurnIndex = 0;
    this.currentDrawerId = null;
    this.currentWord = null;
    this.strokes = [];
    this.activeStrokeMap.clear();

    for (const player of this.getPlayers().values()) {
      player.resetForNewGame();
    }

    this.callbacks.onStateChange();
  }

  /**
   * Handles player disconnection during the game.
   */
  public handlePlayerDisconnect(playerId: string): void {
    // If the active drawer disconnected during selection or drawing, transition immediately!
    if (this.currentDrawerId === playerId) {
      this.clearAllTimers();
      if (this.phase === 'DRAWING' || this.phase === 'WORD_SELECTION') {
        this.endRound();
      }
    }
  }

  // --- Drawing Management ---

  public startStroke(
    playerId: string,
    strokeId: string,
    x: number,
    y: number,
    color: string,
    size: number,
    isEraser: boolean
  ): boolean {
    if (this.phase !== 'DRAWING' || this.currentDrawerId !== playerId) {
      return false;
    }

    const newStroke: Stroke = {
      id: strokeId,
      points: [{ x, y }],
      color,
      size,
      isEraser,
    };

    this.activeStrokeMap.set(strokeId, newStroke);
    return true;
  }

  public appendPoints(playerId: string, strokeId: string, points: Point[]): boolean {
    if (this.phase !== 'DRAWING' || this.currentDrawerId !== playerId) {
      return false;
    }

    const stroke = this.activeStrokeMap.get(strokeId);
    if (!stroke) return false;

    stroke.points.push(...points);
    return true;
  }

  public endStroke(playerId: string, strokeId: string): boolean {
    if (this.phase !== 'DRAWING' || this.currentDrawerId !== playerId) {
      return false;
    }

    const stroke = this.activeStrokeMap.get(strokeId);
    if (stroke) {
      this.strokes.push(stroke);
      this.activeStrokeMap.delete(strokeId);
    }
    return true;
  }

  public undoStroke(playerId: string): boolean {
    if (this.phase !== 'DRAWING' || this.currentDrawerId !== playerId) {
      return false;
    }

    if (this.strokes.length > 0) {
      this.strokes.pop();
      return true;
    }
    return false;
  }

  public clearCanvas(playerId: string): boolean {
    if (this.phase !== 'DRAWING' || this.currentDrawerId !== playerId) {
      return false;
    }

    this.strokes = [];
    this.activeStrokeMap.clear();
    return true;
  }

  /**
   * Generates a sanitized game state snapshot for a specific player.
   * Security Rule: Non-drawers never receive `selectedWord` or `wordChoices`!
   */
  public getSnapshot(requestingPlayerId?: string): GameStateSnapshot {
    const isDrawer = requestingPlayerId && requestingPlayerId === this.currentDrawerId;
    const drawer = this.currentDrawerId ? this.getPlayers().get(this.currentDrawerId) : null;

    return {
      phase: this.phase,
      round: this.currentRound,
      totalRounds: this.totalRounds,
      drawerId: this.currentDrawerId,
      drawerName: drawer?.name || null,
      maskedWord: this.maskedWord,
      wordLength: this.currentWord ? this.currentWord.length : 0,
      category: this.settings.category,
      timeRemaining: this.timeRemaining,
      totalDrawTime: this.totalDrawTime,
      // Security: Only drawer sees selectedWord during game.
      // Everyone sees it during ROUND_END or GAME_OVER.
      selectedWord: (isDrawer || this.phase === 'ROUND_END' || this.phase === 'GAME_OVER')
        ? this.currentWord
        : null,
      wordChoices: (isDrawer && this.phase === 'WORD_SELECTION') ? this.wordChoices : null,
      hintsRevealed: this.hintsRevealedCount,
    };
  }

  public clearAllTimers(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
      this.selectionTimeout = null;
    }
    if (this.intermissionTimeout) {
      clearTimeout(this.intermissionTimeout);
      this.intermissionTimeout = null;
    }
  }
}

