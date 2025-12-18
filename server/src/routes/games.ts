import { Router, Request, Response } from 'express';
import { createGame, addPlayerToGame, startGame, getGameState, getPlayerPrivateState, processPlayerAction } from '../services/gameService';
import { findOrCreateUser } from '../services/userService';
import { Game } from '../models/Game';
import { telegramAuth } from '../middleware/telegramAuth';
import { Action } from '../../../backend/src/actions';

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

    res.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка начала игры:', error);
    res.status(500).json({ error: error.message || 'Ошибка начала игры' });
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

