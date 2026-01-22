import { GameStateData } from '../../../types/game.types';
import './GameBoard.css';
interface GameBoardProps {
  gameState: GameStateData;
  currentPlayerId: string;
}
const GameBoard = ({ gameState, currentPlayerId }: GameBoardProps) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  return (
    <div className="game-board">
      <div className="current-turn">
        {currentPlayer.id === currentPlayerId ? (
          <p className="your-turn">Ваш ход!</p>
        ) : (
          <p>Ход игрока: {currentPlayer.name}</p>
        )}
      </div>
      <div className="players-grid">
        {gameState.players.map((player, index) => (
          <div
            key={player.id}
            className={`player-card ${
              player.id === currentPlayerId ? 'current-player' : ''
            } ${index === gameState.currentPlayerIndex ? 'active-turn' : ''}`}
          >
            <div className="player-name">{player.name}</div>
            <div className="player-coins">💰 {player.coins}</div>
            <div className="player-hand-size">Карт: {player.handSize}</div>
            {player.usedSword && <div className="action-badge sword">⚔️</div>}
            {player.usedShield && <div className="action-badge shield">🛡️</div>}
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
        ))}
      </div>
    </div>
  );
};
export default GameBoard;
