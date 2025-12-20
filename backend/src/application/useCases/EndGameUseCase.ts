import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { IConnectionRepository } from '../../domain/repositories/IConnectionRepository';
import { Result, success, failure } from './Result';

export interface EndGameDTO {
  gameId: string;
  playerId: string;
}

/**
 * Use case for ending/deleting a game.
 * 
 * Validates that the player is part of the game, then:
 * 1. Deletes all connections for the game
 * 2. Deletes the game from DynamoDB
 * 3. Returns success
 */
export class EndGameUseCase {
  constructor(
    private readonly gameRepository: IGameRepository,
    private readonly connectionRepository: IConnectionRepository
  ) {}

  async execute(dto: EndGameDTO): Promise<Result<void>> {
    try {
      // Verify game exists
      const game = await this.gameRepository.findById(dto.gameId);

      if (!game) {
        return failure('Game not found');
      }

      // Verify player is part of the game
      const player = game.players.find(p => p.id === dto.playerId);
      if (!player) {
        return failure('Player is not part of this game');
      }

      // Get all connections for this game to delete them
      const connections = await this.connectionRepository.findByGameId(dto.gameId);

      // Delete all connections
      await Promise.all(
        connections.map(conn => this.connectionRepository.delete(conn.connectionId))
      );

      // Delete the game
      await this.gameRepository.delete(dto.gameId);

      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Failed to end game: ${errorMessage}`);
    }
  }
}

