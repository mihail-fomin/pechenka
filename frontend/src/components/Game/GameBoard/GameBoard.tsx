import { GameStateData, PlayedCardInfo } from '../../../types/game.types';
import './GameBoard.css';
// Иконки действий
const ACTION_ICONS = {
  sword: '/images/cards/sword.svg',
  shield: '/images/cards/shield.svg',
};
// Названия типов карт
const CARD_TYPE_NAMES: Record<string, string> = {
  sword: '⚔️ Меч',
  shield: '🛡️ Щит',
  hill: '⛰️ Холм',
  hint: '💡 Подсказка',
  hidden: '❓ Скрыто',
};
interface GameBoardProps {
  gameState: GameStateData;
  currentPlayerId: string;
}
const GameBoard = ({ gameState, currentPlayerId }: GameBoardProps) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const playedCards = gameState.circleInfo?.playedCards || [];
  // Создаём карту: playerId -> выложенная карта
  const playerCardMap = new Map<string, PlayedCardInfo>();
  playedCards.forEach(card => {
    playerCardMap.set(card.playerId, card);
  });
  return (
    <div className="game-board">
      <div className="current-turn">
        {currentPlayer.id === currentPlayerId ? (
          <p className="your-turn">Ваш ход!</p>
        ) : (
          <p>Ход игрока: {currentPlayer.name}</p>
        )}
      </div>
      {/* Список выложенных карт */}
      {playedCards.length > 0 && (
        <div className="played-cards-summary">
          <div className="summary-title">📋 Выложенные карты в этом круге:</div>
          <div className="summary-list">
            {playedCards.map((card, index) => {
              const isOwnCard = card.playerId === currentPlayerId;
              return (
                <div 
                  key={`summary-${card.playerId}-${index}`}
                  className={`summary-item ${card.cardType} ${isOwnCard ? 'is-mine' : ''}`}
                >
                  <span className="summary-player">{isOwnCard ? '👤 Вы' : card.playerName}</span>
                  <span className="summary-arrow">→</span>
                  <span className="summary-card">
                    {CARD_TYPE_NAMES[card.cardType]}
                    {card.cardType === 'hint' && card.cardValue && ` (${card.cardValue})`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="players-grid">
        {gameState.players.map((player, index) => {
          const swordTarget = player.swordTargetId 
            ? gameState.players.find(p => p.id === player.swordTargetId) 
            : null;
          const shieldTarget = player.shieldTargetId 
            ? gameState.players.find(p => p.id === player.shieldTargetId) 
            : null;
          const playerCard = playerCardMap.get(player.id);
          return (
            <div
              key={player.id}
              className={`player-card ${
                player.id === currentPlayerId ? 'current-player' : ''
              } ${index === gameState.currentPlayerIndex ? 'active-turn' : ''}`}
            >
              <div className="player-name">{player.name}</div>
              <div className="player-coins">💰 {player.coins}</div>
              <div className="player-hand-size">Карт: {player.handSize}</div>
              {player.usedSword && <img src={ACTION_ICONS.sword} alt="Меч" className="action-badge-img sword" />}
              {player.usedShield && <img src={ACTION_ICONS.shield} alt="Щит" className="action-badge-img shield" />}
              {/* Показываем какую карту выложил */}
              {playerCard && (
                <div className={`player-placed-card ${playerCard.cardType}`}>
                  {playerCard.cardType === 'hidden' && '❓'}
                  {playerCard.cardType === 'hint' && `💡${playerCard.cardValue || ''}`}
                  {playerCard.cardType === 'sword' && '⚔️'}
                  {playerCard.cardType === 'shield' && '🛡️'}
                  {playerCard.cardType === 'hill' && '⛰️'}
                </div>
              )}
              {/* Показываем атаки и защиты */}
              {(player.usedSword || player.usedShield) && (
                <div className="player-actions">
                  {player.usedSword && swordTarget && (
                    <span className="action-tag sword-tag" title={`Атаковал: ${swordTarget.name}`}>
                      ⚔️→{swordTarget.name.slice(7, 14)}
                    </span>
                  )}
                  {player.usedShield && shieldTarget && (
                    <span className="action-tag shield-tag" title={`Защита от: ${shieldTarget.name}`}>
                      🛡️←{shieldTarget.name.slice(7, 14)}
                    </span>
                  )}
                  {player.usedShield && !shieldTarget && (
                    <span className="action-tag shield-tag">🛡️</span>
                  )}
                </div>
              )}
              {player.revealedCards.length > 0 && (
                <div className="revealed-cards">
                  {player.revealedCards.map((card, i) => (
                    <span key={i} className="revealed-card">
                      {card.value || '?'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default GameBoard;
