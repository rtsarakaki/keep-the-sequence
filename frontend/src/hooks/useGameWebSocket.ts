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
  cardsPlayedThisTurn: number;
  status: 'waiting' | 'playing' | 'finished' | 'abandoned';
  pilePreferences: Record<string, string | null>; // Maps playerId -> pileId (null if no preference)
  updatedAt?: string; // ISO timestamp for comparing state freshness
  createdBy: string; // ID of the player who created the game
}

interface UseGameWebSocketOptions {
  gameId: string;
  playerId?: string;
  playerName?: string;
  onError?: (error: string) => void;
  onGameEnded?: () => void;
}

interface UseGameWebSocketReturn {
  gameState: GameState | null;
  wsStatus: WebSocketStatus;
  error: string | null;
  gameError: string | null; // Non-critical game errors (validation errors, etc.)
  retryCount: number;
  isRetrying: boolean;
  retry: () => void;
  sendMessage: (message: unknown) => void;
  clearGameError: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for managing WebSocket connection and game state
 */
export function useGameWebSocket({
  gameId,
  playerId,
  playerName,
  onError,
  onGameEnded,
}: UseGameWebSocketOptions): UseGameWebSocketReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null); // Non-critical game errors
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

    const gameWs = new GameWebSocket({
      onMessage: (message) => {
        if (message.type === 'gameState' || message.type === 'gameUpdated') {
          try {
            const newGameState = message.game as GameState;
            
            // Only update if the new state is more recent than the current one
            // This prevents sync responses from overwriting more recent gameUpdated messages
            setGameState((currentState) => {
              if (!currentState) {
                // No current state, accept the new one
                return newGameState;
              }
              
              // If we have updatedAt timestamps, compare them
              if (currentState.updatedAt && newGameState.updatedAt) {
                const currentTime = new Date(currentState.updatedAt).getTime();
                const newTime = new Date(newGameState.updatedAt).getTime();
                
                if (newTime < currentTime) {
                  return currentState;
                }
              }
              
              // If it's a gameUpdated message, always accept it (it's a real-time update)
              // If it's a gameState message (from sync), only accept if we don't have a state or if it's newer
              if (message.type === 'gameUpdated') {
                return newGameState;
              } else if (message.type === 'gameState') {
                // For sync responses, only update if status changed or if we don't have a playing state
                // This prevents sync from overwriting a 'playing' state with an old 'waiting' state
                if (currentState.status === 'playing' && newGameState.status === 'waiting') {
                  return currentState;
                }
                return newGameState;
              }
              
              return newGameState;
            });
            
            setError(null);
            setRetryCount(0);
            setIsRetrying(false);
          } catch (err) {
            handleError(
              `Erro ao processar estado do jogo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
            );
          }
        } else if (message.type === 'gameEnded') {
          if (onGameEnded) {
            onGameEnded();
          }
        } else if (message.type === 'gameFinished') {
          const finishedMessage = message as { type: 'gameFinished'; game: unknown; result?: 'victory' | 'defeat' };
          try {
            setGameState(finishedMessage.game as GameState);
            setError(null);
          } catch (err) {
            handleError(
              `Erro ao processar fim do jogo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
            );
          }
        } else if (message.type === 'error') {
          const errorMessage = (message as { type: 'error'; error: string }).error;
          
          // Define game validation errors that should NEVER break the game view
          // These are user action errors that should be shown as notifications
          const gameValidationErrorPatterns = [
            'Cannot play card',
            'Não é sua vez',
            'Game is not in playing status',
            'Card not in player hand',
            'Invalid pile ID',
            'Você deve jogar pelo menos',
            'Falha ao passar a vez',
            'Player not found in game',
            'Failed to play card',
            'pile', // Any error mentioning "pile" is likely a game validation error
          ];
          
          const isGameValidationError = gameValidationErrorPatterns.some(pattern => 
            errorMessage.includes(pattern)
          );
          
          // If we have a gameState, we're definitely in the game view
          // In this case, ALL errors should be notifications unless they're truly critical
          if (gameState) {
            // We're in the game - treat most errors as notifications
            const isTrulyCritical = 
              errorMessage.includes('Connection lost') ||
              errorMessage.includes('Connection closed') ||
              errorMessage.includes('Authentication failed') ||
              errorMessage.includes('WebSocket error') ||
              (errorMessage.includes('Game not found') && gameState.id); // Game not found when we have state is critical
            
            if (isTrulyCritical) {
              // Only break the view for truly critical connection/auth errors
              handleError(errorMessage);
            } else {
              // Everything else is a notification - keep the game view
              setGameError(errorMessage);
              setTimeout(() => setGameError(null), 5000);
            }
          } else if (isGameValidationError) {
            // No gameState yet, but it's a game validation error
            // Show as notification anyway - we might be loading
            setGameError(errorMessage);
            setTimeout(() => setGameError(null), 5000);
          } else {
            // No gameState and not a game validation error
            // This is likely a connection/auth error during initial load
            handleError(errorMessage);
          }
        }
      },
      onStatusChange: (status) => {
        setWsStatus(status);
        if (status === 'connected') {
          setError(null);
          setIsRetrying(false);

          // Request game state after connection is established
          // Only sync if we don't have a game state yet
          const requestSync = () => {
            if (gameWs && gameWs.getStatus() === 'connected') {
              // Check if we already have a game state - if so, don't sync
              // This prevents overwriting a more recent gameUpdated message
              setGameState((currentState) => {
                if (currentState) {
                  return currentState;
                }
                
                try {
                  gameWs.send({
                    action: 'sync',
                    gameId,
                  });
                } catch (err) {
                  // Silently handle sync errors
                }
                return currentState;
              });
            }
          };

          // First attempt after 500ms
          setTimeout(requestSync, 500);

          // Retry if gameState not received after 3 seconds (max 3 retries)
          setTimeout(() => {
            setGameState((currentState) => {
              if (!currentState && gameWs && gameWs.getStatus() === 'connected' && retryCount < 3) {
                setRetryCount((prev) => prev + 1);
                requestSync();
              }
              return currentState;
            });
          }, 3000);
        }
      },
      onError: (err) => {
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
        // If playerId failed and we have playerName, try using playerName instead
        const errorWithStatus = err as Error & { status?: number };
        if (playerId && playerName && err instanceof Error && (
          err.message.includes('not found') || 
          err.message.includes('Error validating') ||
          err.message.includes('Player not found') ||
          errorWithStatus.status === 403 || 
          errorWithStatus.status === 500
        )) {
          console.log('playerId validation failed, trying playerName instead...');
          try {
            await gameWs.connect(gameId, playerName, { useName: true });
            return; // Success, exit early
          } catch (nameErr) {
            // If playerName also fails, show error
            handleError(
              `Erro ao conectar: ${nameErr instanceof Error ? nameErr.message : 'Erro desconhecido'}\n\nVerifique:\n1. Se o jogo existe\n2. Se você faz parte do jogo\n3. Se o nome está correto`
            );
            return;
          }
        }
        
        // Handle other errors
        if (err instanceof Error && err.message.includes('obter URL do WebSocket')) {
          handleError(
            `Erro ao obter URL do WebSocket: ${err.message}\n\nPossíveis causas:\n1. O jogo não existe\n2. Você não faz parte deste jogo\n3. O playerId/nome está incorreto\n4. Problema de conexão com a API`
          );
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

  const clearGameError = useCallback(() => {
    setGameError(null);
  }, []);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.disconnect();
      setWs(null);
      setWsStatus('disconnected');
    }
  }, [ws]);

  return {
    gameState,
    wsStatus,
    error,
    gameError,
    retryCount,
    isRetrying,
    retry,
    sendMessage,
    clearGameError,
    disconnect,
  };
}

