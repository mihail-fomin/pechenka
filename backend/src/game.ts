/**
 * Главный класс игры "Печенька"
 */

import { Character, getAllCharacters, getTarget, getHunter } from './character';
import { Deck, Card } from './deck';
import { Player } from './player';
import { Action, ActionResult, RevealAction, SwordAction, ShieldAction } from './actions';
import { shuffleArray, SeededRandom } from './utils';

/**
 * Состояние игры
 */
export type GameState = 'waiting' | 'in_progress' | 'round_end' | 'game_end';

/**
 * Опции игры
 */
export interface GameOptions {
  maxRounds?: number;
  seed?: number;
  enableLogging?: boolean;
}

/**
 * Запись в истории игры
 */
export interface HistoryEntry {
  playerId: string;
  action: Action;
  result: ActionResult;
  timestamp: number;
}

/**
 * Публичное состояние игрока (без приватной информации)
 */
export interface PublicPlayerState {
  id: string;
  name: string;
  coins: number;
  handSize: number;
  revealedCards: Card[];
  usedSword: boolean;
  usedShield: boolean;
}

/**
 * Приватное состояние игрока
 */
export interface PrivatePlayerState {
  role: Character;
  hand: Card[];
  target: Character;
  hunter: Character;
}

/**
 * Полное состояние игры
 */
export interface GameStateData {
  players: PublicPlayerState[];
  currentRound: number;
  currentPlayerIndex: number;
  state: GameState;
}

/**
 * Результат окончания игры
 */
export interface GameEndResult {
  winner: Player;
  finalScores: Array<{ id: string; coins: number }>;
}

/**
 * Главный класс игры
 */
export class PechenkaGame {
  public players: Player[] = [];
  public deck: Deck | null = null;
  public currentRound: number = 0;
  public maxRounds: number = 3;
  public currentPlayerIndex: number = 0;
  public state: GameState = 'waiting';
  public history: HistoryEntry[] = [];
  private random: SeededRandom;
  private enableLogging: boolean = false;

  constructor(playerIds: string[], options: GameOptions = {}) {
    if (playerIds.length < 4 || playerIds.length > 6) {
      throw new Error('Игра поддерживает от 4 до 6 игроков');
    }

    this.players = playerIds.map((id, index) => new Player(id, `Player ${id}`));
    this.maxRounds = options.maxRounds || 3;
    this.random = new SeededRandom(options.seed);
    this.enableLogging = options.enableLogging || false;
  }

  /**
   * Логирование (если включено)
   */
  private log(message: string): void {
    if (this.enableLogging) {
      console.log(`[PechenkaGame] ${message}`);
    }
  }

  // === ИНИЦИАЛИЗАЦИЯ ===

  /**
   * Начать игру (первый раунд)
   */
  startGame(): void {
    if (this.state !== 'waiting') {
      throw new Error('Игра уже начата');
    }
    this.startRound();
  }

  /**
   * Начать новый раунд
   */
  startRound(): void {
    if (this.currentRound >= this.maxRounds) {
      throw new Error('Достигнуто максимальное количество раундов');
    }

    this.currentRound++;
    this.log(`Начало раунда ${this.currentRound}`);

    // Сбросить состояние игроков
    this.players.forEach(player => player.resetRound());

    this.assignRoles();
    this.dealCards();
    this.currentPlayerIndex = 0;
    this.state = 'in_progress';
  }

  /**
   * Раздать роли игрокам
   */
  private assignRoles(): void {
    const allCharacters = getAllCharacters();
    const availableCharacters = shuffleArray(
      allCharacters.slice(0, this.players.length),
      this.random.randomInt(0, 1000000)
    );

    this.players.forEach((player, index) => {
      player.assignRole(availableCharacters[index]);
      this.log(`Игрок ${player.name} получил роль: ${player.role}`);
    });
  }

