import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  if (!connectionId) {
    return {
      statusCode: 400,
    };
  }

  // TODO: Inject repository via DI
  // const connectionRepository: IConnectionRepository = container.resolve('IConnectionRepository');
  
  // TODO: Delete connection
  // await connectionRepository.delete(connectionId);

  return {
    statusCode: 200,
  };
};

