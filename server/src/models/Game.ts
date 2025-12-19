import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer {
  id: string;
  telegramId: number;
  username?: string;
  name: string;
}

export interface IGame extends Document {
  gameId: string;
  players: IPlayer[];
  state: 'waiting' | 'in_progress' | 'round_end' | 'game_end';
  currentRound: number;
  maxRounds: number;
  currentPlayerIndex: number;
  gameData: string; // Сериализованное состояние PechenkaGame
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    id: { type: String, required: true },
    telegramId: { type: Number, required: true },
    username: { type: String },
    name: { type: String, required: true },
  },
  { _id: false }
);

const GameSchema = new Schema<IGame>(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    players: {
      type: [PlayerSchema],
      required: true,
    },
    state: {
      type: String,
      enum: ['waiting', 'in_progress', 'round_end', 'game_end'],
      default: 'waiting',
    },
    currentRound: {
      type: Number,
      default: 0,
    },
    maxRounds: {
      type: Number,
      default: 3,
    },
    currentPlayerIndex: {
      type: Number,
      default: 0,
    },
    gameData: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Game = mongoose.model<IGame>('Game', GameSchema);


