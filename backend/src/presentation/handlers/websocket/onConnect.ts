import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { AuthService } from '../../../domain/services/AuthService';
import { container } from '../../../infrastructure/di/container';
import { formatGameForMessage } from './gameMessageFormatter';

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
    console.error('Invalid token', {
      connectionId,
      error: authResult.error,
      hasToken: !!token,
      origin,
    });
    return Promise.resolve({
      statusCode: 401,
      body: JSON.stringify({ 
        error: authResult.error || 'Invalid authentication token',
        code: 'INVALID_TOKEN',
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
      console.error(`Game not found: ${gameId}`, {
        gameId,
        playerId,
        connectionId,
      });
      return Promise.resolve({
        statusCode: 403,
        body: JSON.stringify({ 
          error: `Game "${gameId}" not found. The game may have been deleted or expired.`,
          code: 'GAME_NOT_FOUND',
        }),
      });
    }

    const playerExists = game.players.some(p => p.id === playerId);
    if (!playerExists) {
      console.error(`Player not in game: ${playerId}`, {
        gameId,
        playerId,
        connectionId,
        gamePlayers: game.players.map(p => ({ id: p.id, name: p.name })),
      });
      return Promise.resolve({
        statusCode: 403,
        body: JSON.stringify({ 
          error: `Player "${playerId}" is not part of game "${gameId}". You may need to join the game first.`,
          code: 'PLAYER_NOT_IN_GAME',
        }),
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

    // Return 200 immediately to establish connection
    // API Gateway will close connection with code 1006 if we don't return 200 quickly
    console.log(`Connection established successfully: ${connectionId} for game ${gameId}, player ${playerId}`);
    
    // Prepare game state message
    const gameStateMessage = {
      type: 'gameState',
      game: formatGameForMessage(game),
    };
    
    console.log(`Preparing to send game state to ${connectionId}:`, JSON.stringify(gameStateMessage, null, 2));
    
    // Send initial game state asynchronously (don't await - connection is already established)
    // Serialize Game entity properly (convert Date objects to ISO strings)
    const webSocketService = container.getWebSocketService(event);
    webSocketService.sendToConnection(connectionId, gameStateMessage)
      .then(() => {
        console.log(`Successfully sent game state to ${connectionId}`);
      })
      .catch((sendError) => {
        // Log error but don't fail the connection - player can request sync later
        console.error(`Failed to send initial game state to ${connectionId}:`, sendError);
        console.error('Error details:', {
          errorMessage: sendError instanceof Error ? sendError.message : String(sendError),
          errorStack: sendError instanceof Error ? sendError.stack : undefined,
          connectionId,
          gameId,
          playerId,
        });
      });

    return Promise.resolve({
      statusCode: 200,
    });
  } catch (error) {
    console.error('Error in onConnect handler:', error, {
      connectionId,
      gameId: authResult.token?.gameId,
      playerId: authResult.token?.playerId,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return 403 instead of 500 to provide better error message
    // API Gateway will close the connection with code 1006 if we return non-200
    return Promise.resolve({
      statusCode: 403,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CONNECTION_FAILED',
      }),
    });
  }
};

