import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';
import { CreateGameDTO } from '../../../application/dto/CreateGameDTO';

/**
 * HTTP endpoint to create a new game
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // Handle CORS preflight
  if (event.requestContext.http.method === 'OPTIONS') {
    const origin = event.headers.origin || event.headers.Origin || '*';
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

  const origin = event.headers.origin || event.headers.Origin || '';

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

    const body = JSON.parse(event.body) as { playerName?: string; playerId?: string };
    
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

    // Create game
    const createGameUseCase = container.getCreateGameUseCase();
    const dto: CreateGameDTO = {
      playerName: body.playerName.trim(),
      playerId: body.playerId,
    };

    const result = await createGameUseCase.execute(dto);

    if (!result.isSuccess || !result.value) {
      return Promise.resolve({
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({ error: result.error || 'Failed to create game' }),
      });
    }

    return Promise.resolve({
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
      body: JSON.stringify({
        gameId: result.value.id,
        playerId: result.value.players[0]?.id,
        game: result.value,
      }),
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return Promise.resolve({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  }
};

