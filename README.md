# Печенька - Telegram Mini App

Игра на дедукцию и блеф для 4-6 игроков в формате Telegram Mini App.

## Описание проекта

Проект состоит из трех основных частей:

- **backend/** - Игровой движок на TypeScript (изолированная логика игры)
- **server/** - Backend сервер с REST API и WebSocket (Express, Socket.IO, MongoDB)
- **frontend/** - React приложение для Telegram Mini App (TypeScript, Vite)

## Структура проекта

```
tg-mini-app/
├── backend/              # Игровой движок
│   ├── src/
│   │   ├── game.ts       # Главный класс игры
│   │   ├── player.ts     # Класс игрока
│   │   ├── deck.ts       # Колода и карты
│   │   └── ...
│   └── package.json
├── server/               # API сервер
│   ├── src/
│   │   ├── server.ts     # Express сервер
│   │   ├── routes/       # REST API маршруты
│   │   ├── websocket/    # WebSocket обработчики
│   │   ├── services/     # Бизнес-логика
│   │   ├── models/       # MongoDB модели
│   │   └── ...
│   └── package.json
├── frontend/             # React приложение
│   ├── src/
│   │   ├── components/   # React компоненты
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API клиенты
│   │   └── ...
│   └── package.json
└── README.md
```

## Установка и запуск

### Предварительные требования

- Node.js (v18 или выше)
- MongoDB (локальная установка)
- npm или yarn

### 1. Установка зависимостей

```bash
# Backend (игровой движок)
cd backend
npm install
npm run build

# Server (API сервер)
cd ../server
npm install

# Frontend (React приложение)
cd ../frontend
npm install
```

### 2. Настройка MongoDB

Убедитесь, что MongoDB запущен локально:

```bash
# Windows (если установлен как сервис)
# MongoDB должен запускаться автоматически

# Или запустите вручную
mongod
```

По умолчанию используется: `mongodb://localhost:27017/pechenka`

### 3. Настройка переменных окружения

Создайте файл `server/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pechenka
NODE_ENV=development
TELEGRAM_BOT_TOKEN=
```

### 4. Запуск сервера

```bash
cd server
npm run dev
```

Сервер запустится на `http://localhost:3000`

### 5. Запуск фронтенда

```bash
cd frontend
npm run dev
```

Приложение будет доступно на `http://localhost:5173`

## Разработка

### Backend (игровой движок)

```bash
cd backend
npm run build    # Сборка TypeScript
npm test        # Запуск тестов
```

### Server (API)

```bash
cd server
npm run dev     # Запуск в режиме разработки с hot reload
npm run build   # Сборка для production
npm start       # Запуск production версии
```

### Frontend (React)

```bash
cd frontend
npm run dev     # Запуск dev сервера
npm run build   # Сборка для production
npm run preview # Предпросмотр production сборки
```

## API Endpoints

### REST API

- `POST /api/games` - Создать новую игру
- `GET /api/games/:id` - Получить информацию об игре
- `POST /api/games/:id/join` - Присоединиться к игре
- `POST /api/games/:id/start` - Начать игру
- `GET /api/games/:id/state` - Получить публичное состояние игры
- `GET /api/games/:id/private-state` - Получить приватное состояние игрока
- `POST /api/games/:id/action` - Выполнить действие игрока

### WebSocket Events

**Клиент → Сервер:**
- `join-game` - Присоединиться к игре
- `player-action` - Выполнить действие
- `request-state` - Запросить обновление состояния

**Сервер → Клиент:**
- `game-state` - Обновление состояния игры
- `private-state` - Обновление приватного состояния игрока
- `player-joined` - Игрок присоединился
- `player-left` - Игрок покинул игру
- `error` - Ошибка
- `action-error` - Ошибка выполнения действия

## Технологии

- **Backend**: TypeScript, Node.js
- **Server**: Express, Socket.IO, Mongoose, MongoDB
- **Frontend**: React, TypeScript, Vite, React Router
- **Telegram**: @twa-dev/sdk

## Особенности

- Real-time обновления через WebSocket
- Интеграция с Telegram Mini App
- Сохранение состояния игры в MongoDB
- Поддержка восстановления игры после переподключения
- Адаптивный UI

## Лицензия

MIT
