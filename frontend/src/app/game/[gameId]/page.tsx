'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameWebSocket, WebSocketStatus } from '@/services/websocket';
import styles from './page.module.css';

interface GameState {
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
  currentTurn: string | null;
  status: 'waiting' | 'playing' | 'finished' | 'abandoned';
}

export default function GamePage({ params }: { params: { gameId: string } }) {
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');
  const playerName = typeof window !== 'undefined' ? sessionStorage.getItem('playerName') : null;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<GameWebSocket | null>(null);

  useEffect(() => {
    // For reconnection, we can use either playerId or playerName
    // If playerId is not available, we'll use playerName
    if (!playerId && !playerName) {
      setError('Player ID ou nome não encontrado. Por favor, volte à página inicial.');
      return;
    }

    console.log('Conectando ao jogo:', { gameId: params.gameId, playerId, playerName });

    // Initialize WebSocket connection
    const gameWs = new GameWebSocket({
      onMessage: (message) => {
        console.log('Mensagem recebida:', message);
        console.log('Tipo da mensagem:', message.type);
        console.log('Conteúdo completo:', JSON.stringify(message, null, 2));
        
        if (message.type === 'gameState' || message.type === 'gameUpdated') {
          console.log('Atualizando estado do jogo:', message.game);
          try {
            setGameState(message.game as GameState);
            setError(null); // Clear any previous errors
            console.log('Estado do jogo atualizado com sucesso');
          } catch (err) {
            console.error('Erro ao atualizar estado do jogo:', err);
            setError(`Erro ao processar estado do jogo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          }
        } else if (message.type === 'error') {
          setError((message as { type: 'error'; error: string }).error);
        } else {
          console.warn('Tipo de mensagem desconhecido:', (message as { type?: string }).type);
        }
      },
      onStatusChange: (status) => {
        console.log('Status WebSocket:', status);
        setWsStatus(status);
        if (status === 'connected') {
          setError(null); // Clear errors when connected
          console.log('WebSocket conectado, solicitando estado do jogo...');
          
          // Request game state after connection is established
          // This ensures the connection is fully ready before sending messages
          setTimeout(() => {
            if (gameWs && gameWs.getStatus() === 'connected') {
              console.log('Solicitando sincronização do jogo...');
              try {
                gameWs.send({
                  action: 'sync',
                  gameId: params.gameId,
                });
              } catch (err) {
                console.error('Erro ao solicitar sincronização:', err);
              }
            }
          }, 500); // Wait 500ms for connection to be fully ready
        }
      },
      onError: (err) => {
        console.error('Erro WebSocket:', err);
        setError(`Erro na conexão: ${err.message}`);
      },
    });

    setWs(gameWs);

    // Connect to WebSocket
    // Try using playerId first, fallback to playerName if playerId not found
    const connectWithId = async () => {
      // Use playerId if available, otherwise use playerName
      const identifier = playerId || playerName;
      if (!identifier) {
        setError('Player ID ou nome não encontrado. Por favor, volte à página inicial.');
        return;
      }

      try {
        // Try with playerId first if available
        if (playerId) {
          await gameWs.connect(params.gameId, playerId);
        } else if (playerName) {
          // Use playerName if playerId not available
          await gameWs.connect(params.gameId, playerName, { useName: true });
        }
      } catch (err) {
        console.error('Erro ao conectar WebSocket:', err);
        
        // Check if error is about getting WebSocket URL (before connection)
        if (err instanceof Error && err.message.includes('obter URL do WebSocket')) {
          // This means the HTTP request to get the WebSocket URL failed
          // Common causes: game not found, player not in game, API error
          const debugInfo = `\n\nInformações para diagnóstico:\nGame ID: ${params.gameId}\nPlayer ID: ${playerId || 'N/A'}\nPlayer Nome: ${playerName || 'N/A'}`;
          setError(`Erro ao obter URL do WebSocket: ${err.message}\n\nPossíveis causas:\n1. O jogo "${params.gameId}" não existe\n2. Você não faz parte deste jogo\n3. O playerId/nome está incorreto\n4. Problema de conexão com a API${debugInfo}`);
        } else if (playerId && playerName && err instanceof Error && err.message.includes('not found')) {
          // If playerId fails, try using playerName
          console.log('Tentando reconectar usando nome do jogador...');
          try {
            await gameWs.connect(params.gameId, playerName, { useName: true });
          } catch (nameErr) {
            console.error('Erro ao conectar com nome:', nameErr);
            setError(`Erro ao conectar: ${nameErr instanceof Error ? nameErr.message : 'Erro desconhecido'}\n\nVerifique:\n1. Se o jogo existe\n2. Se você faz parte do jogo\n3. Se o nome está correto`);
          }
        } else {
          // WebSocket connection error (after getting URL)
          setError(`Erro ao conectar: ${err instanceof Error ? err.message : 'Erro desconhecido'}\n\nVerifique:\n1. Se o jogo existe\n2. Se você faz parte do jogo\n3. Se o playerId/nome está correto`);
        }
      }
    };

    connectWithId();

    // Cleanup on unmount
    return () => {
      gameWs.disconnect();
    };
  }, [params.gameId, playerId, playerName]);

  const handlePlayCard = (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => {
    if (!ws || wsStatus !== 'connected') {
      setError('WebSocket não está conectado');
      return;
    }

    if (!gameState || !playerId) {
      return;
    }

    // Find current player
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer || cardIndex >= currentPlayer.hand.length) {
      return;
    }

    const card = currentPlayer.hand[cardIndex];

    // Send play card action
    ws.send({
      action: 'playCard',
      card: {
        value: card.value,
        suit: card.suit,
      },
      pileId,
    });
  };

  const handleDebugTest = async (testType: 'check-game' | 'reconnect-playerId' | 'reconnect-playerName' | 'get-token') => {
    if (!params.gameId) return;

    try {
      switch (testType) {
        case 'check-game': {
          // Try to get WebSocket URL to check if game/player exists
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) {
            alert('API URL não configurada');
            return;
          }

          const testPlayerId = playerId || 'test';
          const response = await fetch(
            `${apiUrl}/api/websocket-url?gameId=${params.gameId}&playerId=${testPlayerId}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              mode: 'cors',
            }
          );

          const data = await response.json();
          if (response.ok) {
            alert(`✅ Jogo existe!\n\nGame ID: ${params.gameId}\nPlayer ID: ${testPlayerId}\nToken gerado com sucesso.`);
          } else {
            alert(`❌ Erro: ${data.error || 'Erro desconhecido'}\n\nStatus: ${response.status}`);
          }
          break;
        }

        case 'reconnect-playerId': {
          if (!playerId) {
            alert('Player ID não disponível');
            return;
          }
          setError(null);
          if (ws) {
            ws.disconnect();
          }
          const newWs = new GameWebSocket({
            onMessage: (message) => {
              console.log('Mensagem recebida:', message);
              if (message.type === 'gameState' || message.type === 'gameUpdated') {
                setGameState(message.game as GameState);
                setError(null);
              }
            },
            onStatusChange: (status) => {
              setWsStatus(status);
              if (status === 'connected') {
                setError(null);
                alert('✅ Conectado com sucesso usando Player ID!');
              }
            },
            onError: (err) => {
              setError(`Erro: ${err.message}`);
            },
          });
          setWs(newWs);
          await newWs.connect(params.gameId, playerId);
          break;
        }

        case 'reconnect-playerName': {
          if (!playerName) {
            alert('Nome do jogador não disponível');
            return;
          }
          setError(null);
          if (ws) {
            ws.disconnect();
          }
          const newWs = new GameWebSocket({
            onMessage: (message) => {
              console.log('Mensagem recebida:', message);
              if (message.type === 'gameState' || message.type === 'gameUpdated') {
                setGameState(message.game as GameState);
                setError(null);
              }
            },
            onStatusChange: (status) => {
              setWsStatus(status);
              if (status === 'connected') {
                setError(null);
                alert('✅ Conectado com sucesso usando Nome!');
              }
            },
            onError: (err) => {
              setError(`Erro: ${err.message}`);
            },
          });
          setWs(newWs);
          await newWs.connect(params.gameId, playerName, { useName: true });
          break;
        }

        case 'get-token': {
          const { getApiUrl } = await import('@/services/api');
          let apiUrl: string;
          try {
            apiUrl = getApiUrl();
          } catch (err) {
            alert(`API URL não configurada: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
            return;
          }

          const testPlayerId = playerId || playerName || 'test';
          const useName = !playerId && !!playerName;
          const param = useName ? 'playerName' : 'playerId';
          
          const response = await fetch(
            `${apiUrl}/api/websocket-url?gameId=${params.gameId}&${param}=${encodeURIComponent(testPlayerId)}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              mode: 'cors',
            }
          );

          const data = await response.json();
          if (response.ok) {
            console.log('Token URL:', data.wsUrl);
            alert(`✅ Token obtido com sucesso!\n\nURL: ${data.wsUrl.substring(0, 100)}...\n\nVerifique o console para URL completa.\n\nGame ID: ${params.gameId}\n${param}: ${testPlayerId}`);
          } else {
            alert(`❌ Erro ao obter token: ${data.error || 'Erro desconhecido'}\n\nStatus: ${response.status}\n\nGame ID: ${params.gameId}\n${param}: ${testPlayerId}`);
          }
          break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      alert(`❌ Erro no teste: ${errorMessage}`);
      console.error('Debug test error:', err);
    }
  };

  if (error) {
    return (
      <main className={styles.container}>
        <div className={styles.error}>
          <h2>Erro</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{error}</p>
          
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>🔧 Ferramentas de Debug</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => handleDebugTest('check-game')}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                1. Verificar se jogo existe
              </button>
              <button
                onClick={() => handleDebugTest('get-token')}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                2. Testar obtenção de token
              </button>
              {playerId && (
                <button
                  onClick={() => handleDebugTest('reconnect-playerId')}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  3. Reconectar usando Player ID
                </button>
              )}
              {playerName && (
                <button
                  onClick={() => handleDebugTest('reconnect-playerName')}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  4. Reconectar usando Nome
                </button>
              )}
            </div>
          </div>

          <a href="/" className={styles.button} style={{ marginTop: '1rem', display: 'inline-block' }}>
            Voltar à página inicial
          </a>
        </div>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className={styles.container}>
        <div className={styles.loading}>
          <h2>Conectando ao jogo...</h2>
          <p>Status: {wsStatus}</p>
        </div>
      </main>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>The Game</h1>
        <div className={styles.status}>
          <span className={styles.statusBadge} data-status={wsStatus}>
            {wsStatus === 'connected' ? '🟢 Conectado' : wsStatus === 'connecting' ? '🟡 Conectando...' : '🔴 Desconectado'}
          </span>
          <span>Status: {gameState.status}</span>
          {gameState.currentTurn && (
            <span>Turno: {gameState.players.find(p => p.id === gameState.currentTurn)?.name || 'Desconhecido'}</span>
          )}
        </div>
      </header>

      <div className={styles.gameBoard}>
        <h2>Pilhas</h2>
        <div className={styles.piles}>
          <div className={styles.pile}>
            <h3>Pilha Crescente 1</h3>
            <div className={styles.pileCards}>
              {gameState.piles.ascending1.length > 0 ? (
                gameState.piles.ascending1.map((card, idx) => (
                  <div key={idx} className={styles.card}>
                    {card.value}
                  </div>
                ))
              ) : (
                <div className={styles.emptyPile}>Vazia</div>
              )}
            </div>
          </div>

          <div className={styles.pile}>
            <h3>Pilha Crescente 2</h3>
            <div className={styles.pileCards}>
              {gameState.piles.ascending2.length > 0 ? (
                gameState.piles.ascending2.map((card, idx) => (
                  <div key={idx} className={styles.card}>
                    {card.value}
                  </div>
                ))
              ) : (
                <div className={styles.emptyPile}>Vazia</div>
              )}
            </div>
          </div>

          <div className={styles.pile}>
            <h3>Pilha Decrescente 1</h3>
            <div className={styles.pileCards}>
              {gameState.piles.descending1.length > 0 ? (
                gameState.piles.descending1.map((card, idx) => (
                  <div key={idx} className={styles.card}>
                    {card.value}
                  </div>
                ))
              ) : (
                <div className={styles.emptyPile}>Vazia</div>
              )}
            </div>
          </div>

          <div className={styles.pile}>
            <h3>Pilha Decrescente 2</h3>
            <div className={styles.pileCards}>
              {gameState.piles.descending2.length > 0 ? (
                gameState.piles.descending2.map((card, idx) => (
                  <div key={idx} className={styles.card}>
                    {card.value}
                  </div>
                ))
              ) : (
                <div className={styles.emptyPile}>Vazia</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {currentPlayer && (
        <div className={styles.playerHand}>
          <h2>Suas Cartas ({currentPlayer.name})</h2>
          <div className={styles.handCards}>
            {currentPlayer.hand.map((card, index) => (
              <div key={index} className={styles.handCard}>
                <div className={styles.cardValue}>{card.value}</div>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handlePlayCard(index, 'ascending1')}
                    disabled={wsStatus !== 'connected'}
                    className={styles.playButton}
                  >
                    ↑1
                  </button>
                  <button
                    onClick={() => handlePlayCard(index, 'ascending2')}
                    disabled={wsStatus !== 'connected'}
                    className={styles.playButton}
                  >
                    ↑2
                  </button>
                  <button
                    onClick={() => handlePlayCard(index, 'descending1')}
                    disabled={wsStatus !== 'connected'}
                    className={styles.playButton}
                  >
                    ↓1
                  </button>
                  <button
                    onClick={() => handlePlayCard(index, 'descending2')}
                    disabled={wsStatus !== 'connected'}
                    className={styles.playButton}
                  >
                    ↓2
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.playersList}>
        <h2>Jogadores ({gameState.players.length})</h2>
        <ul>
          {gameState.players.map((player) => (
            <li key={player.id} className={player.id === playerId ? styles.currentPlayer : ''}>
              {player.name} {player.id === playerId && '(Você)'}
              {player.isConnected ? ' 🟢' : ' 🔴'}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
