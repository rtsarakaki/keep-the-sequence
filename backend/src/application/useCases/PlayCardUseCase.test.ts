import { PlayCardUseCase } from './PlayCardUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';
import { GameInitializer } from '../../domain/services/GameInitializer';

describe('PlayCardUseCase', () => {
  let mockGameRepository: jest.Mocked<IGameRepository>;
  let playCardUseCase: PlayCardUseCase;

  beforeEach(() => {
    mockGameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    playCardUseCase = new PlayCardUseCase(mockGameRepository);
  });

  describe('execute', () => {
    it('should play a valid card on ascending pile', async () => {
      // Create a game with a player
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      
      // Get a card from player's hand (which was dealt by GameInitializer)
      const cardToPlay = game.players[0].hand[0];
      if (!cardToPlay) {
        throw new Error('Player should have cards');
      }
      
      // Add a lower card to ascending pile to make the play valid
      // For ascending pile: card must be > lastCard OR card === lastCard - 10
      // So we add a card that is at least 1 less than cardToPlay
      // This ensures cardToPlay.value > lowerCard.value (valid play)
      const lowerCardValue = Math.max(2, cardToPlay.value - 1);
      const lowerCard = new Card(lowerCardValue, 'spades');
      const gameWithPile = game.addCardToPile('ascending1', lowerCard);
      const playingGame = gameWithPile.updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        card: cardToPlay,
        pileId: 'ascending1' as const,
      };

      const result = await playCardUseCase.execute(dto);

      if (!result.isSuccess) {
        console.error('Test failed:', result.error);
      }
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        // Card should be removed from hand
        const playerAfter = result.value.players.find(p => p.id === 'player-1');
        expect(playerAfter?.hand).not.toContainEqual(cardToPlay);
        
        // Card should be added to pile
        expect(result.value.piles.ascending1).toContainEqual(cardToPlay);
        
        expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
      }
    });

    it('should play a valid card on descending pile', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      
      // Get a card from player's hand
      const cardToPlay = game.players[0].hand[0];
      if (!cardToPlay) {
        throw new Error('Player should have cards');
      }
      
      // Add a higher card to descending pile to make the play valid
      // For descending pile: card must be < lastCard OR card === lastCard + 10
      // So we need: cardToPlay.value < higherCard.value
      // Ensure higherCard is at least 1 more than cardToPlay, but not more than 99
      // If cardToPlay is 99, we can't have a higher card, so use a different approach:
      // Use a card that is definitely higher (but if cardToPlay is 99, we need to use the special rule)
      const higherCardValue = cardToPlay.value >= 99 
        ? 89 // Use 89 so that 99 === 89 + 10 (special rule)
        : Math.min(99, cardToPlay.value + 1); // Otherwise, just 1 more
      const higherCard = new Card(higherCardValue, 'spades');
      const gameWithPile = game.addCardToPile('descending1', higherCard);
      const playingGame = gameWithPile.updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        card: cardToPlay,
        pileId: 'descending1' as const,
      };

      const result = await playCardUseCase.execute(dto);

      if (!result.isSuccess) {
        console.error('Test failed:', result.error);
      }
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.piles.descending1).toContainEqual(cardToPlay);
      }
    });

    it('should return error if game does not exist', async () => {
      mockGameRepository.findById = jest.fn().mockResolvedValue(null);

      const dto = {
        gameId: 'non-existent',
        playerId: 'player-1',
        card: new Card(20, 'hearts'),
        pileId: 'ascending1' as const,
      };

      const result = await playCardUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Game not found');
      }
    });

    it('should return error if player is not in the game', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      const playingGame = game.updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);

      const dto = {
        gameId: 'game-1',
        playerId: 'non-existent-player',
        card: new Card(20, 'hearts'),
        pileId: 'ascending1' as const,
      };

      const result = await playCardUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Player not found');
      }
    });

    it('should return error if card is not in player hand', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      const playingGame = game.updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);

      // Create a card that definitely won't be in the player's hand
      // (player has 6 cards from deck, so we use a card with value 1 which doesn't exist in deck)
      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        card: new Card(1, 'spades'), // Card not in hand (deck starts at 2)
        pileId: 'ascending1' as const,
      };

      const result = await playCardUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Card not in player hand');
      }
    });

    it('should return error if card cannot be played on pile', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      
      // Get a card from player's hand
      const cardToPlay = game.players[0].hand[0];
      if (!cardToPlay) {
        throw new Error('Player should have cards');
      }
      
      // Add a card much higher than what player wants to play
      // Make sure the difference is > 10 to avoid the special rule (exactly 10 units difference)
      // For ascending pile: card must be > lastCard OR exactly lastCard - 10
      // So we need: cardToPlay.value < higherCard.value - 10 (not equal to higherCard.value - 10)
      const higherCardValue = Math.min(99, cardToPlay.value + 25); // +25 ensures difference > 10
      const higherCard = new Card(higherCardValue, 'spades');
      const gameWithPile = game.addCardToPile('ascending1', higherCard);
      const playingGame = gameWithPile.updateStatus('playing');

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        card: cardToPlay, // Too low for ascending pile with higher card
        pileId: 'ascending1' as const,
      };

      const result = await playCardUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Cannot play card');
      }
    });

    it('should allow playing card on empty pile', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      const playingGame = game.updateStatus('playing');
      
      // Get a card from player's hand
      const cardToPlay = playingGame.players[0].hand[0];
      if (!cardToPlay) {
        throw new Error('Player should have cards');
      }

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      mockGameRepository.save = jest.fn().mockResolvedValue(undefined);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        card: cardToPlay,
        pileId: 'ascending1' as const,
      };

      const result = await playCardUseCase.execute(dto);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.piles.ascending1).toContainEqual(cardToPlay);
      }
    });

    it('should return error if game is not in playing status', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(20, 'hearts')],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      const waitingGame = game.updateStatus('waiting');

      mockGameRepository.findById = jest.fn().mockResolvedValue(waitingGame);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        card: new Card(20, 'hearts'),
        pileId: 'ascending1' as const,
      };

      const result = await playCardUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Game is not in playing status');
      }
    });

    it('should return error if repository save fails', async () => {
      // Create a game with a player
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      const playingGame = game.updateStatus('playing');
      
      // Get a card from player's hand
      const cardToPlay = playingGame.players[0].hand[0];
      if (!cardToPlay) {
        throw new Error('Player should have cards');
      }

      mockGameRepository.findById = jest.fn().mockResolvedValue(playingGame);
      const error = new Error('Database error');
      mockGameRepository.save = jest.fn().mockRejectedValue(error);

      const dto = {
        gameId: 'game-1',
        playerId: 'player-1',
        card: cardToPlay,
        pileId: 'ascending1' as const,
      };

      const result = await playCardUseCase.execute(dto);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Failed to play card');
      }
    });
  });
});

