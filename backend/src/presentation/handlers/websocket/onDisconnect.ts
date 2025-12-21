import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';
import { formatGameForMessage } from './gameMessageFormatter';

/**
 * WebSocket $disconnect handler.
 * 
 * Cleans up the connection when a player disconnects:
 * 1. Gets connection info before deleting
 * 2. Updates player status in game (isConnected: false)
 * 3. Removes connection from DynamoDB
 * 4. Notifies other players about the disconnection
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
    
    // Get connection info before deleting
    const connection = await connectionRepository.findByConnectionId(connectionId);
    
    if (!connection) {
      return Promise.resolve({
        statusCode: 200,
      });
    }

    const { gameId, playerId } = connection;

    // Update player status in game (isConnected: false)
    const gameRepository = container.getGameRepository();
    const game = await gameRepository.findById(gameId);
    
    if (game) {
      // Check if player exists in game
      const player = game.players.find(p => p.id === playerId);
      
      if (player && player.isConnected) {
        // Update player connection status
        const updatedGame = game.updatePlayer(playerId, (p) =>
          p.updateConnectionStatus(false)
        );
        
        // Save updated game
        await gameRepository.save(updatedGame);
        
        // Send event to SQS asynchronously (fire-and-forget)
        const sqsEventService = container.getSQSEventService();
        sqsEventService.sendEvent({
          gameId,
          eventType: 'playerDisconnected',
          eventData: {
            playerId,
            playerName: player.name,
          },
          timestamp: Date.now(),
        }).catch(() => {
          // Silently handle SQS send errors
        });
        
        // Get all other connections for this game to notify them
        const allConnections = await connectionRepository.findByGameId(gameId);
        const otherConnections = allConnections.filter(c => c.connectionId !== connectionId);
        
        if (otherConnections.length > 0) {
          // Prepare game state message with updated player status
          const gameStateMessage = {
            type: 'gameUpdated',
            game: formatGameForMessage(updatedGame),
          };
          
          // Notify other players asynchronously (don't block disconnect)
          const webSocketService = container.getWebSocketService(event);
          const connectionIds = otherConnections.map(c => c.connectionId);
          
          webSocketService.sendToConnections(connectionIds, gameStateMessage)
            .catch(() => {
              // Silently handle notification errors
            });
        }
      }
    }
    
    // Delete connection (do this last, after we've used the connection info)
    await connectionRepository.delete(connectionId);

    return Promise.resolve({
      statusCode: 200,
    });
  } catch {
    // Don't fail the disconnect - connection is already closed
    // Return 200 to avoid API Gateway retrying
    return Promise.resolve({
      statusCode: 200,
    });
  }
};

