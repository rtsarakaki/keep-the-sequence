import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';

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

    // Send game state to connection
    await webSocketService.sendToConnection(connectionId, {
      type: 'gameState',
      game: result.value,
    });

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

