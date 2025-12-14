export interface Connection {
  connectionId: string;
  gameId: string;
  playerId: string;
  connectedAt: Date;
  lastActivity: Date;
  ttl?: number; // Time to Live (Unix timestamp in seconds)
}

export interface IConnectionRepository {
  save(connection: Connection): Promise<void>;
  findByConnectionId(connectionId: string): Promise<Connection | null>;
  findByGameId(gameId: string): Promise<Connection[]>;
  delete(connectionId: string): Promise<void>;
}

