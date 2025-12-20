import { GameIdGenerator } from './GameIdGenerator';
import { IGameRepository } from '../repositories/IGameRepository';
import { Game } from '../entities/Game';

describe('GameIdGenerator', () => {
  let mockGameRepository: jest.Mocked<IGameRepository>;

  beforeEach(() => {
    mockGameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IGameRepository>;
  });

  describe('generateUniqueId', () => {
    it('should generate a 6-character alphanumeric code', async () => {
      mockGameRepository.findById = jest.fn().mockResolvedValue(null);

      const gameId = await GameIdGenerator.generateUniqueId(mockGameRepository);

      expect(gameId).toHaveLength(6);
      expect(gameId).toMatch(/^[0-9A-Z]{6}$/);
    });

    it('should generate unique IDs on multiple calls', async () => {
      mockGameRepository.findById = jest.fn().mockResolvedValue(null);

      const id1 = await GameIdGenerator.generateUniqueId(mockGameRepository);
      const id2 = await GameIdGenerator.generateUniqueId(mockGameRepository);
      const id3 = await GameIdGenerator.generateUniqueId(mockGameRepository);

      // Very unlikely to be the same (but not impossible)
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should retry if generated ID already exists', async () => {
      const existingGame = new Game({
        id: 'EXISTS',
        players: [],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: null,
        createdBy: 'creator-id',
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date(),
        ttl: Math.floor(Date.now() / 1000) + 86400,
      });

      // First call returns existing game, second returns null (unique)
      mockGameRepository.findById = jest.fn()
        .mockResolvedValueOnce(existingGame) // First attempt: collision
        .mockResolvedValueOnce(null); // Second attempt: unique

      const gameId = await GameIdGenerator.generateUniqueId(mockGameRepository);

      expect(gameId).toHaveLength(6);
      expect(gameId).toMatch(/^[0-9A-Z]{6}$/);
      expect(mockGameRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should handle case where all attempts collide (fallback)', async () => {
      const existingGame = new Game({
        id: 'EXISTS',
        players: [],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: null,
        createdBy: 'creator-id',
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date(),
        ttl: Math.floor(Date.now() / 1000) + 86400,
      });

      // All attempts return existing game
      mockGameRepository.findById = jest.fn().mockResolvedValue(existingGame);

      const gameId = await GameIdGenerator.generateUniqueId(mockGameRepository);

      // Fallback should still generate a valid ID (may be slightly longer)
      expect(gameId.length).toBeGreaterThanOrEqual(6);
      expect(gameId).toMatch(/^[0-9A-Z]+$/);
    });
  });
});

