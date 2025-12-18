import { GameStateData } from '../../types/game.types';
import './RoundSummary.css';

interface RoundSummaryProps {
  gameState: GameStateData;
}

const RoundSummary = ({ gameState }: RoundSummaryProps) => {
  const sortedPlayers = [...gameState.players].sort((a, b) => b.coins - a.coins);

  return (
    <div className="round-summary">
      <h2>Итоги раунда {gameState.currentRound}</h2>
      <div className="scores">
        {sortedPlayers.map((player, index) => (
          <div key={player.id} className="score-item">
            <span className="rank">#{index + 1}</span>
            <span className="player-name">{player.name}</span>
            <span className="coins">💰 {player.coins}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoundSummary;


