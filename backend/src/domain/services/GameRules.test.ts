import { Card } from '../valueObjects/Card';
import { canPlayCard, calculateScore, shouldGameEndInDefeat, hasAnyCardsBeenPlayed, canPlayerPlayOnNonMarkedPiles, findNextPlayerWithCards } from './GameRules';
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
        pilePreferences: {},
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
        pilePreferences: {},
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
        pilePreferences: {},
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
        pilePreferences: {},
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
        pilePreferences: {},
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
        pilePreferences: {},
      };

      const result = shouldGameEndInDefeat(game);

      expect(result).toBe(true);
    });
  });

  describe('hasAnyCardsBeenPlayed', () => {
    it('deve retornar false quando apenas as cartas iniciais estão nas pilhas', () => {
      // Piles start with initial cards: 1 for ascending, 100 for descending
      const piles = {
        ascending1: [new Card(1, 'hearts')],
        ascending2: [new Card(1, 'hearts')],
        descending1: [new Card(100, 'hearts')],
        descending2: [new Card(100, 'hearts')],
      };

      const result = hasAnyCardsBeenPlayed(piles);

      expect(result).toBe(false);
    });

    it('deve retornar true quando pelo menos uma carta foi jogada em qualquer pilha', () => {
      // Starting card (1) + played card (10)
      const piles = {
        ascending1: [new Card(1, 'hearts'), new Card(10, 'hearts')],
        ascending2: [new Card(1, 'hearts')],
        descending1: [new Card(100, 'hearts')],
        descending2: [new Card(100, 'hearts')],
      };

      const result = hasAnyCardsBeenPlayed(piles);

      expect(result).toBe(true);
    });

    it('deve retornar true quando cartas foram jogadas em múltiplas pilhas', () => {
      const piles = {
        ascending1: [new Card(1, 'hearts'), new Card(10, 'hearts')],
        ascending2: [new Card(1, 'hearts'), new Card(20, 'spades')],
        descending1: [new Card(100, 'hearts'), new Card(90, 'clubs')],
        descending2: [new Card(100, 'hearts')],
      };

      const result = hasAnyCardsBeenPlayed(piles);

      expect(result).toBe(true);
    });
  });

  describe('canPlayerPlayOnNonMarkedPiles', () => {
    it('deve retornar true quando jogador pode jogar em pilha não marcada', () => {
      const playerHand = [new Card(50, 'hearts')];
      const piles = {
        ascending1: [new Card(40, 'spades')], // Pode jogar aqui
        ascending2: [new Card(1, 'hearts')],
        descending1: [new Card(100, 'hearts')],
        descending2: [new Card(100, 'hearts')],
      };
      const pilePreferences: Record<string, 'ascending1' | 'ascending2' | 'descending1' | 'descending2' | null> = {
        'player-2': 'ascending2', // Outro jogador marcou ascending2
      };
      const currentPlayerId = 'player-1';

      const result = canPlayerPlayOnNonMarkedPiles(
        playerHand,
        piles,
        pilePreferences,
        currentPlayerId
      );

      expect(result).toBe(true); // Pode jogar em ascending1 (não marcada)
    });

    it('deve retornar false quando todas as pilhas jogáveis estão marcadas', () => {
      const playerHand = [new Card(50, 'hearts')];
      const piles = {
        ascending1: [new Card(40, 'spades')], // Pode jogar aqui (50 > 40), mas está marcada
        ascending2: [new Card(99, 'hearts')], // Não pode jogar (50 não é > 99)
        descending1: [new Card(100, 'hearts')], // Pode jogar aqui (50 < 100), mas está marcada
        descending2: [new Card(100, 'hearts')], // Pode jogar aqui (50 < 100), mas está marcada
      };
      const pilePreferences: Record<string, 'ascending1' | 'ascending2' | 'descending1' | 'descending2' | null> = {
        'player-2': 'ascending1', // Outro jogador marcou ascending1
        'player-3': 'descending1', // Outro jogador marcou descending1
        'player-4': 'descending2', // Outro jogador marcou descending2
      };
      const currentPlayerId = 'player-1';

      const result = canPlayerPlayOnNonMarkedPiles(
        playerHand,
        piles,
        pilePreferences,
        currentPlayerId
      );

      expect(result).toBe(false); // Todas as pilhas jogáveis estão marcadas
    });

    it('deve ignorar marcações do próprio jogador', () => {
      const playerHand = [new Card(50, 'hearts')];
      const piles = {
        ascending1: [new Card(40, 'spades')], // Pode jogar aqui
        ascending2: [new Card(1, 'hearts')],
        descending1: [new Card(100, 'hearts')],
        descending2: [new Card(100, 'hearts')],
      };
      const pilePreferences: Record<string, 'ascending1' | 'ascending2' | 'descending1' | 'descending2' | null> = {
        'player-1': 'ascending1', // Próprio jogador marcou, mas deve ser ignorado
      };
      const currentPlayerId = 'player-1';

      const result = canPlayerPlayOnNonMarkedPiles(
        playerHand,
        piles,
        pilePreferences,
        currentPlayerId
      );

      expect(result).toBe(true); // Pode jogar em ascending1 (própria marcação ignorada)
    });

    it('deve retornar false quando jogador não tem cartas', () => {
      const playerHand: readonly Card[] = [];
      const piles = {
        ascending1: [new Card(40, 'spades')],
        ascending2: [new Card(1, 'hearts')],
        descending1: [new Card(100, 'hearts')],
        descending2: [new Card(100, 'hearts')],
      };
      const pilePreferences: Record<string, 'ascending1' | 'ascending2' | 'descending1' | 'descending2' | null> = {};
      const currentPlayerId = 'player-1';

      const result = canPlayerPlayOnNonMarkedPiles(
        playerHand,
        piles,
        pilePreferences,
        currentPlayerId
      );

      expect(result).toBe(false);
    });

    it('deve retornar true quando não há marcações', () => {
      const playerHand = [new Card(50, 'hearts')];
      const piles = {
        ascending1: [new Card(40, 'spades')], // Pode jogar aqui
        ascending2: [new Card(1, 'hearts')],
        descending1: [new Card(100, 'hearts')],
        descending2: [new Card(100, 'hearts')],
      };
      const pilePreferences: Record<string, 'ascending1' | 'ascending2' | 'descending1' | 'descending2' | null> = {};
      const currentPlayerId = 'player-1';

      const result = canPlayerPlayOnNonMarkedPiles(
        playerHand,
        piles,
        pilePreferences,
        currentPlayerId
      );

      expect(result).toBe(true);
    });
  });

  describe('findNextPlayerWithCards', () => {
    it('deve encontrar o próximo jogador com cartas', () => {
      const players = [
        { id: 'player-1', hand: [] },
        { id: 'player-2', hand: [new Card(10, 'hearts')] },
        { id: 'player-3', hand: [] },
        { id: 'player-4', hand: [new Card(20, 'spades')] },
      ];

      const result = findNextPlayerWithCards(players, 0); // Start from player-1

      expect(result).not.toBeNull();
      expect(result?.id).toBe('player-2');
    });

    it('deve pular múltiplos jogadores sem cartas', () => {
      const players = [
        { id: 'player-1', hand: [] },
        { id: 'player-2', hand: [] },
        { id: 'player-3', hand: [] },
        { id: 'player-4', hand: [new Card(20, 'spades')] },
      ];

      const result = findNextPlayerWithCards(players, 0); // Start from player-1

      expect(result).not.toBeNull();
      expect(result?.id).toBe('player-4');
    });

    it('deve fazer busca circular quando necessário', () => {
      const players = [
        { id: 'player-1', hand: [] },
        { id: 'player-2', hand: [] },
        { id: 'player-3', hand: [new Card(20, 'spades')] },
        { id: 'player-4', hand: [] },
      ];

      const result = findNextPlayerWithCards(players, 3); // Start from player-4 (last)

      expect(result).not.toBeNull();
      expect(result?.id).toBe('player-3');
    });

    it('deve retornar null quando nenhum jogador tem cartas', () => {
      const players = [
        { id: 'player-1', hand: [] },
        { id: 'player-2', hand: [] },
        { id: 'player-3', hand: [] },
        { id: 'player-4', hand: [] },
      ];

      const result = findNextPlayerWithCards(players, 0);

      expect(result).toBeNull();
    });

    it('deve retornar o próximo jogador mesmo se o atual tiver cartas', () => {
      const players = [
        { id: 'player-1', hand: [new Card(10, 'hearts')] },
        { id: 'player-2', hand: [new Card(20, 'spades')] },
        { id: 'player-3', hand: [] },
      ];

      const result = findNextPlayerWithCards(players, 0); // Start from player-1

      expect(result).not.toBeNull();
      expect(result?.id).toBe('player-2'); // Next player, not current
    });
  });
});

