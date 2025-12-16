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
}

export function PlayerHand({ player, wsStatus, onPlayCard }: PlayerHandProps) {
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

  return (
    <div className={styles.playerHand}>
      <h2 className={styles.title}>
        Suas Cartas <span className={styles.playerName}>({player.name})</span>
        {isDisabled && <span className={styles.disabledBadge}>Desconectado</span>}
      </h2>
      <div className={styles.handCards}>
        {player.hand.length === 0 ? (
          <div className={styles.emptyHand}>Nenhuma carta na mão</div>
        ) : (
          player.hand.map((card, index) => (
            <div key={index} className={styles.handCardWrapper}>
              <div
                draggable={!isDisabled}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                className={`${styles.handCard} ${draggedCardIndex === index ? styles.dragging : ''} ${isDisabled ? styles.disabled : ''}`}
              >
                <Card card={card} size="medium" />
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handlePileClick(index, 'ascending1')}
                    disabled={isDisabled}
                    className={styles.playButton}
                    title="Jogar na Pilha Crescente 1"
                  >
                    ↑1
                  </button>
                  <button
                    onClick={() => handlePileClick(index, 'ascending2')}
                    disabled={isDisabled}
                    className={styles.playButton}
                    title="Jogar na Pilha Crescente 2"
                  >
                    ↑2
                  </button>
                  <button
                    onClick={() => handlePileClick(index, 'descending1')}
                    disabled={isDisabled}
                    className={styles.playButton}
                    title="Jogar na Pilha Decrescente 1"
                  >
                    ↓1
                  </button>
                  <button
                    onClick={() => handlePileClick(index, 'descending2')}
                    disabled={isDisabled}
                    className={styles.playButton}
                    title="Jogar na Pilha Decrescente 2"
                  >
                    ↓2
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

