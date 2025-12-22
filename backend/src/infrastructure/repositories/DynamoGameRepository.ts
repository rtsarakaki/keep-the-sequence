import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game, GameStatus } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';
import { GamePiles } from '../../domain/services/GameRules';

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
    if (!item.gameId || typeof item.gameId !== 'string') {
      throw new Error('Invalid DynamoDB item: missing or invalid gameId');
    }

    const getCreatedBy = (): string => {
      if (typeof item.createdBy === 'string') {
        return item.createdBy;
      }
      // Fallback to first player for backward compatibility
      const players = item.players;
      if (!Array.isArray(players) || players.length === 0) {
        return '';
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const firstPlayer = players[0];
      if (typeof firstPlayer !== 'object' || firstPlayer === null || !('id' in firstPlayer)) {
        return '';
      }
      const playerId = (firstPlayer as { id: unknown }).id;
      return typeof playerId === 'string' ? playerId : '';
    };

    const mapCards = (cards: unknown[]): Card[] => {
      if (!Array.isArray(cards)) {
        return [];
      }
      return cards.map(card => {
        if (
          typeof card === 'object' &&
          card !== null &&
          'value' in card &&
          'suit' in card &&
          typeof card.value === 'number' &&
          typeof card.suit === 'string'
        ) {
          return new Card(card.value, card.suit);
        }
        throw new Error(`Invalid card format: ${JSON.stringify(card)}`);
      });
    };

    const mapPlayers = (players: unknown[]): Player[] => {
      if (!Array.isArray(players)) {
        return [];
      }
      return players.map(player => {
        if (
          typeof player === 'object' &&
          player !== null &&
          'id' in player &&
          'name' in player &&
          'hand' in player &&
          'isConnected' in player
        ) {
          return new Player({
            id: String(player.id),
            name: String(player.name),
            hand: mapCards(Array.isArray(player.hand) ? player.hand : []),
            isConnected: Boolean(player.isConnected),
          });
        }
        throw new Error(`Invalid player format: ${JSON.stringify(player)}`);
      });
    };

    const piles = item.piles as Record<string, unknown>;
    if (!piles || typeof piles !== 'object') {
      throw new Error('Invalid DynamoDB item: missing or invalid piles');
    }

    const validStatuses: GameStatus[] = ['waiting', 'playing', 'finished', 'abandoned'];
    const status = item.status as string;
    if (!status || !validStatuses.includes(status as GameStatus)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const createdAt = item.createdAt;
    const updatedAt = item.updatedAt;
    if (typeof createdAt !== 'number' || typeof updatedAt !== 'number') {
      throw new Error('Invalid DynamoDB item: missing or invalid timestamps');
    }

    // Map pilePreferences (optional, defaults to empty object)
    const pilePreferences = item.pilePreferences;
    const mappedPreferences: Record<string, keyof GamePiles | null> = {};
    if (pilePreferences && typeof pilePreferences === 'object' && pilePreferences !== null) {
      for (const [playerId, pileId] of Object.entries(pilePreferences)) {
        const validPileIds: (keyof GamePiles)[] = ['ascending1', 'ascending2', 'descending1', 'descending2'];
        if (pileId === null || pileId === undefined) {
          mappedPreferences[playerId] = null;
        } else if (typeof pileId === 'string' && validPileIds.includes(pileId as keyof GamePiles)) {
          mappedPreferences[playerId] = pileId as keyof GamePiles;
        }
      }
    }

    return new Game({
      id: item.gameId,
      players: mapPlayers(Array.isArray(item.players) ? item.players : []),
      piles: {
        ascending1: mapCards(Array.isArray(piles.ascending1) ? piles.ascending1 : []),
        ascending2: mapCards(Array.isArray(piles.ascending2) ? piles.ascending2 : []),
        descending1: mapCards(Array.isArray(piles.descending1) ? piles.descending1 : []),
        descending2: mapCards(Array.isArray(piles.descending2) ? piles.descending2 : []),
      },
      deck: mapCards(Array.isArray(item.deck) ? item.deck : []),
      discardPile: mapCards(Array.isArray(item.discardPile) ? item.discardPile : []),
      currentTurn: item.currentTurn === null || item.currentTurn === undefined 
        ? null 
        : String(item.currentTurn),
      cardsPlayedThisTurn: typeof item.cardsPlayedThisTurn === 'number' ? item.cardsPlayedThisTurn : 0,
      createdBy: getCreatedBy(),
      status: status as GameStatus,
      pilePreferences: mappedPreferences,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
      ttl: typeof item.ttl === 'number' ? item.ttl : undefined,
    });
  }

  private mapToDynamoItem(game: Game): Record<string, unknown> {
    return {
      gameId: game.id,
      players: game.players.map(player => ({
        id: player.id,
        name: player.name,
        hand: player.hand.map(card => ({
          value: card.value,
          suit: card.suit,
        })),
        isConnected: player.isConnected,
      })),
      piles: {
        ascending1: game.piles.ascending1.map(card => ({
          value: card.value,
          suit: card.suit,
        })),
        ascending2: game.piles.ascending2.map(card => ({
          value: card.value,
          suit: card.suit,
        })),
        descending1: game.piles.descending1.map(card => ({
          value: card.value,
          suit: card.suit,
        })),
        descending2: game.piles.descending2.map(card => ({
          value: card.value,
          suit: card.suit,
        })),
      },
      deck: game.deck.map(card => ({
        value: card.value,
        suit: card.suit,
      })),
      discardPile: game.discardPile.map(card => ({
        value: card.value,
        suit: card.suit,
      })),
      currentTurn: game.currentTurn ?? null,
      cardsPlayedThisTurn: game.cardsPlayedThisTurn,
      createdBy: game.createdBy,
      status: game.status,
      pilePreferences: game.pilePreferences,
      createdAt: game.createdAt.getTime(),
      updatedAt: game.updatedAt.getTime(),
      ...(game.ttl !== undefined && { ttl: game.ttl }),
    };
  }
}

