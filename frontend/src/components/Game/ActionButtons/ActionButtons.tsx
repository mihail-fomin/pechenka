import { useState } from 'react';
import { GameStateData, PrivatePlayerState, Action } from '../../../types/game.types';
import './ActionButtons.css';
interface ActionButtonsProps {
  gameState: GameStateData;
  privateState: PrivatePlayerState;
  currentPlayerId: string;
  onAction: (action: Action) => void;
}
const ActionButtons = ({
  gameState,
  privateState,
  currentPlayerId,
  onAction,
}: ActionButtonsProps) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'reveal' | 'sword' | 'shield' | null>(null);
  const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);
  if (!currentPlayer || gameState.currentPlayerIndex !== gameState.players.findIndex((p) => p.id === currentPlayerId)) {
    return (
      <div className="action-buttons">
        <p>Ожидание хода других игроков...</p>
      </div>
    );
  }
  const handleReveal = () => {
    if (selectedCardIndex !== null) {
      const card = privateState.hand[selectedCardIndex];
      if (card.type === 'hint') {
        onAction({
          type: 'reveal',
          cardIndex: selectedCardIndex,
        });
        setSelectedCardIndex(null);
        setActionType(null);
      }
    }
  };
  const handleSword = () => {
    if (selectedTarget) {
      onAction({
        type: 'sword',
        targetId: selectedTarget,
      });
      setSelectedTarget(null);
      setActionType(null);
    }
  };
  const handleShield = () => {
    onAction({
      type: 'shield',
    });
    setActionType(null);
  };
  const hintCards = privateState.hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.type === 'hint');
  const hasSword = privateState.hand.some((card) => card.type === 'sword');
  const hasShield = privateState.hand.some((card) => card.type === 'shield');
  const availableTargets = gameState.players.filter((p) => p.id !== currentPlayerId);
  return (
    <div className="action-buttons">
      <h3>Выберите действие</h3>
      <div className="action-options">
        {hintCards.length > 0 && (
          <button
            className={`btn-action ${actionType === 'reveal' ? 'active' : ''}`}
            onClick={() => setActionType('reveal')}
          >
            Вскрыть подсказку
          </button>
        )}
        {hasSword && !currentPlayer.usedSword && (
          <button
            className={`btn-action ${actionType === 'sword' ? 'active' : ''}`}
            onClick={() => setActionType('sword')}
          >
            Использовать меч
          </button>
        )}
        {hasShield && !currentPlayer.usedShield && (
          <button
            className={`btn-action ${actionType === 'shield' ? 'active' : ''}`}
            onClick={() => setActionType('shield')}
          >
            Использовать щит
          </button>
        )}
      </div>
      {actionType === 'reveal' && (
        <div className="action-details">
          <p>Выберите карту-подсказку:</p>
          <div className="cards-selection">
            {hintCards.map(({ card, index }) => (
              <button
                key={index}
                className={`card-select ${selectedCardIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedCardIndex(index)}
              >
                {card.value || '?'}
              </button>
            ))}
          </div>
          <button
            className="btn-confirm"
            onClick={handleReveal}
            disabled={selectedCardIndex === null}
          >
            Вскрыть
          </button>
        </div>
      )}
      {actionType === 'sword' && (
        <div className="action-details">
          <p>Выберите цель для атаки:</p>
          <div className="targets-selection">
            {availableTargets.map((player) => (
              <button
                key={player.id}
                className={`target-select ${selectedTarget === player.id ? 'selected' : ''}`}
                onClick={() => setSelectedTarget(player.id)}
              >
                {player.name}
              </button>
            ))}
          </div>
          <button
            className="btn-confirm"
            onClick={handleSword}
            disabled={!selectedTarget}
          >
            Атаковать
          </button>
        </div>
      )}
      {actionType === 'shield' && (
        <div className="action-details">
          <p>Использовать щит для защиты?</p>
          <button className="btn-confirm" onClick={handleShield}>
            Использовать щит
          </button>
        </div>
      )}
    </div>
  );
};
export default ActionButtons;
