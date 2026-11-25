import mongoose, { Schema, Document } from 'mongoose';
import { RoomSettings } from '../types/index.js';

export interface IRoomDoc extends Document {
  roomCode: string;
  hostName: string;
  settings: RoomSettings;
  createdAt: Date;
  gamesPlayed: number;
}

const RoomSchema = new Schema<IRoomDoc>({
  roomCode: { type: String, required: true, unique: true, index: true },
  hostName: { type: String, required: true },
  settings: {
    maxPlayers: { type: Number, default: 8 },
    rounds: { type: Number, default: 3 },
    drawTime: { type: Number, default: 75 },
    wordCount: { type: Number, default: 3 },
    hints: { type: Number, default: 2 },
    wordMode: { type: String, default: 'Normal' },
    isPublic: { type: Boolean, default: false },
    category: { type: String, default: 'all' },
    customWords: { type: [String], default: [] },
  },
  createdAt: { type: Date, default: Date.now },
  gamesPlayed: { type: Number, default: 0 },
});

export const RoomModel = mongoose.model<IRoomDoc>('Room', RoomSchema);

