import { SyncGameUseCase } from './SyncGameUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';
import { Game } from '../../domain/entities/Game';
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

    it('should return finished game as is without checking defeat/victory', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const game = GameInitializer.createGame('game-1', player);
      const finishedGame = game.updateStatus('finished');

      mockGameRepository.findById = jest.fn().mockResolvedValue(finishedGame);

      const result = await syncGameUseCase.execute('game-1');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('finished');
      }
      expect(mockGameRepository.save).not.toHaveBeenCalled();
    });

    it('should return abandoned game as is without checking defeat/victory', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const game = GameInitializer.createGame('game-1', player);
      const abandonedGame = game.updateStatus('abandoned');

      mockGameRepository.findById = jest.fn().mockResolvedValue(abandonedGame);

      const result = await syncGameUseCase.execute('game-1');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('abandoned');
      }
      expect(mockGameRepository.save).not.toHaveBeenCalled();
    });

    it('should check for defeat condition and end game if player cannot continue', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')], // Has cards but can't play
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      // Create a game where player has cards but can't play and hasn't met minimum
      // Need to manually create game with blocked piles and cardsPlayedThisTurn = 0
      const playingGame = new Game({
        ...game,
        status: 'playing',
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 0, // Hasn't played minimum (2 cards when deck has cards)
        deck: [new Card(50, 'hearts')], // Deck has cards, so minimum is 2
        piles: {
          ascending1: [new Card(1, 'hearts'), new Card(99, 'spades')], // Blocked
          ascending2: [new Card(1, 'hearts'), new Card(99, 'hearts')], // Blocked
          descending1: [new Card(100, 'hearts'), new Card(2, 'spades')], // Blocked
          descending2: [new Card(100, 'hearts'), new Card(2, 'hearts')], // Blocked
        },
        players: [player],
      });

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const result = await syncGameUseCase.execute('game-1');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('finished');
      }
      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should check for victory condition and end game if all hands are empty', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [], // Empty hand
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [], // Empty hand
        isConnected: true,
      });
      // Create game manually with empty hands
      const game = new Game({
        id: 'game-1',
        players: [player1, player2],
        piles: {
          ascending1: [new Card(1, 'hearts')],
          ascending2: [new Card(1, 'hearts')],
          descending1: [new Card(100, 'hearts')],
          descending2: [new Card(100, 'hearts')],
        },
        deck: [],
        discardPile: [],
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 0,
        createdBy: 'player-1',
        status: 'playing',
        createdAt: new Date(),
        updatedAt: new Date(),
        pilePreferences: {},
      });

      mockGameRepository.findById = jest.fn().mockResolvedValue(game);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const result = await syncGameUseCase.execute('game-1');

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('finished');
      }
      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});




