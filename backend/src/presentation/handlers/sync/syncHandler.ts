import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const gameId = event.queryStringParameters?.gameId;

  if (!connectionId) {
    return {
      statusCode: 400,
    };
  }

  if (!gameId) {
    return {
      statusCode: 400,
    };
  }

  // TODO: Inject repository via DI
  // const gameRepository: IGameRepository = container.resolve('IGameRepository');
  
  // TODO: Fetch game state
  // const game = await gameRepository.findById(gameId);
  
  // TODO: Send game state to connection
  // await webSocketService.sendToConnection(connectionId, game);

  return {
    statusCode: 200,
  };
};

