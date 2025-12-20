import { Game } from './Game';
import { Player } from './Player';
import { Card } from '../valueObjects/Card';

describe('Game', () => {
  const createGame = (): Game => {
    return new Game({
      id: 'game1',
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
      cardsPlayedThisTurn: 0,
      createdBy: 'player-1',
      status: 'waiting',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  };

  describe('constructor', () => {
    it('deve criar um jogo com propriedades corretas', () => {
      const game = createGame();
      
      expect(game.id).toBe('game1');
      expect(game.players).toEqual([]);
      expect(game.status).toBe('waiting');
      expect(game.currentTurn).toBeNull();
    });

    it('deve ser imutável', () => {
      const game = createGame();
      
      expect(Object.isFrozen(game)).toBe(true);
    });
  });

  describe('addCardToPile', () => {
    it('deve adicionar carta à pilha especificada', () => {
      const game = createGame();
      const card = new Card(10, 'hearts');
      
      const updatedGame = game.addCardToPile('ascending1', card);
      
      expect(updatedGame.piles.ascending1).toHaveLength(1);
      expect(updatedGame.piles.ascending1[0]).toEqual(card);
      expect(game.piles.ascending1).toHaveLength(0); // Original não foi modificado
    });

    it('não deve modificar o jogo original', () => {
      const game = createGame();
      const card = new Card(10, 'hearts');
      
      const updatedGame = game.addCardToPile('ascending1', card);
      
      expect(game.piles.ascending1).toHaveLength(0);
      expect(updatedGame.piles.ascending1).toHaveLength(1);
    });

    it('deve adicionar carta a pilha que já tem cartas', () => {
      const game = createGame();
      const card1 = new Card(10, 'hearts');
      const card2 = new Card(20, 'spades');
      
      const gameWithOneCard = game.addCardToPile('ascending1', card1);
      const gameWithTwoCards = gameWithOneCard.addCardToPile('ascending1', card2);
      
      expect(gameWithTwoCards.piles.ascending1).toHaveLength(2);
      expect(gameWithTwoCards.piles.ascending1[0]).toEqual(card1);
      expect(gameWithTwoCards.piles.ascending1[1]).toEqual(card2);
    });

    it('deve lidar com pilha inexistente usando array vazio', () => {
      const game = createGame();
      const card = new Card(10, 'hearts');
      
      // Test all pile types to ensure they work
      const game1 = game.addCardToPile('ascending1', card);
      const game2 = game.addCardToPile('ascending2', card);
      const game3 = game.addCardToPile('descending1', card);
      const game4 = game.addCardToPile('descending2', card);
      
      expect(game1.piles.ascending1).toHaveLength(1);
      expect(game2.piles.ascending2).toHaveLength(1);
      expect(game3.piles.descending1).toHaveLength(1);
      expect(game4.piles.descending2).toHaveLength(1);
    });

  });

  describe('updateTurn', () => {
    it('deve atualizar o turno atual', () => {
      const game = createGame();
      
      const updatedGame = game.updateTurn('player1');
      
      expect(updatedGame.currentTurn).toBe('player1');
      expect(game.currentTurn).toBeNull(); // Original não foi modificado
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar o status do jogo', () => {
      const game = createGame();
      
      const updatedGame = game.updateStatus('playing');
      
      expect(updatedGame.status).toBe('playing');
      expect(game.status).toBe('waiting'); // Original não foi modificado
    });
  });

  describe('addPlayer', () => {
    it('deve adicionar jogador ao jogo', () => {
      const game = createGame();
      const player = new Player({
        id: 'player1',
        name: 'Test Player',
        hand: [],
        isConnected: true,
      });
      
      const updatedGame = game.addPlayer(player);
      
      expect(updatedGame.players).toHaveLength(1);
      expect(updatedGame.players[0]).toEqual(player);
      expect(game.players).toHaveLength(0); // Original não foi modificado
    });
  });

  describe('updatePlayer', () => {
    it('deve atualizar jogador específico', () => {
      const player = new Player({
        id: 'player1',
        name: 'Test Player',
        hand: [],
        isConnected: true,
      });
      const game = createGame().addPlayer(player);
      
      const updatedGame = game.updatePlayer('player1', (p) =>
        p.updateConnectionStatus(false)
      );
      
      expect(updatedGame.players[0].isConnected).toBe(false);
      expect(game.players[0].isConnected).toBe(true); // Original não foi modificado
    });

    it('não deve modificar jogadores que não correspondem ao playerId', () => {
      const player1 = new Player({
        id: 'player1',
        name: 'Player 1',
        hand: [],
        isConnected: true,
      });
      const player2 = new Player({
        id: 'player2',
        name: 'Player 2',
        hand: [],
        isConnected: false,
      });
      const game = createGame().addPlayer(player1).addPlayer(player2);
      
      const updatedGame = game.updatePlayer('player1', (p) =>
        p.updateConnectionStatus(false)
      );
      
      expect(updatedGame.players[0].isConnected).toBe(false);
      expect(updatedGame.players[1].isConnected).toBe(false); // player2 não foi modificado
      expect(game.players[0].isConnected).toBe(true); // Original não foi modificado
    });
  });
});

