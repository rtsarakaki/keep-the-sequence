'use client';

import { useSearchParams } from 'next/navigation';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import styles from './page.module.css';

export default function GamePage({ params }: { params: { gameId: string } }) {
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');
  const playerName = typeof window !== 'undefined' ? sessionStorage.getItem('playerName') : null;

  const { gameState, wsStatus, error, retryCount, isRetrying, retry, sendMessage } = useGameWebSocket({
    gameId: params.gameId,
    playerId: playerId || undefined,
    playerName: playerName || undefined,
  });

  const handlePlayCard = (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => {
    if (wsStatus !== 'connected') {
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
    sendMessage({
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
          retry();
          break;
        }

        case 'reconnect-playerName': {
          if (!playerName) {
            alert('Nome do jogador não disponível');
            return;
          }
          retry();
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
          {wsStatus === 'connected' && (
            <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
              Aguardando estado do jogo... (Verifique o console do navegador para mais detalhes)
              {retryCount > 0 && ` (Tentativa ${retryCount}/3)`}
            </p>
          )}
          {(wsStatus === 'disconnected' || wsStatus === 'error' || (wsStatus === 'connected' && retryCount > 0)) && (
            <div style={{ marginTop: '1.5rem' }}>
              <button
                onClick={retry}
                disabled={isRetrying}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isRetrying ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isRetrying ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                {isRetrying ? 'Reconectando...' : retryCount > 0 ? `Tentar Novamente (${retryCount}/3)` : 'Tentar Novamente'}
              </button>
              {retryCount >= 3 && (
                <p style={{ marginTop: '1rem', color: '#c33', fontSize: '0.9rem' }}>
                  Múltiplas tentativas falharam. Verifique sua conexão e tente novamente.
                </p>
              )}
            </div>
          )}
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
