/**
 * Главный класс игры "Печенька"
 */

import { Character, getCharactersForPlayerCount, getTarget, getHunter } from '../models/character';
import { Deck, Card } from '../models/deck';
import { Player } from './player';
import { Action, ActionResult, RevealAction, SwordAction, ShieldAction, HillAction } from '../models/actions';
import { shuffleArray, SeededRandom } from '../utils/utils';

/**
 * Состояние игры
 */
export type GameState = 'waiting' | 'circle_phase' | 'resolving_phase' | 'round_end' | 'game_end';

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
  swordTargetId?: string | null;  // На кого напал
  shieldTargetId?: string | null; // От кого защитился
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
 * Информация о выложенной карте на столе
 */
export interface PlayedCardInfo {
  playerId: string;
  playerName: string;
  cardType: 'hint' | 'sword' | 'shield' | 'hill' | 'hidden';
  cardValue?: string | null;
  order: number; // порядок выкладывания
}

/**
 * Информация о текущем круге
 */
export interface CircleInfo {
  currentCircle: number;
  maxCircles: number;
  playersPlaced: string[]; // id игроков, которые уже выложили карту
  playedCards: PlayedCardInfo[]; // выложенные карты (видимые после вскрытия)
}

/**
 * Элемент очереди разрешения
 */
export interface ResolvingQueueItem {
  playerId: string;
  actionType: 'sword' | 'shield';
}

/**
 * Полное состояние игры
 */
export interface GameStateData {
  players: PublicPlayerState[];
  currentRound: number;
  currentPlayerIndex: number;
  state: GameState;
  circleInfo?: CircleInfo;
  resolvingQueue?: ResolvingQueueItem[];
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
  public maxRounds: number = 0; // Будет установлено равным количеству игроков
  public currentCircle: number = 0; // Текущий круг в раунде
  public currentPlayerIndex: number = 0; // Первый игрок в раунде
  public state: GameState = 'waiting';
  public history: HistoryEntry[] = [];
  // Карты, выложенные в текущем круге (до вскрытия)
  private circleCards: Map<string, { cardIndex: number; action: Action }> = new Map();
  // Карты, вскрытые в текущем круге
  private revealedCircleCards: Map<string, Card> = new Map();
  // Очередь разыгрывания мечей и щитов
  private resolvingQueue: Array<{ playerId: string; action: Action }> = [];
  private random: SeededRandom;
  private enableLogging: boolean = false;

  constructor(playerIds: string[], options: GameOptions = {}) {
    if (playerIds.length < 4 || playerIds.length > 6) {
      throw new Error('Игра поддерживает от 4 до 6 игроков');
    }

    this.players = playerIds.map((id, index) => new Player(id, `Player ${id}`));
    // Количество раундов = количеству игроков (каждый должен побыть первым)
    this.maxRounds = options.maxRounds || playerIds.length;
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
    this.currentCircle = 0;
    this.log(`Начало раунда ${this.currentRound}`);

    // Сбросить состояние игроков
    this.players.forEach(player => player.resetRound());

    // Первый игрок меняется каждый раунд (по часовой стрелке)
    this.currentPlayerIndex = (this.currentRound - 1) % this.players.length;

    this.assignRoles();
    this.dealCards();
    this.startCircle();
  }

  /**
   * Начать новый круг
   */
  private startCircle(): void {
    this.currentCircle++;
    this.log(`Начало круга ${this.currentCircle} раунда ${this.currentRound}`);

    // Очистить карты предыдущего круга
    this.circleCards.clear();
    this.revealedCircleCards.clear();
    this.resolvingQueue = [];

    this.state = 'circle_phase';
  }

  /**
   * Раздать роли игрокам
   */
  private assignRoles(): void {
    const playerCount = this.players.length;
    // Получить персонажей для текущего количества игроков
    const availableCharacters = getCharactersForPlayerCount(playerCount);
    const shuffledCharacters = shuffleArray(
      availableCharacters,
      this.random.randomInt(0, 1000000)
    );
    this.players.forEach((player, index) => {
      player.playerCount = playerCount; // Установить количество игроков для цепочки охоты
      player.assignRole(shuffledCharacters[index]);
      this.log(`Игрок ${player.name} получил роль: ${player.role}`);
    });
  }

