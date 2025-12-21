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
  MdCancel,
  MdPowerSettingsNew
} from 'react-icons/md';
import styles from './GameHeader.module.css';

interface GameHeaderProps {
  wsStatus: WebSocketStatus;
  gameStatus: GameState['status'];
  currentTurn: GameState['currentTurn'];
  players: GameState['players'];
  gameId: string;
  currentPlayerId: string | null;
  cardsPlayedThisTurn: number;
  isGameCreator?: boolean;
  onEndGame?: () => void;
}

const STATUS_LABELS: Record<GameState['status'], string> = {
  waiting: 'Aguardando Jogadores',
  playing: 'Em Andamento',
  finished: 'Finalizado',
  abandoned: 'Abandonado',
};

export function GameHeader({ 
  wsStatus, 
  gameStatus, 
  currentTurn, 
  players, 
  gameId,
  currentPlayerId,
  cardsPlayedThisTurn,
  isGameCreator = false,
  onEndGame
}: GameHeaderProps) {
  const currentTurnPlayer = currentTurn ? players.find(p => p.id === currentTurn) : null;
  const isMyTurn = currentTurn === currentPlayerId && gameStatus === 'playing';
  const shouldBlink = isMyTurn && cardsPlayedThisTurn === 0;

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
        {isGameCreator && onEndGame && (
          <button
            onClick={onEndGame}
            className={styles.endGameIcon}
            disabled={wsStatus !== 'connected'}
            title="Encerrar Jogo"
            aria-label="Encerrar Jogo"
          >
            <MdPowerSettingsNew className={styles.icon} />
          </button>
        )}
        {currentTurn && currentTurnPlayer && (
          <div className={styles.playerName}>
            {currentTurnPlayer.name}
          </div>
        )}
        <div className={styles.statusBadge} data-status={wsStatus} title={getConnectionLabel()}>
          {getConnectionIcon()}
        </div>
        <div className={styles.gameStatus} data-status={gameStatus} title={STATUS_LABELS[gameStatus]}>
          {getGameStatusIcon()}
        </div>
        {currentTurn && (
          <div 
            className={`${styles.turnChip} ${isMyTurn ? styles.myTurn : ''} ${shouldBlink ? styles.blinking : ''}`}
            title={isMyTurn ? 'Sua vez!' : `Vez de ${currentTurnPlayer?.name || 'Desconhecido'}`}
          >
            <span className={styles.turnLabel}>Vez:</span>
            <span className={styles.turnPlayerName}>
              {currentTurnPlayer?.name || 'Desconhecido'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

