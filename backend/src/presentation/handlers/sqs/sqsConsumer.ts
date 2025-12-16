import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GameEventType } from '../../../infrastructure/sqs/SQSEventService';

/**
 * SQS Consumer handler for processing game events asynchronously.
 * 
 * Processes events from the game-events queue:
 * 1. Saves events to DynamoDB (game-events table) for history/analytics
 * 2. Handles critical events (game ended, player disconnected, etc.)
 * 3. Sends to analytics (future enhancement)
 */
export const handler: SQSHandler = async (event: SQSEvent) => {
  const tableName = process.env.GAME_EVENTS_TABLE || 'the-game-backend-game-events-dev';
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
  );

  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body) as unknown;
      
      // Validate event structure
      if (!messageBody || typeof messageBody !== 'object') {
        console.error('Invalid event structure:', messageBody);
        continue; // Skip invalid events, don't throw to avoid DLQ
      }

      const eventData = messageBody as {
        gameId?: string;
        eventType?: GameEventType;
        eventData?: {
          playerId?: string;
          playerName?: string;
          card?: { value: number; suit: string };
          pileId?: string;
          [key: string]: unknown;
        };
        timestamp?: number;
      };

      // Validate required fields
      if (!eventData.gameId || !eventData.eventType) {
        console.warn('Event missing required fields (gameId or eventType):', eventData);
        continue; // Skip invalid events
      }

      const timestamp = eventData.timestamp || Date.now();
      
      // Save to game-events table
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            gameId: eventData.gameId,
            timestamp,
            eventType: eventData.eventType,
            eventData: eventData.eventData || {},
            processedAt: Date.now(),
            ttl: Math.floor(timestamp / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
          },
        })
      );

      console.log(`Saved event: ${eventData.eventType} for game ${eventData.gameId}`);

      // Handle critical events
      handleCriticalEvent(eventData.gameId, eventData.eventType as GameEventType, eventData.eventData);
      
    } catch (error) {
      console.error('Error processing SQS message:', error);
      console.error('Error details:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - let the message be retried or sent to DLQ by SQS
      // Throwing would cause the entire batch to fail
    }
  }
  
  return Promise.resolve();
};

/**
 * Handles critical game events that require special processing.
 */
function handleCriticalEvent(
  gameId: string,
  eventType: GameEventType,
  eventData?: {
    playerId?: string;
    playerName?: string;
    [key: string]: unknown;
  }
): void {
  try {
    switch (eventType) {
      case 'playerDisconnected': {
        // Player disconnected - could trigger game abandonment logic
        // For now, just log it
        console.log(`Critical event: Player ${eventData?.playerId} disconnected from game ${gameId}`);
        // Future: Check if all players disconnected, mark game as abandoned
        // Future: Notify remaining players
        break;
      }

      case 'gameEnded': {
        // Game ended - could trigger cleanup or analytics
        console.log(`Critical event: Game ${gameId} ended`);
        // Future: Calculate final statistics
        // Future: Send to analytics service
        break;
      }

      case 'playCard': {
        // Card played - could check for win/loss conditions
        // This is handled in the PlayCardUseCase, but we could add analytics here
        console.log(`Event: Card played in game ${gameId} by player ${eventData?.playerId}`);
        // Future: Check if game should end (all cards played or no valid moves)
        break;
      }

      case 'joinGame': {
        // Player joined - could check if game should start
        console.log(`Event: Player ${eventData?.playerId} joined game ${gameId}`);
        // Future: Auto-start game when minimum players reached
        break;
      }

      default:
        // Other events don't require special handling
        break;
    }
  } catch (error) {
    // Log error but don't throw - critical event handling should not block event saving
    console.error('Error handling critical event:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      gameId,
      eventType,
    });
  }
}

