import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { Result, success, failure } from './Result';

/**
 * Use Case: Sync game state
 * 
 * Retrieves the current state of a game for synchronization purposes.
 * Used when a player reconnects and needs to get the latest game state.
 */
export class SyncGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(gameId: string): Promise<Result<Game>> {
    try {
      const game = await this.gameRepository.findById(gameId);

      if (!game) {
        return failure('Game not found');
      }

      return success(game);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Failed to sync game: ${errorMessage}`);
    }
  }
}




