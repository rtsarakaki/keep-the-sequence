'use client';

import { useState, useRef } from 'react';
import { WebSocketStatus } from '@/services/websocket';
import { GameState } from '@/hooks/useGameWebSocket';
import { Card } from './Card';
import styles from './PlayerHand.module.css';

interface PlayerHandProps {
  player: GameState['players'][number];
  wsStatus: WebSocketStatus;
  onPlayCard: (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => void;
  isMyTurn?: boolean;
  cardsPlayedThisTurn?: number;
  minimumCards?: number;
  onEndTurn?: () => void;
  canEndTurn?: boolean;
}

export function PlayerHand({ 
  player, 
  wsStatus, 
  onPlayCard,
  isMyTurn = false,
  cardsPlayedThisTurn = 0,
  minimumCards = 0,
  onEndTurn,
  canEndTurn = false,
}: PlayerHandProps) {
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ cardIndex: number; x: number; y: number; initialX: number; initialY: number } | null>(null);
  const draggedCardElementRef = useRef<HTMLElement | null>(null);

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent, cardIndex: number) => {
    if (wsStatus !== 'connected' || isDisabled) {
      return;
    }
    
    const touch = e.touches[0];
    const cardElement = e.currentTarget as HTMLElement;
    const cardRect = cardElement.getBoundingClientRect();
    
    touchStartRef.current = {
      cardIndex,
      x: touch.clientX,
      y: touch.clientY,
      initialX: cardRect.left,
      initialY: cardRect.top,
    };
    
    setDraggedCardIndex(cardIndex);
    
    // Store reference to the card element for visual feedback
    draggedCardElementRef.current = cardElement;
    if (draggedCardElementRef.current) {
      // Use fixed positioning to take card out of normal flow and place it above everything
      draggedCardElementRef.current.style.position = 'fixed';
      draggedCardElementRef.current.style.left = `${cardRect.left}px`;
      draggedCardElementRef.current.style.top = `${cardRect.top}px`;
      draggedCardElementRef.current.style.width = `${cardRect.width}px`;
      draggedCardElementRef.current.style.zIndex = '9999';
      draggedCardElementRef.current.style.opacity = '0.8';
      draggedCardElementRef.current.style.pointerEvents = 'none'; // Allow touches to pass through to elements below
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !draggedCardElementRef.current) return;
    
    e.preventDefault(); // Prevent scrolling while dragging
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Move the card visually using fixed positioning
    if (draggedCardElementRef.current && touchStartRef.current) {
      draggedCardElementRef.current.style.left = `${touchStartRef.current.initialX + deltaX}px`;
      draggedCardElementRef.current.style.top = `${touchStartRef.current.initialY + deltaY}px`;
      draggedCardElementRef.current.style.transform = 'scale(1.1)';
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) {
      return;
    }
    
    const touch = e.changedTouches[0];
    
    // Get all elements at touch point (not just the top one)
    const elementsAtPoint = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    // Find the pile element (look for data-pile-id attribute)
    // Skip the dragged card element itself
    let pileElement: HTMLElement | null = null;
    for (const element of elementsAtPoint) {
      const htmlElement = element as HTMLElement;
      if (htmlElement === draggedCardElementRef.current) {
        continue; // Skip the dragged card itself
      }
      
      // Check if this element or any parent has the pile ID
      let current: HTMLElement | null = htmlElement;
      while (current) {
        if (current.dataset.pileId) {
          pileElement = current;
          break;
        }
        current = current.parentElement;
      }
      
      if (pileElement) break;
    }
    
    // If we found a pile and it's droppable, play the card
    if (pileElement && pileElement.dataset.pileId) {
      const pileId = pileElement.dataset.pileId as 'ascending1' | 'ascending2' | 'descending1' | 'descending2';
      // Check if pile is droppable
      if (pileElement.dataset.isDroppable === 'true') {
        onPlayCard(touchStartRef.current.cardIndex, pileId);
      }
    }
    
    // Reset card visual state
    if (draggedCardElementRef.current) {
      draggedCardElementRef.current.style.position = '';
      draggedCardElementRef.current.style.left = '';
      draggedCardElementRef.current.style.top = '';
      draggedCardElementRef.current.style.width = '';
      draggedCardElementRef.current.style.zIndex = '';
      draggedCardElementRef.current.style.opacity = '';
      draggedCardElementRef.current.style.transform = '';
      draggedCardElementRef.current.style.pointerEvents = '';
    }
    
    // Cleanup
    touchStartRef.current = null;
    setDraggedCardIndex(null);
    draggedCardElementRef.current = null;
  };

  const handleDragStart = (e: React.DragEvent, cardIndex: number) => {
    if (wsStatus !== 'connected') {
      e.preventDefault();
      return;
    }
    setDraggedCardIndex(cardIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardIndex.toString());
  };

  const handleDragEnd = () => {
    setDraggedCardIndex(null);
  };

  const handlePileClick = (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => {
    if (wsStatus !== 'connected') return;
    onPlayCard(cardIndex, pileId);
  };

  const isDisabled = wsStatus !== 'connected';

  // Sort cards by value in ascending order, preserving original indices
  const handWithIndices = player.hand.map((card, index) => ({ card, originalIndex: index }));
  const sortedHand = [...handWithIndices].sort((a, b) => {
    // First sort by value
    if (a.card.value !== b.card.value) {
      return a.card.value - b.card.value;
    }
    // If values are equal, sort by suit (for consistency)
    return a.card.suit.localeCompare(b.card.suit);
  });

  return (
    <div className={styles.playerHand}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            Suas Cartas
            {isDisabled && <span className={styles.disabledBadge}>Desconectado</span>}
          </h2>
          {isMyTurn && (
            <div className={styles.turnInfoInline}>
              <span className={styles.turnInfoValue}>
                {cardsPlayedThisTurn} / {minimumCards}
              </span>
              {cardsPlayedThisTurn < minimumCards && (
                <span className={styles.turnInfoHint}>
                  (mín. {minimumCards})
                </span>
              )}
            </div>
          )}
        </div>
        {isMyTurn && onEndTurn && (
          <button
            onClick={onEndTurn}
            className={styles.endTurnButton}
            disabled={!canEndTurn || wsStatus !== 'connected'}
            title={canEndTurn ? 'Passar a vez para o próximo jogador' : `Jogue pelo menos ${minimumCards} carta${minimumCards > 1 ? 's' : ''} primeiro`}
          >
            {canEndTurn ? '✓ Passar a Vez' : `Jogue ${minimumCards} carta${minimumCards > 1 ? 's' : ''} primeiro`}
          </button>
        )}
      </div>
      <div className={styles.handCards}>
        {sortedHand.length === 0 ? (
          <div className={styles.emptyHand}>Nenhuma carta na mão</div>
        ) : (
          sortedHand.map(({ card, originalIndex }, sortedIndex) => (
            <div key={`${card.value}-${card.suit}-${originalIndex}-${sortedIndex}`} className={styles.handCardWrapper}>
              <div
                draggable={!isDisabled}
                onDragStart={(e) => handleDragStart(e, originalIndex)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, originalIndex)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`${styles.handCard} ${draggedCardIndex === originalIndex ? styles.dragging : ''} ${isDisabled ? styles.disabled : ''}`}
              >
                <Card card={card} size="medium" />
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handlePileClick(originalIndex, 'ascending1')}
                    disabled={isDisabled}
                    className={`${styles.playButton} ${styles.ascendingButton}`}
                    title="Jogar na Pilha Crescente 1"
                  >
                    C1
                  </button>
                  <button
                    onClick={() => handlePileClick(originalIndex, 'ascending2')}
                    disabled={isDisabled}
                    className={`${styles.playButton} ${styles.ascendingButton}`}
                    title="Jogar na Pilha Crescente 2"
                  >
                    C2
                  </button>
                  <button
                    onClick={() => handlePileClick(originalIndex, 'descending1')}
                    disabled={isDisabled}
                    className={`${styles.playButton} ${styles.descendingButton}`}
                    title="Jogar na Pilha Decrescente 1"
                  >
                    D1
                  </button>
                  <button
                    onClick={() => handlePileClick(originalIndex, 'descending2')}
                    disabled={isDisabled}
                    className={`${styles.playButton} ${styles.descendingButton}`}
                    title="Jogar na Pilha Decrescente 2"
                  >
                    D2
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {player.hand.length > 0 && (
        <div className={styles.dragHint}>
          💡 Dica: Arraste uma carta para uma pilha ou clique nos botões acima
        </div>
      )}
    </div>
  );
}

