import { EndGameUseCase } from './EndGameUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { IConnectionRepository, Connection } from '../../domain/repositories/IConnectionRepository';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';

describe('EndGameUseCase', () => {
  let gameRepository: jest.Mocked<IGameRepository>;
  let connectionRepository: jest.Mocked<IConnectionRepository>;
  let endGameUseCase: EndGameUseCase;

  beforeEach(() => {
    gameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    connectionRepository = {
      findByConnectionId: jest.fn(),
      findByGameId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    endGameUseCase = new EndGameUseCase(gameRepository, connectionRepository);
  });

  describe('execute', () => {
    it('should successfully end a game', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';
      const connectionId = 'conn-1';

      const game = new Game({
        id: gameId,
        players: [
          new Player({
            id: playerId,
            name: 'Player 1',
            hand: [new Card(10, 'hearts')],
            isConnected: true,
          }),
        ],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: playerId,
        status: 'playing',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const connection: Connection = {
        connectionId,
        gameId,
        playerId,
        connectedAt: new Date(),
        lastActivity: new Date(),
        ttl: Math.floor(Date.now() / 1000) + 86400,
      };

      gameRepository.findById.mockResolvedValue(game);
      connectionRepository.findByGameId.mockResolvedValue([connection]);
      connectionRepository.delete.mockResolvedValue();
      gameRepository.delete.mockResolvedValue();

      const result = await endGameUseCase.execute({ gameId, playerId });

      expect(result.isSuccess).toBe(true);
      expect(gameRepository.findById).toHaveBeenCalledWith(gameId);
      expect(connectionRepository.findByGameId).toHaveBeenCalledWith(gameId);
      expect(connectionRepository.delete).toHaveBeenCalledWith(connectionId);
      expect(gameRepository.delete).toHaveBeenCalledWith(gameId);
    });

    it('should return error if game does not exist', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      gameRepository.findById.mockResolvedValue(null);

      const result = await endGameUseCase.execute({ gameId, playerId });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Game not found');
      }
      expect(gameRepository.delete).not.toHaveBeenCalled();
    });

    it('should return error if player is not part of the game', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';
      const otherPlayerId = 'player-2';

      const game = new Game({
        id: gameId,
        players: [
          new Player({
            id: otherPlayerId,
            name: 'Player 2',
            hand: [new Card(10, 'hearts')],
            isConnected: true,
          }),
        ],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: otherPlayerId,
        status: 'playing',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      gameRepository.findById.mockResolvedValue(game);

      const result = await endGameUseCase.execute({ gameId, playerId });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Player is not part of this game');
      }
      expect(gameRepository.delete).not.toHaveBeenCalled();
    });

    it('should delete multiple connections', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';
      const connectionId1 = 'conn-1';
      const connectionId2 = 'conn-2';

      const game = new Game({
        id: gameId,
        players: [
          new Player({
            id: playerId,
            name: 'Player 1',
            hand: [new Card(10, 'hearts')],
            isConnected: true,
          }),
        ],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: playerId,
        status: 'playing',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const connections: Connection[] = [
        {
          connectionId: connectionId1,
          gameId,
          playerId,
          connectedAt: new Date(),
          lastActivity: new Date(),
          ttl: Math.floor(Date.now() / 1000) + 86400,
        },
        {
          connectionId: connectionId2,
          gameId,
          playerId: 'player-2',
          connectedAt: new Date(),
          lastActivity: new Date(),
          ttl: Math.floor(Date.now() / 1000) + 86400,
        },
      ];

      gameRepository.findById.mockResolvedValue(game);
      connectionRepository.findByGameId.mockResolvedValue(connections);
      connectionRepository.delete.mockResolvedValue();
      gameRepository.delete.mockResolvedValue();

      const result = await endGameUseCase.execute({ gameId, playerId });

      expect(result.isSuccess).toBe(true);
      expect(connectionRepository.delete).toHaveBeenCalledTimes(2);
      expect(connectionRepository.delete).toHaveBeenCalledWith(connectionId1);
      expect(connectionRepository.delete).toHaveBeenCalledWith(connectionId2);
      expect(gameRepository.delete).toHaveBeenCalledWith(gameId);
    });

    it('should handle errors from repository', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      const game = new Game({
        id: gameId,
        players: [
          new Player({
            id: playerId,
            name: 'Player 1',
            hand: [new Card(10, 'hearts')],
            isConnected: true,
          }),
        ],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: playerId,
        status: 'playing',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      gameRepository.findById.mockResolvedValue(game);
      connectionRepository.findByGameId.mockResolvedValue([]);
      gameRepository.delete.mockRejectedValue(new Error('Database error'));

      const result = await endGameUseCase.execute({ gameId, playerId });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to end game');
      }
    });

    it('should handle non-Error exceptions', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      gameRepository.findById.mockRejectedValue('String error');

      const result = await endGameUseCase.execute({ gameId, playerId });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to end game');
      }
    });
  });
});

