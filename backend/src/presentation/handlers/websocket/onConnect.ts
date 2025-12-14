import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { AuthService } from '../../../domain/services/AuthService';
import { container } from '../../../infrastructure/di/container';

/**
 * WebSocket $connect handler with authentication and origin validation.
 * 
 * Validates:
 * 1. Connection token (from query string)
 * 2. Origin header (if provided)
 * 3. Game and player existence
 * 4. Saves connection to DynamoDB
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  if (!connectionId) {
    return Promise.resolve({
      statusCode: 400,
    });
  }

  // Extract token from query string
  const eventWithQuery = event as unknown as { queryStringParameters?: Record<string, string | undefined> };
  const queryParams = eventWithQuery.queryStringParameters;
  const token: string | undefined = queryParams?.token;
  
  if (!token || typeof token !== 'string') {
    return Promise.resolve({
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing authentication token' }),
    });
  }

  // Get allowed origins from environment
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const authService = new AuthService(allowedOrigins);

  // Extract origin from headers
  const eventWithHeaders = event as unknown as { headers?: Record<string, string | undefined> };
  const headers = eventWithHeaders.headers;
  const origin: string | undefined = headers?.Origin || headers?.origin;

  // Validate token
  const authResult = authService.validateToken(token, origin);
  
  if (!authResult.isValid || !authResult.token) {
    return Promise.resolve({
      statusCode: 401,
      body: JSON.stringify({ 
        error: authResult.error || 'Invalid authentication token' 
      }),
    });
  }

  const { gameId, playerId } = authResult.token;

  try {
    // Get repositories from container
    const gameRepository = container.getGameRepository();
    const connectionRepository = container.getConnectionRepository();

    // Validate game exists and player is part of it
    const game = await gameRepository.findById(gameId);
    if (!game) {
      return Promise.resolve({
        statusCode: 403,
        body: JSON.stringify({ error: 'Game not found' }),
      });
    }

    const playerExists = game.players.some(p => p.id === playerId);
    if (!playerExists) {
      return Promise.resolve({
        statusCode: 403,
        body: JSON.stringify({ error: 'Player is not part of this game' }),
      });
    }

    // Save connection with TTL (24 hours)
    // DynamoDB will automatically delete disconnected connections after 24h
    const now = new Date();
    await connectionRepository.save({
      connectionId,
      gameId,
      playerId,
      connectedAt: now,
      lastActivity: now,
      ttl: Math.floor(now.getTime() / 1000) + (24 * 60 * 60), // 24 hours
    });

    // Send initial game state to the newly connected player
    const webSocketService = container.getWebSocketService(event);
    await webSocketService.sendToConnection(connectionId, {
      type: 'gameState',
      game: game,
    });

    return Promise.resolve({
      statusCode: 200,
    });
  } catch (error) {
    console.error('Error in onConnect handler:', error);
    return Promise.resolve({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  }
};

