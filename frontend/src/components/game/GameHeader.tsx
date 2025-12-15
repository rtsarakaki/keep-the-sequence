import { WebSocketStatus } from '@/services/websocket';
import { GameState } from '@/hooks/useGameWebSocket';
import styles from '../../app/game/[gameId]/page.module.css';

interface GameHeaderProps {
  wsStatus: WebSocketStatus;
  gameStatus: GameState['status'];
  currentTurn: GameState['currentTurn'];
  players: GameState['players'];
}

export function GameHeader({ wsStatus, gameStatus, currentTurn, players }: GameHeaderProps) {
  const currentTurnPlayer = currentTurn ? players.find(p => p.id === currentTurn) : null;

  return (
    <header className={styles.header}>
      <h1>The Game</h1>
      <div className={styles.status}>
        <span className={styles.statusBadge} data-status={wsStatus}>
          {wsStatus === 'connected' ? '🟢 Conectado' : wsStatus === 'connecting' ? '🟡 Conectando...' : '🔴 Desconectado'}
        </span>
        <span>Status: {gameStatus}</span>
        {currentTurn && (
          <span>Turno: {currentTurnPlayer?.name || 'Desconhecido'}</span>
        )}
      </div>
    </header>
  );
}

