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

      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const result = await createGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.players).toHaveLength(1);
        expect(result.value.players[0].name).toBe('Player 1');
        expect(result.value.status).toBe('waiting');
        expect(result.value.piles.ascending1).toEqual([]);
        expect(result.value.piles.ascending2).toEqual([]);
        expect(result.value.piles.descending1).toEqual([]);
        expect(result.value.piles.descending2).toEqual([]);
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

      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const result1 = await createGameUseCase.execute(dto);
      const result2 = await createGameUseCase.execute(dto);

      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      if (result1.isSuccess && result2.isSuccess) {
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });
  });
});

