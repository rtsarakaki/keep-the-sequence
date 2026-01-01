/**
 * DTO for joining an existing game
 */
export interface JoinGameDTO {
  gameId: string;
  playerName: string;
  playerId?: string; // Optional, will be generated if not provided
  clientIp?: string; // Client IP address for security validation
}

