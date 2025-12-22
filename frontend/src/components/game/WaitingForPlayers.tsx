'use client';

import { GameState } from '@/hooks/useGameWebSocket';
import { MdHourglassEmpty, MdContentCopy } from 'react-icons/md';
import styles from './WaitingForPlayers.module.css';

interface WaitingForPlayersProps {
  gameState: GameState;
}

export function WaitingForPlayers({ gameState }: WaitingForPlayersProps) {
  const playersNeeded = Math.max(0, 2 - gameState.players.length);

  return (
    <div className={styles.waitingContainer}>
      <div className={styles.waitingCard}>
        <div className={styles.icon}>
          <MdHourglassEmpty />
        </div>
        <h2 className={styles.title}>Aguardando Jogadores</h2>
        <p className={styles.message}>
          O jogo precisa de pelo menos <strong>2 jogadores</strong> para começar.
        </p>
        <div className={styles.status}>
          <div className={styles.currentPlayers}>
            <span className={styles.label}>Jogadores conectados:</span>
            <span className={styles.count}>{gameState.players.length} / 2+</span>
          </div>
          {playersNeeded > 0 && (
            <div className={styles.needed}>
              <span className={styles.label}>Aguardando:</span>
              <span className={styles.count}>{playersNeeded} jogador{playersNeeded > 1 ? 'es' : ''}</span>
            </div>
          )}
        </div>
        <div className={styles.shareSection}>
          <p className={styles.shareTitle}>Compartilhe o ID do jogo para outros jogadores entrarem:</p>
          <div className={styles.gameIdBox}>
            <code className={styles.gameId}>{gameState.id}</code>
            <button
              className={styles.copyButton}
              onClick={() => {
                navigator.clipboard.writeText(gameState.id);
                // You could add a toast notification here
              }}
              title="Copiar ID do jogo"
            >
              <MdContentCopy className={styles.copyIcon} />
              Copiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

