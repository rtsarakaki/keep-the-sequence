import { JoinGameUseCase } from './JoinGameUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';
import { GameInitializer } from '../../domain/services/GameInitializer';

describe('JoinGameUseCase', () => {
  let mockGameRepository: jest.Mocked<IGameRepository>;
  let joinGameUseCase: JoinGameUseCase;

  beforeEach(() => {
    mockGameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    joinGameUseCase = new JoinGameUseCase(mockGameRepository);
  });

  describe('execute', () => {
    it('should add player to existing game', async () => {
      // Create a game with one player
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts'), new Card(20, 'spades')],
        isConnected: false,
      });
      const existingGame = GameInitializer.createGame('game-1', firstPlayer);

      mockGameRepository.findById = jest.fn().mockResolvedValue(existingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 2',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.players).toHaveLength(2);
        expect(result.value.players[1].name).toBe('Player 2');
        expect(mockGameRepository.findById).toHaveBeenCalledWith('game-1');
        expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
      }
    });

    it('should return error if game does not exist', async () => {
      mockGameRepository.findById = jest.fn().mockResolvedValue(null);

      const dto = {
        gameId: 'non-existent-game',
        playerName: 'Player 2',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Game not found');
      }
      expect(mockGameRepository.save).not.toHaveBeenCalled();
    });

    it('should return error if game is already full (5 players)', async () => {
      // Create a game with 5 players
      const players: Player[] = [];
      for (let i = 1; i <= 5; i++) {
        players.push(
          new Player({
            id: `player-${i}`,
            name: `Player ${i}`,
            hand: [],
            isConnected: false,
          })
        );
      }

      const fullGame = new Game({
        id: 'game-1',
        players: Object.freeze(players),
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: null,
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockGameRepository.findById = jest.fn().mockResolvedValue(fullGame);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 6',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Game is full');
      }
    });

    it('should return error if game is not in waiting status', async () => {
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const game = GameInitializer.createGame('game-1', firstPlayer);
      const playingGame = game.updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 2',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Game is not accepting new players');
      }
    });

    it('should deal cards to the new player', async () => {
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const existingGame = GameInitializer.createGame('game-1', firstPlayer);

      mockGameRepository.findById = jest.fn().mockResolvedValue(existingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 2',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        // New player should have cards dealt
        expect(result.value.players[1].hand.length).toBeGreaterThan(0);
      }
    });

    it('should use provided playerId if given', async () => {
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const existingGame = GameInitializer.createGame('game-1', firstPlayer);

      mockGameRepository.findById = jest.fn().mockResolvedValue(existingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 2',
        playerId: 'custom-player-id',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.players[1].id).toBe('custom-player-id');
      }
    });

    it('should generate playerId if not provided', async () => {
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const existingGame = GameInitializer.createGame('game-1', firstPlayer);

      mockGameRepository.findById = jest.fn().mockResolvedValue(existingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 2',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.players[1].id).toBeDefined();
        expect(result.value.players[1].id).not.toBe('');
      }
    });

    it('should return error if repository save fails', async () => {
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const existingGame = GameInitializer.createGame('game-1', firstPlayer);

      mockGameRepository.findById = jest.fn().mockResolvedValue(existingGame);
      const error = new Error('Database error');
      mockGameRepository.save = jest.fn().mockRejectedValue(error);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 2',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to join game');
      }
    });
  });
});

