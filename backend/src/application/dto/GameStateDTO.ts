import { Card } from '../../domain/valueObjects/Card';
import { GameStatus } from '../../domain/entities/Game';

/**
 * DTO for game state response
 */
export interface PlayerDTO {
  id: string;
  name: string;
  hand: readonly Card[];
  isConnected: boolean;
}

export interface GameStateDTO {
  id: string;
  players: readonly PlayerDTO[];
  piles: {
    ascending1: readonly Card[];
    ascending2: readonly Card[];
    descending1: readonly Card[];
    descending2: readonly Card[];
  };
  deck: {
    remaining: number;
  };
  discardPile: readonly Card[];
  currentTurn: string | null;
  status: GameStatus;
  score: number;
}

