import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyWebsocketHandlerV2 = (event) => {
  const connectionId = event.requestContext.connectionId;

  if (!connectionId) {
    return Promise.resolve({
      statusCode: 400,
    });
  }

  // TODO: Implement game action handling
  // Parse action type (playCard, joinGame, etc.)
  // const body = event.body ? JSON.parse(event.body) as unknown : {};
  // Validate action
  // Update game state
  // Broadcast to other players

  return Promise.resolve({
    statusCode: 200,
  });
};

