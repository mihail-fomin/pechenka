import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSession extends Document {
  sessionId: string;
  gameId: string;
  playerId: string;
  telegramId: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameSessionSchema = new Schema<IGameSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gameId: {
      type: String,
      required: true,
      index: true,
    },
    playerId: {
      type: String,
      required: true,
    },
    telegramId: {
      type: Number,
      required: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Индекс для быстрого поиска активных сессий игрока
GameSessionSchema.index({ telegramId: 1, gameId: 1 });

export const GameSession = mongoose.model<IGameSession>('GameSession', GameSessionSchema);


