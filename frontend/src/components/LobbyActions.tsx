'use client';

import { useState } from 'react';
import styles from './LobbyActions.module.css';

interface LobbyActionsProps {
  playerName: string;
  gameId: string;
  isCreating: boolean;
  onPlayerNameChange: (name: string) => void;
  onGameIdChange: (id: string) => void;
  onCreateGame: (difficulty?: 'easy' | 'hard') => void;
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
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy');

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const trimmedName = playerName.trim();
      if (mode === 'create' && !isCreating && trimmedName && trimmedName.length >= 3) {
        onCreateGame();
      } else if (mode === 'join' && gameId.trim() && trimmedName && trimmedName.length >= 3) {
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
              <div className={styles.difficultySelector}>
                <label className={styles.difficultyLabel}>Dificuldade:</label>
                <div className={styles.difficultyOptions}>
                  <button
                    type="button"
                    className={`${styles.difficultyButton} ${difficulty === 'easy' ? styles.difficultyActive : ''}`}
                    onClick={() => setDifficulty('easy')}
                  >
                    Fácil
                  </button>
                  <button
                    type="button"
                    className={`${styles.difficultyButton} ${difficulty === 'hard' ? styles.difficultyActive : ''}`}
                    onClick={() => setDifficulty('hard')}
                  >
                    Difícil
                  </button>
                </div>
                <p className={styles.difficultyHint}>
                  {difficulty === 'easy' 
                    ? 'Cartas são repostas imediatamente após jogar'
                    : 'Cartas são repostas apenas ao passar a vez'}
                </p>
              </div>
              <button
                className={styles.button}
                onClick={() => onCreateGame(difficulty)}
                disabled={isCreating || !playerName.trim() || playerName.trim().length < 3}
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
                disabled={!gameId.trim() || !playerName.trim() || playerName.trim().length < 3}
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
