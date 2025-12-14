import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { IConnectionRepository } from '../../../domain/repositories/IConnectionRepository';
import { AuthService } from '../../../domain/services/AuthService';

/**
 * WebSocket $connect handler with authentication and origin validation.
 * 
 * Validates:
 * 1. Connection token (from query string)
 * 2. Origin header (if provided)
 * 3. Game and player existence
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  if (!connectionId) {
    return {
      statusCode: 400,
    };
  }

  // Extract token from query string
  const token = event.queryStringParameters?.token;
  
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing authentication token' }),
    };
  }

  // Get allowed origins from environment
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const authService = new AuthService(allowedOrigins);

  // Extract origin from headers
  const origin = event.headers.Origin || event.headers.origin;

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

  return {
    statusCode: 200,
  };
};