  /**
   * Раздать карты игрокам
   * Каждый игрок получает:
   * - Подсказки всех персонажей КРОМЕ своей роли (по одной каждого)
   * - 1 карту Меча
   * - 1 карту Щита
   * - 1 карту Холма (если играет не 6 человек)
   */
  private dealCards(): void {
    const playerCount = this.players.length;
    this.deck = new Deck(playerCount);
    this.deck.shuffle(this.random.randomInt(0, 1000000));
    // Получить доступных персонажей для данного количества игроков
    const availableCharacters = getCharactersForPlayerCount(playerCount);
    this.players.forEach((player) => {
      const playerCards: Card[] = [];
      // 1. Подсказки для всех доступных персонажей КРОМЕ своей роли
      // Согласно правилам: "Уберите из своего комплекта карт такого же персонажа"
      for (const character of availableCharacters) {
        if (character === player.role) {
          continue; // Пропускаем подсказку своей роли
        }
        const hintIndex = this.deck!.cards.findIndex(
          card => card.isHint() && card.value === character
        );
        if (hintIndex !== -1) {
          playerCards.push(this.deck!.cards.splice(hintIndex, 1)[0]);
        }
      }
      // 2. Одна карта Меча
      const swordIndex = this.deck!.cards.findIndex(card => card.isSword());
      if (swordIndex !== -1) {
        playerCards.push(this.deck!.cards.splice(swordIndex, 1)[0]);
      }
      // 3. Одна карта Щита
      const shieldIndex = this.deck!.cards.findIndex(card => card.isShield());
      if (shieldIndex !== -1) {
        playerCards.push(this.deck!.cards.splice(shieldIndex, 1)[0]);
      }
      // 4. Одна карта Холма (если играет не 6 человек)
      if (playerCount < 6) {
        const hillIndex = this.deck!.cards.findIndex(card => card.isHill());
        if (hillIndex !== -1) {
          playerCards.push(this.deck!.cards.splice(hillIndex, 1)[0]);
        }
      }
      // Перемешать карты игрока для случайного порядка
      const shuffledCards = shuffleArray(playerCards, this.random.randomInt(0, 1000000));
      player.addCards(shuffledCards);
      this.log(`Игрок ${player.name} получил ${shuffledCards.length} карт`);
    });
  }

  // === ИГРОВОЙ ПРОЦЕСС ===

  /**
   * Получить текущего игрока (первого в раунде)
   */
  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Получить следующего игрока в очереди разрешения
   */
  getNextResolvingPlayer(): Player | null {
    if (this.state !== 'resolving_phase' || this.resolvingQueue.length === 0) {
      return null;
    }
    const nextPlayerId = this.resolvingQueue[0].playerId;
    return this.players.find(p => p.id === nextPlayerId) || null;
  }

  /**
   * Получить информацию об очереди разрешения
   */
  getResolvingQueue(): Array<{ playerId: string; actionType: 'sword' | 'shield' }> {
    return this.resolvingQueue.map(item => ({
      playerId: item.playerId,
      actionType: item.action.type as 'sword' | 'shield'
    }));
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

    // В зависимости от фазы игры
    if (this.state === 'circle_phase') {
      // Фаза круга: игроки выкладывают карты
      return this.handleCircleAction(playerId, action);
    } else if (this.state === 'resolving_phase') {
      // Фаза разрешения: разыгрывание мечей и щитов
      return this.handleResolvingAction(playerId, action);
    } else {
      return { success: false, error: 'Некорректная фаза игры' };
    }
  }

