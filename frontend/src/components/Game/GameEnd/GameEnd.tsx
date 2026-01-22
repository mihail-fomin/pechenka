import { useNavigate } from 'react-router-dom';
import { GameStateData } from '../../../types/game.types';
import './GameEnd.css';
interface GameEndProps {
  gameState: GameStateData;
}
const GameEnd = ({ gameState }: GameEndProps) => {
  const navigate = useNavigate();
  const sortedPlayers = [...gameState.players].sort((a, b) => b.coins - a.coins);
  const winner = sortedPlayers[0];
  return (
    <div className="game-end">
      <div className="game-end-container">
        <h1>🎉 Игра окончена!</h1>
        <div className="winner">
          <h2>Победитель: {winner.name}</h2>
          <p className="winner-coins">💰 {winner.coins} монет</p>
        </div>
        <div className="final-scores">
          <h3>Итоговые результаты</h3>
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`score-row ${index === 0 ? 'winner-row' : ''}`}
            >
              <span className="position">#{index + 1}</span>
              <span className="name">{player.name}</span>
              <span className="coins">💰 {player.coins}</span>
            </div>
          ))}
        </div>
        <button className="btn-home" onClick={() => navigate('/')}>
          Вернуться в лобби
        </button>
      </div>
    </div>
  );
};
export default GameEnd;
