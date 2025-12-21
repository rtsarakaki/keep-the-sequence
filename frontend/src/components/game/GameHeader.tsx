'use client';

import { WebSocketStatus } from '@/services/websocket';
import { GameState } from '@/hooks/useGameWebSocket';
import { 
  MdCheckCircle, 
  MdSync, 
  MdError, 
  MdHourglassEmpty, 
  MdPlayArrow, 
  MdCheckCircleOutline,
  MdCancel 
} from 'react-icons/md';
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

  const getConnectionIcon = () => {
    switch (wsStatus) {
      case 'connected':
        return <MdCheckCircle className={styles.icon} />;
      case 'connecting':
        return <MdSync className={`${styles.icon} ${styles.spinning}`} />;
      default:
        return <MdError className={styles.icon} />;
    }
  };

  const getConnectionLabel = () => {
    switch (wsStatus) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Desconectado';
    }
  };

  const getGameStatusIcon = () => {
    switch (gameStatus) {
      case 'waiting':
        return <MdHourglassEmpty className={styles.icon} />;
      case 'playing':
        return <MdPlayArrow className={styles.icon} />;
      case 'finished':
        return <MdCheckCircleOutline className={styles.icon} />;
      case 'abandoned':
        return <MdCancel className={styles.icon} />;
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.singleRow}>
        <h1 className={styles.title}>The Game</h1>
        <div className={styles.gameId}>ID: {gameId}</div>
        <div className={styles.statusBadge} data-status={wsStatus} title={getConnectionLabel()}>
          {getConnectionIcon()}
        </div>
        <div className={styles.gameStatus} data-status={gameStatus} title={STATUS_LABELS[gameStatus]}>
          {getGameStatusIcon()}
        </div>
        {currentTurn && (
          <span className={styles.turnInfo} title={`Vez de ${currentTurnPlayer?.name || 'Desconhecido'}`}>
            <strong>{currentTurnPlayer?.name || 'Desconhecido'}</strong>
          </span>
        )}
      </div>
    </header>
  );
}

