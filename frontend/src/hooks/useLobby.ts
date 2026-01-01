import { useState, useEffect } from 'react';
import { createGame, joinGame, checkApiHealth } from '@/services/api';

export function useLobby() {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check API status on mount
  useEffect(() => {
    checkApiHealth().then((status) => {
      if (!status.configured) {
        setError(
          'API não configurada: Por favor, configure NEXT_PUBLIC_API_URL nas variáveis de ambiente da Vercel.'
        );
      } else if (!status.accessible) {
        // Show detailed error for debugging (will be generic message later)
        const errorMsg = status.error || 'Erro desconhecido';
        const detailsMsg = status.details ? `\n\nDetalhes: ${status.details}` : '';
        setError(`API não acessível: ${errorMsg}${detailsMsg}`);
      }
    });
  }, []);

  const handleCreateGame = async () => {
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setError('Por favor, informe seu nome');
      return;
    }
    if (trimmedName.length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create game via HTTP endpoint
      const result = await createGame(trimmedName);

      // Store player info in sessionStorage for the game page
      sessionStorage.setItem('playerId', result.playerId);
      sessionStorage.setItem('playerName', trimmedName);
      sessionStorage.setItem('gameId', result.gameId);

      // Redirect to game page
      window.location.href = `/game/${result.gameId}?playerId=${result.playerId}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar partida';
      setError(errorMessage);
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!gameId.trim()) {
      setError('Por favor, insira um ID de jogo válido');
      return;
    }

    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setError('Por favor, informe seu nome');
      return;
    }
    if (trimmedName.length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres');
      return;
    }

    try {
      // Join game via HTTP endpoint (backend will generate playerId automatically)
      const result = await joinGame(gameId.trim(), trimmedName);

      // Store player info in sessionStorage for the game page
      sessionStorage.setItem('playerId', result.playerId);
      sessionStorage.setItem('playerName', trimmedName);
      sessionStorage.setItem('gameId', result.gameId);

      // Redirect to game page (will connect via WebSocket there)
      window.location.href = `/game/${result.gameId}?playerId=${result.playerId}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao entrar na partida';
      setError(errorMessage);
    }
  };

  return {
    gameId,
    playerName,
    isCreating,
    error,
    setGameId,
    setPlayerName,
    handleCreateGame,
    handleJoinGame,
  };
}

