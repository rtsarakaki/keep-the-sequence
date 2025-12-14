import { AuthService } from './AuthService';

describe('AuthService', () => {
  const allowedOrigins = ['https://example.com', 'https://app.vercel.app'];
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(allowedOrigins);
  });

  describe('createToken', () => {
    it('should create a valid token', () => {
      const token = authService.createToken('game-1', 'player-1', 'https://example.com', 30);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should create token with expiration', () => {
      const token = authService.createToken('game-1', 'player-1', 'https://example.com', 5);
      const result = authService.validateToken(token);
      
      expect(result.isValid).toBe(true);
      expect(result.token?.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', () => {
      const token = authService.createToken('game-1', 'player-1', 'https://example.com', 30);
      const result = authService.validateToken(token);
      
      expect(result.isValid).toBe(true);
      expect(result.token?.gameId).toBe('game-1');
      expect(result.token?.playerId).toBe('player-1');
    });

    it('should reject expired token', () => {
      // Create token with negative expiration (already expired)
      const authToken = {
        gameId: 'game-1',
        playerId: 'player-1',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        origin: 'https://example.com',
      };
      const token = Buffer.from(JSON.stringify(authToken)).toString('base64');
      
      const result = authService.validateToken(token);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should reject invalid token format', () => {
      const result = authService.validateToken('invalid-token');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('should validate origin when provided', () => {
      const token = authService.createToken('game-1', 'player-1', 'https://example.com', 30);
      
      // Valid origin
      const result1 = authService.validateToken(token, 'https://example.com');
      expect(result1.isValid).toBe(true);
      
      // Invalid origin
      const result2 = authService.validateToken(token, 'https://malicious.com');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Origin not allowed');
    });

    it('should allow wildcard origin', () => {
      const wildcardService = new AuthService(['*']);
      const token = wildcardService.createToken('game-1', 'player-1', '*', 30);
      
      const result = wildcardService.validateToken(token, 'https://any-origin.com');
      expect(result.isValid).toBe(true);
    });
  });
});

