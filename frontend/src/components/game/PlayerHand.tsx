import { WebSocketStatus } from '@/services/websocket';
import { GameState } from '@/hooks/useGameWebSocket';
import styles from '../../app/game/[gameId]/page.module.css';

interface PlayerHandProps {
  player: GameState['players'][number];
  wsStatus: WebSocketStatus;
  onPlayCard: (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => void;
}

export function PlayerHand({ player, wsStatus, onPlayCard }: PlayerHandProps) {
  return (
    <div className={styles.playerHand}>
      <h2>Suas Cartas ({player.name})</h2>
      <div className={styles.handCards}>
        {player.hand.map((card, index) => (
          <div key={index} className={styles.handCard}>
            <div className={styles.cardValue}>{card.value}</div>
            <div className={styles.cardActions}>
              <button
                onClick={() => onPlayCard(index, 'ascending1')}
                disabled={wsStatus !== 'connected'}
                className={styles.playButton}
              >
                ↑1
              </button>
              <button
                onClick={() => onPlayCard(index, 'ascending2')}
                disabled={wsStatus !== 'connected'}
                className={styles.playButton}
              >
                ↑2
              </button>
              <button
                onClick={() => onPlayCard(index, 'descending1')}
                disabled={wsStatus !== 'connected'}
                className={styles.playButton}
              >
                ↓1
              </button>
              <button
                onClick={() => onPlayCard(index, 'descending2')}
                disabled={wsStatus !== 'connected'}
                className={styles.playButton}
              >
                ↓2
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

