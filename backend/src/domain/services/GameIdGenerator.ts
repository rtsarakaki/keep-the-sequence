import { IGameRepository } from '../repositories/IGameRepository';

/**
 * Generates short, unique game IDs (6 alphanumeric characters)
 * 
 * Format: 6 characters (0-9, A-Z)
 * Total combinations: 36^6 = ~2.1 billion
 * 
 * Strategy:
 * 1. Generate random 6-character code
 * 2. Check if it exists in repository
 * 3. Retry if collision (max 10 attempts)
 */
export class GameIdGenerator {
  private static readonly ID_LENGTH = 6;
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /**
   * Generate a random 6-character alphanumeric code
   */
  private static generateRandomCode(): string {
    let code = '';
    for (let i = 0; i < this.ID_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * this.CHARACTERS.length);
      code += this.CHARACTERS[randomIndex];
    }
    return code;
  }

  /**
   * Generate a unique game ID
   * 
   * @param gameRepository Repository to check for existing IDs
   * @returns Promise resolving to a unique game ID
   */
  static async generateUniqueId(gameRepository: IGameRepository): Promise<string> {
    for (let attempt = 0; attempt < this.MAX_ATTEMPTS; attempt++) {
      const candidateId = this.generateRandomCode();
      
      // Check if ID already exists
      const existingGame = await gameRepository.findById(candidateId);
      
      if (!existingGame) {
        return candidateId;
      }
      
      // If we've tried many times, log a warning
      if (attempt === this.MAX_ATTEMPTS - 1) {
        console.warn(`Failed to generate unique game ID after ${this.MAX_ATTEMPTS} attempts`);
      }
    }
    
    // Fallback: append timestamp to make it unique (should be very rare)
    const baseCode = this.generateRandomCode();
    const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
    return baseCode.slice(0, 4) + timestamp;
  }
}




