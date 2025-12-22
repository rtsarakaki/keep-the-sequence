'use client';

import { useState } from 'react';
import { Card } from './Card';
import { PileHistoryModal } from './PileHistoryModal';
import { MdHistory, MdWarning } from 'react-icons/md';
import styles from './Pile.module.css';

type PileId = 'ascending1' | 'ascending2' | 'descending1' | 'descending2';

interface PileProps {
  title: string;
  shortTitle?: string;
  pileId: PileId;
  cards: Array<{ value: number; suit: string }>;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  isHovered?: boolean;
  isDroppable?: boolean;
  // Pile preference props
  currentPlayerId?: string | null;
  currentTurn?: string | null;
  pilePreferences?: Record<string, string | null>;
  players?: Array<{ id: string; name: string }>;
  onMarkPreference?: (pileId: PileId | null) => void;
}

export function Pile({ 
  title, 
  shortTitle,
  pileId,
  cards, 
  onDrop, 
  onDragOver, 
  onDragEnter, 
  onDragLeave,
  isHovered = false,
  isDroppable = true,
  currentPlayerId,
  currentTurn,
  pilePreferences = {},
  players = [],
  onMarkPreference,
}: PileProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const lastCard = cards.length > 0 ? cards[cards.length - 1] : null;

  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHistoryOpen(true);
  };

  // Check if this pile is marked by any player
  const markedByPlayerId = Object.entries(pilePreferences).find(
    ([, preferredPile]) => preferredPile === pileId
  )?.[0];
  const markedByPlayer = markedByPlayerId 
    ? players.find(p => p.id === markedByPlayerId)
    : null;

  // Check if current player can mark preferences (not their turn)
  const canMarkPreference = currentPlayerId && 
    currentTurn !== currentPlayerId && 
    onMarkPreference !== undefined;

  // Check if current player has marked this pile
  const isMarkedByCurrentPlayer = currentPlayerId && 
    pilePreferences[currentPlayerId] === pileId;

  // Check if current player is the one whose turn it is (to show warning)
  const isCurrentPlayerTurn = currentPlayerId === currentTurn;

  const handleMarkPreference = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onMarkPreference) return;
    
    // If already marked by current player, remove preference
    // Otherwise, mark this pile (will replace any existing preference)
    if (isMarkedByCurrentPlayer) {
      onMarkPreference(null);
    } else {
      onMarkPreference(pileId);
    }
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
        {shortTitle && (
          <div className={styles.mobileTitle}>{shortTitle}</div>
        )}
        <div className={styles.pileCards}>
          {lastCard ? (
            <div className={styles.lastCard}>
              <Card card={lastCard} size="medium" />
            </div>
          ) : (
            <div className={styles.emptyPile}>
              <span className={styles.emptyText}>Vazia</span>
              {isDroppable && <span className={styles.dropHint}>Solte aqui</span>}
            </div>
          )}
        </div>
        {/* Show warning icon if it's current player's turn and pile is marked */}
        {isCurrentPlayerTurn && markedByPlayer && (
          <div className={styles.warningIcon} title={`${markedByPlayer.name} pediu para não jogar aqui`}>
            <MdWarning />
          </div>
        )}
        {/* Show "Don't play here" button if not current player's turn */}
        {canMarkPreference && (
          <button
            className={`${styles.markPreferenceButton} ${isMarkedByCurrentPlayer ? styles.marked : ''}`}
            onClick={handleMarkPreference}
            title={isMarkedByCurrentPlayer ? 'Remover marcação' : 'Não jogue aqui'}
          >
            {isMarkedByCurrentPlayer ? 'Remover marcação' : 'Não jogue aqui'}
          </button>
        )}
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

