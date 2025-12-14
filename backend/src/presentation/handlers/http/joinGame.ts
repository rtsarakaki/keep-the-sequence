import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';
import { JoinGameDTO } from '../../../application/dto/JoinGameDTO';

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

    // Find the player that was added
    const playerName = body.playerName.trim();
    const player = result.value.players.find(p => 
      p.name === playerName && 
      (!body.playerId || p.id === body.playerId)
    );

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
    console.error('Error in joinGame handler:', error);
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

