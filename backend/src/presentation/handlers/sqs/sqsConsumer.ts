import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

/**
 * SQS Consumer handler for processing game events asynchronously.
 * 
 * Processes events from the game-events queue:
 * 1. Saves events to DynamoDB (game-events table) for history/analytics
 * 2. Handles critical events (future enhancement)
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
        eventType?: string;
        eventData?: unknown;
        timestamp?: number;
      };

      // Save to game-events table
      if (eventData.gameId && eventData.eventType) {
        const timestamp = eventData.timestamp || Date.now();
        
        await client.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              gameId: eventData.gameId,
              timestamp,
              eventType: eventData.eventType,
              eventData: eventData.eventData || {},
              processedAt: Date.now(),
            },
          })
        );

        console.log(`Saved event: ${eventData.eventType} for game ${eventData.gameId}`);
      } else {
        console.warn('Event missing required fields (gameId or eventType):', eventData);
      }

      // TODO: Handle critical events (e.g., game ended, player left)
      // TODO: Send to analytics service
      
    } catch (error) {
      console.error('Error processing SQS message:', error);
      // Don't throw - let the message be retried or sent to DLQ by SQS
      // Throwing would cause the entire batch to fail
    }
  }
  
  return Promise.resolve();
};

