import { Card } from '../valueObjects/Card';

export class Player {
  readonly id: string;
  readonly name: string;
  readonly hand: readonly Card[];
  readonly isConnected: boolean;

  constructor(data: {
    id: string;
    name: string;
    hand: readonly Card[];
    isConnected: boolean;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.hand = Object.freeze([...data.hand]);
    this.isConnected = data.isConnected;
    Object.freeze(this);
  }

  addCardToHand(card: Card): Player {
    return new Player({
      ...this,
      hand: Object.freeze([...this.hand, card]),
    });
  }

  removeCardFromHand(cardIndex: number): { player: Player; card: Card } {
    if (cardIndex < 0 || cardIndex >= this.hand.length) {
      throw new Error('Invalid card index');
    }

    const card = this.hand[cardIndex];
    const newHand = this.hand.filter((_, index) => index !== cardIndex);

    return {
      player: new Player({
        ...this,
        hand: Object.freeze(newHand),
      }),
      card,
    };
  }

  updateConnectionStatus(isConnected: boolean): Player {
    return new Player({
      ...this,
      isConnected,
    });
  }
}

