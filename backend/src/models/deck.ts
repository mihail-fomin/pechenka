/**
 * Колода карт и карты игры
 */

import { Character, getAllCharacters } from './character';

/**
 * Тип карты
 */
export type CardType = 'hint' | 'sword' | 'shield' | 'hill';

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

  /**
   * Проверка, является ли карта холмом
   */
  isHill(): boolean {
    return this.type === 'hill';
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
   * Определить, какие персонажи нужно исключить в зависимости от количества игроков
   * Согласно правилам:
   * - Если играет 4 человека, удалите Персов и Косинуса
   * - Если играет 5 человек, удалите Косинуса
   * - Если играет 6 человек, все персонажи доступны
   * @param playerCount - Количество игроков
   * @returns Массив исключаемых персонажей
   */
  private getExcludedCharacters(playerCount: number): Character[] {
    const excluded: Character[] = [];
    
    // TODO: Определить, какие персонажи из enum Character соответствуют "Персам" и "Косинусу"
    // После определения заменить комментарии на соответствующие значения из enum Character
    // Например:
    // const PERSIANS = Character.???; // Персы
    // const COSINE = Character.???; // Косинус
    
    if (playerCount === 4) {
      // Исключить Персов и Косинуса
      // excluded.push(PERSIANS, COSINE);
    } else if (playerCount === 5) {
      // Исключить Косинуса
      // excluded.push(COSINE);
    }
    // Если playerCount === 6, все персонажи доступны
    
    return excluded;
  }

  /**
   * Инициализация колоды
   * @param playerCount - Количество игроков
   */
  private initialize(playerCount: number): void {
    this.cards = [];

    // Создать карты-подсказки для раздачи игрокам
    // Каждый игрок получит по одной подсказке каждого доступного персонажа
    const allCharacters = getAllCharacters();
    
    // Определить, какие персонажи нужно исключить в зависимости от количества игроков
    // Согласно правилам:
    // - Если играет 4 человека, удалите Персов и Косинуса
    // - Если играет 5 человек, удалите Косинуса
    // - Если играет 6 человек, все персонажи доступны
    const excludedCharacters = this.getExcludedCharacters(playerCount);
    const availableHintCharacters = allCharacters.filter(
      char => !excludedCharacters.includes(char)
    );

    // Создаем по playerCount подсказок для каждого доступного персонажа
    const hintsPerCharacter = playerCount;
    availableHintCharacters.forEach(character => {
      for (let i = 0; i < hintsPerCharacter; i++) {
        this.cards.push(new Card('hint', character));
      }
    });

    // Создать playerCount карт Меча (по одной на игрока)
    for (let i = 0; i < playerCount; i++) {
      this.cards.push(new Card('sword', null));
    }

    // Создать playerCount карт Щита (по одной на игрока)
    for (let i = 0; i < playerCount; i++) {
      this.cards.push(new Card('shield', null));
    }

    // Создать playerCount карт Холма (по одной на игрока)
    // Если играет 6 человек, карты холма не создаются
    if (playerCount < 6) {
      for (let i = 0; i < playerCount; i++) {
        this.cards.push(new Card('hill', null));
      }
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

