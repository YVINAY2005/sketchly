import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerScoreRecord {
  name: string;
  score: number;
  avatar: string;
  rank: number;
}

export interface IGameSessionDoc extends Document {
  roomCode: string;
  winner: {
    name: string;
    score: number;
    avatar: string;
  };
  leaderboard: IPlayerScoreRecord[];
  totalRounds: number;
  createdAt: Date;
}

const GameSessionSchema = new Schema<IGameSessionDoc>({
  roomCode: { type: String, required: true, index: true },
  winner: {
    name: { type: String, required: true },
    score: { type: Number, required: true },
    avatar: { type: String, default: '' },
  },
  leaderboard: [
    {
      name: { type: String, required: true },
      score: { type: Number, required: true },
      avatar: { type: String, default: '' },
      rank: { type: Number, required: true },
    },
  ],
  totalRounds: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const GameSessionModel = mongoose.model<IGameSessionDoc>('GameSession', GameSessionSchema);

