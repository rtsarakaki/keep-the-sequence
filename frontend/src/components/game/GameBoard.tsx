import { GameState } from '@/hooks/useGameWebSocket';
import { Pile } from './Pile';
import styles from '../../app/game/[gameId]/page.module.css';

interface GameBoardProps {
  piles: GameState['piles'];
}

const PILE_CONFIG = [
  { key: 'ascending1' as const, title: 'Pilha Crescente 1' },
  { key: 'ascending2' as const, title: 'Pilha Crescente 2' },
  { key: 'descending1' as const, title: 'Pilha Decrescente 1' },
  { key: 'descending2' as const, title: 'Pilha Decrescente 2' },
] as const;

export function GameBoard({ piles }: GameBoardProps) {
  return (
    <div className={styles.gameBoard}>
      <h2>Pilhas</h2>
      <div className={styles.piles}>
        {PILE_CONFIG.map(({ key, title }) => (
          <Pile key={key} title={title} cards={piles[key]} />
        ))}
      </div>
    </div>
  );
}

