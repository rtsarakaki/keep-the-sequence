'use client';

import { useState } from 'react';
import { Card } from './Card';
import { PileHistoryModal } from './PileHistoryModal';
import { MdHistory } from 'react-icons/md';
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const lastCard = cards.length > 0 ? cards[cards.length - 1] : null;

  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHistoryOpen(true);
  };

  return (
    <>
      <div 
        className={`${styles.pile} ${isHovered ? styles.hovered : ''} ${!isDroppable ? styles.notDroppable : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {cards.length > 0 && (
            <button
              className={styles.historyButton}
              onClick={handleHistoryClick}
              title="Ver histórico de cartas"
              aria-label="Ver histórico de cartas"
            >
              <MdHistory />
              <span className={styles.historyCount}>{cards.length}</span>
            </button>
          )}
        </div>
        <div className={styles.pileCards}>
          {lastCard ? (
            <div className={styles.lastCard}>
              <Card card={lastCard} size="small" className={styles.mobileCard} />
            </div>
          ) : (
            <div className={styles.emptyPile}>
              <span className={styles.emptyText}>Vazia</span>
              {isDroppable && <span className={styles.dropHint}>Solte aqui</span>}
            </div>
          )}
        </div>
      </div>
      <PileHistoryModal
        title={title}
        cards={cards}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </>
  );
}

