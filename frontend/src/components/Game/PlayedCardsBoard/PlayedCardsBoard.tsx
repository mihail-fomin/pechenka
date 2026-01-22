import { CircleInfo } from '../../../types/game.types';
import './PlayedCardsBoard.css';
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
                        <div className="card-back-pattern">❓</div>
                        <div className="player-label">{card.playerName}</div>
                      </div>
                    ) : (
                      <div className="card-front">
                        <div className="card-icon">
                          {card.cardType === 'hint' && '📜'}
                          {card.cardType === 'sword' && '⚔️'}
                          {card.cardType === 'shield' && '🛡️'}
                          {card.cardType === 'hill' && '⛰️'}
                        </div>
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
