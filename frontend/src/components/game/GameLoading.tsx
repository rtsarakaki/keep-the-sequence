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

