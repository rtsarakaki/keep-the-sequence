import { Card } from './Card';

describe('Card', () => {
  describe('constructor', () => {
    it('deve criar uma carta com valor e naipe', () => {
      const card = new Card(10, 'hearts');
      
      expect(card.value).toBe(10);
      expect(card.suit).toBe('hearts');
    });

    it('deve ser imutável', () => {
      const card = new Card(10, 'hearts');
      
      expect(Object.isFrozen(card)).toBe(true);
    });
  });

  describe('equals', () => {
    it('deve retornar true para cartas iguais', () => {
      const card1 = new Card(10, 'hearts');
      const card2 = new Card(10, 'hearts');
      
      expect(card1.equals(card2)).toBe(true);
    });

    it('deve retornar false para cartas com valores diferentes', () => {
      const card1 = new Card(10, 'hearts');
      const card2 = new Card(20, 'hearts');
      
      expect(card1.equals(card2)).toBe(false);
    });

    it('deve retornar false para cartas com naipes diferentes', () => {
      const card1 = new Card(10, 'hearts');
      const card2 = new Card(10, 'spades');
      
      expect(card1.equals(card2)).toBe(false);
    });
  });
});

