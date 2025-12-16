import styles from './Card.module.css';

export interface CardData {
  value: number;
  suit: string;
}

interface CardProps {
  card: CardData;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  draggable?: boolean;
  className?: string;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: '#e74c3c',
  diamonds: '#e74c3c',
  clubs: '#2c3e50',
  spades: '#2c3e50',
};

export function Card({ card, size = 'medium', onClick, draggable = false, className = '' }: CardProps) {
  const suitSymbol = SUIT_SYMBOLS[card.suit] || card.suit[0]?.toUpperCase() || '?';
  const suitColor = SUIT_COLORS[card.suit] || '#666';

  return (
    <div
      className={`${styles.card} ${styles[size]} ${className}`}
      onClick={onClick}
      draggable={draggable}
      style={{ '--suit-color': suitColor } as React.CSSProperties}
      data-value={card.value}
      data-suit={card.suit}
    >
      <div className={styles.cardValue}>{card.value}</div>
      <div className={styles.cardSuit} style={{ color: suitColor }}>
        {suitSymbol}
      </div>
    </div>
  );
}

