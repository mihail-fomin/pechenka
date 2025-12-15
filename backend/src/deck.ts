/**
 * Колода карт и карты игры
 */

import { Character, getAllCharacters } from './character';

/**
 * Тип карты
 */
export type CardType = 'hint' | 'sword' | 'shield';

/**
 * Класс карты
 */
export class Card {
  constructor(
    public type: CardType,
    public value: Character | null = null
  ) {}

  /**
   * Проверка, является ли карта подсказкой
   */
  isHint(): boolean {
    return this.type === 'hint';
  }

  /**
   * Проверка, является ли карта мечом
   */
  isSword(): boolean {
    return this.type === 'sword';
  }

  /**
   * Проверка, является ли карта щитом
   */
  isShield(): boolean {
    return this.type === 'shield';
  }
}

/**
 * Простой генератор случайных чисел с seed
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  /**
   * Генерация случайного числа от 0 до 1
   */
  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Генерация случайного целого числа в диапазоне [min, max)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }
}

/**
 * Класс колоды карт
 */
export class Deck {
  public cards: Card[] = [];
  private random: SeededRandom;

  constructor(playerCount: number, seed?: number) {
    this.random = new SeededRandom(seed);
    this.initialize(playerCount);
  }

  /**
   * Инициализация колоды
   * @param playerCount - Количество игроков
   */
  private initialize(playerCount: number): void {
    this.cards = [];

    // Создать 2 карты-подсказки каждого персонажа (12 карт)
    const characters = getAllCharacters();
    characters.forEach(character => {
      for (let i = 0; i < 2; i++) {
        this.cards.push(new Card('hint', character));
      }
    });

    // Создать playerCount карт Меча
    for (let i = 0; i < playerCount; i++) {
      this.cards.push(new Card('sword', null));
    }

    // Создать playerCount карт Щита
    for (let i = 0; i < playerCount; i++) {
      this.cards.push(new Card('shield', null));
    }
  }

  /**
   * Перемешать колоду (алгоритм Фишера-Йетса)
   * @param seed - Опциональный seed для детерминированности
   */
  shuffle(seed?: number): void {
    if (seed !== undefined) {
      this.random = new SeededRandom(seed);
    }

    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = this.random.randomInt(0, i + 1);
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Взять N карт из колоды
   * @param count - Количество карт
   * @returns Массив карт
   */
  draw(count: number): Card[] {
    if (count > this.cards.length) {
      throw new Error(`Недостаточно карт в колоде. Запрошено: ${count}, доступно: ${this.cards.length}`);
    }

    return this.cards.splice(0, count);
  }

  /**
   * Получить количество оставшихся карт
   */
  getRemainingCount(): number {
    return this.cards.length;
  }
}

