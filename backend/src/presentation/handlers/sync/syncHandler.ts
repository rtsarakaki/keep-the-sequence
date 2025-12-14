import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyWebsocketHandlerV2 = (event) => {
  const connectionId = event.requestContext.connectionId;
  
  // Extract gameId from routeKey or custom mapping
  // Note: WebSocket V2 may need custom route parameter extraction
  const eventWithQuery = event as unknown as { queryStringParameters?: Record<string, string | undefined> };
  const queryParams = eventWithQuery.queryStringParameters;
  const gameId: string | undefined = queryParams?.gameId;

  if (!connectionId) {
    return Promise.resolve({
      statusCode: 400,
    });
  }

  if (!gameId) {
    return Promise.resolve({
      statusCode: 400,
    });
  }

  // TODO: Inject repository via DI
  // const gameRepository: IGameRepository = container.resolve('IGameRepository');
  
  // TODO: Fetch game state
  // const game = await gameRepository.findById(gameId);
  
  // TODO: Send game state to connection
  // await webSocketService.sendToConnection(connectionId, game);

  return Promise.resolve({
    statusCode: 200,
  });
};

