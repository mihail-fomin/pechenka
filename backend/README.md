# Игровой движок "Печенька"

Изолированный игровой движок для настольной игры "Печенька" на TypeScript.

## Описание игры

**"Печенька"** - это игра на дедукцию и блеф для 4-6 игроков. Каждый игрок получает:

- Тайную роль (один из 6 персонажей: Печенька, Синий, Стронций, Красный, Зелёный, Жёлтый)
- Карты в руку: карты-подсказки с персонажами, карты Меча (атака), карты Щита (защита)

### Цепочка охоты

Каждый персонаж охотится на определённого персонажа и является жертвой для другого:

```
Печенька → Синий → Стронций → Красный → Зелёный → Жёлтый → Печенька
```

### Механика раунда

1. Игроки получают тайные роли и карты
2. По очереди игроки либо:
   - Вскрывают карту-подсказку (чтобы дать намёк на свою роль или блефовать)
   - Используют карту Меча (атака на выбранного игрока)
   - Используют карту Щита (защита от атаки)
3. Раунд заканчивается когда все карты разыграны
4. Подсчёт очков (монет):
   - +2 монеты за успешную атаку своей жертвы
   - +1 монета за успешную защиту от своего охотника
   - 0 монет за неправильные действия

## Установка

```bash
npm install
```

## Сборка

```bash
npm run build
```

## Тестирование

```bash
npm test
```

## Использование

### Базовый пример

```typescript
import { PechenkaGame } from './src/game';

// Создание игры
const game = new PechenkaGame(['alice', 'bob', 'charlie', 'diana']);

// Начало игры
game.startGame();

// Получить состояние для конкретного игрока
const aliceState = game.getPlayerPrivateState('alice');
console.log('Твоя роль:', aliceState?.role);
console.log('Твои карты:', aliceState?.hand);
console.log('Твоя цель:', aliceState?.target);
console.log('Твой охотник:', aliceState?.hunter);

// Ход игрока - вскрыть карту-подсказку
const hintIndex = aliceState!.hand.findIndex(card => card.isHint());
if (hintIndex !== -1) {
  const result = game.processAction('alice', {
    type: 'reveal',
    cardIndex: hintIndex
  });
  console.log('Результат:', result);
}

// Получить текущего игрока
const currentPlayer = game.getCurrentPlayer();
console.log('Ход игрока:', currentPlayer.name);

// Ход игрока - атака мечом
const target = game.players.find(p => p.id !== currentPlayer.id)!;
if (currentPlayer.hasSword()) {
  game.processAction(currentPlayer.id, {
    type: 'sword',
    targetId: target.id
  });
}

// Ход игрока - защита щитом
if (currentPlayer.hasShield()) {
  game.processAction(currentPlayer.id, {
    type: 'shield'
  });
}

// Получить публичное состояние игры
const gameState = game.getGameState();
console.log('Состояние игры:', gameState);
```

### Симуляция полной игры

```typescript
import { PechenkaGame } from './src/game';

const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4'], {
  maxRounds: 3,
  seed: 12345, // Для детерминированности
  enableLogging: true // Включить логирование
});

game.startGame();

// Игровой цикл
while (game.state !== 'game_end') {
  const player = game.getCurrentPlayer();
  const privateState = game.getPlayerPrivateState(player.id);
  
  // Простая стратегия: сначала вскрываем подсказки, потом атакуем, потом защищаемся
  if (privateState?.hand.some(c => c.isHint()) && !player.usedSword && !player.usedShield) {
    const hintIndex = privateState.hand.findIndex(c => c.isHint());
    game.processAction(player.id, { type: 'reveal', cardIndex: hintIndex });
  } else if (player.hasSword() && !player.usedSword) {
    // Атакуем случайную цель (в реальной игре здесь была бы логика выбора)
    const target = game.players.find(p => p.id !== player.id)!;
    game.processAction(player.id, { type: 'sword', targetId: target.id });
  } else if (player.hasShield() && !player.usedShield) {
    game.processAction(player.id, { type: 'shield' });
  } else {
    // Если нет доступных действий, пропускаем ход
    break;
  }
  
  // Если раунд закончился, начинаем следующий
  if (game.state === 'round_end' && game.currentRound < game.maxRounds) {
    game.startRound();
  }
}

// Получить результаты
if (game.state === 'game_end') {
  const results = game.endGame();
  console.log('Победитель:', results.winner.name);
  console.log('Финальные очки:', results.finalScores);
}
```

### Опции игры

```typescript
const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4'], {
  maxRounds: 5,        // Максимальное количество раундов (по умолчанию: 3)
  seed: 12345,         // Seed для генератора случайных чисел (для детерминированности)
  enableLogging: true  // Включить логирование действий (по умолчанию: false)
});
```

## Структура проекта

```
pechenka-engine/
  src/
    game.ts           # Главный класс игры
    player.ts         # Класс игрока
    deck.ts           # Колода и карты
    character.ts      # Персонажи и цепочка охоты
    actions.ts        # Типы действий игроков
    utils.ts          # Вспомогательные функции
  tests/
    game.test.ts      # Тесты игры
    player.test.ts    # Тесты игрока
    deck.test.ts      # Тесты колоды
    character.test.ts # Тесты персонажей
  dist/               # Скомпилированный JavaScript
  package.json
  tsconfig.json
  README.md
```

## API

### PechenkaGame

#### Конструктор

```typescript
new PechenkaGame(playerIds: string[], options?: GameOptions)
```

#### Методы

- `startGame()` - Начать игру (первый раунд)
- `startRound()` - Начать новый раунд
- `processAction(playerId: string, action: Action)` - Обработать действие игрока
- `getCurrentPlayer()` - Получить текущего игрока
- `getGameState()` - Получить публичное состояние игры
- `getPlayerPrivateState(playerId: string)` - Получить приватное состояние игрока
- `endGame()` - Завершить игру и получить результаты
- `serialize()` - Сериализовать состояние игры

### Player

#### Свойства

- `id: string` - ID игрока
- `name: string` - Имя игрока
- `role: Character | null` - Тайная роль
- `hand: Card[]` - Карты в руке
- `coins: number` - Победные очки
- `revealedCards: Card[]` - Вскрытые карты-подсказки
- `usedSword: boolean` - Использовал ли меч в этом раунде
- `usedShield: boolean` - Использовал ли щит в этом раунде

#### Методы

- `assignRole(character: Character)` - Назначить роль
- `addCards(cards: Card[])` - Добавить карты в руку
- `revealCard(cardIndex: number)` - Вскрыть карту-подсказку
- `useSword(targetPlayerId: string)` - Использовать меч
- `useShield()` - Использовать щит
- `getTarget()` - Получить цель охоты
- `getHunter()` - Получить охотника
- `resetRound()` - Сбросить состояние раунда

### Card

#### Типы карт

- `'hint'` - Карта-подсказка (содержит персонажа)
- `'sword'` - Карта Меча (атака)
- `'shield'` - Карта Щита (защита)

#### Методы

- `isHint()` - Проверка, является ли карта подсказкой
- `isSword()` - Проверка, является ли карта мечом
- `isShield()` - Проверка, является ли карта щитом

## Особенности

- **Чистая логика** - Никаких зависимостей от UI или сетевых библиотек
- **Детерминированность** - Поддержка seed для воспроизводимости игр
- **Модульность** - Разделение на логические модули
- **Тестируемость** - Полное покрытие юнит-тестами
- **TypeScript** - Полная типизация для безопасности типов

## Лицензия

MIT

