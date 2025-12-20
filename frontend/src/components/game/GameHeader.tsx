'use client';

import { WebSocketStatus } from '@/services/websocket';
import { GameState } from '@/hooks/useGameWebSocket';
import styles from './GameHeader.module.css';

interface GameHeaderProps {
  wsStatus: WebSocketStatus;
  gameStatus: GameState['status'];
  currentTurn: GameState['currentTurn'];
  players: GameState['players'];
  gameId: string;
}

const STATUS_LABELS: Record<GameState['status'], string> = {
  waiting: 'Aguardando Jogadores',
  playing: 'Em Andamento',
  finished: 'Finalizado',
  abandoned: 'Abandonado',
};

export function GameHeader({ wsStatus, gameStatus, currentTurn, players, gameId }: GameHeaderProps) {
  const currentTurnPlayer = currentTurn ? players.find(p => p.id === currentTurn) : null;

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>The Game</h1>
        <div className={styles.gameId}>ID: {gameId}</div>
      </div>
      <div className={styles.statusRow}>
        <span className={styles.statusBadge} data-status={wsStatus}>
          {wsStatus === 'connected' ? '🟢 Conectado' : wsStatus === 'connecting' ? '🟡 Conectando...' : '🔴 Desconectado'}
        </span>
        <span className={styles.gameStatus} data-status={gameStatus}>
          {STATUS_LABELS[gameStatus]}
        </span>
        {currentTurn && (
          <span className={styles.turnInfo}>
            Vez: <strong>{currentTurnPlayer?.name || 'Desconhecido'}</strong>
          </span>
        )}
      </div>
    </header>
  );
}

