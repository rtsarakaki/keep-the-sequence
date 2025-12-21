import { EndTurnUseCase } from './EndTurnUseCase';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game, GameStatus } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';
import { GameInitializer } from '../../domain/services/GameInitializer';
import * as GameRules from '../../domain/services/GameRules';

describe('EndTurnUseCase', () => {
  let mockGameRepository: jest.Mocked<IGameRepository>;
  let endTurnUseCase: EndTurnUseCase;

  beforeEach(() => {
    mockGameRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    endTurnUseCase = new EndTurnUseCase(mockGameRepository);
    
    // Reset mocks for GameRules
    jest.spyOn(GameRules, 'getMinimumCardsToPlay').mockReturnValue(2);
    jest.spyOn(GameRules, 'canPlayerPlayAnyCard').mockReturnValue(true);
    jest.spyOn(GameRules, 'areAllHandsEmpty').mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    it('should successfully end vez and pass to next player', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts'), new Card(20, 'spades')],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [new Card(30, 'hearts')],
        isConnected: true,
      });
      
      const game = GameInitializer.createGame('game-1', player1);
      const gameWithTwoPlayers = new Game({
        ...game,
        players: Object.freeze([player1, player2]),
        status: 'playing' as GameStatus,
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 2, // Player has played minimum (2 cards when deck has cards)
        deck: [new Card(50, 'hearts')], // Deck has cards, so minimum is 2
      });

      mockGameRepository.findById.mockResolvedValue(gameWithTwoPlayers);
      mockGameRepository.save.mockResolvedValue(undefined);

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.currentTurn).toBe('player-2');
        expect(result.value.cardsPlayedThisTurn).toBe(0); // Reset when vez changes
      }
      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return error if game does not exist', async () => {
      mockGameRepository.findById.mockResolvedValue(null);

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Game not found');
      }
    });

    it('should return error if game is not in playing status', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const game = GameInitializer.createGame('game-1', player);
      const waitingGame = game.updateStatus('waiting');

      mockGameRepository.findById.mockResolvedValue(waitingGame);

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Game is not in playing status');
      }
    });

    it('should return error if it is not the player\'s vez', async () => {
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
      const playingGame = new Game({
        ...game,
        players: Object.freeze([player1, player2]),
        status: 'playing' as GameStatus,
        currentTurn: 'player-2', // Not player-1's vez
        cardsPlayedThisTurn: 0,
      });

      mockGameRepository.findById.mockResolvedValue(playingGame);

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBe('Não é sua vez');
      }
    });

    it('should return error if player has not played minimum cards (deck has cards)', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });
      
      const game = GameInitializer.createGame('game-1', player);
      const playingGame = new Game({
        ...game,
        status: 'playing' as GameStatus,
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 1, // Only 1 card, but minimum is 2 when deck has cards
        deck: [new Card(50, 'hearts')], // Deck has cards
      });

      mockGameRepository.findById.mockResolvedValue(playingGame);

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Você deve jogar pelo menos 2 cartas');
      }
    });

    it('should return error if player has not played minimum cards (deck empty)', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });
      
      const game = GameInitializer.createGame('game-1', player);
      const playingGame = new Game({
        ...game,
        status: 'playing' as GameStatus,
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 0, // No cards played, minimum is 1 when deck is empty
        deck: [], // Deck is empty
      });

      // Mock minimum cards to return 1 when deck is empty
      jest.spyOn(GameRules, 'getMinimumCardsToPlay').mockReturnValue(1);

      mockGameRepository.findById.mockResolvedValue(playingGame);

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Você deve jogar pelo menos 1 carta');
      }
    });

    it('should end game in defeat if player cannot play minimum required cards', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')], // Has cards
        isConnected: true,
      });
      
      const game = GameInitializer.createGame('game-1', player);
      // Add high cards to all piles so player cannot play
      const gameWithHighCards = game
        .addCardToPile('ascending1', new Card(99, 'spades'))
        .addCardToPile('ascending2', new Card(99, 'hearts'))
        .addCardToPile('descending1', new Card(2, 'spades'))
        .addCardToPile('descending2', new Card(2, 'hearts'));
      
      const playingGame = new Game({
        ...gameWithHighCards,
        status: 'playing' as GameStatus,
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 0, // Hasn't played minimum
        deck: [new Card(50, 'hearts')], // Deck has cards, so minimum is 2
      });

      // Mock to return false - player cannot play any card
      jest.spyOn(GameRules, 'canPlayerPlayAnyCard').mockReturnValue(false);
      jest.spyOn(GameRules, 'getMinimumCardsToPlay').mockReturnValue(2);

      mockGameRepository.findById.mockResolvedValue(playingGame);
      mockGameRepository.save.mockResolvedValue(undefined);

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('finished');
      }
      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should end game in victory if all players have empty hands', async () => {
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
      
      const game = GameInitializer.createGame('game-1', player1);
      const playingGame = new Game({
        ...game,
        players: Object.freeze([player1, player2]),
        status: 'playing' as GameStatus,
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 1, // Has played minimum
        deck: [], // Deck is empty, so minimum is 1
      });

      // Mock to return true - all hands are empty
      jest.spyOn(GameRules, 'areAllHandsEmpty').mockReturnValue(true);
      jest.spyOn(GameRules, 'getMinimumCardsToPlay').mockReturnValue(1);

      mockGameRepository.findById.mockResolvedValue(playingGame);
      mockGameRepository.save.mockResolvedValue(undefined);

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('finished');
      }
      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should end game in defeat when passing turn to a player who cannot play', async () => {
      const player1 = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(50, 'hearts')], // Has cards
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player-2',
        name: 'Player 2',
        hand: [new Card(10, 'spades')], // Has cards but cannot play
        isConnected: true,
      });
      
      const game = GameInitializer.createGame('game-1', player1);
      // Add high cards to all piles so player2 cannot play
      const gameWithHighCards = game
        .addCardToPile('ascending1', new Card(99, 'spades'))
        .addCardToPile('ascending2', new Card(99, 'hearts'))
        .addCardToPile('descending1', new Card(2, 'spades'))
        .addCardToPile('descending2', new Card(2, 'hearts'));
      
      const playingGame = new Game({
        ...gameWithHighCards,
        players: Object.freeze([player1, player2]),
        status: 'playing' as GameStatus,
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 2, // Has played minimum (2 cards)
        deck: [new Card(60, 'hearts')], // Deck has cards, so minimum is 2
      });

      // Mock getMinimumCardsToPlay to return 2
      jest.spyOn(GameRules, 'getMinimumCardsToPlay').mockReturnValue(2);
      jest.spyOn(GameRules, 'areAllHandsEmpty').mockReturnValue(false);
      
      // Mock shouldGameEndInDefeat to return true when it's player2's turn
      // This simulates the scenario where player2 cannot play any card
      jest.spyOn(GameRules, 'shouldGameEndInDefeat').mockImplementation((gameState) => {
        return gameState.currentTurn === 'player-2';
      });

      mockGameRepository.findById.mockResolvedValue(playingGame);
      mockGameRepository.save.mockResolvedValue(undefined);

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.status).toBe('finished');
        expect(result.value.currentTurn).toBe('player-2'); // Turn was passed to player2
      }
      expect(mockGameRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      
      const game = GameInitializer.createGame('game-1', player);
      const playingGame = new Game({
        ...game,
        status: 'playing' as GameStatus,
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 1,
        deck: [], // Deck is empty, so minimum is 1
      });

      // Mock minimum cards to return 1 when deck is empty
      jest.spyOn(GameRules, 'getMinimumCardsToPlay').mockReturnValue(1);

      mockGameRepository.findById.mockResolvedValue(playingGame);
      mockGameRepository.save.mockRejectedValue(new Error('Database error'));

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Falha ao passar a vez');
      }
    });

    it('should handle non-Error exceptions', async () => {
      mockGameRepository.findById.mockRejectedValue('String error');

      const result = await endTurnUseCase.execute({
        gameId: 'game-1',
        playerId: 'player-1',
      });

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toContain('Falha ao passar a vez');
      }
    });
  });
});

