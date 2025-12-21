import { SetStartingPlayerUseCase } from './SetStartingPlayerUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';
import { Game } from '../../domain/entities/Game';
import { GameInitializer } from '../../domain/services/GameInitializer';

describe('SetStartingPlayerUseCase', () => {
  let mockGameRepository: jest.Mocked<IGameRepository>;
  let setStartingPlayerUseCase: SetStartingPlayerUseCase;

  beforeEach(() => {
    mockGameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    setStartingPlayerUseCase = new SetStartingPlayerUseCase(mockGameRepository);
  });

  describe('execute', () => {
    it('should successfully set starting player', async () => {
      const creator = new Player({
        id: 'creator-1',
        name: 'Creator',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', creator);
      const gameWithPlayers = new Game({
        ...game,
        players: Object.freeze([creator, player2]),
        status: 'waiting' as const,
        currentTurn: null,
      });

      mockGameRepository.findById.mockResolvedValue(gameWithPlayers);
      mockGameRepository.save.mockResolvedValue(undefined);

      const result = await setStartingPlayerUseCase.execute({
        gameId: 'game-1',
        playerId: 'creator-1',
        startingPlayerId: 'player-2',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.currentTurn).toBe('player-2');
      }
      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return error if game does not exist', async () => {
      mockGameRepository.findById.mockResolvedValue(null);

      const result = await setStartingPlayerUseCase.execute({
        gameId: 'non-existent',
        playerId: 'creator-1',
        startingPlayerId: 'player-2',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Game not found');
      }
    });

    it('should return error if requesting player is not the creator', async () => {
      const creator = new Player({
        id: 'creator-1',
        name: 'Creator',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', creator);
      const gameWithPlayers = new Game({
        ...game,
        players: Object.freeze([creator, player2]),
        status: 'waiting' as const,
        currentTurn: null,
      });

      mockGameRepository.findById.mockResolvedValue(gameWithPlayers);

      const result = await setStartingPlayerUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-2', // Not the creator
        startingPlayerId: 'player-2',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Only the game creator can set the starting player');
      }
    });

    it('should return error if cards have been played', async () => {
      const creator = new Player({
        id: 'creator-1',
        name: 'Creator',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', creator);
      const gameWithCard = game.addCardToPile('ascending1', new Card(10, 'hearts'));
      const gameWithPlayers = new Game({
        ...gameWithCard,
        players: Object.freeze([creator, player2]),
        status: 'playing' as const,
        currentTurn: 'creator-1',
      });

      mockGameRepository.findById.mockResolvedValue(gameWithPlayers);

      const result = await setStartingPlayerUseCase.execute({
        gameId: 'game-1',
        playerId: 'creator-1',
        startingPlayerId: 'player-2',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Cannot change starting player after cards have been played');
      }
    });

    it('should return error if game is finished', async () => {
      const creator = new Player({
        id: 'creator-1',
        name: 'Creator',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', creator);
      const gameWithPlayers = new Game({
        ...game,
        players: Object.freeze([creator, player2]),
        status: 'finished' as const,
        currentTurn: null,
      });

      mockGameRepository.findById.mockResolvedValue(gameWithPlayers);

      const result = await setStartingPlayerUseCase.execute({
        gameId: 'game-1',
        playerId: 'creator-1',
        startingPlayerId: 'player-2',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Cannot set starting player for a finished or abandoned game');
      }
    });

    it('should return error if starting player does not exist in game', async () => {
      const creator = new Player({
        id: 'creator-1',
        name: 'Creator',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', creator);
      const gameWithPlayers = new Game({
        ...game,
        players: Object.freeze([creator]),
        status: 'waiting' as const,
        currentTurn: null,
      });

      mockGameRepository.findById.mockResolvedValue(gameWithPlayers);

      const result = await setStartingPlayerUseCase.execute({
        gameId: 'game-1',
        playerId: 'creator-1',
        startingPlayerId: 'non-existent',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Starting player not found in game');
      }
    });

    it('should handle repository errors', async () => {
      const creator = new Player({
        id: 'creator-1',
        name: 'Creator',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', creator);
      const gameWithPlayers = new Game({
        ...game,
        players: Object.freeze([creator, player2]),
        status: 'waiting' as const,
        currentTurn: null,
      });

      mockGameRepository.findById.mockResolvedValue(gameWithPlayers);
      mockGameRepository.save.mockRejectedValue(new Error('Database error'));

      const result = await setStartingPlayerUseCase.execute({
        gameId: 'game-1',
        playerId: 'creator-1',
        startingPlayerId: 'player-2',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to set starting player');
      }
    });
  });
});

