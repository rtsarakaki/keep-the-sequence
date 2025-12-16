import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';

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
    console.warn('onDisconnect: Missing connectionId');
    return Promise.resolve({
      statusCode: 400,
    });
  }

  try {
    const connectionRepository = container.getConnectionRepository();
    
    // Get connection info before deleting
    const connection = await connectionRepository.findByConnectionId(connectionId);
    
    if (!connection) {
      console.warn(`onDisconnect: Connection ${connectionId} not found, skipping cleanup`);
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
        
        console.log(`Player ${playerId} disconnected from game ${gameId}`);
        
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
        }).catch((error) => {
          console.error('Failed to send playerDisconnected event to SQS (non-blocking):', {
            errorMessage: error instanceof Error ? error.message : String(error),
            gameId,
            playerId,
          });
        });
        
        // Get all other connections for this game to notify them
        const allConnections = await connectionRepository.findByGameId(gameId);
        const otherConnections = allConnections.filter(c => c.connectionId !== connectionId);
        
        if (otherConnections.length > 0) {
          // Prepare game state message with updated player status
          const gameStateMessage = {
            type: 'gameUpdated',
            game: {
              id: updatedGame.id,
              players: updatedGame.players.map(p => ({
                id: p.id,
                name: p.name,
                hand: p.hand.map(c => ({ value: c.value, suit: c.suit })),
                isConnected: p.isConnected,
              })),
              piles: {
                ascending1: updatedGame.piles.ascending1.map(c => ({ value: c.value, suit: c.suit })),
                ascending2: updatedGame.piles.ascending2.map(c => ({ value: c.value, suit: c.suit })),
                descending1: updatedGame.piles.descending1.map(c => ({ value: c.value, suit: c.suit })),
                descending2: updatedGame.piles.descending2.map(c => ({ value: c.value, suit: c.suit })),
              },
              deck: updatedGame.deck.map(c => ({ value: c.value, suit: c.suit })),
              discardPile: updatedGame.discardPile.map(c => ({ value: c.value, suit: c.suit })),
              currentTurn: updatedGame.currentTurn,
              status: updatedGame.status,
              createdAt: updatedGame.createdAt.toISOString(),
              updatedAt: updatedGame.updatedAt.toISOString(),
            },
          };
          
          // Notify other players asynchronously (don't block disconnect)
          const webSocketService = container.getWebSocketService(event);
          const connectionIds = otherConnections.map(c => c.connectionId);
          
          webSocketService.sendToConnections(connectionIds, gameStateMessage)
            .then(() => {
              console.log(`Notified ${connectionIds.length} players about disconnection of ${playerId}`);
            })
            .catch((error) => {
              console.error('Failed to notify other players about disconnection:', {
                errorMessage: error instanceof Error ? error.message : String(error),
                gameId,
                playerId,
              });
            });
        }
      }
    }
    
    // Delete connection (do this last, after we've used the connection info)
    await connectionRepository.delete(connectionId);
    console.log(`Connection ${connectionId} removed from database`);

    return Promise.resolve({
      statusCode: 200,
    });
  } catch (error) {
    console.error('Error in onDisconnect handler:', error);
    console.error('Error details:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : undefined,
      errorStack: error instanceof Error ? error.stack : undefined,
      connectionId,
    });
    // Don't fail the disconnect - connection is already closed
    // Return 200 to avoid API Gateway retrying
    return Promise.resolve({
      statusCode: 200,
    });
  }
};

