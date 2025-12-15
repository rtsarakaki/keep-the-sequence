import { GameState } from '@/hooks/useGameWebSocket';
import styles from '../../app/game/[gameId]/page.module.css';

interface PlayersListProps {
  players: GameState['players'];
  currentPlayerId: string | null;
}

export function PlayersList({ players, currentPlayerId }: PlayersListProps) {
  return (
    <div className={styles.playersList}>
      <h2>Jogadores ({players.length})</h2>
      <ul>
        {players.map((player) => (
          <li key={player.id} className={player.id === currentPlayerId ? styles.currentPlayer : ''}>
            {player.name} {player.id === currentPlayerId && '(Você)'}
            {player.isConnected ? ' 🟢' : ' 🔴'}
          </li>
        ))}
      </ul>
    </div>
  );
}

