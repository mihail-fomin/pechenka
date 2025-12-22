import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getGameInfo, startGame, getGameState, getPlayerPrivateState, addTestPlayers } from '../../services/api';
import { GameStateData, PrivatePlayerState, Action, Card } from '../../types/game.types';
import GameBoard from './GameBoard';
import PlayerHand from './PlayerHand';
import TargetSelectionModal from './TargetSelectionModal';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState<'sword' | 'shield' | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

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

      // Перезагрузить информацию об игре
      const info = await getGameInfo(gameId);
      setGameInfo(info);

      // Если игра началась, загрузить состояние
      if (info.state !== 'waiting') {
        const state = await getGameState(gameId);
        setGameState(state);

        if (playerId) {
          const privateStateData = await getPlayerPrivateState(gameId, playerId);
          setPrivateState(privateStateData);
        }
      }

      // Также запросить обновление через WebSocket
      requestState();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка начала игры');
    }
  };

  const handleAddTestPlayers = async () => {
    if (!gameId) return;

    try {
      await addTestPlayers(gameId);
      // Перезагрузить информацию об игре
      const info = await getGameInfo(gameId);
      setGameInfo(info);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка добавления тестовых игроков');
    }
  };

  const handleAction = (action: Action) => {
    sendAction(action);
    setModalOpen(false);
    setSelectedTarget(null);
    setModalActionType(null);
    setPendingAction(null);
    setSelectedCardIndex(null);
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      handleAction(pendingAction);
    }
  };

  const handleCardClick = (card: Card, index: number) => {
    if (!gameState || !privateState) return;

    const currentPlayer = gameState.players.find((p) => p.id === playerId);
    const isCurrentTurn = gameState.currentPlayerIndex === gameState.players.findIndex((p) => p.id === playerId);

    if (!isCurrentTurn || !currentPlayer) return;

    // Обработка подсказки - сохраняем выбор, показываем визуально
    if (card.type === 'hint') {
      setSelectedCardIndex(index);
      setPendingAction({
        type: 'reveal',
        cardIndex: index,
      });
      return;
    }

    // Обработка меча - открываем попап с выбором цели (после закрытия превью карты)
    if (card.type === 'sword' && !currentPlayer.usedSword) {
      // Небольшая задержка, чтобы превью успело закрыться
      setTimeout(() => {
        setModalActionType('sword');
        setModalOpen(true);
      }, 100);
      return;
    }

    // Обработка щита - открываем попап с подтверждением (после закрытия превью карты)
    if (card.type === 'shield' && !currentPlayer.usedShield) {
      // Небольшая задержка, чтобы превью успело закрыться
      setTimeout(() => {
        setModalActionType('shield');
        setModalOpen(true);
      }, 100);
      return;
    }
  };

  const handleModalConfirm = () => {
    if (!modalActionType || !gameState) return;

    if (modalActionType === 'sword') {
      if (selectedTarget) {
        setPendingAction({
          type: 'sword',
          targetId: selectedTarget,
        });
        setModalOpen(false);
        setSelectedTarget(null);
        setModalActionType(null);
      }
    } else if (modalActionType === 'shield') {
      if (selectedTarget) {
        setPendingAction({
          type: 'shield',
          targetId: selectedTarget,
        });
        setModalOpen(false);
        setSelectedTarget(null);
        setModalActionType(null);
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTarget(null);
    setModalActionType(null);
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
              <PlayerHand 
                hand={privateState.hand}
                onCardClick={handleCardClick}
                isCurrentTurn={
                  gameState.currentPlayerIndex === gameState.players.findIndex((p) => p.id === playerId)
                }
                usedSword={gameState.players.find((p) => p.id === playerId)?.usedSword || false}
                usedShield={gameState.players.find((p) => p.id === playerId)?.usedShield || false}
                selectedCardIndex={selectedCardIndex}
              />
              {modalOpen && modalActionType && (
                <TargetSelectionModal
                  isOpen={modalOpen}
                  actionType={modalActionType}
                  gameState={gameState}
                  currentPlayerId={playerId}
                  onSelectTarget={setSelectedTarget}
                  onConfirm={handleModalConfirm}
                  onClose={handleModalClose}
                  selectedTarget={selectedTarget}
                />
              )}
              {pendingAction && gameState.currentPlayerIndex === gameState.players.findIndex((p) => p.id === playerId) && (
                <div className="confirm-action-panel">
                  <div className="confirm-action-info">
                    <p>Выбрано действие:</p>
                    {pendingAction.type === 'reveal' && (
                      <div className="selected-action">
                        <span>Вскрыть подсказку: {privateState.hand[pendingAction.cardIndex]?.value || '?'}</span>
                      </div>
                    )}
                    {pendingAction.type === 'sword' && 'targetId' in pendingAction && (
                      <div className="selected-action">
                        <span>Атаковать: {gameState.players.find(p => p.id === pendingAction.targetId)?.name || '?'}</span>
                      </div>
                    )}
                    {pendingAction.type === 'shield' && 'targetId' in pendingAction && (
                      <div className="selected-action">
                        <span>Защититься от: {gameState.players.find(p => p.id === pendingAction.targetId)?.name || '?'}</span>
                      </div>
                    )}
                  </div>
                  <button className="btn-confirm-turn" onClick={handleConfirmAction}>
                    Подтвердить ход
                  </button>
                </div>
              )}
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


