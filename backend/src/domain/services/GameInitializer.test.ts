import { GameInitializer } from './GameInitializer';
import { Player } from '../entities/Player';

describe('GameInitializer', () => {
  describe('createDeck', () => {
    it('should create a deck with 98 cards (values 2-99)', () => {
      const deck = GameInitializer.createDeck();
      
      expect(deck.length).toBe(98);
      
      // Check values range
      const values = deck.map(card => card.value);
      expect(Math.min(...values)).toBe(2);
      expect(Math.max(...values)).toBe(99);
    });

    it('should create cards with valid suits', () => {
      const deck = GameInitializer.createDeck();
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      
      deck.forEach(card => {
        expect(suits).toContain(card.suit);
      });
    });
  });

  describe('shuffleDeck', () => {
    it('should return a deck with the same number of cards', () => {
      const deck = GameInitializer.createDeck();
      const shuffled = GameInitializer.shuffleDeck(deck);
      
      expect(shuffled.length).toBe(deck.length);
    });

    it('should return a different order (high probability)', () => {
      const deck = GameInitializer.createDeck();
      const shuffled = GameInitializer.shuffleDeck(deck);
      
      // Very unlikely to have the same order after shuffle
      const isSameOrder = deck.every((card, index) => 
        card.value === shuffled[index].value && card.suit === shuffled[index].suit
      );
      
      expect(isSameOrder).toBe(false);
    });

    it('should contain all the same cards', () => {
      const deck = GameInitializer.createDeck();
      const shuffled = GameInitializer.shuffleDeck(deck);
      
      const deckValues = deck.map(c => c.value).sort();
      const shuffledValues = shuffled.map(c => c.value).sort();
      
      expect(shuffledValues).toEqual(deckValues);
    });
  });

  describe('dealCards', () => {
    it('should deal 6 cards to each player for 2 players', () => {
      const deck = GameInitializer.createDeck();
      const { hands } = GameInitializer.dealCards(deck, 2);
      
      expect(hands).toHaveLength(2);
      expect(hands[0].length).toBe(6);
      expect(hands[1].length).toBe(6);
    });

    it('should deal 6 cards to each player for 3 players', () => {
      const deck = GameInitializer.createDeck();
      const { hands } = GameInitializer.dealCards(deck, 3);
      
      expect(hands).toHaveLength(3);
      hands.forEach(hand => {
        expect(hand.length).toBe(6);
      });
    });

    it('should deal 5 cards to each player for 5 players', () => {
      const deck = GameInitializer.createDeck();
      const { hands } = GameInitializer.dealCards(deck, 5);
      
      expect(hands).toHaveLength(5);
      hands.forEach(hand => {
        expect(hand.length).toBe(5);
      });
    });

    it('should return remaining deck after dealing', () => {
      const deck = GameInitializer.createDeck();
      const { hands, remainingDeck } = GameInitializer.dealCards(deck, 2);
      
      const dealtCards = hands[0].length + hands[1].length;
      expect(remainingDeck.length).toBe(deck.length - dealtCards);
    });

    it('should not deal the same card twice', () => {
      const deck = GameInitializer.createDeck();
      const { hands, remainingDeck } = GameInitializer.dealCards(deck, 2);
      
      const allCards = [...hands[0], ...hands[1], ...remainingDeck];
      const cardIds = allCards.map(c => `${c.value}-${c.suit}`);
      const uniqueIds = new Set(cardIds);
      
      expect(uniqueIds.size).toBe(cardIds.length);
    });
  });

  describe('createInitialPiles', () => {
    it('should create empty piles', () => {
      const piles = GameInitializer.createInitialPiles();
      
      expect(piles.ascending1).toEqual([]);
      expect(piles.ascending2).toEqual([]);
      expect(piles.descending1).toEqual([]);
      expect(piles.descending2).toEqual([]);
    });
  });

  describe('createGame', () => {
    it('should create a game with the first player', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Alice',
        hand: [],
        isConnected: false,
      });
      
      const game = GameInitializer.createGame('game-1', player);
      
      expect(game.id).toBe('game-1');
      expect(game.players).toHaveLength(1);
      expect(game.players[0].id).toBe('player-1');
      expect(game.players[0].name).toBe('Alice');
      expect(game.status).toBe('waiting');
      expect(game.currentTurn).toBeNull();
    });

    it('should deal cards to the first player', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Alice',
        hand: [],
        isConnected: false,
      });
      
      const game = GameInitializer.createGame('game-1', player);
      
      // For 1 player, default is 6 cards
      expect(game.players[0].hand.length).toBe(6);
    });

    it('should create game with remaining deck', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Alice',
        hand: [],
        isConnected: false,
      });
      
      const game = GameInitializer.createGame('game-1', player);
      
      // 98 cards total - 6 dealt = 92 remaining
      expect(game.deck.length).toBe(92);
    });

    it('should initialize empty piles', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Alice',
        hand: [],
        isConnected: false,
      });
      
      const game = GameInitializer.createGame('game-1', player);
      
      expect(game.piles.ascending1).toEqual([]);
      expect(game.piles.ascending2).toEqual([]);
      expect(game.piles.descending1).toEqual([]);
      expect(game.piles.descending2).toEqual([]);
    });

    it('should set createdAt and updatedAt', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Alice',
        hand: [],
        isConnected: false,
      });
      
      const before = new Date();
      const game = GameInitializer.createGame('game-1', player);
      const after = new Date();
      
      expect(game.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(game.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(game.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(game.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});

