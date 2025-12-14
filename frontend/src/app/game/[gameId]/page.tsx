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
        if (message.type === 'gameState' || message.type === 'gameUpdated') {
          setGameState(message.game as GameState);
          setError(null); // Clear any previous errors
        } else if (message.type === 'error') {
          setError(message.error);
        }
      },
      onStatusChange: (status) => {
        console.log('Status WebSocket:', status);
        setWsStatus(status);
        if (status === 'connected') {
          setError(null); // Clear errors when connected
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
        // If playerId fails, try using playerName
        if (playerId && playerName && err instanceof Error && err.message.includes('not found')) {
          console.log('Tentando reconectar usando nome do jogador...');
          try {
            await gameWs.connect(params.gameId, playerName, { useName: true });
          } catch (nameErr) {
            console.error('Erro ao conectar com nome:', nameErr);
            setError(`Erro ao conectar: ${nameErr instanceof Error ? nameErr.message : 'Erro desconhecido'}\n\nVerifique:\n1. Se o jogo existe\n2. Se você faz parte do jogo\n3. Se o nome está correto`);
          }
        } else {
          console.error('Erro ao conectar WebSocket:', err);
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

  if (error) {
    return (
      <main className={styles.container}>
        <div className={styles.error}>
          <h2>Erro</h2>
          <p>{error}</p>
          <a href="/" className={styles.button}>Voltar à página inicial</a>
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
