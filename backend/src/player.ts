/**
 * Класс игрока
 */

import { Character, getTarget, getHunter } from './character';
import { Card } from './deck';

/**
 * Класс игрока
 */
export class Player {
  public role: Character | null = null;
  public hand: Card[] = [];
  public coins: number = 0;
  public revealedCards: Card[] = [];
  public usedSword: boolean = false;
  public usedShield: boolean = false;

  constructor(
    public id: string,
    public name: string
  ) {}

  /**
   * Назначить роль игроку
   * @param character - Персонаж
   */
  assignRole(character: Character): void {
    this.role = character;
  }

  /**
   * Добавить карты в руку
   * @param cards - Массив карт
   */
  addCards(cards: Card[]): void {
    this.hand.push(...cards);
  }

  /**
   * Вскрыть карту-подсказку
   * @param cardIndex - Индекс карты в руке
   * @returns Вскрытая карта
   */
  revealCard(cardIndex: number): Card {
    if (cardIndex < 0 || cardIndex >= this.hand.length) {
      throw new Error(`Неверный индекс карты: ${cardIndex}`);
    }

    const card = this.hand[cardIndex];
    if (!card.isHint()) {
      throw new Error('Можно вскрывать только карты-подсказки');
    }

    this.hand.splice(cardIndex, 1);
    this.revealedCards.push(card);
    return card;
  }

  /**
   * Использовать карту Меча (атака)
   * @param targetPlayerId - ID цели атаки
   */
  useSword(targetPlayerId: string): void {
    if (this.usedSword) {
      throw new Error('Меч уже использован в этом раунде');
    }

    const swordCardIndex = this.hand.findIndex(card => card.isSword());
    if (swordCardIndex === -1) {
      throw new Error('Нет карты Меча в руке');
    }

    this.hand.splice(swordCardIndex, 1);
    this.usedSword = true;
  }

  /**
   * Использовать карту Щита (защита)
   */
  useShield(): void {
    if (this.usedShield) {
      throw new Error('Щит уже использован в этом раунде');
    }

    const shieldCardIndex = this.hand.findIndex(card => card.isShield());
    if (shieldCardIndex === -1) {
      throw new Error('Нет карты Щита в руке');
    }

    this.hand.splice(shieldCardIndex, 1);
    this.usedShield = true;
  }

  /**
   * Получить цель охоты (кого должен атаковать)
   * @returns Цель охоты
   */
  getTarget(): Character | null {
    if (!this.role) {
      return null;
    }
    return getTarget(this.role);
  }

  /**
   * Получить охотника (кто охотится на этого игрока)
   * @returns Охотник
   */
  getHunter(): Character | null {
    if (!this.role) {
      return null;
    }
    return getHunter(this.role);
  }

  /**
   * Сбросить состояние раунда (но не монеты)
   */
  resetRound(): void {
    this.usedSword = false;
    this.usedShield = false;
    this.revealedCards = [];
  }

  /**
   * Проверить, есть ли карта Меча в руке
   */
  hasSword(): boolean {
    return this.hand.some(card => card.isSword());
  }

  /**
   * Проверить, есть ли карта Щита в руке
   */
  hasShield(): boolean {
    return this.hand.some(card => card.isShield());
  }

  /**
   * Проверить, есть ли карты-подсказки в руке
   */
  hasHints(): boolean {
    return this.hand.some(card => card.isHint());
  }
}

