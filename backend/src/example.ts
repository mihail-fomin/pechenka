/**
 * Пример использования игрового движка "Печенька"
 */

import { PechenkaGame } from './game';

console.log('=== Пример игры "Печенька" ===\n');

// Создание игры
const game = new PechenkaGame(['alice', 'bob', 'charlie', 'diana'], {
  maxRounds: 2,
  seed: 12345,
  enableLogging: true
});

// Начало игры
game.startGame();

console.log('\n=== Начало игры ===');
console.log(`Раунд: ${game.currentRound}`);
console.log(`Игроков: ${game.players.length}\n`);

// Показать роли игроков (для демонстрации)
game.players.forEach(player => {
  const privateState = game.getPlayerPrivateState(player.id);
  console.log(`${player.name}: роль ${privateState?.role}, цель ${privateState?.target}, охотник ${privateState?.hunter}`);
});

console.log('\n=== Игровой процесс ===\n');

// Симуляция нескольких ходов
let turnCount = 0;
const maxTurns = 20;

while (game.state === 'in_progress' && turnCount < maxTurns) {
  const player = game.getCurrentPlayer();
  const privateState = game.getPlayerPrivateState(player.id);
  
  console.log(`Ход игрока: ${player.name}`);
  console.log(`  Карт в руке: ${player.hand.length}`);
  console.log(`  Монет: ${player.coins}`);
  
  let actionTaken = false;
  
  // Стратегия: сначала вскрываем подсказки, потом атакуем, потом защищаемся
  if (privateState?.hand.some(c => c.isHint()) && !player.usedSword && !player.usedShield) {
    const hintIndex = privateState.hand.findIndex(c => c.isHint());
    if (hintIndex !== -1) {
      const result = game.processAction(player.id, { type: 'reveal', cardIndex: hintIndex });
      if (result.success) {
        console.log(`  → Вскрыл карту-подсказку: ${result.result?.card?.value}`);
        actionTaken = true;
      }
    }
  } else if (player.hasSword() && !player.usedSword) {
    // Атакуем случайную цель
    const possibleTargets = game.players.filter(p => p.id !== player.id);
    if (possibleTargets.length > 0) {
      const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
      const result = game.processAction(player.id, { type: 'sword', targetId: target.id });
      if (result.success) {
        const success = result.result?.success ? 'успешно' : 'неудачно';
        console.log(`  → Атаковал ${target.name} (${success})`);
        actionTaken = true;
      }
    }
  } else if (player.hasShield() && !player.usedShield) {
    const result = game.processAction(player.id, { type: 'shield' });
    if (result.success) {
      console.log(`  → Использовал щит`);
      actionTaken = true;
    }
  }
  
  if (!actionTaken) {
    console.log(`  → Нет доступных действий`);
    break;
  }
  
  console.log('');
  turnCount++;
  
  // Проверяем состояние после хода
  const currentState = game.getGameState();
  if (currentState.state === 'round_end') {
    console.log(`\n=== Раунд ${game.currentRound} завершён ===`);
    currentState.players.forEach(p => {
      console.log(`${p.name}: ${p.coins} монет`);
    });
    
    if (game.currentRound < game.maxRounds) {
      console.log(`\n=== Начало раунда ${game.currentRound + 1} ===\n`);
      game.startRound();
    }
  }
}

// Завершение игры
if (game.state === 'game_end') {
  console.log('\n=== Игра завершена ===\n');
  const results = game.endGame();
  console.log(`Победитель: ${results.winner.name} с ${results.winner.coins} монетами\n`);
  console.log('Финальные очки:');
  results.finalScores.forEach(score => {
    console.log(`  ${score.id}: ${score.coins} монет`);
  });
} else {
  console.log('\n=== Игра прервана ===');
  const gameState = game.getGameState();
  console.log(`Текущее состояние: ${gameState.state}`);
  console.log(`Текущий раунд: ${gameState.currentRound}`);
  console.log('\nОчки игроков:');
  gameState.players.forEach(p => {
    console.log(`  ${p.name}: ${p.coins} монет`);
  });
}

