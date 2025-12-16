import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';
import { PlayCardDTO } from '../../../application/dto/PlayCardDTO';
import { JoinGameDTO } from '../../../application/dto/JoinGameDTO';
import { Card } from '../../../domain/valueObjects/Card';

/**
 * WebSocket game handler for processing game actions.
 * 
 * Supported actions:
 * - playCard: Play a card on a pile
 * - joinGame: Join an existing game (via WebSocket)
 * 
 * After processing, broadcasts the result to all connected players.
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  console.log('gameHandler invoked', {
    connectionId: event.requestContext.connectionId,
    routeKey: event.requestContext.routeKey,
    hasBody: !!event.body,
    bodyLength: event.body?.length || 0,
    bodyPreview: event.body?.substring(0, 200) || 'no body',
  });

  const connectionId = event.requestContext.connectionId;

  if (!connectionId) {
    console.error('Missing connectionId in gameHandler');
    return Promise.resolve({
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing connectionId' }),
    });
  }

  // Parse message body
  if (!event.body) {
    console.error('Missing message body in gameHandler', {
      connectionId,
      routeKey: event.requestContext.routeKey,
    });
    return Promise.resolve({
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing message body' }),
    });
  }

  let messageBody: unknown;
  try {
    messageBody = JSON.parse(event.body) as unknown;
  } catch (error) {
    return Promise.resolve({
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in message body' }),
    });
  }

  // Validate message structure
  if (!messageBody || typeof messageBody !== 'object' || !('action' in messageBody)) {
    return Promise.resolve({
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing action field' }),
    });
  }

  const action = (messageBody as { action: string }).action;
  console.log(`Processing action: ${action}`, {
    connectionId,
    action,
    hasGameId: 'gameId' in messageBody,
  });

  try {
    const connectionRepository = container.getConnectionRepository();

    // Get connection info to identify game and player
    const connection = await connectionRepository.findByConnectionId(connectionId);
    if (!connection) {
      return Promise.resolve({
        statusCode: 403,
        body: JSON.stringify({ error: 'Connection not found' }),
      });
    }

    const { gameId, playerId } = connection;

    // Handle sync action
    if (action === 'sync') {
      console.log(`Sync action detected for game ${gameId}, player ${playerId}`);
      
      try {
        // Get game state using SyncGameUseCase
        const syncGameUseCase = container.getSyncGameUseCase();
        const result = await syncGameUseCase.execute(gameId);

        if (!result.isSuccess) {
          console.error(`Failed to sync game ${gameId}:`, result.error);
          
          // Send error to the player
          const domainName = event.requestContext.domainName;
          const stage = event.requestContext.stage;
          
          if (domainName && stage) {
            try {
              const { ApiGatewayManagementApiClient, PostToConnectionCommand } = await import('@aws-sdk/client-apigatewaymanagementapi');
              const client = new ApiGatewayManagementApiClient({
                endpoint: `https://${domainName}/${stage}`,
                region: process.env.AWS_REGION || 'us-east-1',
              });

              await Promise.resolve(
                client.send(new PostToConnectionCommand({
                  ConnectionId: connectionId,
                  Data: JSON.stringify({
                    type: 'error',
                    error: result.error || 'Failed to sync game',
                  }),
                }))
                  .catch((error) => {
                    console.error(`Failed to send error message (non-blocking):`, {
                      errorMessage: error instanceof Error ? error.message : String(error),
                      connectionId,
                    });
                  })
              );
            } catch (error) {
              console.error(`Failed to create WebSocket client for error:`, {
                errorMessage: error instanceof Error ? error.message : String(error),
                connectionId,
              });
            }
          }
          
          return Promise.resolve({
            statusCode: 404,
            body: JSON.stringify({ error: result.error }),
          });
        }

        const game = result.value;
        
        // Convert Game entity to message format (same pattern as onConnect)
        const gameStateMessage = {
          type: 'gameState',
          game: {
            id: game.id,
            players: game.players.map(p => ({
              id: p.id,
              name: p.name,
              hand: p.hand.map(c => ({ value: c.value, suit: c.suit })),
              isConnected: p.isConnected,
            })),
            piles: {
              ascending1: game.piles.ascending1.map(c => ({ value: c.value, suit: c.suit })),
              ascending2: game.piles.ascending2.map(c => ({ value: c.value, suit: c.suit })),
              descending1: game.piles.descending1.map(c => ({ value: c.value, suit: c.suit })),
              descending2: game.piles.descending2.map(c => ({ value: c.value, suit: c.suit })),
            },
            deck: game.deck.map(c => ({ value: c.value, suit: c.suit })),
            discardPile: game.discardPile.map(c => ({ value: c.value, suit: c.suit })),
            currentTurn: game.currentTurn,
            status: game.status,
            createdAt: game.createdAt.toISOString(),
            updatedAt: game.updatedAt.toISOString(),
          },
        };
        
        console.log(`Preparing to send game state to ${connectionId} for game ${gameId}`);
        
        // Send game state via WebSocket (non-blocking - same pattern as testHandler)
        const domainName = event.requestContext.domainName;
        const stage = event.requestContext.stage;
        
        if (domainName && stage) {
          try {
            const endpoint = `https://${domainName}/${stage}`;
            const { ApiGatewayManagementApiClient, PostToConnectionCommand } = await import('@aws-sdk/client-apigatewaymanagementapi');
            const client = new ApiGatewayManagementApiClient({
              endpoint,
              region: process.env.AWS_REGION || 'us-east-1',
            });

            const messageString = JSON.stringify(gameStateMessage);
            console.log(`Sending game state (non-blocking):`, messageString.substring(0, 100));

            // Send asynchronously - start the promise but don't wait for it
            await Promise.resolve(
              client.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: messageString,
              }))
                .then(() => {
                  console.log(`Game state sent successfully to ${connectionId}`);
                })
                .catch((error) => {
                  console.error(`Failed to send game state (non-blocking):`, {
                    errorMessage: error instanceof Error ? error.message : String(error),
                    connectionId,
                  });
                })
            );
          } catch (error) {
            console.error(`Failed to create WebSocket client:`, {
              errorMessage: error instanceof Error ? error.message : String(error),
              connectionId,
              domainName,
              stage,
            });
          }
        } else {
          console.warn(`Missing domainName or stage, skipping WebSocket send`, {
            domainName: !!domainName,
            stage: !!stage,
          });
        }
        
        // Return success immediately - don't wait for WebSocket send
        return Promise.resolve({
          statusCode: 200,
        });
      } catch (error) {
        console.error('Unexpected error in sync action:', error);
        console.error('Error details:', {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : undefined,
          errorStack: error instanceof Error ? error.stack : undefined,
          connectionId,
          gameId,
        });
        
        return Promise.resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Internal server error during sync' }),
        });
      }
    }

    // For other actions, use WebSocketService from container
    const webSocketService = container.getWebSocketService(event);

    // Route to appropriate handler based on action
    switch (action) {
      case 'playCard': {
        const playCardUseCase = container.getPlayCardUseCase();
        const playCardData = messageBody as {
          action: 'playCard';
          card: { value: number; suit: string };
          pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2';
        };

        const card = new Card(playCardData.card.value, playCardData.card.suit);
        const dto: PlayCardDTO = {
          gameId,
          playerId,
          card,
          pileId: playCardData.pileId,
        };

        const result = await playCardUseCase.execute(dto);

        if (!result.isSuccess) {
          // Send error to the player who made the action
          await webSocketService.sendToConnection(connectionId, {
            type: 'error',
            error: result.error || 'Failed to play card',
          });
          return Promise.resolve({
            statusCode: 400,
            body: JSON.stringify({ error: result.error }),
          });
        }

        // Broadcast updated game state to all players
        const allConnections = await connectionRepository.findByGameId(gameId);
        const connectionIds = allConnections.map(c => c.connectionId);

        await webSocketService.sendToConnections(connectionIds, {
          type: 'gameUpdated',
          game: result.value,
        });

        return Promise.resolve({
          statusCode: 200,
        });
      }

      case 'joinGame': {
        const joinGameUseCase = container.getJoinGameUseCase();
        const joinGameData = messageBody as {
          action: 'joinGame';
          playerName: string;
        };

        const dto: JoinGameDTO = {
          gameId,
          playerId, // Use connection's playerId
          playerName: joinGameData.playerName,
        };

        const result = await joinGameUseCase.execute(dto);

        if (!result.isSuccess) {
          await webSocketService.sendToConnection(connectionId, {
            type: 'error',
            error: result.error || 'Failed to join game',
          });
          return Promise.resolve({
            statusCode: 400,
            body: JSON.stringify({ error: result.error }),
          });
        }

        // Broadcast updated game state to all players
        const allConnections = await connectionRepository.findByGameId(gameId);
        const connectionIds = allConnections.map(c => c.connectionId);

        await webSocketService.sendToConnections(connectionIds, {
          type: 'gameUpdated',
          game: result.value,
        });

        return Promise.resolve({
          statusCode: 200,
        });
      }

      default:
        return Promise.resolve({
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown action: ${action}` }),
        });
    }
  } catch (error) {
    console.error('Error in gameHandler:', error);
    return Promise.resolve({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  }
};

