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

      // Deal cards to the new player based on current number of players
      const numPlayersAfterJoin = existingGame.players.length + 1;
      const { hands, remainingDeck } = GameInitializer.dealCards(
        existingGame.deck,
        numPlayersAfterJoin
      );

      // Get cards for the new player (last hand in the array)
      const newPlayerHand = hands[hands.length - 1];

      // Create new player
      const newPlayer = new Player({
        id: playerId,
        name: dto.playerName,
        hand: newPlayerHand,
        isConnected: false,
      });

      // Add player to game and update deck
      const gameWithNewPlayer = existingGame.addPlayer(newPlayer);
      
      // Create updated game with new deck (Game is immutable, so we create a new instance)
      const gameWithUpdatedDeck = new Game({
        id: gameWithNewPlayer.id,
        players: gameWithNewPlayer.players,
        piles: gameWithNewPlayer.piles,
        deck: remainingDeck,
        discardPile: gameWithNewPlayer.discardPile,
        currentTurn: gameWithNewPlayer.currentTurn,
        status: gameWithNewPlayer.status,
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

