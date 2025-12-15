/**
 * Тесты для модуля player
 */

import { Player } from '../src/player';
import { Card } from '../src/deck';
import { Character } from '../src/character';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player('p1', 'Test Player');
  });

  test('должен создать игрока', () => {
    expect(player.id).toBe('p1');
    expect(player.name).toBe('Test Player');
    expect(player.role).toBeNull();
    expect(player.hand).toEqual([]);
    expect(player.coins).toBe(0);
  });

  test('должен назначить роль', () => {
    player.assignRole(Character.PECHENKA);
    expect(player.role).toBe(Character.PECHENKA);
  });

  test('должен добавить карты в руку', () => {
    const cards = [
      new Card('hint', Character.PECHENKA),
      new Card('sword'),
      new Card('shield')
    ];
    
    player.addCards(cards);
    expect(player.hand.length).toBe(3);
  });

  test('должен вскрыть карту-подсказку', () => {
    const hintCard = new Card('hint', Character.PECHENKA);
    player.addCards([hintCard]);
    
    const revealed = player.revealCard(0);
    
    expect(revealed).toBe(hintCard);
    expect(player.hand.length).toBe(0);
    expect(player.revealedCards.length).toBe(1);
    expect(player.revealedCards[0]).toBe(hintCard);
  });

  test('должен выбросить ошибку при попытке вскрыть не-подсказку', () => {
    const swordCard = new Card('sword');
    player.addCards([swordCard]);
    
    expect(() => player.revealCard(0)).toThrow('Можно вскрывать только карты-подсказки');
  });

  test('должен использовать меч', () => {
    const swordCard = new Card('sword');
    player.addCards([swordCard]);
    
    player.useSword('target-id');
    
    expect(player.usedSword).toBe(true);
    expect(player.hand.length).toBe(0);
  });

  test('должен выбросить ошибку при повторном использовании меча', () => {
    const swordCard = new Card('sword');
    player.addCards([swordCard]);
    player.useSword('target-id');
    
    expect(() => player.useSword('target-id')).toThrow('Меч уже использован в этом раунде');
  });

  test('должен использовать щит', () => {
    const shieldCard = new Card('shield');
    player.addCards([shieldCard]);
    
    player.useShield();
    
    expect(player.usedShield).toBe(true);
    expect(player.hand.length).toBe(0);
  });

  test('должен выбросить ошибку при повторном использовании щита', () => {
    const shieldCard = new Card('shield');
    player.addCards([shieldCard]);
    player.useShield();
    
    expect(() => player.useShield()).toThrow('Щит уже использован в этом раунде');
  });

  test('должен получить цель охоты', () => {
    player.assignRole(Character.PECHENKA);
    expect(player.getTarget()).toBe(Character.BLUE);
  });

  test('должен получить охотника', () => {
    player.assignRole(Character.PECHENKA);
    expect(player.getHunter()).toBe(Character.YELLOW);
  });

  test('должен сбросить состояние раунда', () => {
    player.assignRole(Character.PECHENKA);
    player.coins = 5;
    player.usedSword = true;
    player.usedShield = true;
    player.revealedCards = [new Card('hint', Character.BLUE)];
    
    player.resetRound();
    
    expect(player.coins).toBe(5); // Монеты не сбрасываются
    expect(player.usedSword).toBe(false);
    expect(player.usedShield).toBe(false);
    expect(player.revealedCards).toEqual([]);
  });

  test('должен проверить наличие карт', () => {
    expect(player.hasSword()).toBe(false);
    expect(player.hasShield()).toBe(false);
    expect(player.hasHints()).toBe(false);
    
    player.addCards([new Card('sword')]);
    expect(player.hasSword()).toBe(true);
    
    player.addCards([new Card('shield')]);
    expect(player.hasShield()).toBe(true);
    
    player.addCards([new Card('hint', Character.PECHENKA)]);
    expect(player.hasHints()).toBe(true);
  });
});

