import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';

/**
 * WebSocket $disconnect handler.
 * 
 * Cleans up the connection when a player disconnects:
 * 1. Removes connection from DynamoDB
 * 2. Optionally updates player status in game (future enhancement)
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  if (!connectionId) {
    return Promise.resolve({
      statusCode: 400,
    });
  }

  try {
    const connectionRepository = container.getConnectionRepository();
    
    // Get connection info before deleting (for potential future use)
    const connection = await connectionRepository.findByConnectionId(connectionId);
    void connection; // Suppress unused variable warning (will be used in future enhancements)
    
    // Delete connection
    await connectionRepository.delete(connectionId);

    // TODO: Optionally update player status in game
    // if (connection) {
    //   const gameRepository = container.getGameRepository();
    //   const game = await gameRepository.findById(connection.gameId);
    //   if (game) {
    //     // Update player isConnected status
    //     // This could be done asynchronously via SQS
    //   }
    // }

    return Promise.resolve({
      statusCode: 200,
    });
  } catch (error) {
    console.error('Error in onDisconnect handler:', error);
    // Don't fail the disconnect - connection is already closed
    return Promise.resolve({
      statusCode: 200,
    });
  }
};

