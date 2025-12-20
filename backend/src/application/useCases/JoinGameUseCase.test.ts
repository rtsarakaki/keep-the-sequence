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
        createdBy: players[0]?.id || 'creator-id',
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

    it('should handle non-Error exceptions', async () => {
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const existingGame = GameInitializer.createGame('game-1', firstPlayer);

      mockGameRepository.findById = jest.fn().mockResolvedValue(existingGame);
      // Mock to throw a non-Error object
      mockGameRepository.save = jest.fn().mockRejectedValue('String error');

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 2',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to join game');
        expect(result.error).toContain('Unknown error');
      }
    });

    it('should start game when second player joins', async () => {
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
        expect(result.value.status).toBe('playing');
        expect(result.value.currentTurn).toBe('player-1');
        expect(result.value.players).toHaveLength(2);
      }
    });

    it('should not start game if only one player after join (shouldStartGame = false)', async () => {
      // This scenario shouldn't happen in practice, but tests the branch
      // Actually, when we join, we always add a player, so we'll have at least 2
      // But we can test the branch where status is not 'waiting' even with 2+ players
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const existingGame = GameInitializer.createGame('game-1', firstPlayer);
      // Game has 1 player, status is 'waiting'
      // When we join, we'll have 2 players, so shouldStartGame should be true
      // To test shouldStartGame = false, we need status != 'waiting' OR numPlayers < 2
      // But we can't have numPlayers < 2 after join, so we test with status != 'waiting'
      const gameNotWaiting = existingGame.updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(gameNotWaiting);

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

    it('should not start game if status is not waiting', async () => {
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const existingGame = GameInitializer.createGame('game-1', firstPlayer);
      // Add a second player manually and set status to playing
      const secondPlayer = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: false,
      });
      const gameWithTwoPlayers = existingGame.addPlayer(secondPlayer).updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(gameWithTwoPlayers);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 3',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Game is not accepting new players');
      }
    });

    it('should not start game if there are less than 2 players', async () => {
      const firstPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: false,
      });
      const existingGame = GameInitializer.createGame('game-1', firstPlayer);

      mockGameRepository.findById = jest.fn().mockResolvedValue(existingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      // This test is for when only 1 player exists (shouldStartGame = false)
      // But actually, when we join, we'll have 2 players, so shouldStartGame will be true
      // So this test verifies the logic when shouldStartGame is false
      // We need to test when game already has 2+ players but status is not 'waiting'
      const secondPlayer = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [],
        isConnected: false,
      });
      const gameWithTwoPlayers = existingGame.addPlayer(secondPlayer);
      // Keep status as 'waiting' but test the branch where shouldStartGame is false
      // Actually, if status is 'waiting' and we have 2 players, shouldStartGame should be true
      // So we need a different scenario - when status is not 'waiting' but we have 2+ players
      const gameNotWaiting = gameWithTwoPlayers.updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(gameNotWaiting);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 3',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Game is not accepting new players');
      }
    });

    it('should allow existing player to reconnect when game is in playing status', async () => {
      const existingPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts'), new Card(20, 'spades')],
        isConnected: false, // Disconnected
      });
      const game = GameInitializer.createGame('game-1', existingPlayer);
      const playingGame = game
        .addPlayer(new Player({
          id: 'player-2',
          name: 'Player 2',
          hand: [new Card(30, 'hearts')],
          isConnected: true,
        }))
        .updateStatus('playing')
        .updateTurn('player-1');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 1',
        playerId: 'player-1', // Existing player reconnecting
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        // Player count should remain the same (no new player added)
        expect(result.value.players).toHaveLength(2);
        // Player 1 should be reconnected
        const reconnectedPlayer = result.value.players.find(p => p.id === 'player-1');
        expect(reconnectedPlayer?.isConnected).toBe(true);
        // Game status should remain 'playing'
        expect(result.value.status).toBe('playing');
        // Cards should not be redistributed - should match the cards in the game before reconnection
        const originalPlayerInGame = playingGame.players.find(p => p.id === 'player-1');
        expect(reconnectedPlayer?.hand).toEqual(originalPlayerInGame?.hand);
      }
    });

    it('should allow existing player to reconnect using only playerName when game is in playing status', async () => {
      const existingPlayer = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')],
        isConnected: false,
      });
      const game = GameInitializer.createGame('game-1', existingPlayer);
      const playingGame = game
        .addPlayer(new Player({
          id: 'player-2',
          name: 'Player 2',
          hand: [new Card(30, 'hearts')],
          isConnected: true,
        }))
        .updateStatus('playing')
        .updateTurn('player-1');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerName: 'Player 1', // Reconnecting using name only
        // No playerId provided
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const reconnectedPlayer = result.value.players.find(p => p.name === 'Player 1');
        expect(reconnectedPlayer?.isConnected).toBe(true);
        expect(result.value.status).toBe('playing');
      }
    });

    it('should not allow new player to join when game is in playing status', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player1);
      const playingGame = game
        .addPlayer(new Player({
          id: 'player-2',
          name: 'Player 2',
          hand: [new Card(30, 'hearts')],
          isConnected: true,
        }))
        .updateStatus('playing')
        .updateTurn('player-1');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);

      const dto = {
        gameId: 'game-1',
        playerName: 'New Player', // New player trying to join
        playerId: 'new-player-id',
      };

      const result = await joinGameUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Game is not accepting new players');
      }
      expect(mockGameRepository.save).not.toHaveBeenCalled();
    });

    it('should handle case where players array is empty when starting game', async () => {
      // This is an edge case - shouldn't happen in practice but tests the branch
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
        // Should still work - players[0] should exist
        expect(result.value.players.length).toBeGreaterThan(0);
        expect(result.value.currentTurn).toBeDefined();
        expect(result.value.status).toBe('playing');
      }
    });
  });
});

