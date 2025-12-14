'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [gameId, setGameId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGame = async () => {
    setIsCreating(true);
    // TODO: Implementar criação de jogo
    console.log('Creating game...');
    setTimeout(() => {
      setIsCreating(false);
      // TODO: Redirecionar para o jogo criado
    }, 1000);
  };

  const handleJoinGame = () => {
    if (!gameId.trim()) {
      alert('Por favor, insira um ID de jogo válido');
      return;
    }
    // TODO: Implementar join game
    window.location.href = `/game/${gameId}`;
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

      <div className={styles.actions}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Criar Partida</h2>
          <p className={styles.cardDescription}>
            Inicie uma nova partida e convide seus amigos
          </p>
          <button
            className={styles.button}
            onClick={handleCreateGame}
            disabled={isCreating}
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
              placeholder="ID da partida"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            />
            <button
              className={styles.button}
              onClick={handleJoinGame}
              disabled={!gameId.trim()}
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
