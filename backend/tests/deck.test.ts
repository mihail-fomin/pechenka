/**
 * Тесты для модуля deck
 */

import { Deck, Card } from '../src/models/deck';
import { Character } from '../src/models/character';

describe('Card', () => {
  test('должен создать карту-подсказку', () => {
    const card = new Card('hint', Character.PECHENKA);
    expect(card.type).toBe('hint');
    expect(card.value).toBe(Character.PECHENKA);
    expect(card.isHint()).toBe(true);
    expect(card.isSword()).toBe(false);
    expect(card.isShield()).toBe(false);
  });

  test('должен создать карту Меча', () => {
    const card = new Card('sword');
    expect(card.type).toBe('sword');
    expect(card.value).toBeNull();
    expect(card.isSword()).toBe(true);
  });

  test('должен создать карту Щита', () => {
    const card = new Card('shield');
    expect(card.type).toBe('shield');
    expect(card.value).toBeNull();
    expect(card.isShield()).toBe(true);
  });

  test('должен создать карту Холма', () => {
    const card = new Card('hill');
    expect(card.type).toBe('hill');
    expect(card.value).toBeNull();
    expect(card.isHill()).toBe(true);
  });
});

describe('Deck', () => {
  test('должен создать колоду для 4 игроков', () => {
    const deck = new Deck(4);
    // 6 персонажей * 4 подсказки = 24 подсказки + 4 меча + 4 щита + 4 холма = 36 карт
    expect(deck.cards.length).toBe(36);
  });

  test('должен создать колоду для 6 игроков', () => {
    const deck = new Deck(6);
    // 6 персонажей * 6 подсказок = 36 подсказок + 6 мечей + 6 щитов + 6 холмов = 54 карты
    expect(deck.cards.length).toBe(54);
  });

  test('должен содержать правильное количество карт каждого типа', () => {
    const deck = new Deck(4);
    const hints = deck.cards.filter(c => c.isHint());
    const swords = deck.cards.filter(c => c.isSword());
    const shields = deck.cards.filter(c => c.isShield());
    const hills = deck.cards.filter(c => c.isHill());

    expect(hints.length).toBe(24); // 6 персонажей * 4 игрока
    expect(swords.length).toBe(4);
    expect(shields.length).toBe(4);
    expect(hills.length).toBe(4);
  });

  test('должен содержать по playerCount карты-подсказки каждого персонажа', () => {
    const deck = new Deck(4);
    const hints = deck.cards.filter(c => c.isHint());
    
    const characterCounts = new Map<Character, number>();
    hints.forEach(card => {
      const char = card.value as Character;
      characterCounts.set(char, (characterCounts.get(char) || 0) + 1);
    });

    // Каждый персонаж должен иметь по 4 подсказки (по одной для каждого игрока)
    expect(characterCounts.get(Character.PECHENKA)).toBe(4);
    expect(characterCounts.get(Character.BLUE)).toBe(4);
    expect(characterCounts.get(Character.STRONTIUM)).toBe(4);
    expect(characterCounts.get(Character.RED)).toBe(4);
    expect(characterCounts.get(Character.GREEN)).toBe(4);
    expect(characterCounts.get(Character.YELLOW)).toBe(4);
  });

  test('должен перемешать колоду', () => {
    const deck1 = new Deck(4);
    const deck2 = new Deck(4);
    
    const originalOrder1 = deck1.cards.map(c => `${c.type}-${c.value}`);
    const originalOrder2 = deck2.cards.map(c => `${c.type}-${c.value}`);
    
    deck1.shuffle(12345);
    deck2.shuffle(12345);
    
    const shuffledOrder1 = deck1.cards.map(c => `${c.type}-${c.value}`);
    const shuffledOrder2 = deck2.cards.map(c => `${c.type}-${c.value}`);
    
    // С одинаковым seed порядок должен быть одинаковым
    expect(shuffledOrder1).toEqual(shuffledOrder2);
    
    // Порядок должен измениться (с высокой вероятностью)
    expect(shuffledOrder1).not.toEqual(originalOrder1);
  });

  test('должен взять карты из колоды', () => {
    const deck = new Deck(4);
    const initialCount = deck.cards.length;
    const drawn = deck.draw(5);
    
    expect(drawn.length).toBe(5);
    expect(deck.cards.length).toBe(initialCount - 5);
  });

  test('должен выбросить ошибку при попытке взять больше карт, чем есть', () => {
    const deck = new Deck(4);
    const count = deck.cards.length;
    deck.draw(count);
    
    expect(() => deck.draw(1)).toThrow('Недостаточно карт в колоде');
  });

  test('должен сохранить все карты после перемешивания', () => {
    const deck = new Deck(4);
    const originalCards = [...deck.cards];
    deck.shuffle();
    
    expect(deck.cards.length).toBe(originalCards.length);
    
    // Проверим, что все карты на месте (по типам)
    const originalHints = originalCards.filter(c => c.isHint()).length;
    const shuffledHints = deck.cards.filter(c => c.isHint()).length;
    expect(shuffledHints).toBe(originalHints);
  });
});

