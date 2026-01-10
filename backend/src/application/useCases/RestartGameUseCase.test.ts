import { RestartGameUseCase } from './RestartGameUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';
import { GameInitializer } from '../../domain/services/GameInitializer';

describe('RestartGameUseCase', () => {
  let restartGameUseCase: RestartGameUseCase;
  let mockGameRepository: jest.Mocked<IGameRepository>;

  beforeEach(() => {
    mockGameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<IGameRepository>;

    restartGameUseCase = new RestartGameUseCase(mockGameRepository);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully restart a finished game', async () => {
      // Create a finished game with 2 players
      const player1 = new Player({
        id: 'player-1',
        name: 'Alice',
        hand: [new Card(10, 'hearts'), new Card(20, 'spades')],
        isConnected: true,
      });

      const player2 = new Player({
        id: 'player-2',
        name: 'Bob',
        hand: [new Card(30, 'clubs')],
        isConnected: true,
      });

      const finishedGame = new Game({
        id: 'game-1',
        players: Object.freeze([player1, player2]),
        piles: {
          ascending1: Object.freeze([new Card(1, 'hearts'), new Card(15, 'diamonds')]),
          ascending2: Object.freeze([new Card(1, 'hearts'), new Card(25, 'spades')]),
          descending1: Object.freeze([new Card(100, 'hearts'), new Card(80, 'clubs')]),
          descending2: Object.freeze([new Card(100, 'hearts')]),
        },
        deck: [new Card(50, 'hearts')],
        discardPile: Object.freeze([]),
        currentTurn: null,
        cardsPlayedThisTurn: 0,
        createdBy: 'player-1',
        status: 'finished',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockGameRepository.findById.mockResolvedValue(finishedGame);
      mockGameRepository.save.mockResolvedValue(undefined);

      const result = await restartGameUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('playing');
        expect(result.value.players).toHaveLength(2);
        expect(result.value.players[0].id).toBe('player-1');
        expect(result.value.players[1].id).toBe('player-2');
        expect(result.value.currentTurn).toBe('player-1');
        expect(result.value.cardsPlayedThisTurn).toBe(0);
        
        // Check that piles are reset
        expect(result.value.piles.ascending1).toHaveLength(1);
        expect(result.value.piles.ascending1[0].value).toBe(1);
        expect(result.value.piles.descending1).toHaveLength(1);
        expect(result.value.piles.descending1[0].value).toBe(100);
        
        // Check that all players have cards
        result.value.players.forEach(player => {
          expect(player.hand.length).toBeGreaterThan(0);
        });
      }

      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return error if game does not exist', async () => {
      mockGameRepository.findById.mockResolvedValue(null);

      const result = await restartGameUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Game not found');
      }
    });

    it('should return error if game is not finished', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Alice',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });

      const playingGame = GameInitializer.createGame('game-1', player1);
      const startedGame = playingGame.updateStatus('playing');

      mockGameRepository.findById.mockResolvedValue(startedGame);

      const result = await restartGameUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Game must be finished to restart');
      }
    });

    it('should return error if player is not in the game', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Alice',
        hand: [],
        isConnected: true,
      });

      const finishedGame = GameInitializer.createGame('game-1', player1);
      const gameFinished = finishedGame.updateStatus('finished');

      mockGameRepository.findById.mockResolvedValue(gameFinished);

      const result = await restartGameUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-999',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Player not found in game');
      }
    });

    it('should set status to waiting if only one player', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Alice',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });

      const finishedGame = GameInitializer.createGame('game-1', player1);
      const gameFinished = finishedGame.updateStatus('finished');

      mockGameRepository.findById.mockResolvedValue(gameFinished);
      mockGameRepository.save.mockResolvedValue(undefined);

      const result = await restartGameUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('waiting');
        expect(result.value.currentTurn).toBeNull();
      }
    });
  });
});
