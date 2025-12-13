import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';

export interface IWebSocketService {
  sendToConnection(connectionId: string, message: unknown): Promise<void>;
  sendToConnections(connectionIds: string[], message: unknown): Promise<void>;
}

export class WebSocketService implements IWebSocketService {
  private readonly client: ApiGatewayManagementApiClient;
  private readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.client = new ApiGatewayManagementApiClient({
      endpoint,
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async sendToConnection(connectionId: string, message: unknown): Promise<void> {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(message),
    });

    await this.client.send(command);
  }

  async sendToConnections(connectionIds: string[], message: unknown): Promise<void> {
    const promises = connectionIds.map((connectionId) =>
      this.sendToConnection(connectionId, message).catch((error) => {
        console.error(`Failed to send to connection ${connectionId}:`, error);
        // Continue with other connections even if one fails
      })
    );

    await Promise.allSettled(promises);
  }
}

