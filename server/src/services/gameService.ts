import { PechenkaGame, GameState, GameOptions } from '../../../backend/src/game';
import { Game, IGame } from '../models/Game';
import { v4 as uuidv4 } from 'uuid';

// Кэш активных игр в памяти
const activeGames = new Map<string, PechenkaGame>();

/**
 * Создать новую игру
 */
export const createGame = async (
  creatorTelegramId: number,
  creatorName: string,
  options?: GameOptions
): Promise<IGame> => {
  const gameId = uuidv4();
  const playerId = uuidv4();

  // Создать список игроков (начинаем с создателя)
  const players = [
    {
      id: playerId,
      telegramId: creatorTelegramId,
      name: creatorName,
    },
  ];

  // В режиме разработки автоматически добавить тестовых игроков
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    const testPlayers = [
      { telegramId: 111111111, name: 'Тестовый Игрок 1' },
      { telegramId: 222222222, name: 'Тестовый Игрок 2' },
      { telegramId: 333333333, name: 'Тестовый Игрок 3' },
    ];

    // Добавить тестовых игроков, чтобы было минимум 4 игрока
    for (const testPlayer of testPlayers) {
      players.push({
        id: uuidv4(),
        telegramId: testPlayer.telegramId,
        name: testPlayer.name,
      });
    }
  }

  // Создать запись в БД (игра еще не начата, поэтому PechenkaGame не создаем)
  const gameDoc = new Game({
    gameId,
    players,
    state: 'waiting',
    currentRound: 0,
    maxRounds: options?.maxRounds || 3,
    currentPlayerIndex: 0,
    // gameData будет установлен в '' по умолчанию
  });

  await gameDoc.save();
  return gameDoc;
};

/**
 * Получить игру из кэша или восстановить из БД
 */
export const getGame = async (gameId: string): Promise<PechenkaGame | null> => {
  // Проверить кэш
  if (activeGames.has(gameId)) {
    return activeGames.get(gameId)!;
  }

  // Загрузить из БД
  const gameDoc = await Game.findOne({ gameId });
  if (!gameDoc) {
    return null;
  }

  // Восстановить игру из сериализованных данных
  // Примечание: PechenkaGame не имеет метода deserialize, 
  // поэтому нужно будет создать игру заново с теми же параметрами
  // Для упрощения, будем хранить только состояние и восстанавливать при необходимости
  
  // Пока возвращаем null, если игры нет в кэше
  // В будущем можно добавить метод deserialize в PechenkaGame
  return null;
};

/**
 * Добавить игрока в игру
 */
export const addPlayerToGame = async (
  gameId: string,
  telegramId: number,
  playerName: string
): Promise<{ success: boolean; playerId?: string; error?: string }> => {
  const gameDoc = await Game.findOne({ gameId });
  if (!gameDoc) {
    return { success: false, error: 'Игра не найдена' };
  }

  if (gameDoc.state !== 'waiting') {
    return { success: false, error: 'Игра уже начата' };
  }

  if (gameDoc.players.length >= 6) {
    return { success: false, error: 'Игра полна (максимум 6 игроков)' };
  }

  // Проверить, не присоединился ли уже этот игрок
  if (gameDoc.players.some(p => p.telegramId === telegramId)) {
    return { success: false, error: 'Вы уже в этой игре' };
  }

  const playerId = uuidv4();
  gameDoc.players.push({
    id: playerId,
    telegramId,
    name: playerName,
  });

  // Если игра в кэше, добавить игрока туда тоже
  const game = activeGames.get(gameId);
  if (game) {
    // Добавить игрока в игру (нужно будет расширить PechenkaGame для этого)
    // Пока просто обновим БД
  }

  await gameDoc.save();
  return { success: true, playerId };
};

/**
 * Начать игру
 */
export const startGame = async (gameId: string): Promise<{ success: boolean; error?: string }> => {
  const gameDoc = await Game.findOne({ gameId });
  if (!gameDoc) {
    return { success: false, error: 'Игра не найдена' };
  }

  if (gameDoc.players.length < 4) {
    return { success: false, error: 'Недостаточно игроков (минимум 4)' };
  }

  if (gameDoc.state !== 'waiting') {
    return { success: false, error: 'Игра уже начата' };
  }

  // Создать экземпляр игры с всеми игроками
  const playerIds = gameDoc.players.map(p => p.id);
  const game = new PechenkaGame(playerIds, {
    maxRounds: gameDoc.maxRounds,
  });

  game.startGame();

  // Сохранить в кэш
  activeGames.set(gameId, game);

  // Обновить БД
  gameDoc.state = game.state;
  gameDoc.currentRound = game.currentRound;
  gameDoc.currentPlayerIndex = game.currentPlayerIndex;
  gameDoc.gameData = game.serialize();
  await gameDoc.save();

  return { success: true };
};

/**
 * Выполнить действие игрока
 */
export const processPlayerAction = async (
  gameId: string,
  playerId: string,
  action: any
): Promise<{ success: boolean; result?: any; error?: string }> => {
  const game = await getGame(gameId);
  if (!game) {
    // Попробовать восстановить из БД и начать заново
    const gameDoc = await Game.findOne({ gameId });
    if (!gameDoc) {
      return { success: false, error: 'Игра не найдена' };
    }

    // Восстановить игру (упрощенная версия)
    const playerIds = gameDoc.players.map(p => p.id);
    const restoredGame = new PechenkaGame(playerIds, {
      maxRounds: gameDoc.maxRounds,
    });
    // Здесь нужно было бы восстановить состояние из gameData
    // Пока просто создаем новую игру
    activeGames.set(gameId, restoredGame);
    return { success: false, error: 'Игра была перезапущена. Попробуйте снова.' };
  }

  const result = game.processAction(playerId, action);
  
  if (result.success) {
    // Обновить БД
    const gameDoc = await Game.findOne({ gameId });
    if (gameDoc) {
      gameDoc.state = game.state;
      gameDoc.currentRound = game.currentRound;
      gameDoc.currentPlayerIndex = game.currentPlayerIndex;
      gameDoc.gameData = game.serialize();
      await gameDoc.save();
    }
  }

  return result;
};

/**
 * Получить состояние игры
 */
export const getGameState = async (gameId: string) => {
  const game = await getGame(gameId);
  if (!game) {
    return null;
  }
  return game.getGameState();
};

/**
 * Получить приватное состояние игрока
 */
export const getPlayerPrivateState = async (gameId: string, playerId: string) => {
  const game = await getGame(gameId);
  if (!game) {
    return null;
  }
  return game.getPlayerPrivateState(playerId);
};

/**
 * Удалить игру из кэша
 */
export const removeGame = (gameId: string): void => {
  activeGames.delete(gameId);
};

