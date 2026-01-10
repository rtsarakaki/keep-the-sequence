import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';
import { CreateGameDTO } from '../../../application/dto/CreateGameDTO';
import { getClientIp } from '../../utils/getClientIp';

/**
 * HTTP endpoint to create a new game
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

    const body = JSON.parse(event.body) as { playerName?: string; playerId?: string; difficulty?: 'easy' | 'hard' };
    
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

    const trimmedPlayerName = body.playerName.trim();
    if (trimmedPlayerName.length < 3) {
      return Promise.resolve({
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({ error: 'O nome do jogador deve ter pelo menos 3 caracteres' }),
      });
    }

    // Validate difficulty if provided
    if (body.difficulty && body.difficulty !== 'easy' && body.difficulty !== 'hard') {
      return Promise.resolve({
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({ error: 'difficulty must be "easy" or "hard"' }),
      });
    }

    // Create game
    const createGameUseCase = container.getCreateGameUseCase();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const clientIp: string | undefined = getClientIp(event);
    const dto: CreateGameDTO = {
      playerName: trimmedPlayerName,
      playerId: body.playerId,
      clientIp,
      difficulty: body.difficulty || 'easy',
    };

    const result = await createGameUseCase.execute(dto);

    if (!result.isSuccess) {
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

