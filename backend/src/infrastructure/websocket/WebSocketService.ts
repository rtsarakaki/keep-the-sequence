import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

export interface IWebSocketService {
  sendToConnection(connectionId: string, message: unknown): Promise<void>;
  sendToConnections(connectionIds: string[], message: unknown): Promise<void>;
}

/**
 * Helper function to get WebSocket API endpoint from Lambda event
 * @param event Lambda WebSocket event
 * @returns WebSocket API endpoint URL
 */
export function getWebSocketEndpoint(
  event: Parameters<APIGatewayProxyWebsocketHandlerV2>[0]
): string {
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;

  if (!domainName || !stage) {
    throw new Error('Missing domainName or stage in request context');
  }

  return `https://${domainName}/${stage}`;
}

export class WebSocketService implements IWebSocketService {
  private readonly client: ApiGatewayManagementApiClient;

  constructor(endpoint: string) {
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('WebSocket endpoint is required');
    }

    this.client = new ApiGatewayManagementApiClient({
      endpoint,
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async sendToConnection(connectionId: string, message: unknown): Promise<void> {
    if (!connectionId || typeof connectionId !== 'string') {
      throw new Error('ConnectionId is required');
    }

    if (message === undefined || message === null) {
      throw new Error('Message cannot be null or undefined');
    }

    try {
      const messageString = JSON.stringify(message);
      
      const command = new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: messageString,
      });

      await this.client.send(command);
    } catch (error: unknown) {
      
      // Handle specific AWS errors
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as { statusCode: number }).statusCode;
        
        if (statusCode === 410) {
          // Connection is gone (disconnected)
          throw new Error(`Connection ${connectionId} is no longer available`);
        }
        
        if (statusCode === 403) {
          throw new Error(`Permission denied for connection ${connectionId}`);
        }
      }

      // Re-throw original error if not handled
      throw error;
    }
  }

  async sendToConnections(connectionIds: string[], message: unknown): Promise<void> {
    if (!Array.isArray(connectionIds)) {
      throw new Error('ConnectionIds must be an array');
    }

    if (connectionIds.length === 0) {
      return; // Nothing to send
    }

    const promises = connectionIds.map((connectionId) =>
      this.sendToConnection(connectionId, message).catch(() => {
        // Silently handle errors - continue with other connections
        return null;
      })
    );

    await Promise.allSettled(promises);
  }
}

