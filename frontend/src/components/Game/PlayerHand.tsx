import { Card } from '../../types/game.types';
import './PlayerHand.css';

interface PlayerHandProps {
  hand: Card[];
  onCardClick?: (card: Card, index: number) => void;
  isCurrentTurn?: boolean;
  usedSword?: boolean;
  usedShield?: boolean;
  selectedCardIndex?: number | null;
}

const PlayerHand = ({
  hand,
  onCardClick,
  isCurrentTurn = false,
  usedSword = false,
  usedShield = false,
  selectedCardIndex = null,
}: PlayerHandProps) => {
  const handleCardClick = (card: Card, index: number) => {
    // Сразу обрабатываем клик без модалки
    if (isCurrentTurn && onCardClick) {
      // Проверка, можно ли использовать карту
      if (card.type === 'sword' && usedSword) return;
      if (card.type === 'shield' && usedShield) return;
      onCardClick(card, index);
    }
  };

  const isCardClickable = (card: Card) => {
    if (!isCurrentTurn) return false;
    if (card.type === 'sword' && usedSword) return false;
    if (card.type === 'shield' && usedShield) return false;
    return card.type === 'hint' || card.type === 'sword' || card.type === 'shield';
  };

  return (
    <div className="player-hand">
      <div className="cards-container">
        {hand.map((card, index) => {
          const clickable = isCardClickable(card);
          const isSelected = selectedCardIndex === index;
          
          return (
            <div 
              key={index} 
              className={`card ${card.type} ${clickable ? 'clickable' : ''} ${!clickable ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCardClick(card, index)}
              style={{ 
                position: 'relative',
                zIndex: isSelected ? 100 : hand.length - index,
              }}
            >
                {card.type === 'hint' && (
                  <div className="card-content">
                    <div className="card-type">Подсказка</div>
                    <div className="card-value">{card.value || '?'}</div>
                  </div>
                )}
                {card.type === 'sword' && (
                  <div className="card-content">
                    <div className="card-icon">⚔️</div>
                    <div className="card-type">Меч</div>
                    {usedSword && <div className="card-used">Использован</div>}
                  </div>
                )}
                {card.type === 'shield' && (
                  <div className="card-content">
                    <div className="card-icon">🛡️</div>
                    <div className="card-type">Щит</div>
                    {usedShield && <div className="card-used">Использован</div>}
                  </div>
                )}
                {card.type === 'hill' && (
                  <div className="card-content">
                    <div className="card-icon">⛰️</div>
                    <div className="card-type">Холм</div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default PlayerHand;


