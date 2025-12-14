import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthService } from '../../../domain/services/AuthService';

/**
 * HTTP endpoint to get WebSocket URL with authentication token.
 * 
 * This endpoint:
 * 1. Validates the request (gameId, playerId, origin)
 * 2. Creates a temporary connection token
 * 3. Returns the WebSocket URL with the token
 * 
 * This prevents exposing the WebSocket URL directly and adds authentication.
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // Handle CORS preflight
  if (event.requestContext.http.method === 'OPTIONS') {
    const origin = event.headers.origin || event.headers.Origin || '*';
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Origin',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Get WebSocket URL from environment (set by CDK/Serverless)
  const wsUrl = process.env.WEBSOCKET_API_URL;
  
  if (!wsUrl) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'WebSocket URL not configured' }),
    };
  }

  // Get allowed origins from environment
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const authService = new AuthService(allowedOrigins);

  // Extract parameters from query string or body
  const gameId = event.queryStringParameters?.gameId || 
                 (event.body ? JSON.parse(event.body).gameId : undefined);
  const playerId = event.queryStringParameters?.playerId || 
                   (event.body ? JSON.parse(event.body).playerId : undefined);
  const origin = event.headers.origin || event.headers.Origin || '';

  // Validate required parameters
  if (!gameId || !playerId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
      body: JSON.stringify({
        error: 'Missing required parameters: gameId and playerId',
      }),
    };
  }

  // TODO: Validate gameId and playerId exist in the game
  // This should check DynamoDB to ensure the game exists and player is valid
  // For now, we'll trust the parameters

  // Create connection token (valid for 30 minutes)
  const token = authService.createToken(gameId, playerId, origin, 30);

  // Return WebSocket URL with token
  const wsUrlWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin',
    },
    body: JSON.stringify({
      wsUrl: wsUrlWithToken,
      expiresIn: 1800, // 30 minutes in seconds
    }),
  };
};