  /**
   * Обработать действие в фазе круга (выкладывание карт)
   */
  private handleCircleAction(playerId: string, action: Action): { success: boolean; result?: ActionResult; error?: string } {
    const player = this.players.find(p => p.id === playerId)!;

    // Проверка, что игрок еще не выложил карту в этом круге
    if (this.circleCards.has(playerId)) {
      return { success: false, error: 'Вы уже выложили карту в этом круге' };
    }

    // Валидация карты
    let cardIndex: number;
    if (action.type === 'reveal') {
      const revealAction = action as RevealAction;
      cardIndex = revealAction.cardIndex;
      if (cardIndex < 0 || cardIndex >= player.hand.length) {
        return { success: false, error: 'Неверный индекс карты' };
      }
      const card = player.hand[cardIndex];
      if (!card.isHint()) {
        return { success: false, error: 'Можно вскрывать только карты-подсказки' };
      }
    } else if (action.type === 'sword') {
      if (player.usedSword) {
        return { success: false, error: 'Меч уже использован в этом раунде' };
      }
      if (!player.hasSword()) {
        return { success: false, error: 'Нет карты Меча в руке' };
      }
      cardIndex = player.hand.findIndex(c => c.isSword())!;
    } else if (action.type === 'shield') {
      if (player.usedShield) {
        return { success: false, error: 'Щит уже использован в этом раунде' };
      }
      if (!player.hasShield()) {
        return { success: false, error: 'Нет карты Щита в руке' };
      }
      cardIndex = player.hand.findIndex(c => c.isShield())!;
    } else if (action.type === 'hill') {
      if (!player.hand.some(c => c.isHill())) {
        return { success: false, error: 'Нет карты Холма в руке' };
      }
      cardIndex = player.hand.findIndex(c => c.isHill())!;
    } else {
      return { success: false, error: 'Неизвестный тип действия' };
    }

    // Сохранить выложенную карту
    this.circleCards.set(playerId, { cardIndex, action });

    // Проверка, все ли игроки выложили карты
    if (this.circleCards.size === this.players.length) {
      // Все выложили, вскрываем карты
      this.revealCircleCards();
    }

    return { success: true, result: { type: 'card_placed' } };
  }

  /**
   * Вскрыть все карты круга
   */
  private revealCircleCards(): void {
    this.log('Все игроки выложили карты, вскрываем...');

    // Сначала собрать все карты, чтобы не было проблем с индексами
    const cardsToReveal: Array<{ playerId: string; card: Card; action: Action }> = [];
    
    this.circleCards.forEach(({ cardIndex, action }, playerId) => {
      const player = this.players.find(p => p.id === playerId)!;
      const card = player.hand[cardIndex];
      cardsToReveal.push({ playerId, card, action });
    });

    // Теперь удалить карты из рук и обработать
    cardsToReveal.forEach(({ playerId, card, action }) => {
      const player = this.players.find(p => p.id === playerId)!;
      const cardIndexInHand = player.hand.findIndex(c => 
        c.type === card.type && c.value === card.value
      );
      
      if (cardIndexInHand !== -1) {
        player.hand.splice(cardIndexInHand, 1);
      }

      // Если это подсказка или холм - добавить в вскрытые
      if (card.isHint() || card.isHill()) {
        player.revealedCards.push(card);
        this.revealedCircleCards.set(playerId, card);
      }

      // Если это меч или щит - добавить в очередь разрешения
      if (card.isSword() || card.isShield()) {
        this.resolvingQueue.push({ playerId, action });
      }
    });

    // Если есть мечи/щиты для разыгрывания, переходим в фазу разрешения
    if (this.resolvingQueue.length > 0) {
      this.state = 'resolving_phase';
      // Сортировать очередь по порядку игроков (начиная с первого)
      this.sortResolvingQueue();
    } else {
      // Нет мечей/щитов, переходим к следующему кругу или завершаем раунд
      this.finishCircle();
    }
  }

  /**
   * Отсортировать очередь разрешения по порядку игроков
   */
  private sortResolvingQueue(): void {
    this.resolvingQueue.sort((a, b) => {
      const aIndex = this.players.findIndex(p => p.id === a.playerId);
      const bIndex = this.players.findIndex(p => p.id === b.playerId);
      // Сравнить относительно первого игрока
      const aRelative = (aIndex - this.currentPlayerIndex + this.players.length) % this.players.length;
      const bRelative = (bIndex - this.currentPlayerIndex + this.players.length) % this.players.length;
      return aRelative - bRelative;
    });
  }

