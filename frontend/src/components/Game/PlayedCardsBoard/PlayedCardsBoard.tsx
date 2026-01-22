import { CircleInfo } from '../../../types/game.types';
import './PlayedCardsBoard.css';
// Иконки карт
const CARD_ICONS = {
  sword: '/images/cards/sword.svg',
  shield: '/images/cards/shield.svg',
  hill: '/images/cards/hill.svg',
  hint: '/images/cards/hint.svg',
  hidden: '/images/cards/card-back.svg',
};
interface PlayedCardsBoardProps {
  circleInfo: CircleInfo;
  currentPlayerId: string;
  totalPlayers: number;
}
const PlayedCardsBoard = ({ circleInfo, currentPlayerId, totalPlayers }: PlayedCardsBoardProps) => {
  const { currentCircle, maxCircles, playersPlaced, playedCards } = circleInfo;
  // Проверяем, выложил ли текущий игрок карту
  const hasCurrentPlayerPlaced = playersPlaced.includes(currentPlayerId);
  const playersWaiting = totalPlayers - playersPlaced.length;
  return (
    <div className="played-cards-board">
      <div className="board-header">
        <div className="circle-indicator">
          <span className="circle-label">Круг</span>
          <span className="circle-number">{currentCircle}/{maxCircles}</span>
        </div>
        <div className="players-status">
          {playersWaiting > 0 ? (
            <span className="waiting-count">
              Ожидание: <strong>{playersWaiting}</strong> игрок{playersWaiting === 1 ? '' : playersWaiting < 5 ? 'а' : 'ов'}
            </span>
          ) : (
            <span className="all-placed">Все карты выложены!</span>
          )}
        </div>
      </div>
      <div className="board-table">
        <div className="table-surface">
          {playedCards.length === 0 ? (
            <div className="empty-table">
              <div className="empty-icon">🃏</div>
              <p>Выложите карту на стол</p>
            </div>
          ) : (
            <div className="cards-on-table">
              {playedCards.map((card, index) => {
                const isOwnCard = card.playerId === currentPlayerId;
                return (
                  <div 
                    key={`${card.playerId}-${index}`}
                    className={`table-card ${card.cardType} ${isOwnCard ? 'own-card' : ''}`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      transform: `rotate(${(index - playedCards.length / 2) * 5}deg)`
                    }}
                  >
                    {card.cardType === 'hidden' ? (
                      <div className="card-back">
                        <img src={CARD_ICONS.hidden} alt="Скрытая карта" className="card-back-img" />
                        <div className="player-label">{card.playerName}</div>
                      </div>
                    ) : (
                      <div className="card-front">
                        <img 
                          src={CARD_ICONS[card.cardType as keyof typeof CARD_ICONS]} 
                          alt={card.cardType} 
                          className="card-icon-img" 
                        />
                        {card.cardType === 'hint' && card.cardValue && (
                          <div className="card-value">{card.cardValue}</div>
                        )}
                        <div className="card-type-label">
                          {card.cardType === 'hint' && 'Подсказка'}
                          {card.cardType === 'sword' && 'Меч'}
                          {card.cardType === 'shield' && 'Щит'}
                          {card.cardType === 'hill' && 'Холм'}
                        </div>
                        <div className="player-label">{card.playerName}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {hasCurrentPlayerPlaced && playersWaiting > 0 && (
        <div className="your-card-placed">
          <span className="check-icon">✓</span>
          Ваша карта выложена. Ожидание других игроков...
        </div>
      )}
    </div>
  );
};
export default PlayedCardsBoard;
