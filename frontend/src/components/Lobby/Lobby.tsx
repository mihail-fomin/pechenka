import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { createGame, joinGame, getGameInfo, setTelegramUser } from '../../services/api';
import './Lobby.css';
const Lobby = () => {
  const { user, ready } = useTelegram();
  const navigate = useNavigate();
  const [gameId, setGameId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user && ready) {
      setTelegramUser(user);
    }
  }, [user, ready]);
  const handleCreateGame = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await createGame(user, 3);
      navigate(`/game/${response.gameId}`, {
        state: { playerId: response.playerId },
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания игры');
    } finally {
      setLoading(false);
    }
  };
  const handleJoinGame = async () => {
    if (!user || !gameId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Проверить, что игра существует
      await getGameInfo(gameId.trim());
      const response = await joinGame(gameId.trim(), user);
      navigate(`/game/${gameId.trim()}`, {
        state: { playerId: response.playerId },
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка присоединения к игре');
    } finally {
      setLoading(false);
    }
  };
  if (!ready) {
    return <div className="lobby">Загрузка...</div>;
  }
  return (
    <div className="lobby">
      <div className="lobby-container">
        <h1>🍪 Печенька</h1>
        <p className="lobby-subtitle">Игра на дедукцию и блеф</p>
        {error && <div className="error-message">{error}</div>}
        <div className="lobby-actions">
          <button
            className="btn btn-primary"
            onClick={handleCreateGame}
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать игру'}
          </button>
          <div className="divider">или</div>
          <div className="join-section">
            <input
              type="text"
              className="game-id-input"
              placeholder="Введите ID игры"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              disabled={loading}
            />
            <button
              className="btn btn-secondary"
              onClick={handleJoinGame}
              disabled={loading || !gameId.trim()}
            >
              {loading ? 'Присоединение...' : 'Присоединиться'}
            </button>
          </div>
        </div>
        <div className="lobby-info">
          <p>Игра для 4-6 игроков</p>
          <p>Каждый получает тайную роль и карты</p>
          <p>Цель: набрать больше всего монет</p>
        </div>
      </div>
    </div>
  );
};
export default Lobby;
