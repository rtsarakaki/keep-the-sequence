import { MarkPilePreferenceUseCase } from './MarkPilePreferenceUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Player } from '../../domain/entities/Player';
import { GameInitializer } from '../../domain/services/GameInitializer';

describe('MarkPilePreferenceUseCase', () => {
  let mockGameRepository: jest.Mocked<IGameRepository>;
  let markPilePreferenceUseCase: MarkPilePreferenceUseCase;

  beforeEach(() => {
    mockGameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    markPilePreferenceUseCase = new MarkPilePreferenceUseCase(mockGameRepository);
  });

  describe('execute', () => {
    it('should successfully mark a pile preference', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', player1);
      const gameWithTwoPlayers = game.addPlayer(player2);
      const playingGame = gameWithTwoPlayers
        .updateStatus('playing')
        .updateTurn('player-2'); // player-2's turn, so player-1 can mark preferences

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        pileId: 'ascending1' as const,
      };

      const result = await markPilePreferenceUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.pilePreferences['player-1']).toBe('ascending1');
        expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
      }
    });

    it('should successfully remove a pile preference when pileId is null', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', player1);
      const gameWithTwoPlayers = game.addPlayer(player2);
      const playingGame = gameWithTwoPlayers
        .updateStatus('playing')
        .updateTurn('player-2')
        .markPilePreference('player-1', 'ascending1'); // Already marked

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        pileId: null,
      };

      const result = await markPilePreferenceUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.pilePreferences['player-1']).toBeNull();
        expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
      }
    });

    it('should return error if game does not exist', async () => {
      mockGameRepository.findById = jest.fn().mockResolvedValue(null);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        pileId: 'ascending1' as const,
      };

      const result = await markPilePreferenceUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Game not found');
      }
    });

    it('should return error if game is not in playing status', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', player1);
      const waitingGame = game.updateStatus('waiting');

      mockGameRepository.findById = jest.fn().mockResolvedValue(waitingGame);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        pileId: 'ascending1' as const,
      };

      const result = await markPilePreferenceUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Game is not in playing status');
      }
    });

    it('should return error if player is not in the game', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', player1);
      const gameWithTwoPlayers = game.addPlayer(player2);
      const playingGame = gameWithTwoPlayers
        .updateStatus('playing')
        .updateTurn('player-2');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-3', // Not in game
        pileId: 'ascending1' as const,
      };

      const result = await markPilePreferenceUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Player not found in game');
      }
    });

    it('should return error if it is the player\'s turn', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', player1);
      const gameWithTwoPlayers = game.addPlayer(player2);
      const playingGame = gameWithTwoPlayers
        .updateStatus('playing')
        .updateTurn('player-1'); // player-1's turn, so they can't mark preferences

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        pileId: 'ascending1' as const,
      };

      const result = await markPilePreferenceUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Você não pode marcar preferência durante sua vez');
      }
    });

    it('should return error if pile ID is invalid', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', player1);
      const gameWithTwoPlayers = game.addPlayer(player2);
      const playingGame = gameWithTwoPlayers
        .updateStatus('playing')
        .updateTurn('player-2');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        pileId: 'invalidPile' as any, // Invalid pile ID
      };

      const result = await markPilePreferenceUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Invalid pile ID');
      }
    });

    it('should handle repository errors', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', player1);
      const gameWithTwoPlayers = game.addPlayer(player2);
      const playingGame = gameWithTwoPlayers
        .updateStatus('playing')
        .updateTurn('player-2');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockRejectedValue(new Error('Database error'));

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        pileId: 'ascending1' as const,
      };

      const result = await markPilePreferenceUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Falha ao marcar preferência de pilha');
      }
    });

    it('should handle non-Error exceptions', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: true,
      });

      const game = GameInitializer.createGame('game-1', player1);
      const gameWithTwoPlayers = game.addPlayer(player2);
      const playingGame = gameWithTwoPlayers
        .updateStatus('playing')
        .updateTurn('player-2');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockRejectedValue('String error');

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        pileId: 'ascending1' as const,
      };

      const result = await markPilePreferenceUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Falha ao marcar preferência de pilha');
      }
    });
  });
});

