'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [highlightedPile, setHighlightedPile] = useState<string | null>(null);
  const previousPilesRef = useRef<{ ascending1: number; ascending2: number; descending1: number; descending2: number } | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for touch drag events from PlayerHand
  useEffect(() => {
    const handleCardDragOverPile = (e: Event) => {
      const customEvent = e as CustomEvent<{ pileId: string | null }>;
      setHoveredPile(customEvent.detail.pileId);
    };
    
    window.addEventListener('cardDragOverPile', handleCardDragOverPile as EventListener);
    
    return () => {
      window.removeEventListener('cardDragOverPile', handleCardDragOverPile as EventListener);
    };
  }, []);

  // Detect when a pile is updated (card played)
  useEffect(() => {
    if (!previousPilesRef.current) {
      // First render, just store current state (store lengths, not the full object)
      previousPilesRef.current = {
        ascending1: piles.ascending1.length,
        ascending2: piles.ascending2.length,
        descending1: piles.descending1.length,
        descending2: piles.descending2.length,
      };
      return;
    }

    // Check each pile to see if it grew (a card was played)
    const pileKeys: Array<keyof GameState['piles']> = ['ascending1', 'ascending2', 'descending1', 'descending2'];
    
    for (const pileKey of pileKeys) {
      const previousLength = previousPilesRef.current[pileKey];
      const currentLength = piles[pileKey].length;
      
      // If a pile grew, highlight it (effect lasts until next card is played)
      if (currentLength > previousLength) {
        // Clear any existing timeout (in case cleanup is needed)
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
          highlightTimeoutRef.current = null;
        }
        
        // Highlight the new pile (this will automatically remove highlight from previous pile)
        setHighlightedPile(pileKey);
        
        break; // Only highlight one pile at a time
      }
    }
    
    // Update previous piles reference (store lengths)
    previousPilesRef.current = {
      ascending1: piles.ascending1.length,
      ascending2: piles.ascending2.length,
      descending1: piles.descending1.length,
      descending2: piles.descending2.length,
    };
  }, [piles]);

  // Cleanup on unmount (though timeout is no longer used, keeping for safety)
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

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
            isHighlighted={highlightedPile === key}
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

