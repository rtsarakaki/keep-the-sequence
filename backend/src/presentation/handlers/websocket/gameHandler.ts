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

  // Handle sync action
  if (action === 'sync') {
    const syncData = messageBody as { action: 'sync'; gameId?: string };
    const gameId = syncData.gameId;
    
    if (!gameId) {
      // Try to get gameId from connection
      const connectionRepository = container.getConnectionRepository();
      const connection = await connectionRepository.findByConnectionId(connectionId);
      
      if (!connection) {
        return Promise.resolve({
          statusCode: 400,
          body: JSON.stringify({ error: 'Connection not found. Please reconnect.' }),
        });
      }
      
      const syncGameUseCase = container.getSyncGameUseCase();
      const webSocketService = container.getWebSocketService(event);
      
      const result = await syncGameUseCase.execute(connection.gameId);
      
      if (!result.isSuccess) {
        return Promise.resolve({
          statusCode: 404,
          body: JSON.stringify({ error: result.error || 'Game not found' }),
        });
      }
      
      // Serialize game state properly
      const game = result.value;
      await webSocketService.sendToConnection(connectionId, {
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
        },
      });
      
      return Promise.resolve({
        statusCode: 200,
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

