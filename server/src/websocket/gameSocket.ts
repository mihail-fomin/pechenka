import { Server, Socket } from 'socket.io';
import { getGameState, getPlayerPrivateState, processPlayerAction } from '../services/gameService';
import { Game } from '../models/Game';
import { GameSession } from '../models/GameSession';
import { Action } from '../../../backend/src/models/actions';

interface SocketData {
  gameId?: string;
  playerId?: string;
  telegramId?: number;
}

/**
 * Настройка WebSocket обработчиков для игр
 */
export const setupGameSocket = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log('Клиент подключен:', socket.id);

    /**
     * Присоединиться к игре
     */
    socket.on('join-game', async (data: { gameId: string; playerId: string; telegramId: number }) => {
      try {
        const { gameId, playerId, telegramId } = data;

        // Проверить, что игра существует
        const game = await Game.findOne({ gameId });
        if (!game) {
          socket.emit('error', { message: 'Игра не найдена' });
          return;
        }

        // Проверить, что игрок в игре
        const player = game.players.find(p => p.id === playerId && p.telegramId === telegramId);
        if (!player) {
          socket.emit('error', { message: 'Игрок не найден в игре' });
          return;
        }

        // Сохранить данные в socket
        (socket.data as SocketData) = { gameId, playerId, telegramId };

        // Присоединиться к комнате игры
        socket.join(`game:${gameId}`);

        // Создать или обновить сессию
        await GameSession.findOneAndUpdate(
          { gameId, telegramId },
          {
            sessionId: socket.id,
            gameId,
            playerId,
            telegramId,
            lastActivity: new Date(),
          },
          { upsert: true, new: true }
        );

        // Отправить текущее состояние игры
        const gameState = await getGameState(gameId);
        if (gameState) {
          socket.emit('game-state', gameState);
        }

        // Отправить приватное состояние игрока
        const privateState = await getPlayerPrivateState(gameId, playerId);
        if (privateState) {
          socket.emit('private-state', privateState);
        }

        // Уведомить других игроков
        socket.to(`game:${gameId}`).emit('player-joined', {
          playerId,
          playerName: player.name,
        });

        console.log(`Игрок ${playerId} присоединился к игре ${gameId}`);
      } catch (error: any) {
        console.error('Ошибка присоединения к игре:', error);
        socket.emit('error', { message: error.message || 'Ошибка присоединения к игре' });
      }
    });

    /**
     * Выполнить действие игрока
     */
    socket.on('player-action', async (data: { action: Action }) => {
      try {
        const { gameId, playerId } = socket.data as SocketData;

        if (!gameId || !playerId) {
          socket.emit('error', { message: 'Не присоединены к игре' });
          return;
        }

        const result = await processPlayerAction(gameId, playerId, data.action);

        if (!result.success) {
          socket.emit('action-error', { error: result.error });
          return;
        }

        // Обновить сессию
        await GameSession.findOneAndUpdate(
          { gameId, playerId },
          { lastActivity: new Date() }
        );

        // Получить обновленное состояние игры
        const gameState = await getGameState(gameId);
        const privateState = await getPlayerPrivateState(gameId, playerId);

        // Отправить обновления всем игрокам в комнате
        io.to(`game:${gameId}`).emit('game-state', gameState);
        
        // Отправить приватные состояния каждому игроку
        const game = await Game.findOne({ gameId });
        if (game) {
          for (const player of game.players) {
            const playerPrivateState = await getPlayerPrivateState(gameId, player.id);
            if (playerPrivateState) {
              io.to(`game:${gameId}`).emit('private-state', playerPrivateState);
            }
          }
        }

        // Отправить результат действия
        socket.emit('action-result', { success: true, result: result.result });
      } catch (error: any) {
        console.error('Ошибка выполнения действия:', error);
        socket.emit('action-error', { error: error.message || 'Ошибка выполнения действия' });
      }
    });

    /**
     * Запросить обновление состояния
     */
    socket.on('request-state', async () => {
      try {
        const { gameId, playerId } = socket.data as SocketData;

        if (!gameId || !playerId) {
          return;
        }

        const gameState = await getGameState(gameId);
        const privateState = await getPlayerPrivateState(gameId, playerId);

        if (gameState) {
          socket.emit('game-state', gameState);
        }
        if (privateState) {
          socket.emit('private-state', privateState);
        }
      } catch (error: any) {
        console.error('Ошибка запроса состояния:', error);
        socket.emit('error', { message: error.message || 'Ошибка запроса состояния' });
      }
    });

    /**
     * Отключение
     */
    socket.on('disconnect', async () => {
      try {
        const { gameId, playerId } = socket.data as SocketData;

        if (gameId && playerId) {
          // Удалить сессию
          await GameSession.findOneAndDelete({ sessionId: socket.id });

          // Уведомить других игроков
          socket.to(`game:${gameId}`).emit('player-left', { playerId });

          console.log(`Игрок ${playerId} покинул игру ${gameId}`);
        }
      } catch (error: any) {
        console.error('Ошибка при отключении:', error);
      }
    });
  });
};

