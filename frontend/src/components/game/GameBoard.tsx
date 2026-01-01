'use client';

import { useState } from 'react';
import { GameState } from '@/hooks/useGameWebSocket';
import { Pile } from './Pile';
import styles from './GameBoard.module.css';

interface GameBoardProps {
  piles: GameState['piles'];
  deckLength?: number;
  onCardDrop?: (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => void;
  isDroppable?: boolean;
  // Pile preference props
  currentPlayerId?: string | null;
  currentTurn?: string | null;
  pilePreferences?: Record<string, string | null>;
  players?: Array<{ id: string; name: string }>;
  onMarkPreference?: (pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2' | null) => void;
}

const PILE_CONFIG = [
  { key: 'ascending1' as const, title: 'Pilha Crescente 1', shortTitle: 'C1', icon: '↑' },
  { key: 'ascending2' as const, title: 'Pilha Crescente 2', shortTitle: 'C2', icon: '↑' },
  { key: 'descending1' as const, title: 'Pilha Decrescente 1', shortTitle: 'D1', icon: '↓' },
  { key: 'descending2' as const, title: 'Pilha Decrescente 2', shortTitle: 'D2', icon: '↓' },
] as const;

export function GameBoard({ 
  piles, 
  deckLength = 0, 
  onCardDrop, 
  isDroppable = true,
  currentPlayerId,
  currentTurn,
  pilePreferences,
  players,
  onMarkPreference,
}: GameBoardProps) {
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
      <div className={styles.header}>
        <h2 className={styles.title}>Pilhas do Jogo</h2>
        <div className={styles.deckInfo}>
          <span className={styles.deckLabel}>Monte:</span>
          <span className={styles.deckCount}>{deckLength} cartas</span>
        </div>
      </div>
      <div className={styles.piles}>
        {PILE_CONFIG.map(({ key, shortTitle, icon }) => (
          <Pile
            key={key}
            title={shortTitle}
            shortTitle={shortTitle}
            pileId={key}
            directionIcon={icon}
            cards={piles[key]}
            onDrop={(e) => handleDrop(e, key)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, key)}
            onDragLeave={handleDragLeave}
            isHovered={hoveredPile === key}
            isDroppable={isDroppable}
            currentPlayerId={currentPlayerId}
            currentTurn={currentTurn}
            pilePreferences={pilePreferences}
            players={players}
            onMarkPreference={onMarkPreference}
          />
        ))}
      </div>
    </div>
  );
}

