import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';
import { formatGameForMessage } from '../websocket/gameMessageFormatter';
import { areAllHandsEmpty } from '../../../domain/services/GameRules';

/**
 * WebSocket sync handler.
 * 
 * Synchronizes game state for a reconnecting player:
 * 1. Fetches current game state
 * 2. Sends game state to the connection via WebSocket
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  // Extract gameId from query parameters
  const eventWithQuery = event as unknown as { queryStringParameters?: Record<string, string | undefined> };
  const queryParams = eventWithQuery.queryStringParameters;
  const gameId: string | undefined = queryParams?.gameId;

  if (!connectionId) {
    return Promise.resolve({
      statusCode: 400,
    });
  }

  if (!gameId) {
    return Promise.resolve({
      statusCode: 400,
      body: JSON.stringify({ error: 'gameId is required' }),
    });
  }

  try {
    const syncGameUseCase = container.getSyncGameUseCase();
    const webSocketService = container.getWebSocketService(event);

    // Fetch game state
    const result = await syncGameUseCase.execute(gameId);

    if (!result.isSuccess) {
      return Promise.resolve({
        statusCode: 404,
        body: JSON.stringify({ error: result.error || 'Game not found' }),
      });
    }

    const game = result.value;
    
    // Check if game ended (victory or defeat)
    const gameEnded = game.status === 'finished';
    
    // Convert Game entity to message format using formatGameForMessage
    const gameStateMessage = {
      type: gameEnded ? 'gameFinished' : 'gameState',
      game: formatGameForMessage(game),
      ...(gameEnded && {
        gameId: game.id,
        message: areAllHandsEmpty(game.players) ? 'Vitória!' : 'Derrota!',
        result: areAllHandsEmpty(game.players) ? 'victory' : 'defeat',
      }),
    };

    // Send game state to connection
    await webSocketService.sendToConnection(connectionId, gameStateMessage);

    return Promise.resolve({
      statusCode: 200,
    });
  } catch (error) {
    console.error('Error in syncHandler:', error);
    return Promise.resolve({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  }
};

