import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { Result, success, failure } from './Result';
import { hasAnyCardsBeenPlayed } from '../../domain/services/GameRules';

export interface SetStartingPlayerDTO {
  gameId: string;
  playerId: string; // The player who is making the request (must be creator or current turn)
  startingPlayerId: string; // The player who should start
}

/**
 * Use Case: Set the starting player
 * 
 * Allows the game creator to choose which player starts the game, or allows
 * the player whose turn it is to pass the turn to another player.
 * This can only be done before any cards have been played.
 * 
 * Validates:
 * 1. Game exists
 * 2. Requesting player is the game creator OR is the current turn player
 * 3. No cards have been played yet
 * 4. Starting player exists in the game
 * 5. Game is in waiting or playing status (but no cards played)
 */
export class SetStartingPlayerUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(dto: SetStartingPlayerDTO): Promise<Result<Game>> {
    try {
      // Find game
      const game = await this.gameRepository.findById(dto.gameId);

      if (!game) {
        return failure('Game not found');
      }

      // Validate requesting player is the creator OR is the current turn player
      const isCreator = game.createdBy === dto.playerId;
      const isCurrentTurn = game.currentTurn !== null && game.currentTurn === dto.playerId;
      
      if (!isCreator && !isCurrentTurn) {
        // Provide more detailed error message for debugging
        const errorDetails = game.currentTurn 
          ? `Current turn: ${game.currentTurn}, Requesting player: ${dto.playerId}, Creator: ${game.createdBy}`
          : `Current turn: null, Requesting player: ${dto.playerId}, Creator: ${game.createdBy}`;
        return failure(`Only the game creator or the player whose turn it is can set the starting player. ${errorDetails}`);
      }

      // Validate no cards have been played
      if (hasAnyCardsBeenPlayed(game.piles)) {
        return failure('Cannot change starting player after cards have been played');
      }

      // Validate game is in waiting or playing status
      if (game.status !== 'waiting' && game.status !== 'playing') {
        return failure('Cannot set starting player for a finished or abandoned game');
      }

      // Validate starting player exists in the game
      const startingPlayer = game.players.find(p => p.id === dto.startingPlayerId);
      if (!startingPlayer) {
        return failure('Starting player not found in game');
      }

      // Update currentTurn
      const updatedGame = game.updateTurn(dto.startingPlayerId);

      // Save updated game
      await this.gameRepository.save(updatedGame);

      return success(updatedGame);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Failed to set starting player: ${errorMessage}`);
    }
  }
}

