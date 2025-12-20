import { Game } from '../../../domain/entities/Game';

/**
 * Converts a Game entity to the frontend message format.
 * Serializes Cards, Players, and Dates to plain objects.
 */
export function formatGameForMessage(game: Game): {
  id: string;
  players: Array<{
    id: string;
    name: string;
    hand: Array<{ value: number; suit: string }>;
    isConnected: boolean;
  }>;
  piles: {
    ascending1: Array<{ value: number; suit: string }>;
    ascending2: Array<{ value: number; suit: string }>;
    descending1: Array<{ value: number; suit: string }>;
    descending2: Array<{ value: number; suit: string }>;
  };
  deck: Array<{ value: number; suit: string }>;
  discardPile: Array<{ value: number; suit: string }>;
  currentTurn: string | null;
  cardsPlayedThisTurn: number;
  createdBy: string;
  status: 'waiting' | 'playing' | 'finished' | 'abandoned';
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: game.id,
    players: game.players.map(p => ({
      id: p.id,
      name: p.name,
      hand: p.hand.map(c => ({ value: c.value, suit: c.suit })),
      isConnected: p.isConnected,
    })),
    piles: {
      ascending1: game.piles.ascending1.map(c => ({ value: c.value, suit: c.suit })),
      ascending2: game.piles.ascending2.map(c => ({ value: c.value, suit: c.suit })),
      descending1: game.piles.descending1.map(c => ({ value: c.value, suit: c.suit })),
      descending2: game.piles.descending2.map(c => ({ value: c.value, suit: c.suit })),
    },
    deck: game.deck.map(c => ({ value: c.value, suit: c.suit })),
    discardPile: game.discardPile.map(c => ({ value: c.value, suit: c.suit })),
    currentTurn: game.currentTurn,
    cardsPlayedThisTurn: game.cardsPlayedThisTurn,
    createdBy: game.createdBy,
    status: game.status,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}

