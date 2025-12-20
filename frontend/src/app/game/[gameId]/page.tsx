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

  const handleEndGame = () => {
    if (wsStatus !== 'connected' || !playerId) {
      return;
    }

    if (!confirm('Tem certeza que deseja encerrar o jogo? Todos os jogadores serão desconectados.')) {
      return;
    }

    sendMessage({
      action: 'endGame',
    });
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
      ) : (
        <>
          <GameBoard 
            piles={gameState.piles} 
            onCardDrop={(cardIndex, pileId) => handlePlayCard(cardIndex, pileId)}
            isDroppable={wsStatus === 'connected' && gameState.status === 'playing'}
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

      <div className={styles.endGameSection}>
        <button
          onClick={handleEndGame}
          className={styles.endGameButton}
          disabled={wsStatus !== 'connected' || !playerId}
        >
          Encerrar Jogo
        </button>
      </div>
    </main>
  );
}
