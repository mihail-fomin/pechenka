/**
 * Главный экспорт модуля
 */

export { PechenkaGame } from './game';
export type { GameState, GameOptions, HistoryEntry, PublicPlayerState, PrivatePlayerState, GameStateData, GameEndResult } from './game';

export { Player } from './player';

export { Deck, Card } from './deck';
export type { CardType } from './deck';

export { Character, getTarget, getHunter, getAllCharacters, HUNT_CHAIN } from './character';

export type { Action, ActionType, RevealAction, SwordAction, ShieldAction, ActionResult } from './actions';

export { shuffleArray, SeededRandom } from './utils';

