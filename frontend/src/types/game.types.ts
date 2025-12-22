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
}

export interface PrivatePlayerState {
  role: string;
  hand: Card[];
  target: string;
  hunter: string;
}

export interface GameStateData {
  players: PublicPlayerState[];
  currentRound: number;
  currentPlayerIndex: number;
  state: GameState;
}


