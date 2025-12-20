import { SQSClient, SendMessageCommand, GetQueueUrlCommand } from '@aws-sdk/client-sqs';

export type GameEventType = 'playCard' | 'joinGame' | 'playerDisconnected' | 'gameCreated' | 'gameEnded' | 'endTurn';

export interface GameEvent {
  gameId: string;
  eventType: GameEventType;
  eventData: {
    playerId?: string;
    playerName?: string;
    card?: { value: number; suit: string };
    pileId?: string;
    [key: string]: unknown;
  };
  timestamp: number;
}

/**
 * Service for sending game events to SQS queue.
 * 
 * Events are sent asynchronously and don't block the main flow.
 * Failures are logged but don't throw errors.
 */
export class SQSEventService {
  private readonly client: SQSClient;
  private readonly queueName: string;
  private queueUrl: string | null = null;

  constructor(queueUrl?: string) {
    this.client = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    if (queueUrl) {
      this.queueUrl = queueUrl;
      this.queueName = ''; // Not needed if URL is provided
    } else {
      this.queueName = process.env.GAME_EVENTS_QUEUE || 'the-game-backend-game-events-dev';
    }
  }

  /**
   * Gets the queue URL, caching it after first call.
   */
  private async getQueueUrl(): Promise<string> {
    if (this.queueUrl) {
      return this.queueUrl;
    }

    try {
      const command = new GetQueueUrlCommand({
        QueueName: this.queueName,
      });
      
      const response = await this.client.send(command);
      
      if (!response.QueueUrl) {
        throw new Error(`Queue URL not found for queue: ${this.queueName}`);
      }
      
      this.queueUrl = response.QueueUrl;
      return this.queueUrl;
    } catch (error) {
      console.error('Failed to get queue URL:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        queueName: this.queueName,
      });
      throw error;
    }
  }

  /**
   * Sends a game event to SQS queue.
   * This is fire-and-forget - errors are logged but don't throw.
   */
  async sendEvent(event: GameEvent): Promise<void> {
    try {
      const queueUrl = await this.getQueueUrl();
      const messageBody = JSON.stringify(event);
      
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: messageBody,
        MessageAttributes: {
          EventType: {
            DataType: 'String',
            StringValue: event.eventType,
          },
          GameId: {
            DataType: 'String',
            StringValue: event.gameId,
          },
        },
      });

      await this.client.send(command);
      console.log(`Event sent to SQS: ${event.eventType} for game ${event.gameId}`);
    } catch (error) {
      // Log error but don't throw - event sending should not block main flow
      console.error('Failed to send event to SQS:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
        eventType: event.eventType,
        gameId: event.gameId,
      });
    }
  }

  /**
   * Sends multiple events to SQS queue.
   * Each event is sent independently - if one fails, others still go through.
   */
  async sendEvents(events: GameEvent[]): Promise<void> {
    const promises = events.map(event => this.sendEvent(event));
    await Promise.allSettled(promises);
  }
}

