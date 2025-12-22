'use client';

import LobbyActions from '@/components/LobbyActions';
import ErrorMessage from '@/components/ErrorMessage';
import GameRules from '@/components/GameRules';
import { useLobby } from '@/hooks/useLobby';
import styles from './page.module.css';

export default function Home() {
  const {
    gameId,
    playerName,
    isCreating,
    error,
    setGameId,
    setPlayerName,
    handleCreateGame,
    handleJoinGame,
  } = useLobby();

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

      <ErrorMessage message={error || ''} />

      <LobbyActions
        playerName={playerName}
        gameId={gameId}
        isCreating={isCreating}
        onPlayerNameChange={setPlayerName}
        onGameIdChange={setGameId}
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
      />

      <GameRules />
    </main>
  );
}
