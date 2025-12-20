import { Card } from '../valueObjects/Card';
import { canPlayCard, calculateScore, shouldGameEndInDefeat } from './GameRules';
import { Player } from '../entities/Player';

describe('GameRules', () => {
  describe('canPlayCard - Pilha crescente (1-99)', () => {
    it('deve permitir jogar carta maior que a última', () => {
      const pile: readonly Card[] = [new Card(10, 'hearts'), new Card(20, 'spades')];
      const card = new Card(30, 'clubs');
      
      const result = canPlayCard(card, pile, 'ascending');
      
      expect(result).toBe(true);
    });
    
    it('deve permitir jogar carta 10 unidades menor (regra especial)', () => {
      const pile: readonly Card[] = [new Card(50, 'hearts')];
      const card = new Card(40, 'spades');
      
      const result = canPlayCard(card, pile, 'ascending');
      
      expect(result).toBe(true);
    });
    
    it('não deve permitir jogar carta menor que a última', () => {
      const pile: readonly Card[] = [new Card(50, 'hearts')];
      const card = new Card(30, 'spades');
      
      const result = canPlayCard(card, pile, 'ascending');
      
      expect(result).toBe(false);
    });

    it('deve permitir jogar qualquer carta em pilha vazia', () => {
      const pile: readonly Card[] = [];
      const card = new Card(50, 'hearts');
      
      const result = canPlayCard(card, pile, 'ascending');
      
      expect(result).toBe(true);
    });

    it('não deve permitir jogar carta igual à última', () => {
      const pile: readonly Card[] = [new Card(50, 'hearts')];
      const card = new Card(50, 'spades');
      
      const result = canPlayCard(card, pile, 'ascending');
      
      expect(result).toBe(false);
    });
  });
  
  describe('canPlayCard - Pilha decrescente (100-2)', () => {
    it('deve permitir jogar carta menor que a última', () => {
      const pile: readonly Card[] = [new Card(80, 'hearts'), new Card(70, 'spades')];
      const card = new Card(60, 'clubs');
      
      const result = canPlayCard(card, pile, 'descending');
      
      expect(result).toBe(true);
    });

    it('deve permitir jogar carta 10 unidades maior (regra especial)', () => {
      const pile: readonly Card[] = [new Card(50, 'hearts')];
      const card = new Card(60, 'spades');
      
      const result = canPlayCard(card, pile, 'descending');
      
      expect(result).toBe(true);
    });

    it('não deve permitir jogar carta maior que a última', () => {
      const pile: readonly Card[] = [new Card(50, 'hearts')];
      const card = new Card(70, 'spades');
      
      const result = canPlayCard(card, pile, 'descending');
      
      expect(result).toBe(false);
    });

    it('deve permitir jogar qualquer carta em pilha vazia', () => {
      const pile: readonly Card[] = [];
      const card = new Card(50, 'hearts');
      
      const result = canPlayCard(card, pile, 'descending');
      
      expect(result).toBe(true);
    });

    it('não deve permitir jogar carta igual à última', () => {
      const pile: readonly Card[] = [new Card(50, 'hearts')];
      const card = new Card(50, 'spades');
      
      const result = canPlayCard(card, pile, 'descending');
      
      expect(result).toBe(false);
    });
  });

  describe('calculateScore', () => {
    it('deve calcular score baseado em cartas jogadas', () => {
      const piles = {
        ascending1: [new Card(10, 'hearts'), new Card(20, 'spades')],
        ascending2: [new Card(30, 'clubs')],
        descending1: [new Card(80, 'diamonds'), new Card(70, 'hearts')],
        descending2: [new Card(60, 'spades')],
      };
      
      const totalCards = 98;
      const playedCards = 6; // 2 + 1 + 2 + 1 = 6 cartas
      const expectedScore = totalCards - playedCards;
      
      const score = calculateScore(piles);
      
      expect(score).toBe(expectedScore);
    });

    it('deve retornar 98 quando nenhuma carta foi jogada', () => {
      const piles = {
        ascending1: [],
        ascending2: [],
        descending1: [],
        descending2: [],
      };
      
      const score = calculateScore(piles);
      
      expect(score).toBe(98);
    });

    it('deve retornar 0 quando todas as cartas foram jogadas', () => {
      const piles = {
        ascending1: Array.from({ length: 25 }, (_, i) => new Card(i + 1, 'hearts')),
        ascending2: Array.from({ length: 25 }, (_, i) => new Card(i + 26, 'spades')),
        descending1: Array.from({ length: 24 }, (_, i) => new Card(100 - i, 'clubs')),
        descending2: Array.from({ length: 24 }, (_, i) => new Card(76 - i, 'diamonds')),
      };
      
      const score = calculateScore(piles);
      
      expect(score).toBe(0);
    });
  });

  describe('shouldGameEndInDefeat', () => {
    it('deve retornar true quando jogador não pode jogar o mínimo necessário', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')], // Tem cartas
        isConnected: true,
      });

      // Pilhas bloqueadas - jogador não pode jogar
      const piles = {
        ascending1: [new Card(99, 'spades')],
        ascending2: [new Card(99, 'hearts')],
        descending1: [new Card(2, 'spades')],
        descending2: [new Card(2, 'hearts')],
      };

      const game = {
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 0, // Não jogou o mínimo (2 cartas)
        deck: [new Card(50, 'hearts')], // Deck tem cartas, mínimo é 2
        players: [player],
        piles,
      };

      const result = shouldGameEndInDefeat(game);

      expect(result).toBe(true);
    });

    it('deve retornar false quando jogador pode jogar cartas', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(50, 'hearts')], // Tem cartas jogáveis
        isConnected: true,
      });

      // Pilhas permitem jogar
      const piles = {
        ascending1: [new Card(40, 'spades')], // Pode jogar 50
        ascending2: [],
        descending1: [],
        descending2: [],
      };

      const game = {
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 0,
        deck: [new Card(60, 'hearts')],
        players: [player],
        piles,
      };

      const result = shouldGameEndInDefeat(game);

      expect(result).toBe(false);
    });

    it('deve retornar false quando jogador já jogou o mínimo necessário', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });

      const piles = {
        ascending1: [new Card(99, 'spades')],
        ascending2: [new Card(99, 'hearts')],
        descending1: [new Card(2, 'spades')],
        descending2: [new Card(2, 'hearts')],
      };

      const game = {
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 2, // Já jogou o mínimo
        deck: [new Card(50, 'hearts')],
        players: [player],
        piles,
      };

      const result = shouldGameEndInDefeat(game);

      expect(result).toBe(false);
    });

    it('deve retornar false quando não é a vez de ninguém', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });

      const game = {
        currentTurn: null,
        cardsPlayedThisTurn: 0,
        deck: [new Card(50, 'hearts')],
        players: [player],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
      };

      const result = shouldGameEndInDefeat(game);

      expect(result).toBe(false);
    });

    it('deve retornar false quando jogador não tem cartas (vitória é verificada separadamente)', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [], // Sem cartas
        isConnected: true,
      });

      const game = {
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 0,
        deck: [],
        players: [player],
        piles: {
          ascending1: [],
          ascending2: [],
          descending1: [],
          descending2: [],
        },
      };

      const result = shouldGameEndInDefeat(game);

      expect(result).toBe(false);
    });

    it('deve retornar true quando deck está vazio e jogador não pode jogar o mínimo (1 carta)', () => {
      const player = new Player({
        id: 'player-1',
        name: 'Player 1',
        hand: [new Card(10, 'hearts')],
        isConnected: true,
      });

      const piles = {
        ascending1: [new Card(99, 'spades')],
        ascending2: [new Card(99, 'hearts')],
        descending1: [new Card(2, 'spades')],
        descending2: [new Card(2, 'hearts')],
      };

      const game = {
        currentTurn: 'player-1',
        cardsPlayedThisTurn: 0, // Não jogou o mínimo (1 carta quando deck vazio)
        deck: [], // Deck vazio, mínimo é 1
        players: [player],
        piles,
      };

      const result = shouldGameEndInDefeat(game);

      expect(result).toBe(true);
    });
  });
});

