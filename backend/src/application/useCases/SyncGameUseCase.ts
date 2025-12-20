import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { Result, success, failure } from './Result';
import { shouldGameEndInDefeat, areAllHandsEmpty } from '../../domain/services/GameRules';

/**
 * Use Case: Sync game state
 * 
 * Retrieves the current state of a game for synchronization purposes.
 * Used when a player reconnects and needs to get the latest game state.
 * Also checks for automatic defeat/victory conditions.
 */
export class SyncGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(gameId: string): Promise<Result<Game>> {
    try {
      const game = await this.gameRepository.findById(gameId);

      if (!game) {
        return failure('Game not found');
      }

      // If game is already finished, return as is
      if (game.status === 'finished' || game.status === 'abandoned') {
        return success(game);
      }

      // Check for automatic defeat condition: current player cannot continue
      if (shouldGameEndInDefeat(game)) {
        const defeatedGame = game.updateStatus('finished');
        await this.gameRepository.save(defeatedGame);
        return success(defeatedGame);
      }

      // Check victory condition: all players have empty hands
      if (areAllHandsEmpty(game.players)) {
        const victoriousGame = game.updateStatus('finished');
        await this.gameRepository.save(victoriousGame);
        return success(victoriousGame);
      }

      return success(game);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Failed to sync game: ${errorMessage}`);
    }
  }
}




