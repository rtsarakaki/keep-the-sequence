'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { GameError } from '@/components/game/GameError';
import { GameLoading } from '@/components/game/GameLoading';
import { GameBoard } from '@/components/game/GameBoard';
import { GameHeader } from '@/components/game/GameHeader';
import { PlayersList } from '@/components/game/PlayersList';
import { PlayerHand } from '@/components/game/PlayerHand';
import { WaitingForPlayers } from '@/components/game/WaitingForPlayers';
import styles from './page.module.css';

export default function GamePage({ params }: { params: { gameId: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerId = searchParams.get('playerId');
  const playerName = typeof window !== 'undefined' ? sessionStorage.getItem('playerName') : null;

  const handleGameEnded = () => {
    // Redirect to home page when game is ended
    router.push('/');
  };

  const { gameState, wsStatus, error, retryCount, isRetrying, retry, sendMessage } = useGameWebSocket({
    gameId: params.gameId,
    playerId: playerId || undefined,
    playerName: playerName || undefined,
    onGameEnded: handleGameEnded,
  });

  const handlePlayCard = (cardIndex: number, pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2') => {
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

  const handleEndGame = () => {
    console.log('handleEndGame chamado', { wsStatus, playerId, gameId: params.gameId });
    
    if (wsStatus !== 'connected' || !playerId) {
      console.warn('Não é possível encerrar o jogo:', { wsStatus, playerId });
      alert(`Não é possível encerrar o jogo. Status: ${wsStatus}, Player ID: ${playerId || 'não encontrado'}`);
      return;
    }

    if (!confirm('Tem certeza que deseja encerrar o jogo? Todos os jogadores serão desconectados.')) {
      console.log('Usuário cancelou o encerramento do jogo');
      return;
    }

    console.log('Enviando mensagem endGame...', { gameId: params.gameId, playerId });
    try {
      sendMessage({
        action: 'endGame',
      });
      console.log('Mensagem endGame enviada com sucesso');
    } catch (error) {
      console.error('Erro ao enviar mensagem endGame:', error);
      alert(`Erro ao encerrar o jogo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleDebugTest = async (testType: 'check-game' | 'reconnect-playerId' | 'reconnect-playerName' | 'get-token') => {
    if (!params.gameId) return;

    try {
      switch (testType) {
        case 'check-game': {
          // Try to get WebSocket URL to check if game/player exists
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) {
            alert('API URL não configurada');
            return;
          }

          const testPlayerId = playerId || 'test';
          const response = await fetch(
            `${apiUrl}/api/websocket-url?gameId=${params.gameId}&playerId=${testPlayerId}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              mode: 'cors',
            }
          );

          const data = await response.json();
          if (response.ok) {
            alert(`✅ Jogo existe!\n\nGame ID: ${params.gameId}\nPlayer ID: ${testPlayerId}\nToken gerado com sucesso.`);
          } else {
            alert(`❌ Erro: ${data.error || 'Erro desconhecido'}\n\nStatus: ${response.status}`);
          }
          break;
        }

        case 'reconnect-playerId': {
          if (!playerId) {
            alert('Player ID não disponível');
            return;
          }
          retry();
          break;
        }

        case 'reconnect-playerName': {
          if (!playerName) {
            alert('Nome do jogador não disponível');
            return;
          }
          retry();
          break;
        }

        case 'get-token': {
          const { getApiUrl } = await import('@/services/api');
          let apiUrl: string;
          try {
            apiUrl = getApiUrl();
          } catch (err) {
            alert(`API URL não configurada: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
            return;
          }

          const testPlayerId = playerId || playerName || 'test';
          const useName = !playerId && !!playerName;
          const param = useName ? 'playerName' : 'playerId';
          
          const response = await fetch(
            `${apiUrl}/api/websocket-url?gameId=${params.gameId}&${param}=${encodeURIComponent(testPlayerId)}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              mode: 'cors',
            }
          );

          const data = await response.json();
          if (response.ok) {
            console.log('Token URL:', data.wsUrl);
            alert(`✅ Token obtido com sucesso!\n\nURL: ${data.wsUrl.substring(0, 100)}...\n\nVerifique o console para URL completa.\n\nGame ID: ${params.gameId}\n${param}: ${testPlayerId}`);
          } else {
            alert(`❌ Erro ao obter token: ${data.error || 'Erro desconhecido'}\n\nStatus: ${response.status}\n\nGame ID: ${params.gameId}\n${param}: ${testPlayerId}`);
          }
          break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      alert(`❌ Erro no teste: ${errorMessage}`);
      console.error('Debug test error:', err);
    }
  };

  if (error) {
    return (
      <GameError
        error={error}
        playerId={playerId}
        playerName={playerName}
        onDebugTest={handleDebugTest}
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
      <GameHeader
        wsStatus={wsStatus}
        gameStatus={gameState.status}
        currentTurn={gameState.currentTurn}
        players={gameState.players}
        gameId={params.gameId}
      />

      {isWaitingForPlayers ? (
        <WaitingForPlayers gameState={gameState} currentPlayerId={playerId} />
      ) : isGameFinished ? (
        <div className={styles.gameFinished}>
          <h2>Jogo Finalizado</h2>
          <p>
            {gameState.players.every(p => p.hand.length === 0)
              ? 'Vitória! Todos os jogadores descartaram suas cartas!'
              : 'Derrota! Um jogador não conseguiu jogar o número mínimo de cartas.'}
          </p>
        </div>
      ) : (
        <>
          {isMyTurn && (
            <div className={styles.turnInfo}>
              <p>
                Sua vez! Você deve jogar pelo menos <strong>{minimumCards} carta{minimumCards > 1 ? 's' : ''}</strong>.
                Cartas jogadas nesta vez: <strong>{gameState.cardsPlayedThisTurn}</strong>
              </p>
            </div>
          )}
          
          <GameBoard 
            piles={gameState.piles} 
            onCardDrop={(cardIndex, pileId) => handlePlayCard(cardIndex, pileId)}
            isDroppable={wsStatus === 'connected' && isMyTurn}
          />

          {currentPlayer && (
            <PlayerHand
              player={currentPlayer}
              wsStatus={wsStatus}
              onPlayCard={handlePlayCard}
            />
          )}
        </>
      )}

      <PlayersList players={gameState.players} currentPlayerId={playerId} />

      {!isGameFinished && (
        <div className={styles.turnActions}>
          {isMyTurn && (
            <button
              onClick={handleEndTurn}
              className={styles.endTurnButton}
              disabled={!canEndTurn || wsStatus !== 'connected'}
            >
              {canEndTurn ? 'Passar a Vez' : `Jogue pelo menos ${minimumCards} carta${minimumCards > 1 ? 's' : ''} primeiro`}
            </button>
          )}
        </div>
      )}

      {isGameCreator && (
        <div className={styles.endGameSection}>
          <button
            onClick={handleEndGame}
            className={styles.endGameButton}
            disabled={wsStatus !== 'connected' || !playerId}
          >
            Encerrar Jogo
          </button>
        </div>
      )}
    </main>
  );
}
