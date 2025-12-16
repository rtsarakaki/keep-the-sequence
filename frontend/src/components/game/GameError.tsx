import styles from '../../app/game/[gameId]/page.module.css';

interface GameErrorProps {
  error: string;
  playerId: string | null;
  playerName: string | null;
  onDebugTest: (testType: 'check-game' | 'reconnect-playerId' | 'reconnect-playerName' | 'get-token') => void;
  onRetry: () => void;
}

export function GameError({ error, playerId, playerName, onDebugTest, onRetry }: GameErrorProps) {
  return (
    <main className={styles.container}>
      <div className={styles.error}>
        <h2>Erro</h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{error}</p>

        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#667eea', fontWeight: 700 }}>🔧 Ferramentas de Debug</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => onDebugTest('check-game')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              1. Verificar se jogo existe
            </button>
            <button
              onClick={() => onDebugTest('get-token')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              2. Testar obtenção de token
            </button>
            {playerId && (
              <button
                onClick={() => onDebugTest('reconnect-playerId')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                3. Reconectar usando Player ID
              </button>
            )}
            {playerName && (
              <button
                onClick={() => onDebugTest('reconnect-playerName')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                4. Reconectar usando Nome
              </button>
            )}
            <button
              onClick={onRetry}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🔄 Tentar Novamente
            </button>
          </div>
        </div>

        <a href="/" className={styles.button} style={{ marginTop: '1rem', display: 'inline-block' }}>
          Voltar à página inicial
        </a>
      </div>
    </main>
  );
}

