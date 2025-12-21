'use client';

import { useState } from 'react';
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
                className={`${styles.handCard} ${draggedCardIndex === originalIndex ? styles.dragging : ''} ${isDisabled ? styles.disabled : ''}`}
              >
                <Card card={card} size="medium" />
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handlePileClick(originalIndex, 'ascending1')}
                    disabled={isDisabled}
                    className={styles.playButton}
                    title="Jogar na Pilha Crescente 1"
                  >
                    C1
                  </button>
                  <button
                    onClick={() => handlePileClick(originalIndex, 'ascending2')}
                    disabled={isDisabled}
                    className={styles.playButton}
                    title="Jogar na Pilha Crescente 2"
                  >
                    C2
                  </button>
                  <button
                    onClick={() => handlePileClick(originalIndex, 'descending1')}
                    disabled={isDisabled}
                    className={styles.playButton}
                    title="Jogar na Pilha Decrescente 1"
                  >
                    D1
                  </button>
                  <button
                    onClick={() => handlePileClick(originalIndex, 'descending2')}
                    disabled={isDisabled}
                    className={styles.playButton}
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

