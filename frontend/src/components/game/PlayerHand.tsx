'use client';

import { useState, useRef, useEffect } from 'react';
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
  confirmCardPlay?: boolean;
  setConfirmCardPlay?: (confirm: boolean) => void;
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
  confirmCardPlay = false,
  setConfirmCardPlay,
}: PlayerHandProps) {
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ cardIndex: number; x: number; y: number; initialX: number; initialY: number } | null>(null);
  const draggedCardElementRef = useRef<HTMLElement | null>(null);
  const draggedCardCloneRef = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef<{ cardIndex: number; initialX: number; initialY: number } | null>(null);
  const dragCloneRef = useRef<HTMLElement | null>(null);

  // Cleanup function to remove card clone
  const cleanupCardClone = () => {
    if (draggedCardCloneRef.current && draggedCardCloneRef.current.parentNode) {
      try {
        document.body.removeChild(draggedCardCloneRef.current);
      } catch (error) {
        // Clone might have already been removed
      }
      draggedCardCloneRef.current = null;
    }
    if (draggedCardElementRef.current) {
      draggedCardElementRef.current.style.opacity = '';
    }
    setDraggedCardIndex(null);
    draggedCardElementRef.current = null;
  };

  // Cleanup on unmount or when draggedCardIndex changes
  useEffect(() => {
    return () => {
      cleanupCardClone();
    };
  }, []);

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent, cardIndex: number) => {
    if (wsStatus !== 'connected' || !isMyTurn) {
      return;
    }
    
    const touch = e.touches[0];
    const cardContainer = e.currentTarget as HTMLElement;
    // Find the card element wrapper (the div with data-card-element)
    const cardWrapper = cardContainer.querySelector('[data-card-element]') as HTMLElement;
    
    if (!cardWrapper) return;
    
    const cardRect = cardWrapper.getBoundingClientRect();
    
    touchStartRef.current = {
      cardIndex,
      x: touch.clientX,
      y: touch.clientY,
      initialX: cardRect.left,
      initialY: cardRect.top,
    };
    
    setDraggedCardIndex(cardIndex);
    
    // Store reference to the container for visual feedback
    draggedCardElementRef.current = cardContainer;
    
    // Create a clone of just the card wrapper (not the buttons)
    const cardClone = cardWrapper.cloneNode(true) as HTMLElement;
    cardClone.style.position = 'fixed';
    cardClone.style.left = `${cardRect.left}px`;
    cardClone.style.top = `${cardRect.top}px`;
    cardClone.style.width = `${cardRect.width}px`;
    cardClone.style.height = `${cardRect.height}px`;
    cardClone.style.zIndex = '9999';
    cardClone.style.opacity = '0.9';
    cardClone.style.pointerEvents = 'none';
    cardClone.style.transform = 'scale(1.1)';
    cardClone.style.transition = 'none';
    cardClone.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
    document.body.appendChild(cardClone);
    draggedCardCloneRef.current = cardClone;
    
    // Make the original card container semi-transparent
    if (draggedCardElementRef.current) {
      draggedCardElementRef.current.style.opacity = '0.4';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !draggedCardCloneRef.current) return;
    
    e.preventDefault(); // Prevent scrolling while dragging
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Move only the card clone visually using fixed positioning
    if (draggedCardCloneRef.current && touchStartRef.current) {
      draggedCardCloneRef.current.style.left = `${touchStartRef.current.initialX + deltaX}px`;
      draggedCardCloneRef.current.style.top = `${touchStartRef.current.initialY + deltaY}px`;
    }
    
    // Detect which pile is being hovered over
    const elementsAtPoint = document.elementsFromPoint(touch.clientX, touch.clientY);
    let hoveredPileId: string | null = null;
    
    for (const element of elementsAtPoint) {
      const htmlElement = element as HTMLElement;
      if (htmlElement === draggedCardCloneRef.current) {
        continue; // Skip the dragged card clone itself
      }
      
      // Check if this element or any parent has the pile ID
      let current: HTMLElement | null = htmlElement;
      while (current) {
        if (current.dataset.pileId) {
          hoveredPileId = current.dataset.pileId;
          break;
        }
        current = current.parentElement;
      }
      
      if (hoveredPileId) break;
    }
    
    // Dispatch custom event to notify GameBoard about hovered pile
    if (hoveredPileId) {
      const pileElement = document.querySelector(`[data-pile-id="${hoveredPileId}"]`) as HTMLElement;
      if (pileElement && pileElement.dataset.isDroppable === 'true') {
        window.dispatchEvent(new CustomEvent('cardDragOverPile', { 
          detail: { pileId: hoveredPileId } 
        }));
      } else {
        window.dispatchEvent(new CustomEvent('cardDragOverPile', { 
          detail: { pileId: null } 
        }));
      }
    } else {
      window.dispatchEvent(new CustomEvent('cardDragOverPile', { 
        detail: { pileId: null } 
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) {
      // Ensure cleanup even if touchStartRef is null
      cleanupCardClone();
      return;
    }
    
    const touch = e.changedTouches[0];
    const cardIndex = touchStartRef.current.cardIndex;
    
    // Temporarily hide the clone to detect what's underneath
    if (draggedCardCloneRef.current) {
      draggedCardCloneRef.current.style.opacity = '0';
      draggedCardCloneRef.current.style.pointerEvents = 'none';
    }
    
    // Small delay to ensure the clone is hidden
    setTimeout(() => {
      // Always cleanup the clone, regardless of what happens
      const shouldCleanup = () => {
        // Remove the card clone
        if (draggedCardCloneRef.current && draggedCardCloneRef.current.parentNode) {
          try {
            document.body.removeChild(draggedCardCloneRef.current);
          } catch (error) {
            // Clone might have already been removed
          }
          draggedCardCloneRef.current = null;
        }
        
        // Reset original card container visual state
        if (draggedCardElementRef.current) {
          draggedCardElementRef.current.style.opacity = '';
        }
        
        // Clear hover state
        window.dispatchEvent(new CustomEvent('cardDragOverPile', { 
          detail: { pileId: null } 
        }));
        
        // Cleanup refs
        touchStartRef.current = null;
        setDraggedCardIndex(null);
        draggedCardElementRef.current = null;
      };

      if (!touchStartRef.current) {
        // Cleanup if touchStartRef was cleared
        shouldCleanup();
        return;
      }
      
      // Get all elements at touch point
      const elementsAtPoint = document.elementsFromPoint(touch.clientX, touch.clientY);
      
      // Find the pile element (look for data-pile-id attribute)
      let pileElement: HTMLElement | null = null;
      for (const element of elementsAtPoint) {
        const htmlElement = element as HTMLElement;
        
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
      if (pileElement && pileElement.dataset.pileId && touchStartRef.current) {
        const pileId = pileElement.dataset.pileId as 'ascending1' | 'ascending2' | 'descending1' | 'descending2';
        // Check if pile is droppable
        if (pileElement.dataset.isDroppable === 'true') {
          onPlayCard(cardIndex, pileId);
        }
      }
      
      // Always cleanup after processing
      shouldCleanup();
    }, 10);
  };

  const handleDragStart = (e: React.DragEvent, cardIndex: number) => {
    if (wsStatus !== 'connected' || !isMyTurn) {
      e.preventDefault();
      return;
    }
    
    const cardContainer = e.currentTarget as HTMLElement;
    const cardWrapper = cardContainer.querySelector('[data-card-element]') as HTMLElement;
    
    if (!cardWrapper) {
      e.preventDefault();
      return;
    }
    
    const cardRect = cardWrapper.getBoundingClientRect();
    
    dragStartRef.current = {
      cardIndex,
      initialX: cardRect.left,
      initialY: cardRect.top,
    };
    
    setDraggedCardIndex(cardIndex);
    
    // Store reference to the container for visual feedback
    draggedCardElementRef.current = cardContainer;
    
    // Create a clone of just the card wrapper (not the buttons) for desktop drag
    const cardClone = cardWrapper.cloneNode(true) as HTMLElement;
    cardClone.style.position = 'fixed';
    cardClone.style.left = `${cardRect.left}px`;
    cardClone.style.top = `${cardRect.top}px`;
    cardClone.style.width = `${cardRect.width}px`;
    cardClone.style.height = `${cardRect.height}px`;
    cardClone.style.zIndex = '9999';
    cardClone.style.opacity = '0.9';
    cardClone.style.pointerEvents = 'none';
    cardClone.style.transform = 'scale(1.1)';
    cardClone.style.transition = 'none';
    cardClone.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
    document.body.appendChild(cardClone);
    dragCloneRef.current = cardClone;
    
    // Make the original card container semi-transparent
    if (draggedCardElementRef.current) {
      draggedCardElementRef.current.style.opacity = '0.4';
    }
    
    // Hide the default drag image
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardIndex.toString());
    
    // Update clone position during drag
    const handleDrag = (dragEvent: DragEvent) => {
      if (dragCloneRef.current && dragStartRef.current) {
        dragCloneRef.current.style.left = `${dragEvent.clientX - cardRect.width / 2}px`;
        dragCloneRef.current.style.top = `${dragEvent.clientY - cardRect.height / 2}px`;
      }
    };
    
    document.addEventListener('dragover', handleDrag);
    
    // Cleanup on drag end
    const handleDragEndCleanup = () => {
      document.removeEventListener('dragover', handleDrag);
      if (dragCloneRef.current && dragCloneRef.current.parentNode) {
        document.body.removeChild(dragCloneRef.current);
        dragCloneRef.current = null;
      }
      if (draggedCardElementRef.current) {
        draggedCardElementRef.current.style.opacity = '';
      }
      dragStartRef.current = null;
      setDraggedCardIndex(null);
      draggedCardElementRef.current = null;
    };
    
    // Store cleanup function
    (e.currentTarget as HTMLElement & { __dragEndCleanup?: () => void }).__dragEndCleanup = handleDragEndCleanup;
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement & { __dragEndCleanup?: () => void };
    const cleanup = element.__dragEndCleanup;
    if (cleanup) {
      cleanup();
      delete element.__dragEndCleanup;
    }
    setDraggedCardIndex(null);
  };

  const handlePileClick = (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => {
    if (wsStatus !== 'connected') return;
    onPlayCard(cardIndex, pileId);
  };

  const isDisabled = wsStatus !== 'connected' || !isMyTurn;

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
        <div className={styles.headerActions}>
          {setConfirmCardPlay && (
            <label className={styles.confirmToggle}>
              <input
                type="checkbox"
                checked={confirmCardPlay}
                onChange={(e) => setConfirmCardPlay(e.target.checked)}
                className={styles.confirmToggleInput}
              />
              <span className={styles.confirmToggleLabel}>
                Confirmar jogadas
              </span>
            </label>
          )}
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
                <div data-card-element>
                  <Card card={card} size="medium" />
                </div>
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

