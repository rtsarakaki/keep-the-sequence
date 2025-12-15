import { GameState } from '@/hooks/useGameWebSocket';
import styles from '../../app/game/[gameId]/page.module.css';

interface GameBoardProps {
  piles: GameState['piles'];
}

export function GameBoard({ piles }: GameBoardProps) {
  return (
    <div className={styles.gameBoard}>
      <h2>Pilhas</h2>
      <div className={styles.piles}>
        <div className={styles.pile}>
          <h3>Pilha Crescente 1</h3>
          <div className={styles.pileCards}>
            {piles.ascending1.length > 0 ? (
              piles.ascending1.map((card, idx) => (
                <div key={idx} className={styles.card}>
                  {card.value}
                </div>
              ))
            ) : (
              <div className={styles.emptyPile}>Vazia</div>
            )}
          </div>
        </div>

        <div className={styles.pile}>
          <h3>Pilha Crescente 2</h3>
          <div className={styles.pileCards}>
            {piles.ascending2.length > 0 ? (
              piles.ascending2.map((card, idx) => (
                <div key={idx} className={styles.card}>
                  {card.value}
                </div>
              ))
            ) : (
              <div className={styles.emptyPile}>Vazia</div>
            )}
          </div>
        </div>

        <div className={styles.pile}>
          <h3>Pilha Decrescente 1</h3>
          <div className={styles.pileCards}>
            {piles.descending1.length > 0 ? (
              piles.descending1.map((card, idx) => (
                <div key={idx} className={styles.card}>
                  {card.value}
                </div>
              ))
            ) : (
              <div className={styles.emptyPile}>Vazia</div>
            )}
          </div>
        </div>

        <div className={styles.pile}>
          <h3>Pilha Decrescente 2</h3>
          <div className={styles.pileCards}>
            {piles.descending2.length > 0 ? (
              piles.descending2.map((card, idx) => (
                <div key={idx} className={styles.card}>
                  {card.value}
                </div>
              ))
            ) : (
              <div className={styles.emptyPile}>Vazia</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

