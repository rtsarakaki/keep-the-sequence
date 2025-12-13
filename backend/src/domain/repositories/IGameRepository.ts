import { Game } from '../entities/Game';

export interface IGameRepository {
  findById(gameId: string): Promise<Game | null>;
  save(game: Game): Promise<void>;
  delete(gameId: string): Promise<void>;
}

