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
  // Get HTTP method from request context (API Gateway v2 format)
  const httpMethod = event.requestContext?.http?.method || 'GET';
  
  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    const origin = event.headers?.origin || event.headers?.Origin || '*';
    return Promise.resolve({
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Origin',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    });
  }

  // Get WebSocket URL from environment (set by CDK/Serverless)
  const wsUrl = process.env.WEBSOCKET_API_URL;
  
  if (!wsUrl) {
    return Promise.resolve({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'WebSocket URL not configured' }),
    });
  }

  // Get allowed origins from environment
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const authService = new AuthService(allowedOrigins);

  // Extract parameters from query string or body
  const queryParams = event.queryStringParameters || {};
  let gameId: string | undefined = queryParams.gameId;
  let playerId: string | undefined = queryParams.playerId;
  let playerName: string | undefined = queryParams.playerName;
  
  if (event.body) {
    try {
      const body = JSON.parse(event.body) as { gameId?: string; playerId?: string; playerName?: string };
      gameId = gameId || body.gameId;
      playerId = playerId || body.playerId;
      playerName = playerName || body.playerName;
    } catch {
      // Invalid JSON, will be caught by validation below
    }
  }
  
  const origin = event.headers?.origin || event.headers?.Origin || '';

  // Validate required parameters
  if (!gameId) {
    return Promise.resolve({
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
      body: JSON.stringify({
        error: 'Missing required parameter: gameId',
      }),
    });
  }

  // If playerId not provided, try to find by playerName
  if (!playerId && playerName) {
    try {
      const { container } = await import('../../../infrastructure/di/container');
      const gameRepository = container.getGameRepository();
      const game = await gameRepository.findById(gameId);
      
      if (!game) {
        return Promise.resolve({
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
          },
          body: JSON.stringify({
            error: 'Game not found',
          }),
        });
      }

      // Case-insensitive name comparison
      const normalizedPlayerName = playerName.trim().toLowerCase();
      const player = game.players.find(p => p.name.toLowerCase() === normalizedPlayerName);
      if (!player) {
        return Promise.resolve({
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
          },
          body: JSON.stringify({
            error: `Player "${playerName}" not found in this game`,
          }),
        });
      }

      playerId = player.id;
    } catch (error) {
      console.error('Error finding player by name:', error);
      return Promise.resolve({
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({
          error: 'Error finding player',
        }),
      });
    }
  }

  // Final validation: need either playerId or playerName
  if (!playerId) {
    return Promise.resolve({
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
      body: JSON.stringify({
        error: 'Missing required parameter: playerId or playerName',
      }),
    });
  }

  // Validate gameId and playerId exist in the game
  try {
    console.log('Validating game and player:', { gameId, playerId, playerName });
    
    const { container } = await import('../../../infrastructure/di/container');
    const gameRepository = container.getGameRepository();
    
    console.log('Game repository obtained, fetching game...');
    const game = await gameRepository.findById(gameId);
    
    if (!game) {
      console.log('Game not found:', gameId);
      return Promise.resolve({
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({
          error: 'Game not found',
        }),
      });
    }

    console.log('Game found, players:', game.players.map(p => ({ id: p.id, name: p.name })));

    // Validate playerId exists in the game
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      console.log('Player not found in game:', { playerId, availablePlayers: game.players.map(p => p.id) });
      
      // If playerName was provided, try to find by name
      if (playerName) {
        const normalizedPlayerName = playerName.trim().toLowerCase();
        const playerByName = game.players.find(p => p.name.toLowerCase() === normalizedPlayerName);
        
        if (playerByName) {
          console.log('Player found by name, using their ID:', playerByName.id);
          playerId = playerByName.id;
        } else {
          return Promise.resolve({
            statusCode: 403,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin || '*',
            },
            body: JSON.stringify({
              error: `Player "${playerName}" not found in this game. Available players: ${game.players.map(p => p.name).join(', ')}`,
            }),
          });
        }
      } else {
        return Promise.resolve({
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
          },
          body: JSON.stringify({
            error: `Player ID "${playerId}" not found in this game. Available player IDs: ${game.players.map(p => p.id).join(', ')}`,
          }),
        });
      }
    }
    
    console.log('Validation successful, player found:', { playerId, playerName: player?.name });
    
    // Ensure playerId is set (may have been updated if found by name)
    if (!playerId) {
      throw new Error('playerId is required but was not found or set');
    }
  } catch (error) {
    console.error('Error validating game and player:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && error.stack ? error.stack : String(error);
    
    // Log full error details for debugging
    console.error('Error details:', {
      gameId,
      playerId,
      playerName,
      errorMessage,
      errorDetails,
    });
    
    // Always return error details in production for debugging
    return Promise.resolve({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
      body: JSON.stringify({
        error: 'Error validating game and player',
        message: errorMessage,
        gameId,
        playerId,
        playerName,
      }),
    });
  }

  // Create connection token (valid for 30 minutes)
  const token = authService.createToken(gameId, playerId, origin, 30);

  // Return WebSocket URL with token
  const wsUrlWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;

  return Promise.resolve({
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
  });
};

