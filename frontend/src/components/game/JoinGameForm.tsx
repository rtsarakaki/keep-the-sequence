'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinGame } from '@/services/api';
import { MdPersonAdd, MdError } from 'react-icons/md';
import styles from './JoinGameForm.module.css';

interface JoinGameFormProps {
  gameId: string;
}

export function JoinGameForm({ gameId }: JoinGameFormProps) {
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setError('Por favor, informe seu nome');
      return;
    }
    
    if (trimmedName.length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Join game via HTTP endpoint
      const result = await joinGame(gameId, trimmedName);

      // Store player info in sessionStorage
      sessionStorage.setItem('playerId', result.playerId);
      sessionStorage.setItem('playerName', trimmedName);
      sessionStorage.setItem('gameId', result.gameId);

      // Redirect to game page with playerId
      router.push(`/game/${result.gameId}?playerId=${result.playerId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao entrar na partida';
      setError(errorMessage);
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.joinContainer}>
      <div className={styles.joinCard}>
        <div className={styles.icon}>
          <MdPersonAdd />
        </div>
        <h2 className={styles.title}>Entrar no Jogo</h2>
        <p className={styles.message}>
          Você foi convidado para este jogo! Informe seu nome para entrar.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="playerName" className={styles.label}>
              Seu Nome
            </label>
            <input
              id="playerName"
              type="text"
              placeholder="Digite seu nome (mín. 3 caracteres)"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError(null);
              }}
              onKeyPress={handleKeyPress}
              className={styles.input}
              disabled={isJoining}
              autoFocus
              minLength={3}
            />
          </div>
          {error && (
            <div className={styles.errorMessage}>
              <MdError className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isJoining || !playerName.trim() || playerName.trim().length < 3}
          >
            {isJoining ? 'Entrando...' : 'Entrar no Jogo'}
          </button>
        </form>
      </div>
    </div>
  );
}
