'use client';

import { useState, useEffect } from 'react';
import { createGame, joinGame, checkApiHealth } from '@/services/api';
import styles from './page.module.css';

// Simple UUID generator for browser (crypto.randomUUID is not available in all browsers)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function Home() {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check API status on mount
  useEffect(() => {
    checkApiHealth().then((status) => {
      if (!status.configured) {
        setError(
          '⚠️ API não configurada: Por favor, configure NEXT_PUBLIC_API_URL nas variáveis de ambiente da Vercel.'
        );
      } else if (!status.accessible) {
        // Show detailed error for debugging (will be generic message later)
        const errorMsg = status.error || 'Erro desconhecido';
        const detailsMsg = status.details ? `\n\nDetalhes: ${status.details}` : '';
        setError(`⚠️ API não acessível: ${errorMsg}${detailsMsg}`);
      }
    });
  }, []);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Por favor, informe seu nome');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create game via HTTP endpoint
      const result = await createGame(playerName.trim());

      // Store player info in sessionStorage for the game page
      sessionStorage.setItem('playerId', result.playerId);
      sessionStorage.setItem('playerName', playerName.trim());
      sessionStorage.setItem('gameId', result.gameId);

      // Redirect to game page
      window.location.href = `/game/${result.gameId}?playerId=${result.playerId}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar partida';
      setError(errorMessage);
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!gameId.trim()) {
      setError('Por favor, insira um ID de jogo válido');
      return;
    }

    if (!playerName.trim()) {
      setError('Por favor, informe seu nome');
      return;
    }

    // Generate player ID
    const playerId = generateUUID();

    try {
      // Join game via HTTP endpoint
      const result = await joinGame(gameId.trim(), playerName.trim(), playerId);

      // Store player info in sessionStorage for the game page
      sessionStorage.setItem('playerId', result.playerId);
      sessionStorage.setItem('playerName', playerName.trim());
      sessionStorage.setItem('gameId', result.gameId);

      // Redirect to game page (will connect via WebSocket there)
      window.location.href = `/game/${result.gameId}?playerId=${result.playerId}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao entrar na partida';
      setError(errorMessage);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>The Game</h1>
        <p className={styles.subtitle}>
          Um jogo cooperativo de cartas online
        </p>
        <p className={styles.description}>
          Trabalhe em equipe para vencer o jogo. Jogue cartas nas pilhas
          crescentes e decrescentes, mas cuidado: vocês só podem se comunicar
          através das jogadas!
        </p>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          margin: '1rem auto',
          maxWidth: '600px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c33',
          whiteSpace: 'pre-line', // Allow line breaks
          fontFamily: 'monospace',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

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
              onChange={(e) => setPlayerName(e.target.value)}
              className={styles.input}
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onKeyPress={(e) => e.key === 'Enter' && !isCreating && handleCreateGame()}
            />
          </div>
          <button
            className={styles.button}
            onClick={handleCreateGame}
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
              onChange={(e) => setPlayerName(e.target.value)}
              className={styles.input}
              style={{ marginBottom: '0.5rem' }}
            />
            <input
              type="text"
              placeholder="ID da partida"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className={styles.input}
              style={{ marginBottom: '0.5rem' }}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            />
            <button
              className={styles.button}
              onClick={handleJoinGame}
              disabled={!gameId.trim() || !playerName.trim()}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>

      <div className={styles.rules}>
        <h2 className={styles.rulesTitle}>Como Jogar</h2>
        <div className={styles.rulesGrid}>
          <div className={styles.ruleCard}>
            <div className={styles.ruleNumber}>1</div>
            <h3>Objetivo</h3>
            <p>
              Jogue todas as 98 cartas nas 4 pilhas antes que o baralho acabe.
            </p>
          </div>
          <div className={styles.ruleCard}>
            <div className={styles.ruleNumber}>2</div>
            <h3>Pilhas</h3>
            <p>
              Duas pilhas crescentes (1→99) e duas decrescentes (100→2).
            </p>
          </div>
          <div className={styles.ruleCard}>
            <div className={styles.ruleNumber}>3</div>
            <h3>Regra Especial</h3>
            <p>
              Você pode jogar uma carta 10 unidades menor/maior que a última.
            </p>
          </div>
          <div className={styles.ruleCard}>
            <div className={styles.ruleNumber}>4</div>
            <h3>Comunicação</h3>
            <p>
              Vocês só podem se comunicar através das jogadas. Sem palavras!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
