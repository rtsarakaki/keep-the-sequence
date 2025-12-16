'use client';

import { GameState } from '@/hooks/useGameWebSocket';
import styles from './PlayersList.module.css';

interface PlayersListProps {
  players: GameState['players'];
  currentPlayerId: string | null;
}

export function PlayersList({ players, currentPlayerId }: PlayersListProps) {
  return (
    <div className={styles.playersList}>
      <h2 className={styles.title}>
        Jogadores <span className={styles.count}>({players.length})</span>
      </h2>
      <ul className={styles.list}>
        {players.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          return (
            <li 
              key={player.id} 
              className={`${styles.playerItem} ${isCurrentPlayer ? styles.currentPlayer : ''} ${!player.isConnected ? styles.disconnected : ''}`}
            >
              <div className={styles.playerInfo}>
                <span className={styles.statusIndicator} data-connected={player.isConnected}>
                  {player.isConnected ? '🟢' : '🔴'}
                </span>
                <span className={styles.playerName}>
                  {player.name}
                  {isCurrentPlayer && <span className={styles.youBadge}>Você</span>}
                </span>
              </div>
              <div className={styles.playerStats}>
                <span className={styles.cardCount}>{player.hand.length} cartas</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

