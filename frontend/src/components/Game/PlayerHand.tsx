import { Card } from '../../types/game.types';
import './PlayerHand.css';

interface PlayerHandProps {
  hand: Card[];
}

const PlayerHand = ({ hand }: PlayerHandProps) => {
  return (
    <div className="player-hand">
      <h3>Ваши карты</h3>
      <div className="cards-container">
        {hand.map((card, index) => (
          <div key={index} className={`card ${card.type}`}>
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
              </div>
            )}
            {card.type === 'shield' && (
              <div className="card-content">
                <div className="card-icon">🛡️</div>
                <div className="card-type">Щит</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;


