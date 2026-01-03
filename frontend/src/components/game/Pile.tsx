'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import { PileHistoryModal } from './PileHistoryModal';
import { MdHistory, MdWarning } from 'react-icons/md';
import styles from './Pile.module.css';

type PileId = 'ascending1' | 'ascending2' | 'descending1' | 'descending2';

interface PileProps {
  title: string;
  shortTitle?: string;
  pileId: PileId;
  directionIcon?: string;
  cards: Array<{ value: number; suit: string }>;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  isHovered?: boolean;
  isHighlighted?: boolean;
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
  directionIcon,
  cards, 
  onDrop, 
  onDragOver, 
  onDragEnter,
  onDragLeave,
  isHovered = false,
  isHighlighted = false,
  isDroppable = true,
  currentPlayerId,
  currentTurn,
  pilePreferences = {},
  players = [],
  onMarkPreference,
}: PileProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showWarningMessage, setShowWarningMessage] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCard = cards.length > 0 ? cards[cards.length - 1] : null;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHistoryOpen(true);
  };

  // Find all players who marked this pile (excluding current player)
  const markedByPlayerIds = Object.entries(pilePreferences)
    .filter(([playerId, preferredPile]) => 
      preferredPile === pileId && playerId !== currentPlayerId
    )
    .map(([playerId]) => playerId);
  
  const markedByPlayers = markedByPlayerIds
    .map(playerId => players.find(p => p.id === playerId))
    .filter((player): player is { id: string; name: string } => player !== undefined);

  // Check if this pile is marked by any other player (not current player)
  const isPileMarked = markedByPlayers.length > 0;

  // Check if current player can mark preferences (not their turn)
  const canMarkPreference = currentPlayerId && 
    currentTurn !== currentPlayerId && 
    onMarkPreference !== undefined;

  // Check if current player has marked this pile
  const isMarkedByCurrentPlayer = currentPlayerId && 
    pilePreferences[currentPlayerId] === pileId;

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

  const handleWarningClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Clear existing timeout if any
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Toggle message visibility
    if (showWarningMessage) {
      setShowWarningMessage(false);
    } else {
      setShowWarningMessage(true);
      // Auto-hide after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setShowWarningMessage(false);
        timeoutRef.current = null;
      }, 3000);
    }
  };

  const warningMessage = markedByPlayers.length === 1
    ? `${markedByPlayers[0].name} pediu para não jogar aqui`
    : `${markedByPlayers.map(p => p.name).join(', ')} pediram para não jogar aqui`;

  return (
    <>
      <div 
        className={`${styles.pile} ${pileId.includes('ascending') ? styles.ascending : styles.descending} ${isHovered ? styles.hovered : ''} ${isHighlighted ? styles.highlighted : ''} ${!isDroppable ? styles.notDroppable : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        data-pile-id={pileId}
        data-is-droppable={isDroppable ? 'true' : 'false'}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>
            {directionIcon && (
              <span className={styles.directionArrow} aria-label={pileId.includes('ascending') ? 'Crescente' : 'Decrescente'}>
                {directionIcon}
              </span>
            )}
            {title}
          </h3>
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
          <div className={styles.mobileTitle}>
            {directionIcon && (
              <span className={styles.directionArrow}>{directionIcon}</span>
            )}
            {shortTitle}
          </div>
        )}
        <div className={styles.pileCards}>
          {/* Show warning icon if pile is marked by any player */}
          {isPileMarked && (
            <>
              <div 
                className={styles.warningIcon} 
                title={warningMessage}
                onClick={handleWarningClick}
              >
                <MdWarning />
                {markedByPlayers.length > 1 && (
                  <span className={styles.warningCount}>{markedByPlayers.length}</span>
                )}
              </div>
              {showWarningMessage && (
                <div className={styles.warningMessage}>
                  {warningMessage}
                </div>
              )}
            </>
          )}
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

