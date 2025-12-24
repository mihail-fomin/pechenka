import { Card } from '../../types/game.types';
import './CardPreviewModal.css';

interface CardPreviewModalProps {
  isOpen: boolean;
  card: Card | null;
  onClose: () => void;
}

const CardPreviewModal = ({ isOpen, card, onClose }: CardPreviewModalProps) => {
  if (!isOpen || !card) return null;

  return (
    <div className="card-preview-overlay" onClick={onClose}>
      <div className="card-preview-content" onClick={(e) => e.stopPropagation()}>
        <button className="card-preview-close" onClick={onClose}>×</button>
        <div className={`card-preview-large ${card.type}`}>
          {card.type === 'hint' && (
            <div className="card-preview-body">
              <div className="card-preview-type">Подсказка</div>
              <div className="card-preview-value">{card.value || '?'}</div>
            </div>
          )}
          {card.type === 'sword' && (
            <div className="card-preview-body">
              <div className="card-preview-icon">⚔️</div>
              <div className="card-preview-type">Меч</div>
            </div>
          )}
          {card.type === 'shield' && (
            <div className="card-preview-body">
              <div className="card-preview-icon">🛡️</div>
              <div className="card-preview-type">Щит</div>
            </div>
          )}
          {card.type === 'hill' && (
            <div className="card-preview-body">
              <div className="card-preview-icon">⛰️</div>
              <div className="card-preview-type">Холм</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardPreviewModal;


