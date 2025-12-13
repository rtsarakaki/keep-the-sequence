export class Card {
  readonly value: number;
  readonly suit: string;

  constructor(value: number, suit: string) {
    this.value = value;
    this.suit = suit;
    Object.freeze(this);
  }

  equals(other: Card): boolean {
    return this.value === other.value && this.suit === other.suit;
  }
}

