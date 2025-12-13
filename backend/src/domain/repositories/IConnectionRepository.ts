export interface Connection {
  connectionId: string;
  gameId: string;
  playerId: string;
  connectedAt: Date;
  lastActivity: Date;
}

export interface IConnectionRepository {
  save(connection: Connection): Promise<void>;
  findByConnectionId(connectionId: string): Promise<Connection | null>;
  findByGameId(gameId: string): Promise<Connection[]>;
  delete(connectionId: string): Promise<void>;
}

