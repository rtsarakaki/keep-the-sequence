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
    console.log(`[MOCK] Sync action detected, starting mock response`);
    
    try {
      const syncData = messageBody as { action: 'sync'; gameId?: string };
      const gameIdToSync = syncData.gameId || 'MOCK_GAME';
      
      console.log(`[MOCK] Processing sync request`, {
        gameIdToSync,
        connectionId,
        hasDomainName: !!event.requestContext.domainName,
        hasStage: !!event.requestContext.stage,
        domainName: event.requestContext.domainName,
        stage: event.requestContext.stage,
      });
      
      // Create mock game state (simple, no external dependencies)
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
      
      console.log(`[MOCK] Mock game state created successfully`);
      
      // Try to send via WebSocket (non-blocking - won't fail if it doesn't work)
      // Check if we have the required context first
      const hasWebSocketContext = event.requestContext.domainName && event.requestContext.stage;
      
      if (hasWebSocketContext) {
        try {
          console.log(`[MOCK] Attempting to get WebSocketService...`);
          const webSocketService = container.getWebSocketService(event);
          console.log(`[MOCK] WebSocketService obtained, attempting to send message...`);
          
          // Send asynchronously - don't wait for it
          webSocketService.sendToConnection(connectionId, mockGameStateMessage)
            .then(() => {
              console.log(`[MOCK] Mock message sent successfully to ${connectionId}`);
            })
            .catch((sendError) => {
              console.error(`[MOCK] Failed to send mock message (non-blocking):`, {
                errorMessage: sendError instanceof Error ? sendError.message : String(sendError),
                connectionId,
              });
            });
        } catch (serviceError) {
          console.error(`[MOCK] Failed to create WebSocketService (non-blocking):`, {
            errorMessage: serviceError instanceof Error ? serviceError.message : String(serviceError),
            connectionId,
          });
          // Continue - this is not a fatal error for the mock
        }
      } else {
        console.warn(`[MOCK] WebSocket context incomplete, skipping WebSocket send`, {
          hasDomainName: !!event.requestContext.domainName,
          hasStage: !!event.requestContext.stage,
        });
      }
      
      // Always return success immediately - don't wait for WebSocket send
      console.log(`[MOCK] Returning success response immediately`);
      return Promise.resolve({
        statusCode: 200,
      });
    } catch (error) {
      // This should never happen, but just in case
      console.error('[MOCK] CRITICAL: Unexpected error in sync action:', error);
      console.error('[MOCK] Error details:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
        errorStack: error instanceof Error ? error.stack : undefined,
        connectionId,
        eventContext: {
          domainName: event.requestContext.domainName,
          stage: event.requestContext.stage,
          routeKey: event.requestContext.routeKey,
        },
      });
      
      // Even on error, return success for mock
      return Promise.resolve({
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Mock sync completed (with errors logged)',
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

