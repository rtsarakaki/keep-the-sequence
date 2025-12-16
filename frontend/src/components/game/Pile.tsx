'use client';

import { Card } from './Card';
import styles from './Pile.module.css';

interface PileProps {
  title: string;
  cards: Array<{ value: number; suit: string }>;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  isHovered?: boolean;
  isDroppable?: boolean;
}

export function Pile({ 
  title, 
  cards, 
  onDrop, 
  onDragOver, 
  onDragEnter, 
  onDragLeave,
  isHovered = false,
  isDroppable = true,
}: PileProps) {
  const lastCard = cards.length > 0 ? cards[cards.length - 1] : null;
  const previousCards = cards.slice(0, -1);

  return (
    <div 
      className={`${styles.pile} ${isHovered ? styles.hovered : ''} ${!isDroppable ? styles.notDroppable : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.pileCards}>
        {previousCards.length > 0 && (
          <div className={styles.previousCards}>
            {previousCards.map((card, idx) => (
              <Card key={idx} card={card} size="small" className={styles.hiddenCard} />
            ))}
          </div>
        )}
        {lastCard ? (
          <div className={styles.lastCard}>
            <Card card={lastCard} size="medium" />
            {cards.length > 1 && (
              <span className={styles.cardCount}>+{cards.length - 1}</span>
            )}
          </div>
        ) : (
          <div className={styles.emptyPile}>
            <span className={styles.emptyText}>Vazia</span>
            {isDroppable && <span className={styles.dropHint}>Solte aqui</span>}
          </div>
        )}
      </div>
    </div>
  );
}

