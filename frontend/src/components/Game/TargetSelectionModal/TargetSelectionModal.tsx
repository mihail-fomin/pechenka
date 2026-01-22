import { GameStateData } from '../../../types/game.types';
import './TargetSelectionModal.css';
interface TargetSelectionModalProps {
  isOpen: boolean;
  actionType: 'sword' | 'shield';
  gameState: GameStateData;
  currentPlayerId: string;
  onSelectTarget: (targetId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  selectedTarget: string | null;
}
const TargetSelectionModal = ({
  isOpen,
  actionType,
  gameState,
  currentPlayerId,
  onSelectTarget,
  onConfirm,
  onClose,
  selectedTarget,
}: TargetSelectionModalProps) => {
  if (!isOpen) return null;
  const availableTargets = gameState.players.filter((p) => p.id !== currentPlayerId);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {actionType === 'sword' ? 'Выберите цель для атаки' : 'Выберите игрока, от которого защищаетесь'}
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="targets-list">
          {availableTargets.map((player) => (
            <button
              key={player.id}
              className={`target-item ${selectedTarget === player.id ? 'selected' : ''}`}
              onClick={() => onSelectTarget(player.id)}
            >
              <div className="target-name">{player.name}</div>
              <div className="target-info">
                Монет: {player.coins} | Карт: {player.handSize}
              </div>
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={!selectedTarget}
          >
            {actionType === 'sword' ? 'Атаковать' : 'Защититься'}
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};
export default TargetSelectionModal;
