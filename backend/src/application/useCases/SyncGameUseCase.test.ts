import { SyncGameUseCase } from './SyncGameUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Player } from '../../domain/entities/Player';
import { GameInitializer } from '../../domain/services/GameInitializer';

describe('SyncGameUseCase', () => {
  let mockGameRepository: jest.Mocked<IGameRepository>;
  let syncGameUseCase: SyncGameUseCase;

  beforeEach(() => {
    mockGameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    syncGameUseCase = new SyncGameUseCase(mockGameRepository);
  });

  describe('execute', () => {
    it('should return game state for existing game', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const game = GameInitializer.createGame('game-1', player);

      mockGameRepository.findById = jest.fn().mockResolvedValue(game);

      const result = await syncGameUseCase.execute('game-1');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.id).toBe('game-1');
        expect(result.value.players).toHaveLength(1);
        expect(result.value.players[0].id).toBe('player-1');
      }
    });

    it('should return error if game does not exist', async () => {
      mockGameRepository.findById = jest.fn().mockResolvedValue(null);

      const result = await syncGameUseCase.execute('non-existent-game');

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Game not found');
      }
    });

    it('should return complete game state including piles', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const game = GameInitializer.createGame('game-1', player);
      const gameWithPiles = game
        .addCardToPile('ascending1', game.players[0].hand[0])
        .updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(gameWithPiles);

      const result = await syncGameUseCase.execute('game-1');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.piles.ascending1.length).toBeGreaterThan(0);
        expect(result.value.status).toBe('playing');
      }
    });

    it('should return game state with multiple players', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const game = GameInitializer.createGame('game-1', player1);
      
      // Add second player manually for test
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: false,
      });
      const gameWithTwoPlayers = game.addPlayer(player2);

      mockGameRepository.findById = jest.fn().mockResolvedValue(gameWithTwoPlayers);

      const result = await syncGameUseCase.execute('game-1');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.players).toHaveLength(2);
        expect(result.value.players[0].id).toBe('player-1');
        expect(result.value.players[1].id).toBe('player-2');
      }
    });

    it('should return error if repository findById fails', async () => {
      const error = new Error('Database error');
      mockGameRepository.findById = jest.fn().mockRejectedValue(error);

      const result = await syncGameUseCase.execute('game-1');

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to sync game');
        expect(result.error).toContain('Database error');
      }
    });

    it('should handle non-Error exceptions', async () => {
      // Mock to throw a non-Error object
      mockGameRepository.findById = jest.fn().mockRejectedValue('String error');

      const result = await syncGameUseCase.execute('game-1');

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to sync game');
        expect(result.error).toContain('Unknown error');
      }
    });
  });
});




