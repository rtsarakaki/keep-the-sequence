import styles from '../../app/game/[gameId]/page.module.css';

interface GameErrorProps {
  error: string;
  onRetry: () => void;
}

export function GameError({ error, onRetry }: GameErrorProps) {
  return (
    <main className={styles.container}>
      <div className={styles.error}>
        <h2>Erro</h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{error}</p>

        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

        <a href="/" className={styles.button} style={{ marginTop: '1rem', display: 'inline-block' }}>
          Voltar à página inicial
        </a>
      </div>
    </main>
  );
}