  /**
   * Обработать действие в фазе разрешения (разыгрывание мечей/щитов)
   */
  private handleResolvingAction(playerId: string, action: Action): { success: boolean; result?: ActionResult; error?: string } {
    // Проверить, что это следующий игрок в очереди
    if (this.resolvingQueue.length === 0) {
      return { success: false, error: 'Очередь разрешения пуста' };
    }

    const nextInQueue = this.resolvingQueue[0];
    if (nextInQueue.playerId !== playerId) {
      return { success: false, error: 'Не ваш ход в фазе разрешения' };
    }

    const player = this.players.find(p => p.id === playerId)!;
    const queuedAction = nextInQueue.action;

    // Выполнить действие
    const result = this.executeResolvingAction(playerId, queuedAction, action);

    // Убрать из очереди
    this.resolvingQueue.shift();

    // Если очередь пуста, завершаем круг
    if (this.resolvingQueue.length === 0) {
      this.finishCircle();
    }

    return { success: true, result };
  }

  /**
   * Выполнить действие в фазе разрешения
   * Примечание: карта уже была удалена из руки в revealCircleCards,
   * здесь нужно только отметить использование и записать историю
   */
  private executeResolvingAction(playerId: string, queuedAction: Action, action: Action): ActionResult {
    const player = this.players.find(p => p.id === playerId)!;

    if (queuedAction.type === 'sword') {
      const swordAction = action as SwordAction;
      if (action.type !== 'sword' || !swordAction.targetId) {
        return { type: 'error', error: 'Требуется указать цель для меча' };
      }

      const target = this.players.find(p => p.id === swordAction.targetId);
      if (!target) {
        return { type: 'error', error: 'Цель не найдена' };
      }

      // Проверка: нельзя атаковать самого себя
      if (swordAction.targetId === playerId) {
        return { type: 'error', error: 'Нельзя атаковать самого себя' };
      }

      // Проверка: нельзя атаковать того, кто уже защитился от тебя
      if (target.usedShield && target.shieldTargetId === playerId) {
        return { type: 'error', error: 'Нельзя атаковать того, кто уже защитился от вас' };
      }

      // Отметить использование меча (карта уже удалена из руки в revealCircleCards)
      player.usedSword = true;
      const isCorrectTarget = target.role === player.getTarget();

      // Запись в историю
      this.history.push({
        playerId,
        action: swordAction,
        result: { type: 'sword_used', target: swordAction.targetId, success: isCorrectTarget },
        timestamp: Date.now()
      });

      return { type: 'sword_used', target: swordAction.targetId, success: isCorrectTarget };
    } else if (queuedAction.type === 'shield') {
      const shieldAction = action as ShieldAction;
      if (action.type !== 'shield') {
        return { type: 'error', error: 'Требуется действие щита' };
      }

      // Если указана цель, проверить её
      if (shieldAction.targetId) {
        const target = this.players.find(p => p.id === shieldAction.targetId);
        if (!target) {
          return { type: 'error', error: 'Цель не найдена' };
        }

        // Проверка: нельзя защититься от самого себя
        if (shieldAction.targetId === playerId) {
          return { type: 'error', error: 'Нельзя защититься от самого себя' };
        }

        // Проверка: нельзя защититься от того, кто уже атаковал тебя
        if (target.usedSword) {
          const existingSwordAction = this.history
            .filter(h => h.playerId === target.id && h.action.type === 'sword')
            .pop();
          if (existingSwordAction && (existingSwordAction.action as SwordAction).targetId === playerId) {
            return { type: 'error', error: 'Нельзя защититься от того, кто уже атаковал вас' };
          }
        }
      }

      // Отметить использование щита (карта уже удалена из руки в revealCircleCards)
      player.usedShield = true;
      player.shieldTargetId = shieldAction.targetId || null;
      
      // Запись в историю
      const result = { 
        type: 'shield_used' as const,
        target: shieldAction.targetId 
      };
      this.history.push({
        playerId,
        action: shieldAction,
        result,
        timestamp: Date.now()
      });

      return result;
    }

    return { type: 'error', error: 'Неизвестный тип действия в очереди' };
  }

  /**
   * Завершить круг
   */
  private finishCircle(): void {
    // Проверка, закончился ли раунд
    if (this.currentCircle >= this.players.length) {
      // Все круги пройдены
      this.endRound();
    } else {
      // Начать следующий круг
      this.startCircle();
    }
  }

