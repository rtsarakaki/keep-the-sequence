import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { container } from '../../../infrastructure/di/container';
import { PlayCardDTO } from '../../../application/dto/PlayCardDTO';
import { JoinGameDTO } from '../../../application/dto/JoinGameDTO';
import { Card } from '../../../domain/valueObjects/Card';
import { formatGameForMessage } from './gameMessageFormatter';
import { areAllHandsEmpty } from '../../../domain/services/GameRules';
import { SetStartingPlayerDTO } from '../../../application/useCases/SetStartingPlayerUseCase';
import { MarkPilePreferenceDTO } from '../../../application/useCases/MarkPilePreferenceUseCase';

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
  const connectionId = event.requestContext.connectionId;

  if (!connectionId) {
    return Promise.resolve({
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing connectionId' }),
    });
  }

  // Parse message body
  if (!event.body) {
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
      try {
        // Get game state using SyncGameUseCase
        const syncGameUseCase = container.getSyncGameUseCase();
        const result = await syncGameUseCase.execute(gameId);

        if (!result.isSuccess) {
          
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
                  .catch(() => {
                    // Silently handle error sending errors
                  })
              );
            } catch {
              // Silently handle WebSocket client creation errors
            }
          }
          
          return Promise.resolve({
            statusCode: 404,
            body: JSON.stringify({ error: result.error }),
          });
        }

        const game = result.value;
        
        // Check if game ended (victory or defeat)
        const gameEnded = game.status === 'finished';
        
        // Convert Game entity to message format
        const gameStateMessage = {
          type: gameEnded ? 'gameFinished' : 'gameState',
          game: formatGameForMessage(game),
          ...(gameEnded && {
            gameId: game.id,
            message: areAllHandsEmpty(game.players) ? 'Vitória!' : 'Derrota!',
            result: areAllHandsEmpty(game.players) ? 'victory' : 'defeat',
          }),
        };
        
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

            // Send asynchronously - start the promise but don't wait for it
            await Promise.resolve(
              client.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: messageString,
              }))
                .catch(() => {
                  // Silently handle send errors
                })
            );
          } catch {
            // Silently handle WebSocket client creation errors
          }
        }
        
        // Return success immediately - don't wait for WebSocket send
        return Promise.resolve({
          statusCode: 200,
        });
      } catch {
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

        // Check if game ended (victory or defeat)
        const gameEnded = result.value.status === 'finished';

        // Broadcast updated game state to all players
        const allConnections = await connectionRepository.findByGameId(gameId);
        const connectionIds = allConnections.map(c => c.connectionId);

        await webSocketService.sendToConnections(connectionIds, {
          type: gameEnded ? 'gameFinished' : 'gameUpdated',
          game: formatGameForMessage(result.value),
          ...(gameEnded && {
            gameId: result.value.id,
            message: areAllHandsEmpty(result.value.players) ? 'Vitória!' : 'Derrota!',
            result: areAllHandsEmpty(result.value.players) ? 'victory' : 'defeat',
          }),
        });

        // Send event to SQS asynchronously (fire-and-forget)
        const sqsEventService = container.getSQSEventService();
        sqsEventService.sendEvent({
          gameId,
          eventType: 'playCard',
          eventData: {
            playerId,
            card: { value: card.value, suit: card.suit },
            pileId: playCardData.pileId,
          },
          timestamp: Date.now(),
        }).catch(() => {
          // Silently handle SQS send errors
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
          game: formatGameForMessage(result.value),
        }).catch(() => {
          // Silently handle notification errors
        });

        // Send event to SQS asynchronously (fire-and-forget)
        const sqsEventService = container.getSQSEventService();
        sqsEventService.sendEvent({
          gameId,
          eventType: 'joinGame',
          eventData: {
            playerId,
            playerName: joinGameData.playerName,
          },
          timestamp: Date.now(),
        }).catch(() => {
          // Silently handle SQS send errors
        });

        return Promise.resolve({
          statusCode: 200,
        });
      }

      case 'endTurn': {
        const endTurnUseCase = container.getEndTurnUseCase();

        const result = await endTurnUseCase.execute({
          gameId,
          playerId,
        });

        if (!result.isSuccess) {
          await webSocketService.sendToConnection(connectionId, {
            type: 'error',
            error: result.error || 'Falha ao passar a vez',
          });
          return Promise.resolve({
            statusCode: 400,
            body: JSON.stringify({ error: result.error }),
          });
        }

        // Check if game ended (victory or defeat)
        const gameEnded = result.value.status === 'finished';

        // Broadcast updated game state to all players
        const allConnections = await connectionRepository.findByGameId(gameId);
        const connectionIds = allConnections.map(c => c.connectionId);

        await webSocketService.sendToConnections(connectionIds, {
          type: gameEnded ? 'gameFinished' : 'gameUpdated',
          game: formatGameForMessage(result.value),
          result: gameEnded ? (areAllHandsEmpty(result.value.players) ? 'victory' : 'defeat') : undefined,
        }).catch(() => {
          // Silently handle notification errors
        });

        // Send event to SQS asynchronously (fire-and-forget)
        const sqsEventService = container.getSQSEventService();
        sqsEventService.sendEvent({
          gameId,
          eventType: 'endTurn',
          eventData: {
            playerId,
            gameEnded,
            result: gameEnded ? (areAllHandsEmpty(result.value.players) ? 'victory' : 'defeat') : undefined,
          },
          timestamp: Date.now(),
        }).catch(() => {
          // Silently handle SQS send errors
        });

        return Promise.resolve({
          statusCode: 200,
        });
      }

      case 'endGame': {
        // IMPORTANT: Get connections BEFORE deleting them (EndGameUseCase deletes connections)
        // We need to get them before calling the use case so we can notify players
        const allConnections = await connectionRepository.findByGameId(gameId);
        const connectionIds = allConnections.map(c => c.connectionId);

        const endGameUseCase = container.getEndGameUseCase();

        const result = await endGameUseCase.execute({
          gameId,
          playerId,
        });

        if (!result.isSuccess) {
          await webSocketService.sendToConnection(connectionId, {
            type: 'error',
            error: result.error || 'Failed to end game',
          });
          return Promise.resolve({
            statusCode: 400,
            body: JSON.stringify({ error: result.error }),
          });
        }

        // Notify all players that the game has ended
        // Note: Connections may have been deleted, but WebSocket connections are still active
        // until the client disconnects, so we can still send messages
        await webSocketService.sendToConnections(connectionIds, {
          type: 'gameEnded',
          gameId,
          message: 'O jogo foi encerrado por um dos jogadores.',
        }).catch(() => {
          // Silently handle notification errors
        });

        // Send event to SQS asynchronously (fire-and-forget)
        const sqsEventService = container.getSQSEventService();
        sqsEventService.sendEvent({
          gameId,
          eventType: 'gameEnded',
          eventData: {
            playerId,
            reason: 'ended_by_player',
          },
          timestamp: Date.now(),
        }).catch(() => {
          // Silently handle SQS send errors
        });

        return Promise.resolve({
          statusCode: 200,
        });
      }

      case 'setStartingPlayer': {
        const setStartingPlayerUseCase = container.getSetStartingPlayerUseCase();
        const setStartingPlayerData = messageBody as {
          action: 'setStartingPlayer';
          startingPlayerId: string;
        };

        const dto: SetStartingPlayerDTO = {
          gameId,
          playerId,
          startingPlayerId: setStartingPlayerData.startingPlayerId,
        };

        const result = await setStartingPlayerUseCase.execute(dto);

        if (!result.isSuccess) {
          await webSocketService.sendToConnection(connectionId, {
            type: 'error',
            error: result.error || 'Failed to set starting player',
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
          game: formatGameForMessage(result.value),
          }).catch(() => {
            // Silently handle notification errors
          });

        return Promise.resolve({
          statusCode: 200,
        });
      }

      case 'markPilePreference': {
        const markPilePreferenceUseCase = container.getMarkPilePreferenceUseCase();
        const markPilePreferenceData = messageBody as {
          action: 'markPilePreference';
          pileId: string | null;
        };

        const dto: MarkPilePreferenceDTO = {
          gameId,
          playerId,
          pileId: markPilePreferenceData.pileId as keyof import('../../../domain/services/GameRules').GamePiles | null,
        };

        const result = await markPilePreferenceUseCase.execute(dto);

        if (!result.isSuccess) {
          await webSocketService.sendToConnection(connectionId, {
            type: 'error',
            error: result.error || 'Falha ao marcar preferência de pilha',
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
          game: formatGameForMessage(result.value),
        }).catch(() => {
          // Silently handle notification errors
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
    return Promise.resolve({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  }
};

