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
      console.log(`Sending message to connection ${connectionId}:`, messageString.substring(0, 200));
      
      const command = new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: messageString,
      });

      const response = await this.client.send(command);
      console.log(`Message sent successfully to ${connectionId}`, {
        responseMetadata: response.$metadata,
        connectionId,
      });
    } catch (error: unknown) {
      console.error(`Error sending message to ${connectionId}:`, error);
      console.error('Error details:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
        errorStack: error instanceof Error ? error.stack : undefined,
        connectionId,
        endpoint: this.client.config?.endpoint || 'unknown',
      });
      
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
      this.sendToConnection(connectionId, message).catch((error: unknown) => {
        // Log error but don't throw - continue with other connections
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to send to connection ${connectionId}:`, errorMessage);
        
        // Return null to indicate failure (will be filtered by Promise.allSettled)
        return null;
      })
    );

    const results = await Promise.allSettled(promises);
    
    // Count failures for logging
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`Failed to send to ${failures.length} out of ${connectionIds.length} connections`);
    }
  }
}

