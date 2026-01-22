import { useState } from 'react';
import './HuntChainHint.css';

interface HuntChainHintProps {
  playerCount: number;
}

const HuntChainHint = ({ playerCount }: HuntChainHintProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Ограничиваем количество игроков от 4 до 6
  const validPlayerCount = Math.max(4, Math.min(6, playerCount));
  const imageSrc = `/images/hunt-chain-${validPlayerCount}.png`;
  return (
    <>
      <button 
        className="hunt-chain-hint-button"
        onClick={() => setIsOpen(true)}
        title="Показать цепочку охоты"
      >
        <span className="hint-icon">🎯</span>
        <span className="hint-text">Подсказка</span>
      </button>
      {isOpen && (
        <div className="hunt-chain-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="hunt-chain-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hunt-chain-header">
              <h3>Цепочка охоты ({validPlayerCount} игроков)</h3>
              <button className="hunt-chain-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            <div className="hunt-chain-content">
              <img 
                src={imageSrc} 
                alt={`Цепочка охоты для ${validPlayerCount} игроков`}
                className="hunt-chain-image"
              />
              <div className="hunt-chain-legend">
                <p>Стрелка показывает направление охоты:</p>
                <p><strong>Персонаж A → Персонаж B</strong> = A охотится на B</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HuntChainHint;