  /**
   * Раздать карты игрокам
   */
  private dealCards(): void {
    this.deck = new Deck(this.players.length);
    this.deck.shuffle(this.random.randomInt(0, 1000000));

    // Равномерно раздать карты
    const cardsPerPlayer = Math.floor(this.deck.cards.length / this.players.length);
    const remainder = this.deck.cards.length % this.players.length;

    this.players.forEach((player, index) => {
      const cardsToDeal = cardsPerPlayer + (index < remainder ? 1 : 0);
      const cards = this.deck!.draw(cardsToDeal);
      player.addCards(cards);
      this.log(`Игрок ${player.name} получил ${cards.length} карт`);
    });
  }

  // === ИГРОВОЙ ПРОЦЕСС ===

  /**
   * Получить текущего игрока
   */
  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Обработать действие игрока
   * @param playerId - ID игрока
   * @param action - Действие
   * @returns Результат обработки
   */
  processAction(playerId: string, action: Action): { success: boolean; result?: ActionResult; error?: string } {
    // Валидация
    const validationError = this.validateAction(playerId, action);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Выполнение
    const result = this.executeAction(playerId, action);

    // Запись в историю
    this.history.push({
      playerId,
      action,
      result,
      timestamp: Date.now()
    });

    this.log(`Игрок ${playerId} выполнил действие: ${action.type}`);

    // Следующий ход
    this.nextTurn();

    // Проверка конца раунда
    if (this.checkRoundEnd()) {
      this.endRound();
    }

    return { success: true, result };
  }

  /**
   * Валидация действия
   * @param playerId - ID игрока
   * @param action - Действие
   * @returns Сообщение об ошибке или null
   */
  private validateAction(playerId: string, action: Action): string | null {
    if (this.state !== 'in_progress') {
      return 'Игра не в процессе';
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return 'Игрок не найден';
    }

    // Проверка, что это ход игрока
    if (this.getCurrentPlayer().id !== playerId) {
      return 'Не ваш ход';
    }

    // Проверка действия
    switch (action.type) {
      case 'reveal': {
        const revealAction = action as RevealAction;
        if (revealAction.cardIndex < 0 || revealAction.cardIndex >= player.hand.length) {
          return 'Неверный индекс карты';
        }
        const card = player.hand[revealAction.cardIndex];
        if (!card.isHint()) {
          return 'Можно вскрывать только карты-подсказки';
        }
        break;
      }

      case 'sword': {
        const swordAction = action as SwordAction;
        if (player.usedSword) {
          return 'Меч уже использован в этом раунде';
        }
        if (!player.hasSword()) {
          return 'Нет карты Меча в руке';
        }
        const target = this.players.find(p => p.id === swordAction.targetId);
        if (!target) {
          return 'Цель не найдена';
        }
        if (target.id === player.id) {
          return 'Нельзя атаковать себя';
        }
        break;
      }

      case 'shield': {
        if (player.usedShield) {
          return 'Щит уже использован в этом раунде';
        }
        if (!player.hasShield()) {
          return 'Нет карты Щита в руке';
        }
        break;
      }

      default:
        return 'Неизвестный тип действия';
    }

    return null;
  }

  /**
   * Выполнить действие
   * @param playerId - ID игрока
   * @param action - Действие
   * @returns Результат действия
   */
  private executeAction(playerId: string, action: Action): ActionResult {
    const player = this.players.find(p => p.id === playerId)!;

    switch (action.type) {
      case 'reveal':
        return this.handleReveal(player, (action as RevealAction).cardIndex);

      case 'sword':
        return this.handleSword(player, (action as SwordAction).targetId);

      case 'shield':
        return this.handleShield(player);

      default:
        return { type: 'error', error: 'Неизвестный тип действия' };
    }
  }

  /**
   * Обработать вскрытие карты
   */
  private handleReveal(player: Player, cardIndex: number): ActionResult {
    const card = player.revealCard(cardIndex);
    return {
      type: 'revealed',
      card
    };
  }

  /**
   * Обработать использование меча
   */
  private handleSword(player: Player, targetId: string): ActionResult {
    const target = this.players.find(p => p.id === targetId)!;
    player.useSword(targetId);

    // Проверка, правильная ли цель
    const isCorrectTarget = target.role === player.getTarget();

    return {
      type: 'sword_used',
      target: targetId,
      success: isCorrectTarget
    };
  }

