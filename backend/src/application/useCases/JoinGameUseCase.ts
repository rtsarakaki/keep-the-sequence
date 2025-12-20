import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { JoinGameDTO } from '../dto/JoinGameDTO';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { GameInitializer } from '../../domain/services/GameInitializer';
import { Result, success, failure } from './Result';
import { randomUUID } from 'crypto';

/**
 * Use Case: Join an existing game
 * 
 * Adds a new player to an existing game, deals cards to the new player,
 * and updates the game state.
 */
export class JoinGameUseCase {
  private readonly MAX_PLAYERS = 5;

  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(dto: JoinGameDTO): Promise<Result<Game>> {
    try {
      // Find existing game
      const existingGame = await this.gameRepository.findById(dto.gameId);

      if (!existingGame) {
        return failure('Game not found');
      }

      // Validate game can accept new players
      if (existingGame.status !== 'waiting') {
        return failure('Game is not accepting new players');
      }

      if (existingGame.players.length >= this.MAX_PLAYERS) {
        return failure('Game is full (maximum 5 players)');
      }

      // Generate player ID if not provided
      const playerId = dto.playerId || randomUUID();

      // When a new player joins, we need to redistribute cards for all players
      // Collect all cards from existing players' hands back to the deck
      const allCards = [
        ...existingGame.deck,
        ...existingGame.players.flatMap(p => p.hand),
      ];

      // Shuffle the combined deck
      const shuffledDeck = GameInitializer.shuffleDeck(allCards);

      // Deal cards to all players (including the new one)
      const numPlayersAfterJoin = existingGame.players.length + 1;
      const { hands, remainingDeck } = GameInitializer.dealCards(
        shuffledDeck,
        numPlayersAfterJoin
      );

      // Update existing players with new hands (redistribute cards)
      const updatedExistingPlayers = existingGame.players.map((player, index) => {
        return new Player({
          id: player.id,
          name: player.name,
          hand: hands[index],
          isConnected: player.isConnected,
        });
      });

      // Get cards for the new player (last hand in the array)
      const newPlayerHand = hands[hands.length - 1];

      // Create new player
      const newPlayer = new Player({
        id: playerId,
        name: dto.playerName,
        hand: newPlayerHand,
        isConnected: false,
      });

      // Create game with updated players
      const gameWithUpdatedPlayers = new Game({
        id: existingGame.id,
        players: Object.freeze([...updatedExistingPlayers, newPlayer]),
        piles: existingGame.piles,
        deck: existingGame.deck, // Will be updated below
        discardPile: existingGame.discardPile,
        currentTurn: existingGame.currentTurn,
        cardsPlayedThisTurn: existingGame.cardsPlayedThisTurn,
        status: existingGame.status,
        createdAt: existingGame.createdAt,
        updatedAt: existingGame.updatedAt,
        ttl: existingGame.ttl,
      });
      
      const gameWithNewPlayer = gameWithUpdatedPlayers;
      
      // Determine new game status and current turn
      // Game starts (status: 'playing') when there are at least 2 players
      const shouldStartGame = numPlayersAfterJoin >= 2 && gameWithNewPlayer.status === 'waiting';
      
      // If game should start, set status to 'playing' and assign first turn to first player
      const newStatus = shouldStartGame ? 'playing' as const : gameWithNewPlayer.status;
      const newCurrentTurn = shouldStartGame 
        ? gameWithNewPlayer.players[0]?.id || null 
        : gameWithNewPlayer.currentTurn;
      
      // Create updated game with new deck (Game is immutable, so we create a new instance)
      const gameWithUpdatedDeck = new Game({
        id: gameWithNewPlayer.id,
        players: gameWithNewPlayer.players,
        piles: gameWithNewPlayer.piles,
        deck: remainingDeck,
        discardPile: gameWithNewPlayer.discardPile,
        currentTurn: newCurrentTurn,
        cardsPlayedThisTurn: 0, // Reset when game starts
        status: newStatus,
        createdAt: gameWithNewPlayer.createdAt,
        updatedAt: new Date(),
        ttl: gameWithNewPlayer.ttl,
      });

      // Save updated game
      await this.gameRepository.save(gameWithUpdatedDeck);

      return success(gameWithUpdatedDeck);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Failed to join game: ${errorMessage}`);
    }
  }
}

