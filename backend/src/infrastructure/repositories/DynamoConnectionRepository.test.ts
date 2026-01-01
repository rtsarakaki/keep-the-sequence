import { DynamoConnectionRepository } from './DynamoConnectionRepository';
import { Connection } from '../../domain/repositories/IConnectionRepository';

describe('DynamoConnectionRepository', () => {
  const createTestConnection = (): Connection => {
    return {
      connectionId: 'conn-abc123',
      gameId: 'game-123',
      playerId: 'player-1',
      clientIp: '192.168.1.1',
      connectedAt: new Date('2024-01-01T10:00:00Z'),
      lastActivity: new Date('2024-01-01T11:00:00Z'),
    };
  };

  describe('mapToDynamoItem', () => {
    it('deve converter Connection para formato DynamoDB corretamente', () => {
      const connection = createTestConnection();
      const repository = new DynamoConnectionRepository('test-table');
      const item = (repository as any).mapToDynamoItem(connection);

      expect(item.connectionId).toBe('conn-abc123');
      expect(item.gameId).toBe('game-123');
      expect(item.playerId).toBe('player-1');
      expect(item.connectedAt).toBe(new Date('2024-01-01T10:00:00Z').getTime());
      expect(item.lastActivity).toBe(new Date('2024-01-01T11:00:00Z').getTime());
    });

    it('deve converter todas as propriedades corretamente', () => {
      const connection: Connection = {
        connectionId: 'conn-xyz789',
        gameId: 'game-456',
        playerId: 'player-2',
        clientIp: '192.168.1.2',
        connectedAt: new Date('2024-01-02T12:00:00Z'),
        lastActivity: new Date('2024-01-02T13:30:00Z'),
      };

      const repository = new DynamoConnectionRepository('test-table');
      const item = (repository as any).mapToDynamoItem(connection);

      expect(item).toEqual({
        connectionId: 'conn-xyz789',
        gameId: 'game-456',
        playerId: 'player-2',
        clientIp: '192.168.1.2',
        connectedAt: new Date('2024-01-02T12:00:00Z').getTime(),
        lastActivity: new Date('2024-01-02T13:30:00Z').getTime(),
      });
    });

    it('deve converter Connection sem clientIp corretamente', () => {
      const connection: Connection = {
        connectionId: 'conn-xyz789',
        gameId: 'game-456',
        playerId: 'player-2',
        connectedAt: new Date('2024-01-02T12:00:00Z'),
        lastActivity: new Date('2024-01-02T13:30:00Z'),
      };

      const repository = new DynamoConnectionRepository('test-table');
      const item = (repository as any).mapToDynamoItem(connection);

      expect(item.clientIp).toBeUndefined();
    });
  });

  describe('mapToConnection', () => {
    it('deve converter item DynamoDB para Connection corretamente', () => {
      const item = {
        connectionId: 'conn-abc123',
        gameId: 'game-123',
        playerId: 'player-1',
        clientIp: '192.168.1.1',
        connectedAt: new Date('2024-01-01T10:00:00Z').getTime(),
        lastActivity: new Date('2024-01-01T11:00:00Z').getTime(),
      };

      const repository = new DynamoConnectionRepository('test-table');
      const connection = (repository as any).mapToConnection(item);

      expect(connection.connectionId).toBe('conn-abc123');
      expect(connection.gameId).toBe('game-123');
      expect(connection.playerId).toBe('player-1');
      expect(connection.clientIp).toBe('192.168.1.1');
      expect(connection.connectedAt).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(connection.lastActivity).toEqual(new Date('2024-01-01T11:00:00Z'));
    });

    it('deve converter item DynamoDB sem clientIp corretamente', () => {
      const item = {
        connectionId: 'conn-abc123',
        gameId: 'game-123',
        playerId: 'player-1',
        connectedAt: new Date('2024-01-01T10:00:00Z').getTime(),
        lastActivity: new Date('2024-01-01T11:00:00Z').getTime(),
      };

      const repository = new DynamoConnectionRepository('test-table');
      const connection = (repository as any).mapToConnection(item);

      expect(connection.clientIp).toBeUndefined();
    });

    it('deve fazer round-trip: Connection → DynamoDB → Connection preservando dados', () => {
      const originalConnection = createTestConnection();
      const repository = new DynamoConnectionRepository('test-table');
      
      const item = (repository as any).mapToDynamoItem(originalConnection);
      const restoredConnection = (repository as any).mapToConnection(item);

      expect(restoredConnection.connectionId).toBe(originalConnection.connectionId);
      expect(restoredConnection.gameId).toBe(originalConnection.gameId);
      expect(restoredConnection.playerId).toBe(originalConnection.playerId);
      expect(restoredConnection.clientIp).toBe(originalConnection.clientIp);
      expect(restoredConnection.connectedAt).toEqual(originalConnection.connectedAt);
      expect(restoredConnection.lastActivity).toEqual(originalConnection.lastActivity);
    });

    it('deve lançar erro se connectionId estiver faltando', () => {
      const item = {
        gameId: 'game-123',
        playerId: 'player-1',
        connectedAt: Date.now(),
        lastActivity: Date.now(),
      };

      const repository = new DynamoConnectionRepository('test-table');
      expect(() => (repository as any).mapToConnection(item)).toThrow('Invalid DynamoDB item: missing or invalid connectionId');
    });

    it('deve lançar erro se gameId estiver faltando', () => {
      const item = {
        connectionId: 'conn-abc123',
        playerId: 'player-1',
        connectedAt: Date.now(),
        lastActivity: Date.now(),
      };

      const repository = new DynamoConnectionRepository('test-table');
      expect(() => (repository as any).mapToConnection(item)).toThrow('Invalid DynamoDB item: missing or invalid gameId');
    });

    it('deve lançar erro se playerId estiver faltando', () => {
      const item = {
        connectionId: 'conn-abc123',
        gameId: 'game-123',
        connectedAt: Date.now(),
        lastActivity: Date.now(),
      };

      const repository = new DynamoConnectionRepository('test-table');
      expect(() => (repository as any).mapToConnection(item)).toThrow('Invalid DynamoDB item: missing or invalid playerId');
    });

    it('deve lançar erro se timestamps estiverem faltando', () => {
      const item = {
        connectionId: 'conn-abc123',
        gameId: 'game-123',
        playerId: 'player-1',
      };

      const repository = new DynamoConnectionRepository('test-table');
      expect(() => (repository as any).mapToConnection(item)).toThrow('Invalid DynamoDB item: missing or invalid timestamps');
    });
  });
});