  /**
   * Обработать использование щита
   */
  private handleShield(player: Player): ActionResult {
    player.useShield();
    return {
      type: 'shield_used'
    };
  }

  /**
   * Переход к следующему игроку
   */
  private nextTurn(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  /**
   * Проверка окончания раунда
   */
  private checkRoundEnd(): boolean {
    // Раунд заканчивается когда:
    // 1. Все карты разыграны (у всех игроков пустые руки)
    const allCardsPlayed = this.players.every(player => player.hand.length === 0);

    // 2. Все игроки использовали меч и щит
    const allUsedActions = this.players.every(
      player => player.usedSword && player.usedShield
    );

    return allCardsPlayed || allUsedActions;
  }

  // === ПОДСЧЁТ ОЧКОВ ===

  /**
   * Завершить раунд и подсчитать очки
   */
  private endRound(): void {
    this.log(`Завершение раунда ${this.currentRound}`);
    this.calculateScores();
    this.state = 'round_end';

    if (this.currentRound >= this.maxRounds) {
      this.endGame();
    }
  }

  /**
   * Подсчитать очки за раунд
   */
  private calculateScores(): void {
    this.players.forEach(player => {
      // +2 монеты за успешную атаку своей жертвы
      if (player.usedSword) {
        const swordAction = this.history
          .filter(h => h.playerId === player.id && h.action.type === 'sword')
          .pop();

        if (swordAction?.result?.success) {
          player.coins += 2;
          this.log(`Игрок ${player.name} получил +2 монеты за успешную атаку`);
        }
      }

      // +1 монета за успешную защиту от охотника
      if (player.usedShield) {
        const hunter = this.players.find(p => {
          const target = p.getTarget();
          return target === player.role;
        });

        if (hunter && hunter.usedSword) {
          const hunterAttack = this.history.find(
            h => h.playerId === hunter.id &&
            h.action.type === 'sword' &&
            (h.action as SwordAction).targetId === player.id
          );

          if (hunterAttack) {
            player.coins += 1;
            this.log(`Игрок ${player.name} получил +1 монету за успешную защиту`);
          }
        }
      }
    });
  }

  /**
   * Завершить игру
   */
  endGame(): GameEndResult {
    this.state = 'game_end';
    const winner = this.players.reduce((prev, current) =>
      (prev.coins > current.coins) ? prev : current
    );

    this.log(`Игра завершена. Победитель: ${winner.name} с ${winner.coins} монетами`);

    return {
      winner,
      finalScores: this.players.map(p => ({ id: p.id, coins: p.coins }))
    };
  }

  // === УТИЛИТЫ ===

  /**
   * Получить полное состояние игры (без приватной информации)
   */
  getGameState(): GameStateData {
    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        coins: p.coins,
        handSize: p.hand.length,
        revealedCards: [...p.revealedCards],
        usedSword: p.usedSword,
        usedShield: p.usedShield
      })),
      currentRound: this.currentRound,
      currentPlayerIndex: this.currentPlayerIndex,
      state: this.state
    };
  }

  /**
   * Получить приватное состояние игрока
   * @param playerId - ID игрока
   */
  getPlayerPrivateState(playerId: string): PrivatePlayerState | null {
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.role) {
      return null;
    }

    return {
      role: player.role,
      hand: [...player.hand],
      target: player.getTarget()!,
      hunter: player.getHunter()!
    };
  }

  /**
   * Сериализация состояния игры
   */
  serialize(): string {
    return JSON.stringify({
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        hand: p.hand.map(c => ({ type: c.type, value: c.value })),
        coins: p.coins,
        revealedCards: p.revealedCards.map(c => ({ type: c.type, value: c.value })),
        usedSword: p.usedSword,
        usedShield: p.usedShield
      })),
      currentRound: this.currentRound,
      currentPlayerIndex: this.currentPlayerIndex,
      state: this.state,
      history: this.history
    });
  }
}

