'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { useConfirmCardPlay } from '@/hooks/useConfirmCardPlay';
import { ConfirmCardPlayModal } from '@/components/game/ConfirmCardPlayModal';
import { GameError } from '@/components/game/GameError';
import { GameLoading } from '@/components/game/GameLoading';
import { GameBoard } from '@/components/game/GameBoard';
import { GameHeader } from '@/components/game/GameHeader';
import { PlayersList } from '@/components/game/PlayersList';
import { PlayerHand } from '@/components/game/PlayerHand';
import { WaitingForPlayers } from '@/components/game/WaitingForPlayers';
import { JoinGameForm } from '@/components/game/JoinGameForm';
import { GameNotification } from '@/components/game/GameNotification';
import { MdEmojiEvents, MdSentimentDissatisfied } from 'react-icons/md';
import styles from './page.module.css';

export default function GamePage({ params }: { params: { gameId: string } }) {
  const [confirmCardPlay, setConfirmCardPlay] = useConfirmCardPlay();
  const [pendingPlay, setPendingPlay] = useState<{ cardIndex: number; pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2' } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerId = searchParams.get('playerId');
  const playerName = typeof window !== 'undefined' ? sessionStorage.getItem('playerName') : null;

  const handleGameEnded = () => {
    // Redirect to home page when game is ended
    router.push('/');
  };

  const { gameState, wsStatus, error, gameError, retryCount, isRetrying, retry, sendMessage, clearGameError, disconnect } = useGameWebSocket({
    gameId: params.gameId,
    playerId: playerId || undefined,
    playerName: playerName || undefined,
    onGameEnded: handleGameEnded,
  });

  const handlePlayCardDirect = (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => {
    if (wsStatus !== 'connected') {
      return;
    }

    if (!gameState || !playerId) {
      return;
    }

    // Check if game is in playing status
    if (gameState.status !== 'playing') {
      // Show a user-friendly message
      alert('O jogo ainda não começou. Aguarde mais jogadores entrarem (mínimo 2 jogadores).');
      return;
    }

    // Find current player
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer || cardIndex >= currentPlayer.hand.length) {
      return;
    }

    const card = currentPlayer.hand[cardIndex];

    // Send play card action
    sendMessage({
      action: 'playCard',
      card: {
        value: card.value,
        suit: card.suit,
      },
      pileId,
    });
  };

  const handlePlayCard = (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => {
    if (confirmCardPlay) {
      // Show confirmation modal
      setPendingPlay({ cardIndex, pileId });
    } else {
      // Play directly without confirmation
      handlePlayCardDirect(cardIndex, pileId);
    }
  };

  const handleConfirmPlay = () => {
    if (pendingPlay) {
      handlePlayCardDirect(pendingPlay.cardIndex, pendingPlay.pileId);
      setPendingPlay(null);
    }
  };

  const handleCancelPlay = () => {
    setPendingPlay(null);
  };

  const getPileName = (pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2'): string => {
    const names: Record<string, string> = {
      ascending1: 'Pilha Crescente 1 (C1)',
      ascending2: 'Pilha Crescente 2 (C2)',
      descending1: 'Pilha Decrescente 1 (D1)',
      descending2: 'Pilha Decrescente 2 (D2)',
    };
    return names[pileId] || pileId;
  };

  const handleEndTurn = () => {
    if (wsStatus !== 'connected' || !playerId || !gameState) {
      return;
    }

      // Check if it's the player's vez
      if (gameState.currentTurn !== playerId) {
        alert('Não é sua vez!');
        return;
      }

    // Check if game is in playing status
    if (gameState.status !== 'playing') {
      return;
    }

    const minimumCards = gameState.deck.length > 0 ? 2 : 1;
    
    // Validate player has played minimum cards
    if (gameState.cardsPlayedThisTurn < minimumCards) {
          alert(`Você deve jogar pelo menos ${minimumCards} carta${minimumCards > 1 ? 's' : ''} antes de passar a vez.`);
      return;
    }

    sendMessage({
      action: 'endTurn',
    });
  };

  const handleMarkPreference = (pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2' | null) => {
    if (wsStatus !== 'connected' || !playerId || !gameState) {
      return;
    }

    // Check if game is in playing status
    if (gameState.status !== 'playing') {
      return;
    }

    sendMessage({
      action: 'markPilePreference',
      pileId,
    });
  };

  const handleSetStartingPlayer = (startingPlayerId: string) => {
    if (wsStatus !== 'connected' || !playerId) {
      return;
    }

    if (!gameState) {
      return;
    }

    // Check if any cards have been played
    // Piles start with initial cards (1 for ascending, 100 for descending)
    // So we check if length > 1 (meaning a card was played in addition to the initial card)
    const hasCardsBeenPlayed = 
      gameState.piles.ascending1.length > 1 ||
      gameState.piles.ascending2.length > 1 ||
      gameState.piles.descending1.length > 1 ||
      gameState.piles.descending2.length > 1;

    if (hasCardsBeenPlayed) {
      // This should not happen as the button should be hidden, but just in case
      return;
    }

    sendMessage({
      action: 'setStartingPlayer',
      startingPlayerId,
    });
  };

  const handleEndGame = () => {
    if (wsStatus !== 'connected' || !playerId) {
      alert('Não é possível encerrar o jogo. Verifique sua conexão.');
      return;
    }

    if (!confirm('Tem certeza que deseja encerrar o jogo? Todos os jogadores serão desconectados.')) {
      return;
    }

    try {
      sendMessage({
        action: 'endGame',
      });
    } catch (error) {
      alert(`Erro ao encerrar o jogo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleRestartGame = () => {
    if (wsStatus !== 'connected' || !playerId) {
      return;
    }

    if (!gameState) {
      return;
    }

    // Send restart game action
    sendMessage({
      action: 'restartGame',
    });
  };

  const handleLeaveGame = () => {
    if (confirm('Tem certeza que deseja sair do jogo?')) {
      disconnect();
      router.push('/');
    }
  };

  // If no playerId, show join form
  if (!playerId) {
    return <JoinGameForm gameId={params.gameId} />;
  }

  if (error) {
    return (
      <GameError
        error={error}
        onRetry={retry}
      />
    );
  }

  if (!gameState) {
    return (
      <GameLoading
        wsStatus={wsStatus}
        retryCount={retryCount}
        isRetrying={isRetrying}
        onRetry={retry}
      />
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isWaitingForPlayers = gameState.status === 'waiting';
  const isGameFinished = gameState.status === 'finished';
  const isMyTurn = gameState.currentTurn === playerId && gameState.status === 'playing';
  const minimumCards = gameState.deck.length > 0 ? 2 : 1;
  const canEndTurn = isMyTurn && gameState.cardsPlayedThisTurn >= minimumCards;
  const isGameCreator = gameState.createdBy === playerId; // Check if current player is the game creator

  return (
    <main className={styles.container}>
      {gameError && (
        <GameNotification
          message={gameError}
          type="error"
          duration={5000}
          onDismiss={clearGameError}
        />
      )}
      <GameHeader
        wsStatus={wsStatus}
        gameStatus={gameState.status}
        currentTurn={gameState.currentTurn}
        players={gameState.players}
        gameId={params.gameId}
        currentPlayerId={playerId}
        cardsPlayedThisTurn={gameState.cardsPlayedThisTurn}
        isGameCreator={isGameCreator}
        onEndGame={handleEndGame}
        onLeaveGame={handleLeaveGame}
      />

      {isWaitingForPlayers ? (
        <WaitingForPlayers gameState={gameState} />
      ) : (
        <>
          {isGameFinished && (
            <div className={styles.gameFinished}>
              <h2 className={gameState.players.every(p => p.hand.length === 0) ? styles.victory : styles.defeat}>
                {gameState.players.every(p => p.hand.length === 0) ? (
                  <>
                    <MdEmojiEvents className={styles.resultIcon} />
                    Vitória!
                  </>
                ) : (
                  <>
                    <MdSentimentDissatisfied className={styles.resultIcon} />
                    Derrota!
                  </>
                )}
              </h2>
              <p>
                {gameState.players.every(p => p.hand.length === 0)
                  ? 'Parabéns! Todos os jogadores descartaram suas cartas!'
                  : 'Um jogador não conseguiu jogar o número mínimo de cartas necessárias.'}
              </p>
              <p className={styles.gameFinishedHint}>
                O jogo permanece visível para análise. Você pode revisar as cartas jogadas e entender o que aconteceu.
              </p>
              <button
                onClick={handleRestartGame}
                className={styles.restartButton}
                disabled={wsStatus !== 'connected'}
                title="Jogar Novamente"
              >
                <span className={styles.restartButtonIcon}>🔄</span>
                Jogar Novamente
              </button>
            </div>
          )}
          
          <div className={isGameFinished ? styles.gameFinishedContainer : undefined}>
            <GameBoard 
              piles={gameState.piles}
              deckLength={gameState.deck.length}
              onCardDrop={isGameFinished ? undefined : (cardIndex, pileId) => handlePlayCard(cardIndex, pileId)}
              isDroppable={!isGameFinished && wsStatus === 'connected' && isMyTurn}
              currentPlayerId={playerId}
              currentTurn={gameState.currentTurn}
              pilePreferences={gameState.pilePreferences}
              players={gameState.players}
              onMarkPreference={isGameFinished ? undefined : handleMarkPreference}
            />

            {currentPlayer && (
              <PlayerHand
                player={currentPlayer}
                wsStatus={isGameFinished ? 'disconnected' : wsStatus}
                onPlayCard={isGameFinished ? () => {} : handlePlayCard}
                isMyTurn={!isGameFinished && isMyTurn}
                cardsPlayedThisTurn={gameState.cardsPlayedThisTurn}
                minimumCards={minimumCards}
                onEndTurn={isGameFinished ? undefined : handleEndTurn}
                canEndTurn={!isGameFinished && canEndTurn}
                confirmCardPlay={confirmCardPlay}
                setConfirmCardPlay={setConfirmCardPlay}
              />
            )}
          </div>
        </>
      )}

      <PlayersList 
        players={gameState.players} 
        currentPlayerId={playerId}
        currentTurn={gameState.currentTurn}
        createdBy={gameState.createdBy}
        piles={gameState.piles}
        gameStatus={gameState.status}
        onSetStartingPlayer={handleSetStartingPlayer}
      />
      
      {pendingPlay && gameState && playerId && (
        (() => {
          const currentPlayer = gameState.players.find(p => p.id === playerId);
          const card = currentPlayer?.hand[pendingPlay.cardIndex];
          return card ? (
            <ConfirmCardPlayModal
              isOpen={true}
              card={card}
              pileName={getPileName(pendingPlay.pileId)}
              onConfirm={handleConfirmPlay}
              onCancel={handleCancelPlay}
            />
          ) : null;
        })()
      )}
    </main>
  );
}
