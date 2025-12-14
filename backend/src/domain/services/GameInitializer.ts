import { Card } from '../valueObjects/Card';
import { Game, GameStatus } from '../entities/Game';
import { GamePiles } from './GameRules';
import { Player } from '../entities/Player';

/**
 * Service for initializing a new game
 */
export class GameInitializer {
  /**
   * Creates a full deck of 98 cards (values 2-99)
   */
  static createDeck(): readonly Card[] {
    const cards: Card[] = [];
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    
    // Create cards from 2 to 99
    for (let value = 2; value <= 99; value++) {
      // Distribute suits evenly (not perfect, but works for the game)
      const suit = suits[value % suits.length];
      cards.push(new Card(value, suit));
    }
    
    return Object.freeze(cards);
  }

  /**
   * Shuffles an array of cards
   */
  static shuffleDeck(deck: readonly Card[]): readonly Card[] {
    const shuffled = [...deck];
    
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return Object.freeze(shuffled);
  }

  /**
   * Deals cards to players
   * Each player gets a certain number of cards based on number of players
   */
  static dealCards(
    deck: readonly Card[],
    numPlayers: number
  ): { hands: readonly (readonly Card[])[]; remainingDeck: readonly Card[] } {
    const hands: Card[][] = Array(numPlayers).fill(null).map(() => []);
    
    // Number of cards per player based on number of players
    const cardsPerPlayer: Record<number, number> = {
      2: 7,
      3: 6,
      4: 6,
      5: 5,
    };
    
    const cardsToDeal = cardsPerPlayer[numPlayers] || 6;
    let deckIndex = 0;
    
    // Deal cards round-robin style
    for (let round = 0; round < cardsToDeal; round++) {
      for (let player = 0; player < numPlayers; player++) {
        if (deckIndex < deck.length) {
          hands[player].push(deck[deckIndex]);
          deckIndex++;
        }
      }
    }
    
    const remainingDeck = deck.slice(deckIndex);
    
    const frozenHands = Object.freeze(hands.map(hand => Object.freeze(hand)));
    return {
      hands: frozenHands,
      remainingDeck: Object.freeze(remainingDeck),
    };
  }

  /**
   * Creates initial empty piles
   */
  static createInitialPiles(): GamePiles {
    return {
      ascending1: Object.freeze([]),
      ascending2: Object.freeze([]),
      descending1: Object.freeze([]),
      descending2: Object.freeze([]),
    };
  }

  /**
   * Creates a new game with the first player
   */
  static createGame(
    gameId: string,
    firstPlayer: Player
  ): Game {
    const now = new Date();
    
    // Create and shuffle deck
    const fullDeck = this.createDeck();
    const shuffledDeck = this.shuffleDeck(fullDeck);
    
    // Deal cards (for 1 player initially, will deal more when others join)
    const { hands, remainingDeck } = this.dealCards(shuffledDeck, 1);
    
    // Create first player with dealt cards
    const playerWithCards = new Player({
      id: firstPlayer.id,
      name: firstPlayer.name,
      hand: hands[0],
      isConnected: firstPlayer.isConnected,
    });
    
    // Create initial piles
    const piles = this.createInitialPiles();
    
    // Create game with first player
    return new Game({
      id: gameId,
      players: Object.freeze([playerWithCards]),
      piles,
      deck: remainingDeck,
      discardPile: Object.freeze([]),
      currentTurn: null, // Will be set when game starts
      status: 'waiting' as GameStatus,
      createdAt: now,
      updatedAt: now,
      ttl: undefined, // Can be set later for cleanup
    });
  }
}

