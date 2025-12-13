import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';

export class DynamoGameRepository implements IGameRepository {
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

  async findById(gameId: string): Promise<Game | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { gameId },
    });

    const result = await this.client.send(command);

    if (!result.Item) {
      return null;
    }

    return this.mapToGame(result.Item);
  }

  async save(game: Game): Promise<void> {
    const item = this.mapToDynamoItem(game);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    await this.client.send(command);
  }

  async delete(gameId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { gameId },
    });

    await this.client.send(command);
  }

  private mapToGame(item: Record<string, unknown>): Game {
    // Implementation will map DynamoDB item to Game entity
    // This is a placeholder - full implementation needed
    throw new Error('Not implemented');
  }

  private mapToDynamoItem(game: Game): Record<string, unknown> {
    // Implementation will map Game entity to DynamoDB item
    // This is a placeholder - full implementation needed
    throw new Error('Not implemented');
  }
}

