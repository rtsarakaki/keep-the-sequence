/**
 * API Service for HTTP endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Get the API base URL
 * @throws Error if NEXT_PUBLIC_API_URL is not configured
 */
export function getApiUrl(): string {
  if (!API_URL) {
    throw new Error(
      'API URL não configurada. Por favor, configure NEXT_PUBLIC_API_URL nas variáveis de ambiente da Vercel.'
    );
  }
  return API_URL;
}

/**
 * Get WebSocket URL with authentication token
 * 
 * Can use either playerId or playerName (playerName will be resolved to playerId)
 */
export async function getWebSocketUrl(
  gameId: string,
  playerIdOrName: string,
  options?: { useName?: boolean }
): Promise<{ wsUrl: string; expiresIn: number }> {
  try {
    const apiUrl = getApiUrl();
    const params = new URLSearchParams({
      gameId,
    });
    
    // Use playerName if specified, otherwise use playerId
    if (options?.useName) {
      params.append('playerName', playerIdOrName);
    } else {
      params.append('playerId', playerIdOrName);
    }
    
    const response = await fetch(
      `${apiUrl}/api/websocket-url?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Erro ao obter URL do WebSocket: ${response.status}`;
      let errorDetails: string | undefined;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
        errorDetails = errorData.details;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      // Provide more context for common errors
      if (response.status === 403 && errorMessage.includes('Player not found')) {
        errorMessage = `Jogador não encontrado no jogo. Verifique se o playerId/nome está correto.`;
      } else if (response.status === 404 && errorMessage.includes('Game not found')) {
        errorMessage = `Jogo não encontrado. Verifique se o ID do jogo está correto.`;
      } else if (response.status === 500 && errorMessage.includes('Error validating')) {
        errorMessage = `Erro ao validar jogo e jogador. ${errorDetails ? `Detalhes: ${errorDetails}` : 'Verifique se o jogo existe e se você faz parte dele.'}`;
      }

      const fullError = new Error(errorMessage) as Error & { status?: number; details?: string };
      fullError.status = response.status;
      fullError.details = errorDetails;
      throw fullError;
    }

    const data = await response.json();
    
    if (!data.wsUrl) {
      throw new Error('Resposta inválida: wsUrl não encontrada');
    }

    return {
      wsUrl: data.wsUrl,
      expiresIn: data.expiresIn || 1800,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('API URL não configurada')) {
      throw error; // Re-throw configuration errors as-is
    }
    
    // Network or API errors
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao conectar com a API';
    throw new Error(`Não foi possível conectar com o servidor: ${message}`);
  }
}

/**
 * Create a new game
 */
export async function createGame(playerName: string, playerId?: string): Promise<{ gameId: string; playerId: string; game: unknown }> {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName,
        playerId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Erro ao criar partida (Status ${response.status})`;
      let errorDetails: string | undefined;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData.error || errorData.message;
      } catch {
        errorDetails = errorText || `Status ${response.status}: ${response.statusText}`;
        errorMessage = `${errorMessage}: ${errorDetails}`;
      }

      const fullError = errorDetails ? `${errorMessage}\n\nDetalhes: ${errorDetails}` : errorMessage;
      throw new Error(fullError);
    }

    const data = await response.json();
    
    if (!data.gameId || !data.playerId) {
      throw new Error('Resposta inválida: gameId ou playerId não encontrados');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('API URL não configurada')) {
      throw error; // Re-throw configuration errors as-is
    }
    
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao criar partida';
    throw new Error(`Não foi possível criar a partida: ${message}`);
  }
}

/**
 * Join an existing game
 */
export async function joinGame(
  gameId: string,
  playerName: string,
  playerId?: string
): Promise<{ gameId: string; playerId: string; game: unknown }> {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/games/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        gameId,
        playerName,
        playerId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Erro ao entrar na partida (Status ${response.status})`;
      let errorDetails: string | undefined;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData.error || errorData.message;
      } catch {
        errorDetails = errorText || `Status ${response.status}: ${response.statusText}`;
        errorMessage = `${errorMessage}: ${errorDetails}`;
      }

      const fullError = errorDetails ? `${errorMessage}\n\nDetalhes: ${errorDetails}` : errorMessage;
      throw new Error(fullError);
    }

    const data = await response.json();
    
    if (!data.gameId || !data.playerId) {
      throw new Error('Resposta inválida: gameId ou playerId não encontrados');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('API URL não configurada')) {
      throw error; // Re-throw configuration errors as-is
    }
    
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao entrar na partida';
    throw new Error(`Não foi possível entrar na partida: ${message}`);
  }
}

/**
 * Check if API is configured and accessible
 */
export async function checkApiHealth(): Promise<{ configured: boolean; accessible: boolean; error?: string; details?: string }> {
  if (!API_URL) {
    return {
      configured: false,
      accessible: false,
      error: 'NEXT_PUBLIC_API_URL não está configurada nas variáveis de ambiente da Vercel.',
    };
  }

  try {
    // Try to call the health check endpoint to verify API is accessible
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to detect connection issues faster
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
      // Add credentials to handle CORS properly
      mode: 'cors',
      credentials: 'omit',
    });

    let errorDetails: string | undefined;
    if (!response.ok) {
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || `Status ${response.status}: ${response.statusText}`;
      } catch {
        errorDetails = `Status ${response.status}: ${response.statusText}`;
      }
    }

    return {
      configured: true,
      accessible: response.ok,
      error: response.ok ? undefined : `API retornou erro: ${errorDetails || `status ${response.status}`}`,
      details: errorDetails,
    };
  } catch (error) {
    let errorMessage = 'Erro desconhecido ao conectar com a API';
    let errorDetails: string | undefined;
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // This usually means CORS or network issue
      errorMessage = 'Falha ao conectar com a API. Possíveis causas:\n';
      errorMessage += '1. CORS não configurado no backend\n';
      errorMessage += '2. URL da API incorreta\n';
      errorMessage += '3. Backend não está deployado ou não está acessível\n';
      errorMessage += `\nURL testada: ${API_URL}/api/websocket-url`;
      errorDetails = 'Failed to fetch - Verifique CORS e se o backend está acessível';
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.message;
      
      // Check for timeout
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = 'Timeout ao conectar com a API (mais de 10 segundos)';
        errorDetails = 'Timeout';
      }
    }

    return {
      configured: true,
      accessible: false,
      error: `Erro de conexão: ${errorMessage}`,
      details: errorDetails,
    };
  }
}

