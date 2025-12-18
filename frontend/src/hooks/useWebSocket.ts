import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameStateData, PrivatePlayerState, Action } from '../types/game.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

interface UseWebSocketOptions {
  gameId: string;
  playerId: string;
  telegramId: number;
  onGameState?: (state: GameStateData) => void;
  onPrivateState?: (state: PrivatePlayerState) => void;
  onError?: (error: string) => void;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const { gameId, playerId, telegramId, onGameState, onPrivateState, onError } = options;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Создать подключение
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // Обработчики событий
    socket.on('connect', () => {
      console.log('WebSocket подключен');
      setConnected(true);

      // Присоединиться к игре
      socket.emit('join-game', {
        gameId,
        playerId,
        telegramId,
      });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket отключен');
      setConnected(false);
    });

    socket.on('game-state', (state: GameStateData) => {
      onGameState?.(state);
    });

    socket.on('private-state', (state: PrivatePlayerState) => {
      onPrivateState?.(state);
    });

    socket.on('error', (data: { message: string }) => {
      console.error('WebSocket ошибка:', data.message);
      onError?.(data.message);
    });

    socket.on('action-error', (data: { error: string }) => {
      console.error('Ошибка действия:', data.error);
      onError?.(data.error);
    });

    socket.on('player-joined', (data: { playerId: string; playerName: string }) => {
      console.log(`Игрок ${data.playerName} присоединился`);
    });

    socket.on('player-left', (data: { playerId: string }) => {
      console.log(`Игрок ${data.playerId} покинул игру`);
    });

    // Очистка при размонтировании
    return () => {
      socket.disconnect();
    };
  }, [gameId, playerId, telegramId, onGameState, onPrivateState, onError]);

  // Отправить действие
  const sendAction = useCallback((action: Action) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('player-action', { action });
    }
  }, [connected]);

  // Запросить обновление состояния
  const requestState = useCallback(() => {
    if (socketRef.current && connected) {
      socketRef.current.emit('request-state');
    }
  }, [connected]);

  return {
    connected,
    sendAction,
    requestState,
  };
};


