import { Card } from '../../domain/valueObjects/Card';

/**
 * DTO for playing a card
 */
export interface PlayCardDTO {
  gameId: string;
  playerId: string;
  card: Card;
  pileId: 'ascending1' | 'ascending2' | 'descending1' | 'descending2';
}

