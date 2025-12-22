import { Game } from './Game';
import { Player } from './Player';
import { Card } from '../valueObjects/Card';

describe('Game', () => {
  const createGame = (): Game => {
    // Create initial piles with starting cards
    const startingCardAscending = new Card(1, 'hearts');
    const startingCardDescending = new Card(100, 'hearts');
    
    return new Game({
      id: 'game1',
      players: [],
      piles: {
        ascending1: [startingCardAscending],
        ascending2: [startingCardAscending],
        descending1: [startingCardDescending],
        descending2: [startingCardDescending],
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
      
      expect(updatedGame.piles.ascending1).toHaveLength(2); // Starting card + new card
      expect(updatedGame.piles.ascending1[0].value).toBe(1); // Starting card
      expect(updatedGame.piles.ascending1[1]).toEqual(card); // New card
      expect(game.piles.ascending1).toHaveLength(1); // Original não foi modificado (still has starting card)
    });

    it('não deve modificar o jogo original', () => {
      const game = createGame();
      const card = new Card(10, 'hearts');
      
      const updatedGame = game.addCardToPile('ascending1', card);
      
      expect(game.piles.ascending1).toHaveLength(1); // Original still has starting card
      expect(updatedGame.piles.ascending1).toHaveLength(2); // Updated has starting card + new card
    });

    it('deve adicionar carta a pilha que já tem cartas', () => {
      const game = createGame();
      const card1 = new Card(10, 'hearts');
      const card2 = new Card(20, 'spades');
      
      const gameWithOneCard = game.addCardToPile('ascending1', card1);
      const gameWithTwoCards = gameWithOneCard.addCardToPile('ascending1', card2);
      
      expect(gameWithTwoCards.piles.ascending1).toHaveLength(3); // Starting card (1) + card1 (10) + card2 (20)
      expect(gameWithTwoCards.piles.ascending1[0].value).toBe(1); // Starting card
      expect(gameWithTwoCards.piles.ascending1[1]).toEqual(card1);
      expect(gameWithTwoCards.piles.ascending1[2]).toEqual(card2);
    });

    it('deve adicionar cartas a todas as pilhas corretamente', () => {
      const game = createGame();
      const card = new Card(10, 'hearts');
      
      // Test all pile types to ensure they work
      // Each pile starts with 1 card (initial card), so after adding one more, should have 2
      const game1 = game.addCardToPile('ascending1', card);
      const game2 = game.addCardToPile('ascending2', card);
      const game3 = game.addCardToPile('descending1', card);
      const game4 = game.addCardToPile('descending2', card);
      
      expect(game1.piles.ascending1).toHaveLength(2); // Starting card (1) + new card (10)
      expect(game2.piles.ascending2).toHaveLength(2); // Starting card (1) + new card (10)
      expect(game3.piles.descending1).toHaveLength(2); // Starting card (100) + new card (10)
      expect(game4.piles.descending2).toHaveLength(2); // Starting card (100) + new card (10)
    });

    it('deve remover preferências de pilha quando uma carta é jogada nela', () => {
      const game = createGame();
      const card = new Card(10, 'hearts');
      
      // Mark a preference for a pile
      const gameWithPreference = game.markPilePreference('player-1', 'ascending1');
      expect(gameWithPreference.pilePreferences['player-1']).toBe('ascending1');
      
      // Play a card on the marked pile
      const gameAfterPlay = gameWithPreference.addCardToPile('ascending1', card);
      
      // Preference should be removed
      expect(gameAfterPlay.pilePreferences['player-1']).toBeNull();
    });

    it('deve manter preferências de outras pilhas quando uma carta é jogada', () => {
      const game = createGame();
      const card = new Card(10, 'hearts');
      
      // Mark preferences for multiple piles
      const gameWithPreferences = game
        .markPilePreference('player-1', 'ascending1')
        .markPilePreference('player-2', 'descending1');
      
      expect(gameWithPreferences.pilePreferences['player-1']).toBe('ascending1');
      expect(gameWithPreferences.pilePreferences['player-2']).toBe('descending1');
      
      // Play a card on ascending1 (player-1's preference)
      const gameAfterPlay = gameWithPreferences.addCardToPile('ascending1', card);
      
      // player-1's preference should be removed, but player-2's should remain
      expect(gameAfterPlay.pilePreferences['player-1']).toBeNull();
      expect(gameAfterPlay.pilePreferences['player-2']).toBe('descending1');
    });

  });

  describe('updateTurn', () => {
    it('deve atualizar a vez atual', () => {
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

  describe('drawCardForPlayer', () => {
    it('deve comprar uma carta do deck e adicionar à mão do jogador', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });
      const game = new Game({
        ...createGame(),
        players: Object.freeze([player]),
        deck: [new Card(20, 'spades'), new Card(30, 'diamonds')],
      });

      const updatedGame = game.drawCardForPlayer('player-1');
      const updatedPlayer = updatedGame.players.find(p => p.id === 'player-1');

      expect(updatedPlayer?.hand.length).toBe(2); // Original hand + 1 drawn card
      expect(updatedPlayer?.hand).toContainEqual(new Card(20, 'spades'));
      expect(updatedGame.deck.length).toBe(1); // Deck should have one less card
      expect(updatedGame.deck).toContainEqual(new Card(30, 'diamonds'));
    });

    it('não deve modificar o jogo se o deck estiver vazio', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });
      const game = new Game({
        ...createGame(),
        players: Object.freeze([player]),
        deck: [],
      });

      const updatedGame = game.drawCardForPlayer('player-1');

      expect(updatedGame).toBe(game); // Should return same instance
      expect(updatedGame.players[0].hand.length).toBe(1); // Hand unchanged
    });

    it('não deve modificar o jogo se o jogador não existir', () => {
      const game = new Game({
        ...createGame(),
        deck: [new Card(20, 'spades')],
      });

      const updatedGame = game.drawCardForPlayer('non-existent-player');

      expect(updatedGame).toBe(game); // Should return same instance
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

  describe('markPilePreference', () => {
    it('deve marcar preferência de pilha para um jogador', () => {
      const game = createGame();
      
      const updatedGame = game.markPilePreference('player-1', 'ascending1');
      
      expect(updatedGame.pilePreferences['player-1']).toBe('ascending1');
      expect(game.pilePreferences['player-1']).toBeUndefined(); // Original não foi modificado
    });

    it('deve substituir preferência existente quando jogador marca nova pilha', () => {
      const game = createGame();
      
      const gameWithFirstPreference = game.markPilePreference('player-1', 'ascending1');
      expect(gameWithFirstPreference.pilePreferences['player-1']).toBe('ascending1');
      
      const gameWithSecondPreference = gameWithFirstPreference.markPilePreference('player-1', 'descending1');
      expect(gameWithSecondPreference.pilePreferences['player-1']).toBe('descending1');
    });

    it('deve remover preferência quando pileId é null', () => {
      const game = createGame();
      
      const gameWithPreference = game.markPilePreference('player-1', 'ascending1');
      expect(gameWithPreference.pilePreferences['player-1']).toBe('ascending1');
      
      const gameWithoutPreference = gameWithPreference.markPilePreference('player-1', null);
      expect(gameWithoutPreference.pilePreferences['player-1']).toBeNull();
    });

    it('deve permitir múltiplos jogadores terem preferências diferentes', () => {
      const game = createGame();
      
      const gameWithPreferences = game
        .markPilePreference('player-1', 'ascending1')
        .markPilePreference('player-2', 'descending1')
        .markPilePreference('player-3', 'ascending2');
      
      expect(gameWithPreferences.pilePreferences['player-1']).toBe('ascending1');
      expect(gameWithPreferences.pilePreferences['player-2']).toBe('descending1');
      expect(gameWithPreferences.pilePreferences['player-3']).toBe('ascending2');
    });
  });
});

