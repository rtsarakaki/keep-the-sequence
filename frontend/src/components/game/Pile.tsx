import styles from '../../app/game/[gameId]/page.module.css';

interface PileProps {
  title: string;
  cards: Array<{ value: number; suit: string }>;
}

export function Pile({ title, cards }: PileProps) {
  return (
    <div className={styles.pile}>
      <h3>{title}</h3>
      <div className={styles.pileCards}>
        {cards.length > 0 ? (
          cards.map((card, idx) => (
            <div key={idx} className={styles.card}>
              {card.value}
            </div>
          ))
        ) : (
          <div className={styles.emptyPile}>Vazia</div>
        )}
      </div>
    </div>
  );
}

