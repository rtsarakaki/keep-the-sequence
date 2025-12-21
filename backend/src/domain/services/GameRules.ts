import { Card } from '../valueObjects/Card';

export type PileDirection = 'ascending' | 'descending';

export type GamePiles = {
  ascending1: readonly Card[];
  ascending2: readonly Card[];
  descending1: readonly Card[];
  descending2: readonly Card[];
};

export const canPlayCard = (
  card: Card,
  pile: readonly Card[],
  direction: PileDirection
): boolean => {
  if (pile.length === 0) {
    return true;
  }

  const lastCard = pile[pile.length - 1];
  const isAscending = direction === 'ascending';

  if (isAscending) {
    return card.value > lastCard.value || card.value === lastCard.value - 10;
  } else {
    return card.value < lastCard.value || card.value === lastCard.value + 10;
  }
};

export const calculateScore = (piles: GamePiles): number => {
  const totalCards = 98;
  const playedCards = Object.values(piles).reduce(
    (sum, pile) => sum + pile.length,
    0
  );
  return totalCards - playedCards;
};

/**
 * Calculate the minimum number of cards a player must play in their turn
 * - If deck has cards: minimum is 2
 * - If deck is empty: minimum is 1
 */
export const getMinimumCardsToPlay = (deckLength: number): number => {
  return deckLength > 0 ? 2 : 1;
};

/**
 * Check if a player can play at least one card from their hand
 */
export const canPlayerPlayAnyCard = (
  playerHand: readonly Card[],
  piles: GamePiles
): boolean => {
  if (playerHand.length === 0) {
    return false;
  }

  // Check each card in hand against each pile
  for (const card of playerHand) {
    // Check ascending piles
    if (canPlayCard(card, piles.ascending1, 'ascending')) {
      return true;
    }
    if (canPlayCard(card, piles.ascending2, 'ascending')) {
      return true;
    }
    // Check descending piles
    if (canPlayCard(card, piles.descending1, 'descending')) {
      return true;
    }
    if (canPlayCard(card, piles.descending2, 'descending')) {
      return true;
    }
  }

  return false;
};

/**
 * Check if all players have empty hands (victory condition)
 */
export const areAllHandsEmpty = (players: ReadonlyArray<{ hand: readonly Card[] }>): boolean => {
  return players.every(player => player.hand.length === 0);
};

/**
 * Check if any cards have been played in the game piles
 * Used to determine if new players can still join (only before first card is played)
 */
export const hasAnyCardsBeenPlayed = (piles: GamePiles): boolean => {
  return (
    piles.ascending1.length > 0 ||
    piles.ascending2.length > 0 ||
    piles.descending1.length > 0 ||
    piles.descending2.length > 0
  );
};

/**
 * Check if the current player cannot continue (defeat condition)
 * This happens when:
 * 1. It's the player's turn
 * 2. The player has cards in hand
 * 3. The player has played less than the minimum required cards
 * 4. The player cannot play any card from their hand
 */
export const shouldGameEndInDefeat = (
  game: {
    currentTurn: string | null;
    cardsPlayedThisTurn: number;
    deck: readonly Card[];
    players: ReadonlyArray<{ id: string; hand: readonly Card[] }>;
    piles: GamePiles;
  }
): boolean => {
  // Game must be in progress
  if (!game.currentTurn) {
    return false;
  }

  // Find current player
  const currentPlayer = game.players.find(p => p.id === game.currentTurn);
  if (!currentPlayer) {
    return false;
  }

  // If player has no cards, they can't be defeated (victory condition is checked separately)
  if (currentPlayer.hand.length === 0) {
    return false;
  }

  // Calculate minimum cards required
  const minimumCards = getMinimumCardsToPlay(game.deck.length);

  // Check if player has played less than minimum
  if (game.cardsPlayedThisTurn < minimumCards) {
    // Check if player can play any card
    const canPlayAny = canPlayerPlayAnyCard(currentPlayer.hand, game.piles);
    
    // If player cannot play any card and hasn't met minimum, game ends in defeat
    return !canPlayAny;
  }

  return false;
};

