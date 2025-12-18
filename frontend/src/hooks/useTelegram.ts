import { useEffect, useState } from 'react';
import { initDataRaw, initData, WebApp } from '@twa-dev/sdk';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface UseTelegramReturn {
  user: TelegramUser | null;
  webApp: WebApp | null;
  ready: boolean;
}

export const useTelegram = (): UseTelegramReturn => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Инициализация Telegram WebApp SDK
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();

      setWebApp(tg);

      // Получить данные пользователя
      if (tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        setUser({
          id: tgUser.id,
          first_name: tgUser.first_name || 'Игрок',
          last_name: tgUser.last_name,
          username: tgUser.username,
        });
      } else {
        // Для разработки, если нет данных Telegram
        if (process.env.NODE_ENV === 'development') {
          setUser({
            id: 123456789,
            first_name: 'Test User',
            username: 'testuser',
          });
        }
      }

      // Применить тему
      if (tg.colorScheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }

      // Слушать изменения темы
      tg.onEvent('themeChanged', () => {
        if (tg.colorScheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      });

      setReady(true);
    } else {
      // Для разработки вне Telegram
      if (process.env.NODE_ENV === 'development') {
        setUser({
          id: 123456789,
          first_name: 'Test User',
          username: 'testuser',
        });
        setReady(true);
      }
    }
  }, []);

  return { user, webApp, ready };
};


