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

