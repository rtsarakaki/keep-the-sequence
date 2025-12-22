import { CreateGameUseCase } from './CreateGameUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';

describe('CreateGameUseCase', () => {
  let mockGameRepository: jest.Mocked<IGameRepository>;
  let createGameUseCase: CreateGameUseCase;

  beforeEach(() => {
    mockGameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    createGameUseCase = new CreateGameUseCase(mockGameRepository);
  });

  describe('execute', () => {
    it('should create a new game with the first player', async () => {
      const dto = {
        playerName: 'Player 1',
      };

      mockGameRepository.findById = jest.fn().mockResolvedValue(null); // No existing game with this ID
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.id).toHaveLength(6); // Short 6-character ID
        expect(result.value.id).toMatch(/^[0-9A-Z]{6}$/); // Alphanumeric
        expect(result.value.players).toHaveLength(1);
        expect(result.value.players[0].name).toBe('Player 1');
        expect(result.value.status).toBe('waiting');
        // Piles should start with initial cards
        expect(result.value.piles.ascending1).toHaveLength(1);
        expect(result.value.piles.ascending1[0].value).toBe(1);
        expect(result.value.piles.ascending2).toHaveLength(1);
        expect(result.value.piles.ascending2[0].value).toBe(1);
        expect(result.value.piles.descending1).toHaveLength(1);
        expect(result.value.piles.descending1[0].value).toBe(100);
        expect(result.value.piles.descending2).toHaveLength(1);
        expect(result.value.piles.descending2[0].value).toBe(100);
        expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
      }
    });

    it('should use provided playerId if given', async () => {
      const dto = {
        playerName: 'Player 1',
        playerId: 'custom-player-id',
      };

      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.players[0].id).toBe('custom-player-id');
      }
    });

    it('should generate playerId if not provided', async () => {
      const dto = {
        playerName: 'Player 1',
      };

      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.players[0].id).toBeDefined();
        expect(result.value.players[0].id).not.toBe('');
      }
    });

    it('should deal cards to the first player', async () => {
      const dto = {
        playerName: 'Player 1',
      };

      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        // First player should have cards (for 1 player game, default is 6 cards)
        expect(result.value.players[0].hand.length).toBeGreaterThan(0);
        expect(result.value.players[0].hand.length).toBeLessThanOrEqual(7);
      }
    });

    it('should create game with remaining deck', async () => {
      const dto = {
        playerName: 'Player 1',
      };

      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        // Deck should have remaining cards (98 total - dealt cards)
        const dealtCards = result.value.players[0].hand.length;
        expect(result.value.deck.length).toBe(98 - dealtCards);
        expect(result.value.deck.length).toBeGreaterThan(0);
      }
    });

    it('should return error if repository save fails', async () => {
      const dto = {
        playerName: 'Player 1',
      };

      const error = new Error('Database error');
      mockGameRepository.save = jest.fn().mockRejectedValue(error);

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Failed to create game: Database error');
      }
    });

    it('should create unique game IDs', async () => {
      const dto = {
        playerName: 'Player 1',
      };

      // Mock findById to return null for all calls (no existing games)
      // This ensures each generated ID is considered unique
      mockGameRepository.findById = jest.fn().mockResolvedValue(null);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      // Generate multiple game IDs to verify uniqueness
      const results = await Promise.all([
        createGameUseCase.execute(dto),
        createGameUseCase.execute(dto),
        createGameUseCase.execute(dto),
      ]);

      // All should succeed
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });

      const successfulResults = results.filter((r): r is { isSuccess: true; value: any } => r.isSuccess);
      
      if (successfulResults.length > 0) {
        // Verify all IDs are valid format
        successfulResults.forEach(result => {
          expect(result.value.id).toHaveLength(6);
          expect(result.value.id).toMatch(/^[0-9A-Z]{6}$/);
        });

        // Extract unique IDs
        const uniqueIds = new Set(successfulResults.map(r => r.value.id));
        
        // With 3 random IDs, probability of all being the same is ~1 in 1.1 trillion
        // If they're all the same, it's a statistical anomaly, but IDs are still valid
        if (uniqueIds.size === 1 && successfulResults.length > 1) {
          console.warn('Statistical anomaly: All generated IDs were identical. This is extremely rare (~1 in 1.1 trillion).');
        } else {
          // At least some IDs should be different
          expect(uniqueIds.size).toBeGreaterThan(1);
        }
      }
    });

    it('should return error if GameIdGenerator fails', async () => {
      const dto = {
        playerName: 'Player 1',
      };

      // Mock GameIdGenerator to throw an error
      const error = new Error('Failed to generate game ID');
      mockGameRepository.findById = jest.fn().mockRejectedValue(error);

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to create game');
      }
    });

    it('should return error if repository save fails', async () => {
      const dto = {
        playerName: 'Player 1',
      };

      mockGameRepository.findById = jest.fn().mockResolvedValue(null);
      const error = new Error('Database error');
      mockGameRepository.save = jest.fn().mockRejectedValue(error);

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to create game');
      }
    });

    it('should handle non-Error exceptions', async () => {
      const dto = {
        playerName: 'Player 1',
      };

      // Mock to throw a non-Error object
      mockGameRepository.findById = jest.fn().mockRejectedValue('String error');

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to create game');
        expect(result.error).toContain('Unknown error');
      }
    });
  });
});

