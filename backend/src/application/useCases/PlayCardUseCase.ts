import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { PlayCardDTO } from '../dto/PlayCardDTO';
import { Game } from '../../domain/entities/Game';
import { canPlayCard, shouldGameEndInDefeat, areAllHandsEmpty, findNextPlayerWithCards } from '../../domain/services/GameRules';
import { Result, success, failure } from './Result';

/**
 * Use Case: Play a card
 * 
 * Validates and executes a card play action:
 * 1. Validates game exists and is in playing status
 * 2. Validates player is in the game
 * 3. Validates card is in player's hand
 * 4. Validates card can be played on the pile (using GameRules)
 * 5. Removes card from hand and adds to pile
 * 6. Updates game state
 */
export class PlayCardUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(dto: PlayCardDTO): Promise<Result<Game>> {
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

      // Find player
      const player = game.players.find(p => p.id === dto.playerId);
      if (!player) {
        return failure('Player not found in game');
      }

      // Validate card is in player's hand
      const cardInHand = player.hand.find(
        c => c.value === dto.card.value && c.suit === dto.card.suit
      );
      if (!cardInHand) {
        return failure('Card not in player hand');
      }

      // Get target pile
      const targetPile = game.piles[dto.pileId];
      if (!targetPile) {
        return failure('Invalid pile ID');
      }

      // Determine pile direction
      const direction = dto.pileId.startsWith('ascending') ? 'ascending' : 'descending';

      // Validate card can be played using game rules
      if (!canPlayCard(dto.card, targetPile, direction)) {
        return failure(`Cannot play card ${dto.card.value} on ${dto.pileId} pile`);
      }

      // Remove card from player's hand
      const cardIndex = player.hand.findIndex(
        c => c.value === dto.card.value && c.suit === dto.card.suit
      );
      const { player: updatedPlayer } = player.removeCardFromHand(cardIndex);

      // Update player in game
      const gameWithUpdatedPlayer = game.updatePlayer(dto.playerId, () => updatedPlayer);

      // Add card to pile
      const gameWithCardPlayed = gameWithUpdatedPlayer.addCardToPile(dto.pileId, dto.card);

      // Draw a new card from deck if available
      const gameAfterDraw = gameWithCardPlayed.drawCardForPlayer(dto.playerId);

      // Check for automatic defeat condition: player cannot continue
      if (shouldGameEndInDefeat({
        currentTurn: gameAfterDraw.currentTurn,
        cardsPlayedThisTurn: gameAfterDraw.cardsPlayedThisTurn,
        deck: gameAfterDraw.deck,
        players: gameAfterDraw.players,
        piles: gameAfterDraw.piles,
        pilePreferences: gameAfterDraw.pilePreferences,
      })) {
        const defeatedGame = gameAfterDraw.updateStatus('finished');
        await this.gameRepository.save(defeatedGame);
        return success(defeatedGame);
      }

      // Check victory condition: all players have empty hands
      if (areAllHandsEmpty(gameAfterDraw.players)) {
        const victoriousGame = gameAfterDraw.updateStatus('finished');
        await this.gameRepository.save(victoriousGame);
        return success(victoriousGame);
      }

      // If current player has no cards left, automatically pass turn to next player with cards
      const currentPlayerAfterDraw = gameAfterDraw.players.find(p => p.id === dto.playerId);
      if (currentPlayerAfterDraw && currentPlayerAfterDraw.hand.length === 0) {
        const currentPlayerIndex = gameAfterDraw.players.findIndex(p => p.id === dto.playerId);
        const nextPlayer = findNextPlayerWithCards(gameAfterDraw.players, currentPlayerIndex);
        
        // If no player has cards, game should have been detected as victory above
        // But handle this case defensively
        if (!nextPlayer) {
          const victoriousGame = gameAfterDraw.updateStatus('finished');
          await this.gameRepository.save(victoriousGame);
          return success(victoriousGame);
        }
        
        // Pass turn to next player with cards
        const gameWithAutoPass = gameAfterDraw.updateTurn(nextPlayer.id);
        
        // Check if next player can play (automatic defeat detection)
        if (shouldGameEndInDefeat({
          currentTurn: gameWithAutoPass.currentTurn,
          cardsPlayedThisTurn: gameWithAutoPass.cardsPlayedThisTurn,
          deck: gameWithAutoPass.deck,
          players: gameWithAutoPass.players,
          piles: gameWithAutoPass.piles,
          pilePreferences: gameWithAutoPass.pilePreferences,
        })) {
          const defeatedGame = gameWithAutoPass.updateStatus('finished');
          await this.gameRepository.save(defeatedGame);
          return success(defeatedGame);
        }
        
        // Save updated game with auto-passed turn
        await this.gameRepository.save(gameWithAutoPass);
        return success(gameWithAutoPass);
      }

      // Save updated game
      await this.gameRepository.save(gameAfterDraw);

      return success(gameAfterDraw);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Failed to play card: ${errorMessage}`);
    }
  }
}

