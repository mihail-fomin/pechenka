import { CircleInfo, PublicPlayerState } from '../../../types/game.types';
import './PlayedCardsBoard.css';
// Иконки карт
const CARD_ICONS = {
  sword: '/images/cards/sword.svg',
  shield: '/images/cards/shield.svg',
  hill: '/images/cards/hill.svg',
  hint: '/images/cards/hint.svg',
  hidden: '/images/cards/card-back.svg',
};
// Названия типов карт
const CARD_TYPE_NAMES: Record<string, string> = {
  sword: '⚔️ Меч',
  shield: '🛡️ Щит',
  hill: '⛰️ Холм',
  hint: '💡 Подсказка',
  hidden: '❓ Скрыто',
};
interface PlayedCardsBoardProps {
  circleInfo: CircleInfo;
  currentPlayerId: string;
  totalPlayers: number;
  players: PublicPlayerState[];
  currentPlayerIndex: number;
}
const PlayedCardsBoard = ({ 
  circleInfo, 
  currentPlayerId, 
  totalPlayers,
  players,
  currentPlayerIndex
}: PlayedCardsBoardProps) => {
  const { currentCircle, maxCircles, playersPlaced, playedCards } = circleInfo;
  const hasCurrentPlayerPlaced = playersPlaced.includes(currentPlayerId);
  const playersWaiting = totalPlayers - playersPlaced.length;
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === currentPlayerId;
  return (
    <div className="played-cards-board">
      {/* Заголовок с инфо о ходе */}
      <div className="board-header">
        <div className="circle-indicator">
          <span className="circle-label">Круг</span>
          <span className="circle-number">{currentCircle}/{maxCircles}</span>
        </div>
        <div className="turn-indicator">
          {isMyTurn ? (
            <span className="your-turn">Ваш ход!</span>
          ) : (
            <span className="other-turn">Ход: {currentPlayer?.name}</span>
          )}
        </div>
        <div className="players-status">
          {playersWaiting > 0 ? (
            <span className="waiting-count">
              Ожидание: <strong>{playersWaiting}</strong>
            </span>
          ) : (
            <span className="all-placed">✓ Все готовы</span>
          )}
        </div>
      </div>
      {/* Компактная сетка игроков */}
      <div className="players-row">
        {players.map((player, index) => {
          const hasPlaced = playersPlaced.includes(player.id);
          const swordTarget = player.swordTargetId ? players.find(p => p.id === player.swordTargetId) : null;
          const shieldTarget = player.shieldTargetId ? players.find(p => p.id === player.shieldTargetId) : null;
          // Найти карту, выложенную этим игроком
          const playerCard = playedCards.find(c => c.playerId === player.id);
          return (
            <div
              key={player.id}
              className={`player-chip ${
                player.id === currentPlayerId ? 'is-me' : ''
              } ${index === currentPlayerIndex ? 'active-turn' : ''} ${hasPlaced ? 'has-placed' : ''}`}
            >
              <span className="chip-name">{player.name}</span>
              <span className="chip-info">
                <span className="chip-coins">💰{player.coins}</span>
                <span className="chip-cards">🃏{player.handSize}</span>
              </span>
              {/* Показываем какую карту выложил */}
              {playerCard && (
                <span className={`chip-card-type ${playerCard.cardType}`}>
                  {playerCard.cardType === 'hidden' ? '❓' : ''}
                  {playerCard.cardType === 'hint' && `💡${playerCard.cardValue || ''}`}
                  {playerCard.cardType === 'sword' && '⚔️'}
                  {playerCard.cardType === 'shield' && '🛡️'}
                  {playerCard.cardType === 'hill' && '⛰️'}
                </span>
              )}
              {/* Показываем на кого напал */}
              {player.usedSword && swordTarget && (
                <span className="chip-action sword-action" title={`Атаковал: ${swordTarget.name}`}>
                  →{swordTarget.name.slice(7, 12)}
                </span>
              )}
              {/* Показываем от кого защитился */}
              {player.usedShield && shieldTarget && (
                <span className="chip-action shield-action" title={`Защита от: ${shieldTarget.name}`}>
                  ←{shieldTarget.name.slice(7, 12)}
                </span>
              )}
              {!hasPlaced && <span className="chip-waiting">⏳</span>}
            </div>
          );
        })}
      </div>
      {/* Список выложенных карт */}
      {playedCards.length > 0 && (
        <div className="played-cards-list">
          <div className="list-title">Выложенные карты:</div>
          <div className="list-items">
            {playedCards.map((card, index) => {
              const isOwnCard = card.playerId === currentPlayerId;
              return (
                <div 
                  key={`list-${card.playerId}-${index}`}
                  className={`list-item ${card.cardType} ${isOwnCard ? 'is-mine' : ''}`}
                >
                  <span className="item-player">{isOwnCard ? '👤 Вы' : card.playerName}</span>
                  <span className="item-arrow">→</span>
                  <span className="item-card">
                    {CARD_TYPE_NAMES[card.cardType]}
                    {card.cardType === 'hint' && card.cardValue && ` (${card.cardValue})`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Стол с картами (визуализация) */}
      {playedCards.length > 0 && (
        <div className="board-table">
          <div className="table-surface">
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
                        <div className="player-label">{card.playerName}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Пустой стол */}
      {playedCards.length === 0 && (
        <div className="board-table">
          <div className="table-surface">
            <div className="empty-table">
              <div className="empty-icon">🃏</div>
              <p>Выложите карту</p>
            </div>
          </div>
        </div>
      )}
      {hasCurrentPlayerPlaced && playersWaiting > 0 && (
        <div className="your-card-placed">
          <span className="check-icon">✓</span>
          Ожидание других игроков...
        </div>
      )}
    </div>
  );
};
export default PlayedCardsBoard;
