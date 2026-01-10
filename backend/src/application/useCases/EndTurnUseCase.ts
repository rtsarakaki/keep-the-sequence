import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { Result, success, failure } from './Result';
import {
  getMinimumCardsToPlay,
  canPlayerPlayAnyCard,
  areAllHandsEmpty,
  shouldGameEndInDefeat,
  findNextPlayerWithCards,
} from '../../domain/services/GameRules';

export interface EndTurnDTO {
  gameId: string;
  playerId: string;
}

/**
 * Use Case: End a player's vez
 *
 * Validates and executes ending a vez:
 * 1. Validates game exists and is in playing status
 * 2. Validates it's the player's vez
 * 3. Validates player has played minimum required cards
 * 4. Checks if player can play more cards (for defeat detection)
 * 5. Checks if all players have empty hands (victory condition)
 * 6. Passes vez to next player or ends game
 */
export class EndTurnUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(dto: EndTurnDTO): Promise<Result<Game>> {
    try {
      // Find game
      const game = await this.gameRepository.findById(dto.gameId);

      if (!game) {
        return failure('Game not found');
      }

      // Validate game status
      if (game.status !== 'playing') {
        return failure('Game is not in playing status');
      }

      // Validate it's the player's vez
      if (game.currentTurn !== dto.playerId) {
        return failure('Não é sua vez');
      }

      // Find current player
      const currentPlayer = game.players.find(p => p.id === dto.playerId);
      if (!currentPlayer) {
        return failure('Player not found in game');
      }

      // Calculate minimum cards required
      const minimumCards = getMinimumCardsToPlay(game.deck.length);

      // Validate player has played minimum cards
      if (game.cardsPlayedThisTurn < minimumCards) {
        // Check if player can play the required minimum
        // If player has cards but can't play the minimum, game ends in defeat
        if (currentPlayer.hand.length > 0) {
          const canPlayMinimum = canPlayerPlayAnyCard(currentPlayer.hand, game.piles);
          if (!canPlayMinimum) {
            // Player has cards but can't play the minimum required - game ends in defeat
            const defeatedGame = game.updateStatus('finished');
            await this.gameRepository.save(defeatedGame);
            return success(defeatedGame);
          }
        }
        
        // Player hasn't played minimum but can still play - return error
          return failure(
            `Você deve jogar pelo menos ${minimumCards} carta${minimumCards > 1 ? 's' : ''} antes de passar a vez`
          );
      }

      // In hard mode, draw cards to replenish hand before passing turn
      // Calculate how many cards the player should have based on number of players
      let gameAfterDraw = game;
      if (game.difficulty === 'hard') {
        const numPlayers = game.players.length;
        const cardsPerPlayer: Record<number, number> = {
          2: 6,
          3: 6,
          4: 6,
          5: 5,
        };
        const targetHandSize = cardsPerPlayer[numPlayers] || 6;
        const currentHandSize = currentPlayer.hand.length;
        const cardsToDraw = Math.max(0, targetHandSize - currentHandSize);

        // Draw cards until hand is full or deck is empty
        for (let i = 0; i < cardsToDraw && gameAfterDraw.deck.length > 0; i++) {
          gameAfterDraw = gameAfterDraw.drawCardForPlayer(dto.playerId);
        }
      }

      // Check victory condition: all players have empty hands
      if (areAllHandsEmpty(gameAfterDraw.players)) {
        const victoriousGame = gameAfterDraw.updateStatus('finished');
        await this.gameRepository.save(victoriousGame);
        return success(victoriousGame);
      }

      // Pass vez to next player with cards (skip players with empty hands)
      const currentPlayerIndex = gameAfterDraw.players.findIndex(p => p.id === dto.playerId);
      const nextPlayer = findNextPlayerWithCards(gameAfterDraw.players, currentPlayerIndex);

      // If no player has cards, game should have been detected as victory above
      // But handle this case defensively
      if (!nextPlayer) {
        const victoriousGame = game.updateStatus('finished');
        await this.gameRepository.save(victoriousGame);
        return success(victoriousGame);
      }

      const gameWithNextTurn = gameAfterDraw.updateTurn(nextPlayer.id);

      // Check if next player can play (automatic defeat detection)
      // This ensures the game ends immediately if the next player cannot make the minimum required plays
      if (shouldGameEndInDefeat({
        currentTurn: gameWithNextTurn.currentTurn,
        cardsPlayedThisTurn: gameWithNextTurn.cardsPlayedThisTurn,
        deck: gameWithNextTurn.deck,
        players: gameWithNextTurn.players,
        piles: gameWithNextTurn.piles,
        pilePreferences: gameWithNextTurn.pilePreferences,
      })) {
        const defeatedGame = gameWithNextTurn.updateStatus('finished');
        await this.gameRepository.save(defeatedGame);
        return success(defeatedGame);
      }

      // Save updated game
      await this.gameRepository.save(gameWithNextTurn);

      return success(gameWithNextTurn);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Falha ao passar a vez: ${errorMessage}`);
    }
  }
}

