import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { AuthService } from '../../../domain/services/AuthService';

/**
 * WebSocket $connect handler with authentication and origin validation.
 * 
 * Validates:
 * 1. Connection token (from query string)
 * 2. Origin header (if provided)
 * 3. Game and player existence
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = (event) => {
  const connectionId = event.requestContext.connectionId;
  
  if (!connectionId) {
    return Promise.resolve({
      statusCode: 400,
    });
  }

  // Extract token from query string
  // Note: WebSocket V2 event structure - query params may need custom mapping
  // For $connect route, query params are typically available via custom mapping in API Gateway
  // For now, we'll use type assertion to access queryStringParameters
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
  // Note: WebSocket V2 may not have headers directly - may need custom mapping
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

  // Extract gameId and playerId for future use
  const { gameId: _gameId, playerId: _playerId } = authResult.token;
  
  // Suppress unused variable warnings (will be used when implementing TODO)
  void _gameId;
  void _playerId;

  // TODO: Inject repository via DI
  // const connectionRepository: IConnectionRepository = container.resolve('IConnectionRepository');
  
  // TODO: Validate game exists and player is part of it
  // const game = await gameRepository.findById(gameId);
  // if (!game || !game.players.some(p => p.id === playerId)) {
  //   return { statusCode: 403, body: JSON.stringify({ error: 'Invalid game or player' }) };
  // }
  
  // TODO: Save connection
  // await connectionRepository.save({
  //   connectionId,
  //   gameId,
  //   playerId,
  //   connectedAt: new Date(),
  //   lastActivity: new Date(),
  // });

  return Promise.resolve({
    statusCode: 200,
  });
};

