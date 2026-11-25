import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../src/game/Game.js';
import { Player } from '../src/game/Player.js';
import { WordService } from '../src/services/wordService.js';
import { RoomSettings } from '../src/types/index.js';

describe('WordService', () => {
  it('normalizes string correctly (trim, lowercase, multiple spaces)', () => {
    expect(WordService.normalize('  ElEphAnt  ')).toBe('elephant');
    expect(WordService.normalize('Ice   Cream')).toBe('ice cream');
  });

  it('generates correct mask with underscores and keeps spaces', () => {
    const mask = WordService.generateMask('ice cream', new Set());
    // Should have spaces between letters and double space between words
    expect(mask).toContain('_');
    expect(mask).toContain('  ');
  });

  it('reveals specified letters in mask', () => {
    const revealed = new Set([0, 4]); // 'i' in ice and 'c' in cream
    const mask = WordService.generateMask('ice cream', revealed);
    expect(mask.startsWith('I')).toBe(true);
  });

  it('detects close guesses using Levenshtein distance', () => {
    expect(WordService.isCloseGuess('elefant', 'elephant')).toBe(false); // 2 edits
    expect(WordService.isCloseGuess('elephnt', 'elephant')).toBe(true); // 1 deletion
    expect(WordService.isCloseGuess('elephants', 'elephant')).toBe(true); // 1 insertion
    expect(WordService.isCloseGuess('elephant', 'elephant')).toBe(false); // exact match is not "close"
  });
});

describe('Game Engine State Machine', () => {
  let players: Map<string, Player>;
  let defaultSettings: RoomSettings;
  let game: Game;

  beforeEach(() => {
    players = new Map();
    const p1 = new Player('p1', 's1', 'Alice', '🐱', true);
    const p2 = new Player('p2', 's2', 'Bob', '🐶', false);
    const p3 = new Player('p3', 's3', 'Charlie', '🦊', false);
    players.set('p1', p1);
    players.set('p2', p2);
    players.set('p3', p3);

    defaultSettings = {
      maxPlayers: 8,
      rounds: 2,
      drawTime: 60,
      wordCount: 3,
      hints: 2,
      wordMode: 'Normal',
      isPublic: false,
      category: 'all',
      customWords: [],
    };

    game = new Game(
      'TEST01',
      defaultSettings,
      () => players,
      {
        onStateChange: () => {},
        onRoundStart: () => {},
        onWordChosen: () => {},
        onPrivateWord: () => {},
        onHintRevealed: () => {},
        onRoundEnd: () => {},
        onGameOver: () => {},
        onTimerTick: () => {},
      }
    );
  });

  it('starts game and enters WORD_SELECTION with a valid drawer', () => {
    const started = game.start();
    expect(started).toBe(true);
    expect(game.phase).toBe('WORD_SELECTION');
    expect(game.currentDrawerId).toBeDefined();
    expect(players.has(game.currentDrawerId!)).toBe(true);
    expect(game.wordChoices.length).toBe(3);
  });

  it('rejects word selection from non-drawer', () => {
    game.start();
    const drawerId = game.currentDrawerId!;
    const nonDrawerId = drawerId === 'p1' ? 'p2' : 'p1';

    const selected = game.selectWord('apple', nonDrawerId);
    expect(selected).toBe(false);
    expect(game.phase).toBe('WORD_SELECTION');
  });

  it('transitions to DRAWING phase when drawer chooses a word', () => {
    game.start();
    const drawerId = game.currentDrawerId!;
    const chosen = game.wordChoices[0];

    const selected = game.selectWord(chosen, drawerId);
    expect(selected).toBe(true);
    expect(game.phase).toBe('DRAWING');
    expect(game.currentWord).toBe(chosen);
    expect(game.timeRemaining).toBe(60);
  });

  it('prevents drawer from guessing their own word', () => {
    game.start();
    const drawerId = game.currentDrawerId!;
    game.selectWord('guitar', drawerId);

    const res = game.submitGuess(drawerId, 'guitar');
    expect(res.isCorrect).toBe(false);
  });

  it('awards points to correct guesser and bonus to drawer', () => {
    game.start();
    const drawerId = game.currentDrawerId!;
    const guesserId = Array.from(players.keys()).find(id => id !== drawerId)!;

    game.selectWord('guitar', drawerId);

    const guesser = players.get(guesserId)!;
    const drawer = players.get(drawerId)!;
    const initialGuesserScore = guesser.score;
    const initialDrawerScore = drawer.score;

    const res = game.submitGuess(guesserId, '  GuItAr  ');
    expect(res.isCorrect).toBe(true);
    expect(res.pointsAwarded).toBeGreaterThan(0);
    expect(guesser.score).toBeGreaterThan(initialGuesserScore);
    expect(drawer.score).toBeGreaterThan(initialDrawerScore);
    expect(guesser.hasGuessedCorrectly).toBe(true);

    // Duplicate guess should not award points again
    const repeatRes = game.submitGuess(guesserId, 'guitar');
    expect(repeatRes.isCorrect).toBe(false);
    expect(repeatRes.pointsAwarded).toBe(0);
  });

  it('sanitizes snapshot so non-drawers cannot see secret word', () => {
    game.start();
    const drawerId = game.currentDrawerId!;
    const guesserId = Array.from(players.keys()).find(id => id !== drawerId)!;
    game.selectWord('elephant', drawerId);

    const drawerSnapshot = game.getSnapshot(drawerId);
    expect(drawerSnapshot.selectedWord).toBe('elephant');

    const guesserSnapshot = game.getSnapshot(guesserId);
    expect(guesserSnapshot.selectedWord).toBeNull();
    expect(guesserSnapshot.maskedWord).toBeDefined();
    expect(guesserSnapshot.maskedWord).toContain('_');
  });

  it('tracks and undoes drawing strokes', () => {
    game.start();
    const drawerId = game.currentDrawerId!;
    game.selectWord('sun', drawerId);

    game.startStroke(drawerId, 's1', 0.1, 0.1, '#000000', 5, false);
    game.appendPoints(drawerId, 's1', [{ x: 0.2, y: 0.2 }, { x: 0.3, y: 0.3 }]);
    game.endStroke(drawerId, 's1');

    expect(game.strokes.length).toBe(1);
    expect(game.strokes[0].points.length).toBe(3);

    game.undoStroke(drawerId);
    expect(game.strokes.length).toBe(0);
  });
});

