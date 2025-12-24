/**
 * Главный экспорт модуля
 */

export { PechenkaGame } from './core/game';
export type { GameState, GameOptions, HistoryEntry, PublicPlayerState, PrivatePlayerState, GameStateData, GameEndResult, PlayedCardInfo, CircleInfo } from './core/game';

export { Player } from './core/player';

export { Deck, Card } from './models/deck';
export type { CardType } from './models/deck';

export { Character, getTarget, getHunter, getAllCharacters, HUNT_CHAIN } from './models/character';

export type { Action, ActionType, RevealAction, SwordAction, ShieldAction, ActionResult } from './models/actions';

export { shuffleArray, SeededRandom } from './utils/utils';

