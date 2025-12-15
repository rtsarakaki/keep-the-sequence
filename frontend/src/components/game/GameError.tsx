import styles from '../../app/game/[gameId]/page.module.css';

interface GameErrorProps {
  error: string;
  playerId: string | null;
  playerName: string | null;
  onDebugTest: (testType: 'check-game' | 'reconnect-playerId' | 'reconnect-playerName' | 'get-token') => void;
  onRetry: () => void;
}

export function GameError({ error, playerId, playerName, onDebugTest }: GameErrorProps) {
  return (
    <main className={styles.container}>
      <div className={styles.error}>
        <h2>Erro</h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{error}</p>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>🔧 Ferramentas de Debug</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => onDebugTest('check-game')}
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
              onClick={() => onDebugTest('get-token')}
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
                onClick={() => onDebugTest('reconnect-playerId')}
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
                onClick={() => onDebugTest('reconnect-playerName')}
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

