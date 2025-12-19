import { Request, Response, NextFunction } from 'express';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

/**
 * Middleware для извлечения данных пользователя из Telegram WebApp
 * В production нужно валидировать initData через Telegram Bot API
 */
export const telegramAuth = (req: Request, res: Response, next: NextFunction): void => {
  // В заголовке или теле запроса должны быть данные Telegram
  const initData = req.headers['x-telegram-init-data'] as string;
  const telegramUserHeader = req.headers['x-telegram-user'] as string;
  
  // Для разработки можно передавать данные напрямую
  // В production нужно валидировать через Telegram
  if (req.body.telegramUser) {
    (req as any).telegramUser = req.body.telegramUser;
    return next();
  }

  // Проверить заголовок x-telegram-user (для GET запросов и других случаев)
  if (telegramUserHeader) {
    try {
      const telegramUser = JSON.parse(telegramUserHeader);
      (req as any).telegramUser = telegramUser;
      return next();
    } catch (e) {
      // Игнорируем ошибку парсинга
    }
  }

  // Если нет данных, можно разрешить для разработки
  // В production нужно возвращать ошибку
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    // Для разработки можно использовать тестовые данные
    (req as any).telegramUser = {
      id: 123456789,
      first_name: 'Test User',
      username: 'testuser',
    };
    return next();
  }

  res.status(401).json({ error: 'Не авторизован' });
};


