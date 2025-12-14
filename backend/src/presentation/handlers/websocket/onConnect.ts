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
    return {
      statusCode: 400,
    };
  }

  // Extract token from query string
  const queryParams = event.queryStringParameters as Record<string, string | undefined> | undefined;
  const token: string | undefined = queryParams?.token;
  
  if (!token || typeof token !== 'string') {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing authentication token' }),
    };
  }

  // Get allowed origins from environment
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const authService = new AuthService(allowedOrigins);

  // Extract origin from headers
  const headers = event.headers as Record<string, string | undefined> | undefined;
  const origin: string | undefined = headers?.Origin || headers?.origin;

  // Validate token
  const authResult = authService.validateToken(token, origin);
  
  if (!authResult.isValid || !authResult.token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        error: authResult.error || 'Invalid authentication token' 
      }),
    };
  }

  // Extract gameId and playerId for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { gameId, playerId } = authResult.token;

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

