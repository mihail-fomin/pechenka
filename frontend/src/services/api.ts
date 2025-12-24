import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:1107/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерфейс для данных Telegram пользователя
export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

// Добавить данные Telegram пользователя к запросам
export const setTelegramUser = (user: TelegramUserData): void => {
  api.defaults.headers.common['x-telegram-user'] = JSON.stringify(user);
};

export interface CreateGameResponse {
  success: boolean;
  gameId: string;
  playerId: string;
}

export interface JoinGameResponse {
  success: boolean;
  playerId: string;
}

export interface GameInfo {
  gameId: string;
  players: Array<{
    id: string;
    telegramId: number;
    username?: string;
    name: string;
  }>;
  state: string;
  currentRound: number;
  maxRounds: number;
  currentPlayerIndex: number;
}

/**
 * Создать новую игру
 */
export const createGame = async (
  telegramUser: TelegramUserData,
  maxRounds?: number
): Promise<CreateGameResponse> => {
  const response = await api.post<CreateGameResponse>('/games', {
    telegramUser,
    maxRounds: maxRounds || 3,
  });
  return response.data;
};

/**
 * Получить информацию об игре
 */
export const getGameInfo = async (gameId: string): Promise<GameInfo> => {
  const response = await api.get<GameInfo>(`/games/${gameId}`);
  return response.data;
};

/**
 * Присоединиться к игре
 */
export const joinGame = async (
  gameId: string,
  telegramUser: TelegramUserData
): Promise<JoinGameResponse> => {
  const response = await api.post<JoinGameResponse>(`/games/${gameId}/join`, {
    telegramUser,
  });
  return response.data;
};

/**
 * Начать игру
 */
export const startGame = async (gameId: string): Promise<{ success: boolean }> => {
  const telegramUserHeader = api.defaults.headers.common['x-telegram-user'] as string;
  let telegramUser;
  try {
    telegramUser = telegramUserHeader ? JSON.parse(telegramUserHeader) : null;
  } catch (e) {
    // Игнорируем ошибку парсинга
  }
  const response = await api.post<{ success: boolean }>(`/games/${gameId}/start`, {
    telegramUser,
  });
  return response.data;
};

/**
 * Получить публичное состояние игры
 */
export const getGameState = async (gameId: string) => {
  const response = await api.get(`/games/${gameId}/state`);
  return response.data;
};

/**
 * Получить приватное состояние игрока
 */
export const getPlayerPrivateState = async (gameId: string, playerId: string) => {
  const response = await api.get(`/games/${gameId}/private-state`, {
    params: { playerId },
  });
  return response.data;
};

/**
 * Выполнить действие игрока
 */
export const performAction = async (
  gameId: string,
  playerId: string,
  action: any
): Promise<{ success: boolean; result?: any }> => {
  const response = await api.post(`/games/${gameId}/action`, {
    playerId,
    action,
  });
  return response.data;
};

/**
 * Добавить тестовых игроков (только в режиме разработки)
 */
export const addTestPlayers = async (
  gameId: string
): Promise<{ success: boolean; added?: number; totalPlayers?: number }> => {
  const response = await api.post(`/games/${gameId}/add-test-players`);
  return response.data;
};

/**
 * Автоматически сыграть случайной картой (только в режиме разработки)
 */
export const autoPlay = async (
  gameId: string,
  options: { playerId?: string; allPlayers?: boolean }
): Promise<{ 
  success: boolean; 
  results?: Array<{ 
    playerId: string; 
    success: boolean; 
    action?: any; 
    error?: string 
  }> 
}> => {
  const response = await api.post(`/games/${gameId}/auto-play`, options);
  return response.data;
};


