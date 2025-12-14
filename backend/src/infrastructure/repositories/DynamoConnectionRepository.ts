import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  IConnectionRepository,
  Connection,
} from '../../domain/repositories/IConnectionRepository';

export class DynamoConnectionRepository implements IConnectionRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(tableName: string, client?: DynamoDBDocumentClient) {
    this.tableName = tableName;
    this.client =
      client ||
      DynamoDBDocumentClient.from(
        new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
      );
  }

  async save(connection: Connection): Promise<void> {
    const item = this.mapToDynamoItem(connection);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    await this.client.send(command);
  }

  async findByConnectionId(connectionId: string): Promise<Connection | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { connectionId },
    });

    const result = await this.client.send(command);

    if (!result.Item) {
      return null;
    }

    return this.mapToConnection(result.Item);
  }

  async findByGameId(gameId: string): Promise<Connection[]> {
    // Note: This uses Scan which is not ideal for production
    // In production, consider adding a GSI (Global Secondary Index) on gameId
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'gameId = :gameId',
      ExpressionAttributeValues: {
        ':gameId': gameId,
      },
    });

    const result = await this.client.send(command);

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map((item) => this.mapToConnection(item));
  }

  async delete(connectionId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { connectionId },
    });

    await this.client.send(command);
  }

  private mapToDynamoItem(connection: Connection): Record<string, unknown> {
    return {
      connectionId: connection.connectionId,
      gameId: connection.gameId,
      playerId: connection.playerId,
      connectedAt: connection.connectedAt.getTime(),
      lastActivity: connection.lastActivity.getTime(),
    };
  }

  private mapToConnection(item: Record<string, unknown>): Connection {
    if (!item.connectionId || typeof item.connectionId !== 'string') {
      throw new Error('Invalid DynamoDB item: missing or invalid connectionId');
    }

    if (!item.gameId || typeof item.gameId !== 'string') {
      throw new Error('Invalid DynamoDB item: missing or invalid gameId');
    }

    if (!item.playerId || typeof item.playerId !== 'string') {
      throw new Error('Invalid DynamoDB item: missing or invalid playerId');
    }

    const connectedAt = item.connectedAt as number;
    const lastActivity = item.lastActivity as number;

    if (typeof connectedAt !== 'number' || typeof lastActivity !== 'number') {
      throw new Error('Invalid DynamoDB item: missing or invalid timestamps');
    }

    return {
      connectionId: item.connectionId as string,
      gameId: item.gameId as string,
      playerId: item.playerId as string,
      connectedAt: new Date(connectedAt),
      lastActivity: new Date(lastActivity),
    };
  }
}

