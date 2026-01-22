// Типы для игры, совместимые с backend

export type GameState = 'waiting' | 'circle_phase' | 'resolving_phase' | 'round_end' | 'game_end';

export type ActionType = 'reveal' | 'sword' | 'shield' | 'hill';

export interface BaseAction {
  type: ActionType;
}

export interface RevealAction extends BaseAction {
  type: 'reveal';
  cardIndex: number;
}

export interface SwordAction extends BaseAction {
  type: 'sword';
  targetId: string;
}

export interface ShieldAction extends BaseAction {
  type: 'shield';
  targetId?: string;
}

export interface HillAction extends BaseAction {
  type: 'hill';
}

export type Action = RevealAction | SwordAction | ShieldAction | HillAction;

export interface Card {
  type: 'hint' | 'sword' | 'shield' | 'hill';
  value: string | null;
}

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

export interface PrivatePlayerState {
  role: string;
  hand: Card[];
  target: string;
  hunter: string;
}

export interface PlayedCardInfo {
  playerId: string;
  playerName: string;
  cardType: 'hint' | 'sword' | 'shield' | 'hill' | 'hidden';
  cardValue?: string | null;
  order: number;
}

export interface CircleInfo {
  currentCircle: number;
  maxCircles: number;
  playersPlaced: string[];
  playedCards: PlayedCardInfo[];
}

export interface ResolvingQueueItem {
  playerId: string;
  actionType: 'sword' | 'shield';
}

export interface GameStateData {
  players: PublicPlayerState[];
  currentRound: number;
  currentPlayerIndex: number;
  state: GameState;
  circleInfo?: CircleInfo;
  resolvingQueue?: ResolvingQueueItem[];
}


