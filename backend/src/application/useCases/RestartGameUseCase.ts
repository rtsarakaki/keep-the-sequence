import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { GameInitializer } from '../../domain/services/GameInitializer';
import { Result, success, failure } from './Result';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';

export interface RestartGameDTO {
  gameId: string;
  playerId: string;
}

/**
 * Use Case: Restart a finished game
 * 
 * Restarts a finished game by:
 * 1. Collecting all cards (from deck, players' hands, and piles)
 * 2. Shuffling the deck
 * 3. Redistributing cards to all players
 * 4. Resetting piles to initial state
 * 5. Resetting game state (status, turn, etc.)
 * 6. Keeping all players
 */
export class RestartGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(dto: RestartGameDTO): Promise<Result<Game>> {
    try {
      // Find game
      const game = await this.gameRepository.findById(dto.gameId);

      if (!game) {
        return failure('Game not found');
      }

      // Validate game is finished
      if (game.status !== 'finished') {
        return failure('Game must be finished to restart');
      }

      // Validate player is in the game
      const player = game.players.find(p => p.id === dto.playerId);
      if (!player) {
        return failure('Player not found in game');
      }

      // Collect all cards from:
      // 1. Current deck
      // 2. All players' hands
      // 3. All piles (except the initial starting cards: 1 and 100)
      const allCards: Array<{ value: number; suit: string }> = [];

      // Add cards from deck
      allCards.push(...game.deck.map(c => ({ value: c.value, suit: c.suit })));

      // Add cards from players' hands
      for (const p of game.players) {
        allCards.push(...p.hand.map(c => ({ value: c.value, suit: c.suit })));
      }

      // Add cards from piles (skip the first card in each pile as they are the starting cards)
      for (const pile of [
        ...game.piles.ascending1.slice(1),
        ...game.piles.ascending2.slice(1),
        ...game.piles.descending1.slice(1),
        ...game.piles.descending2.slice(1),
      ]) {
        allCards.push({ value: pile.value, suit: pile.suit });
      }

      // Add cards from discard pile if any
      if (game.discardPile) {
        allCards.push(...game.discardPile.map(c => ({ value: c.value, suit: c.suit })));
      }

      // Convert back to Card objects
      const cardObjects = allCards.map(c => new Card(c.value, c.suit));

      // Shuffle the deck
      const shuffledDeck = GameInitializer.shuffleDeck(cardObjects);

      // Deal cards to all players
      const numPlayers = game.players.length;
      const { hands, remainingDeck } = GameInitializer.dealCards(shuffledDeck, numPlayers);

      // Update players with new hands
      const updatedPlayers = game.players.map((p, index) => {
        return new Player({
          id: p.id,
          name: p.name,
          hand: hands[index],
          isConnected: p.isConnected, // Keep connection status
        });
      });

      // Reset piles to initial state
      const initialPiles = GameInitializer.createInitialPiles();

      // Determine new status: 'playing' if 2+ players, 'waiting' if only 1
      const newStatus = numPlayers >= 2 ? 'playing' : 'waiting';

      // Create restarted game
      const now = new Date();
      const restartedGame = new Game({
        id: game.id,
        players: Object.freeze(updatedPlayers),
        piles: initialPiles,
        deck: remainingDeck,
        discardPile: Object.freeze([]),
        currentTurn: newStatus === 'playing' ? game.players[0].id : null, // Start with first player if playing
        cardsPlayedThisTurn: 0,
        createdBy: game.createdBy, // Keep original creator
        status: newStatus,
        difficulty: game.difficulty, // Keep original difficulty
        createdAt: game.createdAt, // Keep original creation date
        updatedAt: now,
        pilePreferences: {}, // Reset pile preferences
        ttl: game.ttl, // Keep original TTL
      });

      // Save restarted game
      await this.gameRepository.save(restartedGame);

      return success(restartedGame);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Failed to restart game: ${errorMessage}`);
    }
  }
}