  /**
   * Валидация действия
   * @param playerId - ID игрока
   * @param action - Действие
   * @returns Сообщение об ошибке или null
   */
  private validateAction(playerId: string, action: Action): string | null {
    if (this.state === 'waiting' || this.state === 'round_end' || this.state === 'game_end') {
      return 'Игра не в процессе';
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return 'Игрок не найден';
    }

    // В фазе круга все игроки могут выкладывать карты
    // В фазе разрешения только следующий в очереди
    // Эти проверки выполняются в handleCircleAction и handleResolvingAction

    return null;
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
      // 3 монеты за успешную атаку своей цели
      if (player.usedSword) {
        const swordAction = this.history
          .filter(h => h.playerId === player.id && h.action.type === 'sword')
          .pop();

        if (swordAction?.result?.success) {
          player.coins += 3;
          this.log(`Игрок ${player.name} получил +3 монеты за успешную атаку цели`);
        }
      }

      // 2 монеты за успешную защиту от того, чьей целью он был
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
            // Проверить, что защита была от охотника
            const shieldAction = this.history.find(
              h => h.playerId === player.id && h.action.type === 'shield'
            );
            if (shieldAction && (shieldAction.action as ShieldAction).targetId === hunter.id) {
              player.coins += 2;
              this.log(`Игрок ${player.name} получил +2 монеты за успешную защиту от охотника`);
            }
          }
        }
      }

      // 1 монета за сохранение карты холма в руке до конца раунда
      if (player.hand.some(card => card.isHill())) {
        player.coins += 1;
        this.log(`Игрок ${player.name} получил +1 монету за сохранение карты холма`);
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
    // Собрать информацию о выложенных картах в текущем круге
    const playedCards: PlayedCardInfo[] = [];
    let order = 0;
    
    // Сначала добавить вскрытые карты (видимые всем)
    this.revealedCircleCards.forEach((card, playerId) => {
      const player = this.players.find(p => p.id === playerId);
      playedCards.push({
        playerId,
        playerName: player?.name || 'Unknown',
        cardType: card.type as 'hint' | 'sword' | 'shield' | 'hill',
        cardValue: card.value,
        order: order++
      });
    });
    
    // Добавить карты, которые еще не вскрыты (показать как hidden)
    this.circleCards.forEach(({ cardIndex, action }, playerId) => {
      // Не добавлять, если карта уже вскрыта
      if (this.revealedCircleCards.has(playerId)) return;
      
      const player = this.players.find(p => p.id === playerId);
      playedCards.push({
        playerId,
        playerName: player?.name || 'Unknown',
        cardType: 'hidden',
        order: order++
      });
    });

    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        coins: p.coins,
        handSize: p.hand.length,
        revealedCards: [...p.revealedCards],
        usedSword: p.usedSword,
        usedShield: p.usedShield,
        swordTargetId: p.swordTargetId,
        shieldTargetId: p.shieldTargetId
      })),
      currentRound: this.currentRound,
      currentPlayerIndex: this.currentPlayerIndex,
      state: this.state,
      circleInfo: {
        currentCircle: this.currentCircle,
        maxCircles: this.players.length,
        playersPlaced: Array.from(this.circleCards.keys()),
        playedCards
      },
      resolvingQueue: this.getResolvingQueue()
    };
  }

  /**
   * Получить информацию о текущем круге
   */
  getCircleInfo(): { currentCircle: number; maxCircles: number; playersPlaced: string[] } {
    return {
      currentCircle: this.currentCircle,
      maxCircles: this.players.length,
      playersPlaced: Array.from(this.circleCards.keys())
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
        usedShield: p.usedShield,
        shieldTargetId: p.shieldTargetId
      })),
      currentRound: this.currentRound,
      currentCircle: this.currentCircle,
      currentPlayerIndex: this.currentPlayerIndex,
      state: this.state,
      history: this.history,
      circleCards: Array.from(this.circleCards.entries()).map(([id, data]) => ({
        playerId: id,
        cardIndex: data.cardIndex,
        action: data.action
      })),
      revealedCircleCards: Array.from(this.revealedCircleCards.entries()).map(([id, card]) => ({
        playerId: id,
        card: { type: card.type, value: card.value }
      })),
      resolvingQueue: this.resolvingQueue.map(item => ({
        playerId: item.playerId,
        action: item.action
      }))
    });
  }
}

