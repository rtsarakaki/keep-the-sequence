import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { IConnectionRepository } from '../../../domain/repositories/IConnectionRepository';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  if (!connectionId) {
    return {
      statusCode: 400,
    };
  }

  // TODO: Extract playerId from query string or headers
  const playerId = event.queryStringParameters?.playerId || 'unknown';
  const gameId = event.queryStringParameters?.gameId || 'unknown';

  // TODO: Inject repository via DI
  // const connectionRepository: IConnectionRepository = container.resolve('IConnectionRepository');
  
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

