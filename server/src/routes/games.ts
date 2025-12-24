import { Router, Request, Response } from 'express';
import { createGame, addPlayerToGame, startGame, getGameState, getPlayerPrivateState, processPlayerAction } from '../services/gameService';
import { findOrCreateUser } from '../services/userService';
import { Game } from '../models/Game';
import { telegramAuth } from '../middleware/telegramAuth';
import { Action } from '../../../backend/src/models/actions';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';

// Глобальная переменная для io (будет установлена из server.ts)
let ioInstance: Server | null = null;

export const setIoInstance = (io: Server) => {
  ioInstance = io;
};

const router = Router();

// Все маршруты требуют аутентификации Telegram
router.use(telegramAuth);

/**
 * POST /api/games
 * Создать новую игру
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const { maxRounds } = req.body;

    // Найти или создать пользователя
    const user = await findOrCreateUser(
      telegramUser.id,
      telegramUser.username,
      telegramUser.first_name,
      telegramUser.last_name
    );

    // Создать игру
    const game = await createGame(
      telegramUser.id,
      telegramUser.first_name || 'Игрок',
      { maxRounds: maxRounds || 3 }
    );

    res.json({
      success: true,
      gameId: game.gameId,
      playerId: game.players[0].id,
    });
  } catch (error: any) {
    console.error('Ошибка создания игры:', error);
    res.status(500).json({ error: error.message || 'Ошибка создания игры' });
  }
});

/**
 * GET /api/games/:id
 * Получить информацию об игре
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const game = await Game.findOne({ gameId: id });

    if (!game) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }

    res.json({
      gameId: game.gameId,
      players: game.players,
      state: game.state,
      currentRound: game.currentRound,
      maxRounds: game.maxRounds,
      currentPlayerIndex: game.currentPlayerIndex,
    });
  } catch (error: any) {
    console.error('Ошибка получения игры:', error);
    res.status(500).json({ error: error.message || 'Ошибка получения игры' });
  }
});

/**
 * POST /api/games/:id/join
 * Присоединиться к игре
 */
router.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const telegramUser = (req as any).telegramUser;

    // Найти или создать пользователя
    await findOrCreateUser(
      telegramUser.id,
      telegramUser.username,
      telegramUser.first_name,
      telegramUser.last_name
    );

    const result = await addPlayerToGame(
      id,
      telegramUser.id,
      telegramUser.first_name || 'Игрок'
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      playerId: result.playerId,
    });
  } catch (error: any) {
    console.error('Ошибка присоединения к игре:', error);
    res.status(500).json({ error: error.message || 'Ошибка присоединения к игре' });
  }
});

/**
 * POST /api/games/:id/start
 * Начать игру
 */
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await startGame(id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Отправить обновление состояния всем игрокам через WebSocket
    if (ioInstance) {
      const gameState = await getGameState(id);
      if (gameState) {
        ioInstance.to(`game:${id}`).emit('game-state', gameState);

        // Отправить приватные состояния каждому игроку
        const game = await Game.findOne({ gameId: id });
        if (game) {
          for (const player of game.players) {
            const playerPrivateState = await getPlayerPrivateState(id, player.id);
            if (playerPrivateState) {
              ioInstance.to(`game:${id}`).emit('private-state', playerPrivateState);
            }
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка начала игры:', error);
    res.status(500).json({ error: error.message || 'Ошибка начала игры' });
  }
});

/**
 * POST /api/games/:id/add-test-players
 * Добавить тестовых игроков (только в режиме разработки)
 */
router.post('/:id/add-test-players', async (req: Request, res: Response) => {
  try {
    // Проверить, что это режим разработки
    // Если NODE_ENV не установлен, считаем это режимом разработки
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'production') {
      return res.status(403).json({ error: 'Доступно только в режиме разработки' });
    }

    const { id } = req.params;
    const gameDoc = await Game.findOne({ gameId: id });

    if (!gameDoc) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }

    if (gameDoc.state !== 'waiting') {
      return res.status(400).json({ error: 'Игра уже начата' });
    }

    // Добавить тестовых игроков до минимума (4 игрока)
    const testPlayers = [
      { telegramId: 111111111, name: 'Тестовый Игрок 1' },
      { telegramId: 222222222, name: 'Тестовый Игрок 2' },
      { telegramId: 333333333, name: 'Тестовый Игрок 3' },
      { telegramId: 444444444, name: 'Тестовый Игрок 4' },
      { telegramId: 555555555, name: 'Тестовый Игрок 5' },
    ];

    let added = 0;
    for (const testPlayer of testPlayers) {
      if (gameDoc.players.length >= 6) break;
      if (gameDoc.players.some(p => p.telegramId === testPlayer.telegramId)) continue;

      gameDoc.players.push({
        id: uuidv4(),
        telegramId: testPlayer.telegramId,
        name: testPlayer.name,
      });
      added++;
    }

    await gameDoc.save();

    res.json({
      success: true,
      added,
      totalPlayers: gameDoc.players.length,
    });
  } catch (error: any) {
    console.error('Ошибка добавления тестовых игроков:', error);
    res.status(500).json({ error: error.message || 'Ошибка добавления тестовых игроков' });
  }
});

