import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { GamePiles } from '../../domain/services/GameRules';
import { Result, success, failure } from './Result';

export interface MarkPilePreferenceDTO {
  gameId: string;
  playerId: string;
  pileId: keyof GamePiles | null; // null to remove preference
}

/**
 * Use Case: Mark pile preference
 * 
 * Allows a player to mark a pile they prefer others not to play on.
 * Each player can only have one pile preference at a time.
 * Only works when it's not the player's turn.
 */
export class MarkPilePreferenceUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(dto: MarkPilePreferenceDTO): Promise<Result<Game>> {
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

      // Validate player is in the game
      const player = game.players.find(p => p.id === dto.playerId);
      if (!player) {
        return failure('Player not found in game');
      }

      // Validate it's NOT the player's turn (only non-current players can mark preferences)
      if (game.currentTurn === dto.playerId) {
        return failure('Você não pode marcar preferência durante sua vez');
      }

      // Validate pile ID if provided
      if (dto.pileId !== null && !(dto.pileId in game.piles)) {
        return failure('Invalid pile ID');
      }

      // Mark preference
      const updatedGame = game.markPilePreference(dto.playerId, dto.pileId);

      // Save game
      await this.gameRepository.save(updatedGame);

      return success(updatedGame);
    } catch (error) {
      return failure('Falha ao marcar preferência de pilha');
    }
  }
}

