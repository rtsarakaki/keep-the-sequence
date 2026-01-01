/**
 * DTO for creating a new game
 */
export interface CreateGameDTO {
  playerName: string;
  playerId?: string; // Optional, will be generated if not provided
  clientIp?: string; // Client IP address for security validation
}

