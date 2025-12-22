'use client';

import { useState } from 'react';
import styles from './LobbyActions.module.css';

interface LobbyActionsProps {
  playerName: string;
  gameId: string;
  isCreating: boolean;
  onPlayerNameChange: (name: string) => void;
  onGameIdChange: (id: string) => void;
  onCreateGame: () => void;
  onJoinGame: () => void;
}

type ActionMode = 'create' | 'join';

export default function LobbyActions({
  playerName,
  gameId,
  isCreating,
  onPlayerNameChange,
  onGameIdChange,
  onCreateGame,
  onJoinGame,
}: LobbyActionsProps) {
  const [mode, setMode] = useState<ActionMode>('create');

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'create' && !isCreating && playerName.trim()) {
        onCreateGame();
      } else if (mode === 'join' && gameId.trim() && playerName.trim()) {
        onJoinGame();
      }
    }
  };

  return (
    <div className={styles.actions}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${mode === 'create' ? styles.tabActive : ''}`}
          onClick={() => setMode('create')}
        >
          Criar Partida
        </button>
        <button
          className={`${styles.tab} ${mode === 'join' ? styles.tabActive : ''}`}
          onClick={() => setMode('join')}
        >
          Entrar em Partida
        </button>
      </div>

      <div className={styles.card}>
        {mode === 'create' ? (
          <>
            <h2 className={styles.cardTitle}>Criar Partida</h2>
            <p className={styles.cardDescription}>
              Inicie uma nova partida e convide seus amigos
            </p>
            <div className={styles.form}>
              <input
                type="text"
                placeholder="Seu nome"
                value={playerName}
                onChange={(e) => onPlayerNameChange(e.target.value)}
                className={styles.input}
                onKeyPress={handleKeyPress}
              />
              <button
                className={styles.button}
                onClick={onCreateGame}
                disabled={isCreating || !playerName.trim()}
              >
                {isCreating ? 'Criando...' : 'Criar Partida'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.cardTitle}>Entrar em Partida</h2>
            <p className={styles.cardDescription}>
              Digite o ID da partida para entrar
            </p>
            <div className={styles.form}>
              <input
                type="text"
                placeholder="Seu nome"
                value={playerName}
                onChange={(e) => onPlayerNameChange(e.target.value)}
                className={styles.input}
                onKeyPress={handleKeyPress}
              />
              <input
                type="text"
                placeholder="ID da partida"
                value={gameId}
                onChange={(e) => onGameIdChange(e.target.value)}
                className={styles.input}
                onKeyPress={handleKeyPress}
              />
              <button
                className={styles.button}
                onClick={onJoinGame}
                disabled={!gameId.trim() || !playerName.trim()}
              >
                Entrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