/**
 * GET /api/games/:id/state
 * Получить публичное состояние игры
 */
router.get('/:id/state', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const state = await getGameState(id);

    if (!state) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }

    res.json(state);
  } catch (error: any) {
    console.error('Ошибка получения состояния:', error);
    res.status(500).json({ error: error.message || 'Ошибка получения состояния' });
  }
});

/**
 * GET /api/games/:id/private-state
 * Получить приватное состояние игрока
 */
router.get('/:id/private-state', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { playerId } = req.query;

    if (!playerId || typeof playerId !== 'string') {
      return res.status(400).json({ error: 'playerId обязателен' });
    }

    const privateState = await getPlayerPrivateState(id, playerId);

    if (!privateState) {
      return res.status(404).json({ error: 'Состояние не найдено' });
    }

    res.json(privateState);
  } catch (error: any) {
    console.error('Ошибка получения приватного состояния:', error);
    res.status(500).json({ error: error.message || 'Ошибка получения приватного состояния' });
  }
});

/**
 * POST /api/games/:id/auto-play
 * Автоматически сыграть случайной картой (только в режиме разработки)
 */
router.post('/:id/auto-play', async (req: Request, res: Response) => {
  try {
    // Проверить, что это режим разработки
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'production') {
      return res.status(403).json({ error: 'Доступно только в режиме разработки' });
    }

    const { id } = req.params;
    const { playerId, allPlayers } = req.body;

    const gameDoc = await Game.findOne({ gameId: id });
    if (!gameDoc) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }

    const gameState = await getGameState(id);
    if (!gameState) {
      return res.status(404).json({ error: 'Состояние игры не найдено' });
    }

    if (gameState.state !== 'circle_phase' && gameState.state !== 'resolving_phase') {
      return res.status(400).json({ error: 'Автоход доступен только в фазе круга или раскрытия' });
    }

    const results: Array<{ playerId: string; success: boolean; action?: any; error?: string }> = [];

    // Режим зависит от фазы игры
    if (gameState.state === 'circle_phase') {
      // Фаза круга - выбираем случайные карты
      const playersToAct = allPlayers 
        ? gameDoc.players.map(p => p.id)
        : playerId ? [playerId] : [];

      if (playersToAct.length === 0) {
        return res.status(400).json({ error: 'Не указаны игроки для автохода' });
      }

      for (const pid of playersToAct) {
        // Проверить, не выложил ли уже игрок карту
        if (gameState.circleInfo?.playersPlaced.includes(pid)) {
          results.push({ playerId: pid, success: false, error: 'Уже выложена карта' });
          continue;
        }

        // Получить приватное состояние игрока
        const privateState = await getPlayerPrivateState(id, pid);
        if (!privateState || privateState.hand.length === 0) {
          results.push({ playerId: pid, success: false, error: 'Нет карт в руке' });
          continue;
        }

        // Выбрать случайную карту
        const hand = privateState.hand;
        const randomIndex = Math.floor(Math.random() * hand.length);
        const randomCard = hand[randomIndex];

        // Сформировать действие в зависимости от типа карты
        let action: Action;
        if (randomCard.type === 'hint') {
          action = { type: 'reveal', cardIndex: randomIndex };
        } else if (randomCard.type === 'sword') {
          // Выбрать случайную цель для меча
          const otherPlayers = gameDoc.players.filter(p => p.id !== pid);
          const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          action = { type: 'sword', targetId: randomTarget.id };
        } else if (randomCard.type === 'shield') {
          // Выбрать случайную цель для щита
          const otherPlayers = gameDoc.players.filter(p => p.id !== pid);
          const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          action = { type: 'shield', targetId: randomTarget.id };
        } else if (randomCard.type === 'hill') {
          action = { type: 'hill' };
        } else {
          results.push({ playerId: pid, success: false, error: 'Неизвестный тип карты' });
          continue;
        }

        // Выполнить действие
        const result = await processPlayerAction(id, pid, action);
        results.push({ 
          playerId: pid, 
          success: result.success, 
          action: result.success ? action : undefined,
          error: result.error 
        });
      }
    } else if (gameState.state === 'resolving_phase') {
      // Фаза раскрытия - выполняем действия из очереди
      const queue = gameState.resolvingQueue || [];
      
      // Определяем сколько действий выполнять
      const actionsToProcess = allPlayers ? queue.length : 1;
      
      for (let i = 0; i < actionsToProcess && queue.length > 0; i++) {
        // Получаем актуальное состояние игры (очередь могла измениться)
        const currentState = await getGameState(id);
        if (!currentState || currentState.state !== 'resolving_phase') {
          break; // Фаза завершилась
        }
        
        const currentQueue = currentState.resolvingQueue || [];
        if (currentQueue.length === 0) break;
        
        const nextItem = currentQueue[0];
        const pid = nextItem.playerId;
        
        // Сформировать действие в зависимости от типа
        let action: Action;
        const otherPlayers = gameDoc.players.filter(p => p.id !== pid);
        const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        
        if (nextItem.actionType === 'sword') {
          action = { type: 'sword', targetId: randomTarget.id };
        } else {
          action = { type: 'shield', targetId: randomTarget.id };
        }

        // Выполнить действие
        const result = await processPlayerAction(id, pid, action);
        results.push({ 
          playerId: pid, 
          success: result.success, 
          action: result.success ? action : undefined,
          error: result.error 
        });
      }
    }

    // Отправить обновление состояния всем игрокам через WebSocket
    if (ioInstance) {
      const updatedGameState = await getGameState(id);
      if (updatedGameState) {
        ioInstance.to(`game:${id}`).emit('game-state', updatedGameState);

        // Отправить приватные состояния каждому игроку
        for (const player of gameDoc.players) {
          const playerPrivateState = await getPlayerPrivateState(id, player.id);
          if (playerPrivateState) {
            ioInstance.to(`game:${id}`).emit('private-state', playerPrivateState);
          }
        }
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Ошибка автохода:', error);
    res.status(500).json({ error: error.message || 'Ошибка автохода' });
  }
});

/**
 * POST /api/games/:id/action
 * Выполнить действие игрока
 */
router.post('/:id/action', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { playerId, action } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'playerId обязателен' });
    }

    if (!action || !action.type) {
      return res.status(400).json({ error: 'action обязателен' });
    }

    const result = await processPlayerAction(id, playerId, action as Action);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      result: result.result,
    });
  } catch (error: any) {
    console.error('Ошибка выполнения действия:', error);
    res.status(500).json({ error: error.message || 'Ошибка выполнения действия' });
  }
});

export default router;

