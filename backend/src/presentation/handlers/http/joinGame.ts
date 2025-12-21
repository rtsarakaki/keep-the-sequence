import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';
import { JoinGameDTO } from '../../../application/dto/JoinGameDTO';
import { formatGameForMessage } from '../websocket/gameMessageFormatter';
import { WebSocketService } from '../../../infrastructure/websocket/WebSocketService';

/**
 * HTTP endpoint to join an existing game
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // Get HTTP method from request context (API Gateway v2 format)
  const httpMethod = event.requestContext?.http?.method || 'POST';
  
  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    const origin = event.headers?.origin || event.headers?.Origin || '*';
    return Promise.resolve({
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Origin',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    });
  }

  const origin = event.headers?.origin || event.headers?.Origin || '';

  try {
    // Parse request body
    if (!event.body) {
      return Promise.resolve({
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({ error: 'Missing request body' }),
      });
    }

    const body = JSON.parse(event.body) as { gameId?: string; playerName?: string; playerId?: string };
    
    if (!body.gameId || typeof body.gameId !== 'string' || !body.gameId.trim()) {
      return Promise.resolve({
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({ error: 'gameId is required' }),
      });
    }

    if (!body.playerName || typeof body.playerName !== 'string' || !body.playerName.trim()) {
      return Promise.resolve({
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({ error: 'playerName is required' }),
      });
    }

    // Join game
    const joinGameUseCase = container.getJoinGameUseCase();
    const dto: JoinGameDTO = {
      gameId: body.gameId.trim(),
      playerName: body.playerName.trim(),
      playerId: body.playerId,
    };

    const result = await joinGameUseCase.execute(dto);

    if (!result.isSuccess) {
      return Promise.resolve({
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({ error: result.error || 'Failed to join game' }),
      });
    }

    // Find the player that was added (case-insensitive name comparison)
    const playerName = body.playerName.trim();
    const player = result.value.players.find(p => 
      p.name.toLowerCase() === playerName.toLowerCase() && 
      (!body.playerId || p.id === body.playerId)
    );

    // Notify all connected players about the game update (e.g., when second player joins and game starts)
    // This is important so the first player sees the game status change from 'waiting' to 'playing'
    try {
      const connectionRepository = container.getConnectionRepository();
      const allConnections = await connectionRepository.findByGameId(result.value.id);
      const connectionIds = allConnections.map(c => c.connectionId);
      
      // Get WebSocket endpoint from environment variable
      const wsEndpoint = process.env.WEBSOCKET_API_URL;
      if (wsEndpoint && connectionIds.length > 0) {
        // Extract endpoint from WebSocket URL (remove wss:// or ws:// prefix and path)
        // WEBSOCKET_API_URL format: wss://xxxxx.execute-api.region.amazonaws.com/stage
        // We need: https://xxxxx.execute-api.region.amazonaws.com/stage
        const endpoint = wsEndpoint.replace(/^wss?:\/\//, 'https://').split('?')[0];
        const webSocketService = new WebSocketService(endpoint);
      
        await webSocketService.sendToConnections(connectionIds, {
          type: 'gameUpdated',
          game: formatGameForMessage(result.value),
        }).catch(() => {
          // Silently handle notification errors
        });
      }
    } catch {
      // Silently handle notification errors - don't fail the HTTP request
    }

    // Send event to SQS asynchronously (fire-and-forget)
    try {
      const sqsEventService = container.getSQSEventService();
      sqsEventService.sendEvent({
        gameId: result.value.id,
        eventType: 'joinGame',
        eventData: {
          playerId: player?.id,
          playerName: body.playerName.trim(),
        },
        timestamp: Date.now(),
      }).catch(() => {
        // Silently handle SQS send errors
      });
    } catch {
      // Silently handle SQS send errors
    }

    return Promise.resolve({
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
      body: JSON.stringify({
        gameId: result.value.id,
        playerId: player?.id,
        game: result.value,
      }),
    });
  } catch (error) {
    return Promise.resolve({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
    });
  }
};

