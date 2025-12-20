import { Card } from '../valueObjects/Card';
import { Player } from './Player';
import { GamePiles } from '../services/GameRules';

export type GameStatus = 'waiting' | 'playing' | 'finished' | 'abandoned';

export class Game {
  readonly id: string;
  readonly players: readonly Player[];
  readonly piles: GamePiles;
  readonly deck: readonly Card[];
  readonly discardPile: readonly Card[];
  readonly currentTurn: string | null;
  readonly cardsPlayedThisTurn: number; // Number of cards played by current player in this turn
  readonly createdBy: string; // Player ID of the player who created the game
  readonly status: GameStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly ttl?: number;

  constructor(data: {
    id: string;
    players: readonly Player[];
    piles: GamePiles;
    deck: readonly Card[];
    discardPile: readonly Card[];
    currentTurn: string | null;
    cardsPlayedThisTurn?: number; // Optional, defaults to 0
    createdBy: string; // Player ID of the player who created the game
    status: GameStatus;
    createdAt: Date;
    updatedAt: Date;
    ttl?: number;
  }) {
    this.id = data.id;
    this.players = Object.freeze([...data.players]);
    this.piles = Object.freeze({
      ascending1: Object.freeze([...data.piles.ascending1]),
      ascending2: Object.freeze([...data.piles.ascending2]),
      descending1: Object.freeze([...data.piles.descending1]),
      descending2: Object.freeze([...data.piles.descending2]),
    });
    this.deck = Object.freeze([...data.deck]);
    this.discardPile = Object.freeze([...data.discardPile]);
    this.currentTurn = data.currentTurn;
    this.cardsPlayedThisTurn = data.cardsPlayedThisTurn ?? 0;
    this.createdBy = data.createdBy;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.ttl = data.ttl;
    Object.freeze(this);
  }

  addCardToPile(pileId: keyof GamePiles, card: Card): Game {
    const currentPile = this.piles[pileId] || [];
    return new Game({
      ...this,
      piles: {
        ...this.piles,
        [pileId]: Object.freeze([...currentPile, card]),
      },
      cardsPlayedThisTurn: this.cardsPlayedThisTurn + 1, // Increment cards played this vez
      updatedAt: new Date(),
    });
  }

  updateTurn(nextPlayerId: string | null): Game {
    return new Game({
      ...this,
      currentTurn: nextPlayerId,
      cardsPlayedThisTurn: 0, // Reset cards played when vez changes
      updatedAt: new Date(),
    });
  }

  updateStatus(status: GameStatus): Game {
    return new Game({
      ...this,
      status,
      updatedAt: new Date(),
    });
  }

  addPlayer(player: Player): Game {
    return new Game({
      ...this,
      players: Object.freeze([...this.players, player]),
      updatedAt: new Date(),
    });
  }

  updatePlayer(playerId: string, updater: (player: Player) => Player): Game {
    const updatedPlayers = this.players.map((player) =>
      player.id === playerId ? updater(player) : player
    );
    return new Game({
      ...this,
      players: Object.freeze(updatedPlayers),
      updatedAt: new Date(),
    });
  }

  /**
   * Draws a card from the deck and adds it to a player's hand.
   * Returns a new Game instance with the updated deck and player hand.
   * If the deck is empty, returns the game unchanged.
   */
  drawCardForPlayer(playerId: string): Game {
    if (this.deck.length === 0) {
      return this; // No cards to draw
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return this; // Player not found
    }

    // Take first card from deck
    const drawnCard = this.deck[0];
    const newDeck = this.deck.slice(1);

    // Add card to player's hand
    const updatedPlayer = player.addCardToHand(drawnCard);

    // Update player in game
    return this.updatePlayer(playerId, () => updatedPlayer).updateDeck(newDeck);
  }

  /**
   * Updates the deck with a new deck array.
   */
  private updateDeck(newDeck: readonly Card[]): Game {
    return new Game({
      ...this,
      deck: Object.freeze(newDeck),
      updatedAt: new Date(),
    });
  }
}

