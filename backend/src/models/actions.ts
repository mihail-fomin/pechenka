/**
 * Типы действий игроков
 */

import { Card } from './deck';

/**
 * Тип действия игрока
 */
export type ActionType = 'reveal' | 'sword' | 'shield' | 'hill';

/**
 * Базовый интерфейс действия
 */
export interface BaseAction {
  type: ActionType;
}

/**
 * Действие: вскрыть карту-подсказку
 */
export interface RevealAction extends BaseAction {
  type: 'reveal';
  cardIndex: number;
}

/**
 * Действие: использовать карту Меча (атака)
 */
export interface SwordAction extends BaseAction {
  type: 'sword';
  targetId: string;
}

/**
 * Действие: использовать карту Щита (защита)
 */
export interface ShieldAction extends BaseAction {
  type: 'shield';
  targetId?: string; // ID игрока, от которого защищаемся (опционально)
}

/**
 * Действие: выложить карту Холма
 */
export interface HillAction extends BaseAction {
  type: 'hill';
}

/**
 * Объединённый тип действия
 */
export type Action = RevealAction | SwordAction | ShieldAction | HillAction;

/**
 * Результат действия
 */
export interface ActionResult {
  type: string;
  success?: boolean;
  card?: Card;
  target?: string;
  error?: string;
}

