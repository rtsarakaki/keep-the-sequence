'use client';

import styles from '../app/page.module.css';

interface LobbyActionsProps {
  playerName: string;
  gameId: string;
  isCreating: boolean;
  onPlayerNameChange: (name: string) => void;
  onGameIdChange: (id: string) => void;
  onCreateGame: () => void;
  onJoinGame: () => void;
}

export default function LobbyActions({
  playerName,
  gameId,
  isCreating,
  onPlayerNameChange,
  onGameIdChange,
  onCreateGame,
  onJoinGame,
}: LobbyActionsProps) {
  return (
    <div className={styles.actions}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Criar Partida</h2>
        <p className={styles.cardDescription}>
          Inicie uma nova partida e convide seus amigos
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Seu nome"
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            className={styles.input}
            style={{ width: '100%', marginBottom: '0.5rem' }}
            onKeyPress={(e) => e.key === 'Enter' && !isCreating && onCreateGame()}
          />
        </div>
        <button
          className={styles.button}
          onClick={onCreateGame}
          disabled={isCreating || !playerName.trim()}
        >
          {isCreating ? 'Criando...' : 'Criar Partida'}
        </button>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Entrar em Partida</h2>
        <p className={styles.cardDescription}>
          Digite o ID da partida para entrar
        </p>
        <div className={styles.joinForm}>
          <input
            type="text"
            placeholder="Seu nome"
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            className={styles.input}
            style={{ marginBottom: '0.5rem' }}
          />
          <input
            type="text"
            placeholder="ID da partida"
            value={gameId}
            onChange={(e) => onGameIdChange(e.target.value)}
            className={styles.input}
            style={{ marginBottom: '0.5rem' }}
            onKeyPress={(e) => e.key === 'Enter' && onJoinGame()}
          />
          <button
            className={styles.button}
            onClick={onJoinGame}
            disabled={!gameId.trim() || !playerName.trim()}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}

