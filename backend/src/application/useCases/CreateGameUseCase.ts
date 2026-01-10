import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { CreateGameDTO } from '../dto/CreateGameDTO';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { GameInitializer } from '../../domain/services/GameInitializer';
import { GameIdGenerator } from '../../domain/services/GameIdGenerator';
import { Result, success, failure } from './Result';
import { randomUUID } from 'crypto';

/**
 * Use Case: Create a new game
 * 
 * Creates a new game with the first player, deals cards, and initializes the game state.
 */
export class CreateGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(dto: CreateGameDTO): Promise<Result<Game>> {
    try {
      // Generate unique short game ID (6 characters)
      const gameId = await GameIdGenerator.generateUniqueId(this.gameRepository);

      // Generate player ID if not provided
      const playerId = dto.playerId || randomUUID();

      // Create first player
      const firstPlayer = new Player({
        id: playerId,
        name: dto.playerName,
        hand: [], // Will be dealt by GameInitializer
        isConnected: false,
      });

      // Initialize game with difficulty (defaults to 'easy')
      const game = GameInitializer.createGame(gameId, firstPlayer, dto.difficulty || 'easy');

      // Save game to repository
      await this.gameRepository.save(game);

      return success(game);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Failed to create game: ${errorMessage}`);
    }
  }
}

