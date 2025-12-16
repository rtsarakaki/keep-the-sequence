import { WebSocketStatus } from '@/services/websocket';
import styles from '../../app/game/[gameId]/page.module.css';

interface GameLoadingProps {
  wsStatus: WebSocketStatus;
  retryCount: number;
  isRetrying: boolean;
  onRetry: () => void;
}

export function GameLoading({ wsStatus, retryCount, isRetrying, onRetry }: GameLoadingProps) {
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
              onClick={onRetry}
              disabled={isRetrying}
              style={{
                padding: '0.75rem 2rem',
                background: isRetrying ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isRetrying ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                opacity: isRetrying ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isRetrying) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
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

