import { DynamoGameRepository } from '../repositories/DynamoGameRepository';
import { DynamoConnectionRepository } from '../repositories/DynamoConnectionRepository';
import { WebSocketService, getWebSocketEndpoint } from '../websocket/WebSocketService';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { IConnectionRepository } from '../../domain/repositories/IConnectionRepository';
import { CreateGameUseCase } from '../../application/useCases/CreateGameUseCase';
import { JoinGameUseCase } from '../../application/useCases/JoinGameUseCase';
import { PlayCardUseCase } from '../../application/useCases/PlayCardUseCase';
import { SyncGameUseCase } from '../../application/useCases/SyncGameUseCase';
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

/**
 * Simple Dependency Injection container for Lambda handlers.
 * 
 * Creates singleton instances of repositories and use cases.
 * Uses environment variables for configuration.
 */
class Container {
  private gameRepository: IGameRepository | null = null;
  private connectionRepository: IConnectionRepository | null = null;
  private createGameUseCase: CreateGameUseCase | null = null;
  private joinGameUseCase: JoinGameUseCase | null = null;
  private playCardUseCase: PlayCardUseCase | null = null;
  private syncGameUseCase: SyncGameUseCase | null = null;

  getGameRepository(): IGameRepository {
    if (!this.gameRepository) {
      const tableName = process.env.GAMES_TABLE || 'the-game-backend-games-dev';
      this.gameRepository = new DynamoGameRepository(tableName);
    }
    return this.gameRepository;
  }

  getConnectionRepository(): IConnectionRepository {
    if (!this.connectionRepository) {
      const tableName = process.env.CONNECTIONS_TABLE || 'the-game-backend-connections-dev';
      this.connectionRepository = new DynamoConnectionRepository(tableName);
    }
    return this.connectionRepository;
  }

  /**
   * Creates a WebSocketService instance from a Lambda WebSocket event.
   * The endpoint is extracted from the event context.
   */
  getWebSocketService(event: Parameters<APIGatewayProxyWebsocketHandlerV2>[0]): WebSocketService {
    const endpoint = getWebSocketEndpoint(event);
    return new WebSocketService(endpoint);
  }

  getCreateGameUseCase(): CreateGameUseCase {
    if (!this.createGameUseCase) {
      this.createGameUseCase = new CreateGameUseCase(this.getGameRepository());
    }
    return this.createGameUseCase;
  }

  getJoinGameUseCase(): JoinGameUseCase {
    if (!this.joinGameUseCase) {
      this.joinGameUseCase = new JoinGameUseCase(this.getGameRepository());
    }
    return this.joinGameUseCase;
  }

  getPlayCardUseCase(): PlayCardUseCase {
    if (!this.playCardUseCase) {
      this.playCardUseCase = new PlayCardUseCase(this.getGameRepository());
    }
    return this.playCardUseCase;
  }

  getSyncGameUseCase(): SyncGameUseCase {
    if (!this.syncGameUseCase) {
      this.syncGameUseCase = new SyncGameUseCase(this.getGameRepository());
    }
    return this.syncGameUseCase;
  }
}

// Export singleton instance
export const container = new Container();

