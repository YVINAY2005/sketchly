import { Player as IPlayer } from '@sketchly/shared';

export class Player {
  public id: string;
  public socketId: string;
  public name: string;
  public avatar: string;
  public score: number = 0;
  public roundScore: number = 0;
  public isHost: boolean = false;
  public isReady: boolean = false;
  public isConnected: boolean = true;
  public hasGuessedCorrectly: boolean = false;
  public guessTime: number | null = null;

  constructor(id: string, socketId: string, name: string, avatar: string, isHost: boolean = false) {
    this.id = id;
    this.socketId = socketId;
    this.name = name.trim();
    this.avatar = avatar || '🎨';
    this.isHost = isHost;
  }

  public resetForNewRound(): void {
    this.roundScore = 0;
    this.hasGuessedCorrectly = false;
    this.guessTime = null;
  }

  public resetForNewGame(): void {
    this.score = 0;
    this.roundScore = 0;
    this.hasGuessedCorrectly = false;
    this.guessTime = null;
    this.isReady = false;
  }

  public addScore(points: number): void {
    this.roundScore += points;
    this.score += points;
  }

  public toJSON(): IPlayer {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      avatar: this.avatar,
      score: this.score,
      roundScore: this.roundScore,
      isHost: this.isHost,
      isReady: this.isReady,
      isConnected: this.isConnected,
      hasGuessedCorrectly: this.hasGuessedCorrectly,
      guessTime: this.guessTime,
    };
  }
}
