import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getGameInfo, startGame, getGameState, getPlayerPrivateState, addTestPlayers } from '../../services/api';
import { GameStateData, PrivatePlayerState, Action } from '../../types/game.types';
import GameBoard from './GameBoard';
import PlayerHand from './PlayerHand';
import ActionButtons from './ActionButtons';
import RoundSummary from './RoundSummary';
import GameEnd from './GameEnd';
import './GameRoom.css';

const GameRoom = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useTelegram();

  const [gameInfo, setGameInfo] = useState<any>(null);
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [privateState, setPrivateState] = useState<PrivatePlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const playerId = location.state?.playerId;

  // WebSocket подключение
  const { connected, sendAction, requestState } = useWebSocket({
    gameId: gameId || '',
    playerId: playerId || '',
    telegramId: user?.id || 0,
    onGameState: (state) => {
      setGameState(state);
    },
    onPrivateState: (state) => {
      setPrivateState(state);
    },
    onError: (err) => {
      setError(err);
    },
  });

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }

    const loadGame = async () => {
      try {
        const info = await getGameInfo(gameId);
        setGameInfo(info);

        if (info.state !== 'waiting') {
          const state = await getGameState(gameId);
          setGameState(state);

          if (playerId) {
            const privateStateData = await getPlayerPrivateState(gameId, playerId);
            setPrivateState(privateStateData);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Ошибка загрузки игры');
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId, playerId, navigate]);

  const handleStartGame = async () => {
    if (!gameId) return;

    try {
      await startGame(gameId);
      requestState();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка начала игры');
    }
  };

  const handleAddTestPlayers = async () => {
    if (!gameId) return;

    try {
      const result = await addTestPlayers(gameId);
      // Перезагрузить информацию об игре
      const info = await getGameInfo(gameId);
      setGameInfo(info);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка добавления тестовых игроков');
    }
  };

  const handleAction = (action: Action) => {
    sendAction(action);
  };

  if (loading) {
    return <div className="game-room">Загрузка...</div>;
  }

  if (error) {
    return <div className="game-room error">{error}</div>;
  }

  if (!gameInfo || !playerId) {
    return <div className="game-room error">Игра не найдена</div>;
  }

  // Ожидание начала игры
  if (gameInfo.state === 'waiting') {
    return (
      <div className="game-room">
        <div className="waiting-room">
          <h2>Ожидание игроков</h2>
          <p>Игроков: {gameInfo.players.length} / 6</p>
          <div className="players-list">
            {gameInfo.players.map((player: any) => (
              <div key={player.id} className="player-item">
                {player.name}
              </div>
            ))}
          </div>
          {import.meta.env.DEV && gameInfo.players.length < 4 && (
            <button className="btn btn-secondary" onClick={handleAddTestPlayers}>
              Добавить тестовых игроков
            </button>
          )}
          {gameInfo.players.length >= 4 && gameInfo.players[0].id === playerId && (
            <button className="btn btn-primary" onClick={handleStartGame}>
              Начать игру
            </button>
          )}
          {gameInfo.players.length < 4 && (
            <p className="waiting-message">Ожидание игроков (минимум 4)</p>
          )}
          {!connected && <p className="connection-status">Подключение...</p>}
        </div>
      </div>
    );
  }

  // Игра окончена
  if (gameState?.state === 'game_end') {
    return <GameEnd gameState={gameState} />;
  }

  // Игровой процесс
  return (
    <div className="game-room">
      {gameState && (
        <>
          <div className="game-header">
            <h2>Раунд {gameState.currentRound}</h2>
            <div className="connection-status">
              {connected ? '🟢 Подключено' : '🔴 Отключено'}
            </div>
          </div>

          <GameBoard gameState={gameState} currentPlayerId={playerId} />

          {privateState && (
            <>
              <PlayerHand hand={privateState.hand} />
              <ActionButtons
                gameState={gameState}
                privateState={privateState}
                currentPlayerId={playerId}
                onAction={handleAction}
              />
            </>
          )}

          {gameState.state === 'round_end' && (
            <RoundSummary gameState={gameState} />
          )}
        </>
      )}
    </div>
  );
};

export default GameRoom;


