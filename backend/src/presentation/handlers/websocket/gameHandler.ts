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

  // Handle sync action
  if (action === 'sync') {
    try {
      const syncData = messageBody as { action: 'sync'; gameId?: string };
      const gameIdToSync = syncData.gameId || 'MOCK_GAME';
      
      console.log(`[MOCK] Processing sync request for game ${gameIdToSync}, connection ${connectionId}`);
      
      // MOCK RESPONSE - Simplified mock that doesn't depend on external services
      // Try to get WebSocketService, but don't fail if it doesn't work
      let webSocketService;
      try {
        webSocketService = container.getWebSocketService(event);
        console.log(`[MOCK] WebSocketService obtained successfully`);
      } catch (serviceError) {
        console.error(`[MOCK] Failed to get WebSocketService:`, serviceError);
        // Continue anyway - we'll try to send but won't fail if it doesn't work
      }
      
      // Create mock game state
      const mockGameStateMessage = {
        type: 'gameState',
        game: {
          id: gameIdToSync,
          players: [
            {
              id: 'mock-player-1',
              name: 'Jogador Mock',
              hand: [
                { value: 10, suit: 'hearts' },
                { value: 20, suit: 'clubs' },
                { value: 30, suit: 'diamonds' },
                { value: 40, suit: 'spades' },
                { value: 50, suit: 'hearts' },
                { value: 60, suit: 'clubs' },
              ],
              isConnected: true,
            },
          ],
          piles: {
            ascending1: [],
            ascending2: [],
            descending1: [],
            descending2: [],
          },
          deck: Array.from({ length: 80 }, (_, i) => {
            const suits: readonly string[] = ['hearts', 'clubs', 'diamonds', 'spades'];
            const suitIndex = i % 4;
            return {
              value: i + 1,
              suit: suits[suitIndex] ?? 'hearts',
            };
          }),
          discardPile: [],
          currentTurn: null,
          status: 'waiting' as const,
        },
      };
      
      console.log(`[MOCK] Prepared mock game state message`, {
        gameIdToSync,
        connectionId,
        messageType: mockGameStateMessage.type,
        gameStateGameId: mockGameStateMessage.game.id,
        playersCount: mockGameStateMessage.game.players.length,
      });
      
      // Try to send via WebSocket, but don't fail if it doesn't work
      if (webSocketService) {
        try {
          await webSocketService.sendToConnection(connectionId, mockGameStateMessage);
          console.log(`[MOCK] Sync completed successfully for ${connectionId} - mock message sent via WebSocket`);
        } catch (sendError) {
          console.error(`[MOCK] Failed to send mock game state via WebSocket to ${connectionId}:`, sendError);
          console.error(`[MOCK] Error details:`, {
            errorMessage: sendError instanceof Error ? sendError.message : String(sendError),
            errorName: sendError instanceof Error ? sendError.name : undefined,
            connectionId,
          });
          // Don't throw - just log the error and continue
        }
      } else {
        console.warn(`[MOCK] WebSocketService not available, skipping WebSocket send`);
      }
      
      // Always return success - the mock is working even if WebSocket send fails
      console.log(`[MOCK] Returning success response for sync action`);
      return Promise.resolve({
        statusCode: 200,
      });
    } catch (error) {
      console.error('[MOCK] Unexpected error in sync action:', error);
      console.error('[MOCK] Error details:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
        errorStack: error instanceof Error ? error.stack : undefined,
        connectionId,
      });
      return Promise.resolve({
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Internal server error during sync',
          details: error instanceof Error ? error.message : String(error),
        }),
      });
    }
  }

  try {
    const connectionRepository = container.getConnectionRepository();
    const webSocketService = container.getWebSocketService(event);

    // Get connection info to identify game and player
    const connection = await connectionRepository.findByConnectionId(connectionId);
    if (!connection) {
      return Promise.resolve({
        statusCode: 403,
        body: JSON.stringify({ error: 'Connection not found' }),
      });
    }

    const { gameId, playerId } = connection;

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

