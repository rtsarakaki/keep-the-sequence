'use client';

import { useState } from 'react';
import { GameState } from '@/hooks/useGameWebSocket';
import { Pile } from './Pile';
import styles from './GameBoard.module.css';

interface GameBoardProps {
  piles: GameState['piles'];
  onCardDrop?: (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => void;
  isDroppable?: boolean;
}

const PILE_CONFIG = [
  { key: 'ascending1' as const, title: 'Pilha Crescente 1', icon: '↑' },
  { key: 'ascending2' as const, title: 'Pilha Crescente 2', icon: '↑' },
  { key: 'descending1' as const, title: 'Pilha Decrescente 1', icon: '↓' },
  { key: 'descending2' as const, title: 'Pilha Decrescente 2', icon: '↓' },
] as const;

export function GameBoard({ piles, onCardDrop, isDroppable = true }: GameBoardProps) {
  const [hoveredPile, setHoveredPile] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, pileId: string) => {
    e.preventDefault();
    setHoveredPile(pileId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear hover if we're leaving the pile container
    const target = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!target.contains(relatedTarget)) {
      setHoveredPile(null);
    }
  };

  const handleDrop = (e: React.DragEvent, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => {
    e.preventDefault();
    setHoveredPile(null);
    
    if (!onCardDrop || !isDroppable) return;

    const cardIndexStr = e.dataTransfer.getData('text/plain');
    const cardIndex = parseInt(cardIndexStr, 10);
    
    if (!isNaN(cardIndex)) {
      onCardDrop(cardIndex, pileId);
    }
  };

  return (
    <div className={styles.gameBoard}>
      <h2 className={styles.title}>Pilhas do Jogo</h2>
      <div className={styles.piles}>
        {PILE_CONFIG.map(({ key, title, icon }) => (
          <Pile
            key={key}
            title={`${icon} ${title}`}
            cards={piles[key]}
            onDrop={(e) => handleDrop(e, key)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, key)}
            onDragLeave={handleDragLeave}
            isHovered={hoveredPile === key}
            isDroppable={isDroppable}
          />
        ))}
      </div>
    </div>
  );
}

