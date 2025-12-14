import { DynamoGameRepository } from './DynamoGameRepository';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { Card } from '../../domain/valueObjects/Card';

describe('DynamoGameRepository', () => {
  const createTestGame = (): Game => {
    return new Game({
      id: 'game-123',
      players: [
        new Player({
          id: 'player-1',
          name: 'Alice',
          hand: [
            new Card(10, 'hearts'),
            new Card(25, 'spades'),
          ],
          isConnected: true,
        }),
        new Player({
          id: 'player-2',
          name: 'Bob',
          hand: [
            new Card(50, 'diamonds'),
          ],
          isConnected: false,
        }),
      ],
      piles: {
        ascending1: [new Card(1, 'spades')],
        ascending2: [new Card(2, 'hearts')],
        descending1: [new Card(100, 'diamonds')],
        descending2: [new Card(99, 'clubs')],
      },
      deck: [
        new Card(30, 'hearts'),
        new Card(40, 'spades'),
      ],
      discardPile: [new Card(5, 'clubs')],
      currentTurn: 'player-1',
      status: 'playing',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T11:00:00Z'),
      ttl: 1704067200,
    });
  };

  describe('mapToDynamoItem', () => {
    it('deve converter Game para formato DynamoDB corretamente', () => {
      const game = createTestGame();
      const repository = new DynamoGameRepository('test-table');
      const item = (repository as any).mapToDynamoItem(game);

      expect(item.gameId).toBe('game-123');
      expect(item.status).toBe('playing');
      expect(item.currentTurn).toBe('player-1');
      expect(item.createdAt).toBe(new Date('2024-01-01T10:00:00Z').getTime());
      expect(item.updatedAt).toBe(new Date('2024-01-01T11:00:00Z').getTime());
      expect(item.ttl).toBe(1704067200);
    });

    it('deve converter players corretamente', () => {
      const game = createTestGame();
      const repository = new DynamoGameRepository('test-table');
      const item = (repository as any).mapToDynamoItem(game);

      expect(item.players).toHaveLength(2);
      expect(item.players[0]).toEqual({
        id: 'player-1',
        name: 'Alice',
        hand: [
          { value: 10, suit: 'hearts' },
          { value: 25, suit: 'spades' },
        ],
        isConnected: true,
      });
      expect(item.players[1]).toEqual({
        id: 'player-2',
        name: 'Bob',
        hand: [
          { value: 50, suit: 'diamonds' },
        ],
        isConnected: false,
      });
    });

    it('deve converter piles corretamente', () => {
      const game = createTestGame();
      const repository = new DynamoGameRepository('test-table');
      const item = (repository as any).mapToDynamoItem(game);

      expect(item.piles).toEqual({
        ascending1: [{ value: 1, suit: 'spades' }],
        ascending2: [{ value: 2, suit: 'hearts' }],
        descending1: [{ value: 100, suit: 'diamonds' }],
        descending2: [{ value: 99, suit: 'clubs' }],
      });
    });

    it('deve converter deck e discardPile corretamente', () => {
      const game = createTestGame();
      const repository = new DynamoGameRepository('test-table');
      const item = (repository as any).mapToDynamoItem(game);

      expect(item.deck).toEqual([
        { value: 30, suit: 'hearts' },
        { value: 40, suit: 'spades' },
      ]);
      expect(item.discardPile).toEqual([
        { value: 5, suit: 'clubs' },
      ]);
    });

    it('deve converter currentTurn null corretamente', () => {
      const game = new Game({
        ...createTestGame(),
        currentTurn: null,
      });
      const repository = new DynamoGameRepository('test-table');
      const item = (repository as any).mapToDynamoItem(game);

      expect(item.currentTurn).toBeNull();
    });

    it('não deve incluir ttl se não estiver definido', () => {
      const game = new Game({
        ...createTestGame(),
        ttl: undefined,
      });
      const repository = new DynamoGameRepository('test-table');
      const item = (repository as any).mapToDynamoItem(game);

      expect(item.ttl).toBeUndefined();
    });
  });

  describe('mapToGame', () => {
    it('deve converter item DynamoDB para Game corretamente', () => {
      const item = {
        gameId: 'game-123',
        players: [
          {
            id: 'player-1',
            name: 'Alice',
            hand: [
              { value: 10, suit: 'hearts' },
              { value: 25, suit: 'spades' },
            ],
            isConnected: true,
          },
        ],
        piles: {
          ascending1: [{ value: 1, suit: 'spades' }],
          ascending2: [],
          descending1: [{ value: 100, suit: 'diamonds' }],
          descending2: [],
        },
        deck: [{ value: 30, suit: 'hearts' }],
        discardPile: [],
        currentTurn: 'player-1',
        status: 'playing',
        createdAt: new Date('2024-01-01T10:00:00Z').getTime(),
        updatedAt: new Date('2024-01-01T11:00:00Z').getTime(),
      };

      const repository = new DynamoGameRepository('test-table');
      const game = (repository as any).mapToGame(item);

      expect(game.id).toBe('game-123');
      expect(game.status).toBe('playing');
      expect(game.currentTurn).toBe('player-1');
      expect(game.players).toHaveLength(1);
      expect(game.players[0].id).toBe('player-1');
      expect(game.players[0].name).toBe('Alice');
      expect(game.players[0].hand).toHaveLength(2);
      expect(game.players[0].hand[0].value).toBe(10);
      expect(game.players[0].hand[0].suit).toBe('hearts');
      expect(game.createdAt).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(game.updatedAt).toEqual(new Date('2024-01-01T11:00:00Z'));
    });

    it('deve converter currentTurn null corretamente', () => {
      const item = {
        gameId: 'game-123',
        players: [],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: null,
        status: 'waiting',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const repository = new DynamoGameRepository('test-table');
      const game = (repository as any).mapToGame(item);

      expect(game.currentTurn).toBeNull();
    });

    it('deve lidar com arrays vazios', () => {
      const item = {
        gameId: 'game-123',
        players: [],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: null,
        status: 'waiting',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const repository = new DynamoGameRepository('test-table');
      const game = (repository as any).mapToGame(item);

      expect(game.players).toHaveLength(0);
      expect(game.deck).toHaveLength(0);
      expect(game.discardPile).toHaveLength(0);
      expect(game.piles.ascending1).toHaveLength(0);
    });

    it('deve fazer round-trip: Game → DynamoDB → Game preservando dados', () => {
      const originalGame = createTestGame();
      const repository = new DynamoGameRepository('test-table');
      
      const item = (repository as any).mapToDynamoItem(originalGame);
      const restoredGame = (repository as any).mapToGame(item);

      expect(restoredGame.id).toBe(originalGame.id);
      expect(restoredGame.status).toBe(originalGame.status);
      expect(restoredGame.currentTurn).toBe(originalGame.currentTurn);
      expect(restoredGame.players.length).toBe(originalGame.players.length);
      expect(restoredGame.players[0].id).toBe(originalGame.players[0].id);
      expect(restoredGame.players[0].name).toBe(originalGame.players[0].name);
      expect(restoredGame.players[0].hand.length).toBe(originalGame.players[0].hand.length);
      expect(restoredGame.players[0].hand[0].value).toBe(originalGame.players[0].hand[0].value);
      expect(restoredGame.players[0].hand[0].suit).toBe(originalGame.players[0].hand[0].suit);
      expect(restoredGame.piles.ascending1.length).toBe(originalGame.piles.ascending1.length);
      expect(restoredGame.piles.ascending1[0].value).toBe(originalGame.piles.ascending1[0].value);
      expect(restoredGame.deck.length).toBe(originalGame.deck.length);
      expect(restoredGame.createdAt).toEqual(originalGame.createdAt);
      expect(restoredGame.updatedAt).toEqual(originalGame.updatedAt);
    });

    it('deve lançar erro se gameId estiver faltando', () => {
      const item = {
        players: [],
        piles: {},
        deck: [],
        discardPile: [],
        status: 'waiting',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const repository = new DynamoGameRepository('test-table');
      expect(() => (repository as any).mapToGame(item)).toThrow('Invalid DynamoDB item: missing or invalid gameId');
    });

    it('deve lançar erro se status for inválido', () => {
      const item = {
        gameId: 'game-123',
        players: [],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: null,
        status: 'invalid-status',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const repository = new DynamoGameRepository('test-table');
      expect(() => (repository as any).mapToGame(item)).toThrow('Invalid status: invalid-status');
    });

    it('deve lançar erro se timestamps estiverem faltando', () => {
      const item = {
        gameId: 'game-123',
        players: [],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
        deck: [],
        discardPile: [],
        currentTurn: null,
        status: 'waiting',
      };

      const repository = new DynamoGameRepository('test-table');
      expect(() => (repository as any).mapToGame(item)).toThrow('Invalid DynamoDB item: missing or invalid timestamps');
    });
  });
});

