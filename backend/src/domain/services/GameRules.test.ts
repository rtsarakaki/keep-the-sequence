import { Card } from '../valueObjects/Card';
import { canPlayCard, calculateScore } from './GameRules';

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
      const playedCards = 5; // 2 + 1 + 2 + 1
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
});

