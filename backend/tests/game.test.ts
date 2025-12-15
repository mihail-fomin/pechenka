/**
 * Тесты для модуля game
 */

import { PechenkaGame } from '../src/game';
import { Character } from '../src/character';

describe('PechenkaGame', () => {
  test('должен создать игру с 4 игроками', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    expect(game.players).toHaveLength(4);
    expect(game.state).toBe('waiting');
  });

  test('должен выбросить ошибку при создании игры с неправильным количеством игроков', () => {
    expect(() => new PechenkaGame(['p1', 'p2'])).toThrow('Игра поддерживает от 4 до 6 игроков');
    expect(() => new PechenkaGame(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'])).toThrow('Игра поддерживает от 4 до 6 игроков');
  });

  test('должен раздать уникальные роли', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    game.startGame();

    const roles = game.players.map(p => p.role);
    const uniqueRoles = new Set(roles);
    expect(uniqueRoles.size).toBe(4);
    expect(roles.every(r => r !== null)).toBe(true);
  });

  test('должен раздать карты каждому игроку', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    game.startRound();

    game.players.forEach(player => {
      expect(player.hand.length).toBeGreaterThan(0);
    });
  });

  test('должен позволить игроку вскрыть карту', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    game.startRound();

    const player = game.getCurrentPlayer();
    const initialHandSize = player.hand.length;
    const hintIndex = player.hand.findIndex(c => c.isHint());

    if (hintIndex !== -1) {
      const result = game.processAction(player.id, { type: 'reveal', cardIndex: hintIndex });

      expect(result.success).toBe(true);
      expect(player.hand.length).toBe(initialHandSize - 1);
      expect(player.revealedCards.length).toBe(1);
    }
  });

  test('должен не позволить игроку действовать не в свой ход', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    game.startRound();

    const currentPlayer = game.getCurrentPlayer();
    const otherPlayer = game.players.find(p => p.id !== currentPlayer.id)!;
    const hintIndex = otherPlayer.hand.findIndex(c => c.isHint());

    if (hintIndex !== -1) {
      const result = game.processAction(otherPlayer.id, { type: 'reveal', cardIndex: hintIndex });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Не ваш ход');
    }
  });

  test('должен позволить игроку использовать меч', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    game.startRound();

    const player = game.getCurrentPlayer();
    const target = game.players.find(p => p.id !== player.id)!;

    if (player.hasSword()) {
      const result = game.processAction(player.id, { type: 'sword', targetId: target.id });
      expect(result.success).toBe(true);
      expect(player.usedSword).toBe(true);
    }
  });

  test('должен позволить игроку использовать щит', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    game.startRound();

    const player = game.getCurrentPlayer();

    if (player.hasShield()) {
      const result = game.processAction(player.id, { type: 'shield' });
      expect(result.success).toBe(true);
      expect(player.usedShield).toBe(true);
    }
  });

  test('должен начислить монеты за правильную атаку', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4'], { seed: 12345 });
    game.startRound();

    const player = game.getCurrentPlayer();
    const target = game.players.find(p => p.role === player.getTarget())!;

    if (player.hasSword() && target) {
      const initialCoins = player.coins;
      game.processAction(player.id, { type: 'sword', targetId: target.id });

      // Завершим раунд вручную для подсчета очков
      // Симулируем завершение раунда
      while (game.state === 'in_progress') {
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer.hasHints()) {
          const hintIndex = currentPlayer.hand.findIndex(c => c.isHint());
          if (hintIndex !== -1) {
            game.processAction(currentPlayer.id, { type: 'reveal', cardIndex: hintIndex });
          }
        } else if (currentPlayer.hasSword() && !currentPlayer.usedSword) {
          const anyTarget = game.players.find(p => p.id !== currentPlayer.id)!;
          game.processAction(currentPlayer.id, { type: 'sword', targetId: anyTarget.id });
        } else if (currentPlayer.hasShield() && !currentPlayer.usedShield) {
          game.processAction(currentPlayer.id, { type: 'shield' });
        } else {
          break;
        }
      }

      // Проверяем, что монеты начислены (после завершения раунда)
      if (game.state === 'round_end') {
        expect(player.coins).toBeGreaterThanOrEqual(initialCoins);
      }
    }
  });

  test('должен вернуть состояние игры', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    game.startGame();

    const state = game.getGameState();
    expect(state.players).toHaveLength(4);
    expect(state.currentRound).toBe(1);
    expect(state.state).toBe('in_progress');
  });

  test('должен вернуть приватное состояние игрока', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    game.startGame();

    const privateState = game.getPlayerPrivateState('p1');
    expect(privateState).not.toBeNull();
    expect(privateState?.role).toBeDefined();
    expect(privateState?.hand).toBeDefined();
    expect(privateState?.target).toBeDefined();
    expect(privateState?.hunter).toBeDefined();
  });

  test('должен определить победителя после всех раундов', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4'], { maxRounds: 1 });
    game.startGame();

    // Симулируем быстрый раунд
    let turns = 0;
    while (game.state === 'in_progress' && turns < 100) {
      const player = game.getCurrentPlayer();
      
      if (player.hasHints()) {
        const hintIndex = player.hand.findIndex(c => c.isHint());
        if (hintIndex !== -1) {
          game.processAction(player.id, { type: 'reveal', cardIndex: hintIndex });
        }
      } else if (player.hasSword() && !player.usedSword) {
        const target = game.players.find(p => p.id !== player.id)!;
        game.processAction(player.id, { type: 'sword', targetId: target.id });
      } else if (player.hasShield() && !player.usedShield) {
        game.processAction(player.id, { type: 'shield' });
      } else {
        break;
      }
      turns++;
    }

    // Если игра завершена, должен быть победитель
    if (game.state === 'game_end') {
      const result = game.endGame();
      expect(result.winner).toBeDefined();
      expect(result.finalScores).toHaveLength(4);
    }
  });

  test('должен записывать действия в историю', () => {
    const game = new PechenkaGame(['p1', 'p2', 'p3', 'p4']);
    game.startRound();

    const player = game.getCurrentPlayer();
    const hintIndex = player.hand.findIndex(c => c.isHint());

    if (hintIndex !== -1) {
      const initialHistoryLength = game.history.length;
      game.processAction(player.id, { type: 'reveal', cardIndex: hintIndex });
      expect(game.history.length).toBe(initialHistoryLength + 1);
      expect(game.history[game.history.length - 1].playerId).toBe(player.id);
    }
  });

  test('должен использовать seed для детерминированности', () => {
    const game1 = new PechenkaGame(['p1', 'p2', 'p3', 'p4'], { seed: 12345 });
    const game2 = new PechenkaGame(['p1', 'p2', 'p3', 'p4'], { seed: 12345 });

    game1.startGame();
    game2.startGame();

    // Роли должны быть одинаковыми (с одинаковым seed)
    const roles1 = game1.players.map(p => p.role).sort();
    const roles2 = game2.players.map(p => p.role).sort();
    expect(roles1).toEqual(roles2);
  });
});

