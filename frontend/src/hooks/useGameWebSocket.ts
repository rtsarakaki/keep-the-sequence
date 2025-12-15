import { useEffect, useState, useCallback } from 'react';
import { GameWebSocket, WebSocketStatus } from '@/services/websocket';

export interface GameState {
  id: string;
  players: Array<{
    id: string;
    name: string;
    hand: Array<{ value: number; suit: string }>;
    isConnected: boolean;
  }>;
  piles: {
    ascending1: Array<{ value: number; suit: string }>;
    ascending2: Array<{ value: number; suit: string }>;
    descending1: Array<{ value: number; suit: string }>;
    descending2: Array<{ value: number; suit: string }>;
  };
  deck: Array<{ value: number; suit: string }>;
  discardPile: Array<{ value: number; suit: string }>;
  currentTurn: string | null;
  status: 'waiting' | 'playing' | 'finished' | 'abandoned';
}

interface UseGameWebSocketOptions {
  gameId: string;
  playerId?: string;
  playerName?: string;
  onError?: (error: string) => void;
}

interface UseGameWebSocketReturn {
  gameState: GameState | null;
  wsStatus: WebSocketStatus;
  error: string | null;
  retryCount: number;
  isRetrying: boolean;
  retry: () => void;
  sendMessage: (message: unknown) => void;
}

/**
 * Custom hook for managing WebSocket connection and game state
 */
export function useGameWebSocket({
  gameId,
  playerId,
  playerName,
  onError,
}: UseGameWebSocketOptions): UseGameWebSocketReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [ws, setWs] = useState<GameWebSocket | null>(null);

  const handleError = useCallback(
    (errorMessage: string) => {
      setError(errorMessage);
      onError?.(errorMessage);
    },
    [onError]
  );

  const connect = useCallback(async () => {
    if (!playerId && !playerName) {
      handleError('Player ID ou nome não encontrado. Por favor, volte à página inicial.');
      return;
    }

    console.log('Conectando ao jogo:', { gameId, playerId, playerName });

    const gameWs = new GameWebSocket({
      onMessage: (message) => {
        console.log('Mensagem recebida:', message);
        console.log('Tipo da mensagem:', message.type);
        console.log('Conteúdo completo:', JSON.stringify(message, null, 2));

        if (message.type === 'gameState' || message.type === 'gameUpdated') {
          console.log('Atualizando estado do jogo:', message.game);
          try {
            setGameState(message.game as GameState);
            setError(null);
            setRetryCount(0);
            setIsRetrying(false);
            console.log('Estado do jogo atualizado com sucesso');
          } catch (err) {
            console.error('Erro ao atualizar estado do jogo:', err);
            handleError(
              `Erro ao processar estado do jogo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
            );
          }
        } else if (message.type === 'error') {
          handleError((message as { type: 'error'; error: string }).error);
        } else {
          console.warn('Tipo de mensagem desconhecido:', (message as { type?: string }).type);
        }
      },
      onStatusChange: (status) => {
        console.log('Status WebSocket:', status);
        setWsStatus(status);
        if (status === 'connected') {
          setError(null);
          setIsRetrying(false);
          console.log('WebSocket conectado, solicitando estado do jogo...');

          // Request game state after connection is established
          const requestSync = () => {
            if (gameWs && gameWs.getStatus() === 'connected') {
              console.log('Solicitando sincronização do jogo...');
              try {
                gameWs.send({
                  action: 'sync',
                  gameId,
                });
              } catch (err) {
                console.error('Erro ao solicitar sincronização:', err);
              }
            }
          };

          // First attempt after 500ms
          setTimeout(requestSync, 500);

          // Retry if gameState not received after 3 seconds (max 3 retries)
          setTimeout(() => {
            setGameState((currentState) => {
              if (!currentState && gameWs && gameWs.getStatus() === 'connected' && retryCount < 3) {
                console.log(`Retry ${retryCount + 1}/3: solicitando sincronização novamente...`);
                setRetryCount((prev) => prev + 1);
                requestSync();
              }
              return currentState;
            });
          }, 3000);
        }
      },
      onError: (err) => {
        console.error('Erro WebSocket:', err);
        handleError(`Erro na conexão: ${err.message}`);
      },
    });

    setWs(gameWs);

    // Connect to WebSocket
    const connectWithId = async () => {
      const identifier = playerId || playerName;
      if (!identifier) {
        handleError('Player ID ou nome não encontrado. Por favor, volte à página inicial.');
        return;
      }

      try {
        if (playerId) {
          await gameWs.connect(gameId, playerId);
        } else if (playerName) {
          await gameWs.connect(gameId, playerName, { useName: true });
        }
      } catch (err) {
        console.error('Erro ao conectar WebSocket:', err);

        if (err instanceof Error && err.message.includes('obter URL do WebSocket')) {
          const debugInfo = `\n\nInformações para diagnóstico:\nGame ID: ${gameId}\nPlayer ID: ${playerId || 'N/A'}\nPlayer Nome: ${playerName || 'N/A'}`;
          handleError(
            `Erro ao obter URL do WebSocket: ${err.message}\n\nPossíveis causas:\n1. O jogo "${gameId}" não existe\n2. Você não faz parte deste jogo\n3. O playerId/nome está incorreto\n4. Problema de conexão com a API${debugInfo}`
          );
        } else if (playerId && playerName && err instanceof Error && err.message.includes('not found')) {
          console.log('Tentando reconectar usando nome do jogador...');
          try {
            await gameWs.connect(gameId, playerName, { useName: true });
          } catch (nameErr) {
            console.error('Erro ao conectar com nome:', nameErr);
            handleError(
              `Erro ao conectar: ${nameErr instanceof Error ? nameErr.message : 'Erro desconhecido'}\n\nVerifique:\n1. Se o jogo existe\n2. Se você faz parte do jogo\n3. Se o nome está correto`
            );
          }
        } else {
          handleError(
            `Erro ao conectar: ${err instanceof Error ? err.message : 'Erro desconhecido'}\n\nVerifique:\n1. Se o jogo existe\n2. Se você faz parte do jogo\n3. Se o playerId/nome está correto`
          );
        }
      }
    };

    connectWithId();
  }, [gameId, playerId, playerName, retryCount, handleError]);

  const retry = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
    if (ws) {
      ws.disconnect();
    }
    connect();
  }, [ws, connect]);

  const sendMessage = useCallback(
    (message: unknown) => {
      if (!ws || wsStatus !== 'connected') {
        handleError('WebSocket não está conectado');
        return;
      }
      ws.send(message);
    },
    [ws, wsStatus, handleError]
  );

  useEffect(() => {
    connect();

    return () => {
      if (ws) {
        ws.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, playerId, playerName]);

  return {
    gameState,
    wsStatus,
    error,
    retryCount,
    isRetrying,
    retry,
    sendMessage,
  };
}

