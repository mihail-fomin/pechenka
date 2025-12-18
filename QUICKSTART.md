# Быстрый старт

## Шаг 1: Установка зависимостей

```bash
# Backend (игровой движок)
cd backend
npm install
npm run build

# Server (API)
cd ../server
npm install

# Frontend
cd ../frontend
npm install
```

## Шаг 2: Запуск MongoDB

Убедитесь, что MongoDB запущен локально на порту 27017.

## Шаг 3: Настройка окружения

Создайте `server/.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pechenka
NODE_ENV=development
```

## Шаг 4: Запуск

В одном терминале:
```bash
cd server
npm run dev
```

В другом терминале:
```bash
cd frontend
npm run dev
```

## Шаг 5: Открыть приложение

Откройте `http://localhost:5173` в браузере или в Telegram Mini App.

## Примечания

- Для разработки вне Telegram можно использовать тестовые данные пользователя
- WebSocket подключение работает на `http://localhost:3000`
- API доступен на `http://localhost:3000/api`


