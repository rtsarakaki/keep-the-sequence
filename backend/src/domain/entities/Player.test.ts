import { Player } from './Player';
import { Card } from '../valueObjects/Card';

describe('Player', () => {
  const createPlayer = (hand: Card[] = []): Player => {
    return new Player({
      id: 'player1',
      name: 'Test Player',
      hand,
      isConnected: true,
    });
  };

  describe('constructor', () => {
    it('deve criar um jogador com propriedades corretas', () => {
      const player = createPlayer();
      
      expect(player.id).toBe('player1');
      expect(player.name).toBe('Test Player');
      expect(player.hand).toEqual([]);
      expect(player.isConnected).toBe(true);
    });

    it('deve ser imutável', () => {
      const player = createPlayer();
      
      expect(Object.isFrozen(player)).toBe(true);
    });
  });

  describe('addCardToHand', () => {
    it('deve adicionar carta à mão do jogador', () => {
      const player = createPlayer();
      const card = new Card(10, 'hearts');
      
      const updatedPlayer = player.addCardToHand(card);
      
      expect(updatedPlayer.hand).toHaveLength(1);
      expect(updatedPlayer.hand[0]).toEqual(card);
      expect(player.hand).toHaveLength(0); // Original não foi modificado
    });

    it('não deve modificar o jogador original', () => {
      const player = createPlayer([new Card(10, 'hearts')]);
      const card = new Card(20, 'spades');
      
      const updatedPlayer = player.addCardToHand(card);
      
      expect(player.hand).toHaveLength(1);
      expect(updatedPlayer.hand).toHaveLength(2);
    });
  });

  describe('removeCardFromHand', () => {
    it('deve remover carta da mão do jogador', () => {
      const card1 = new Card(10, 'hearts');
      const card2 = new Card(20, 'spades');
      const player = createPlayer([card1, card2]);
      
      const result = player.removeCardFromHand(0);
      
      expect(result.player.hand).toHaveLength(1);
      expect(result.player.hand[0]).toEqual(card2);
      expect(result.card).toEqual(card1);
      expect(player.hand).toHaveLength(2); // Original não foi modificado
    });

    it('deve lançar erro para índice inválido', () => {
      const player = createPlayer([new Card(10, 'hearts')]);
      
      expect(() => player.removeCardFromHand(-1)).toThrow('Invalid card index');
      expect(() => player.removeCardFromHand(10)).toThrow('Invalid card index');
    });
  });

  describe('updateConnectionStatus', () => {
    it('deve atualizar status de conexão', () => {
      const player = createPlayer();
      
      const disconnectedPlayer = player.updateConnectionStatus(false);
      
      expect(disconnectedPlayer.isConnected).toBe(false);
      expect(player.isConnected).toBe(true); // Original não foi modificado
    });
  });
});

