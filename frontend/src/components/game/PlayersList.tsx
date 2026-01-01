'use client';

import { GameState } from '@/hooks/useGameWebSocket';
import { MdCheckCircle, MdPerson, MdPlayArrow } from 'react-icons/md';
import styles from './PlayersList.module.css';

interface PlayersListProps {
  players: GameState['players'];
  currentPlayerId: string | null;
  currentTurn: GameState['currentTurn'];
  createdBy: GameState['createdBy'];
  piles: GameState['piles'];
  gameStatus: GameState['status'];
  onSetStartingPlayer?: (playerId: string) => void;
}

// Helper to check if any cards have been played
const hasAnyCardsBeenPlayed = (piles: GameState['piles']): boolean => {
  return (
    piles.ascending1.length > 0 ||
    piles.ascending2.length > 0 ||
    piles.descending1.length > 0 ||
    piles.descending2.length > 0
  );
};

export function PlayersList({ 
  players, 
  currentPlayerId, 
  currentTurn,
  createdBy,
  piles,
  gameStatus,
  onSetStartingPlayer 
}: PlayersListProps) {
  const isGameCreator = currentPlayerId === createdBy;
  const isCurrentTurnPlayer = currentPlayerId === currentTurn;
  // Only allow setting starting player if:
  // 1. User is the game creator OR is the current turn player
  // 2. No cards have been played yet
  // 3. Game is not finished
  const canSetStartingPlayer = (isGameCreator || isCurrentTurnPlayer) && !hasAnyCardsBeenPlayed(piles) && gameStatus !== 'finished';

  return (
    <div className={styles.playersList}>
      <h2 className={styles.title}>
        Jogadores <span className={styles.count}>({players.length})</span>
      </h2>
      <ul className={styles.list}>
        {players.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const isStartingPlayer = player.id === currentTurn;
          // Can set this player if:
          // - User can set starting player (creator or current turn)
          // - This player is not the current turn (can't pass to yourself)
          // - This player is not the current player if current player is the turn (can't pass to yourself)
          const canSetThisPlayer = canSetStartingPlayer && player.id !== currentTurn && player.id !== currentPlayerId;

          return (
            <li 
              key={player.id} 
              className={`${styles.playerItem} ${isCurrentPlayer ? styles.currentPlayer : ''} ${!player.isConnected ? styles.disconnected : ''} ${isStartingPlayer ? styles.startingPlayer : ''}`}
            >
              <div className={styles.playerInfo}>
                <span 
                  className={styles.statusIndicator} 
                  data-connected={player.isConnected}
                  title={player.isConnected ? 'Conectado' : 'Desconectado'}
                >
                  {player.isConnected ? (
                    <MdCheckCircle className={styles.icon} />
                  ) : (
                    <MdPerson className={styles.icon} />
                  )}
                </span>
                <span className={styles.playerName}>
                  {player.name}
                  {isCurrentPlayer && <span className={styles.youBadge}>Você</span>}
                  {isStartingPlayer && <span className={styles.startingBadge}>Começa</span>}
                  {isCurrentTurnPlayer && isStartingPlayer && !hasAnyCardsBeenPlayed(piles) && (
                    <span className={styles.yourTurnBadge}>Sua vez</span>
                  )}
                </span>
                {canSetThisPlayer && onSetStartingPlayer && (
                  <button
                    className={styles.setStartingButton}
                    onClick={() => onSetStartingPlayer(player.id)}
                    title={isGameCreator ? "Definir como jogador inicial" : "Passar a vez para este jogador"}
                  >
                    <MdPlayArrow className={styles.icon} />
                  </button>
                )}
              </div>
              <div className={styles.playerActions}>
                <span className={styles.cardCount}>
                  <span className={styles.cardNumber}>{player.hand.length}</span>
                  <span className={styles.cardLabel}>cartas</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {canSetStartingPlayer && (
        <p className={styles.hint}>
          {isGameCreator 
            ? "Você pode escolher quem começa clicando no ícone ao lado do jogador"
            : "Você pode passar a vez para outro jogador clicando no ícone, ou simplesmente começar jogando"}
        </p>
      )}
    </div>
  );
}

