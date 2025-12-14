/**
 * Authentication Service
 * 
 * Simple JWT-based authentication for WebSocket connections.
 * In production, consider using AWS Cognito or a more robust solution.
 */

export interface AuthToken {
  gameId: string;
  playerId: string;
  expiresAt: number;
  origin: string; // Allowed origin (e.g., https://your-app.vercel.app)
}

export interface AuthResult {
  isValid: boolean;
  token?: AuthToken;
  error?: string;
}

/**
 * Validates a JWT-like token for WebSocket connection.
 * 
 * For simplicity, we use a base64-encoded JSON token.
 * In production, use proper JWT with signature verification.
 */
export class AuthService {
  private readonly allowedOrigins: readonly string[];

  constructor(allowedOrigins: readonly string[]) {
    this.allowedOrigins = allowedOrigins;
  }

  /**
   * Validates a connection token
   */
  validateToken(token: string, origin?: string): AuthResult {
    try {
      // Decode token (base64 JSON)
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded) as unknown;
      const authToken = parsed as AuthToken;

      // Check expiration
      if (authToken.expiresAt < Date.now()) {
        return {
          isValid: false,
          error: 'Token expired',
        };
      }

      // Validate origin if provided
      if (origin && !this.isOriginAllowed(origin, authToken.origin)) {
        return {
          isValid: false,
          error: 'Origin not allowed',
        };
      }

      return {
        isValid: true,
        token: authToken,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid token format',
      };
    }
  }

  /**
   * Creates a connection token
   */
  createToken(
    gameId: string,
    playerId: string,
    origin: string,
    expiresInMinutes: number = 30
  ): string {
    const authToken: AuthToken = {
      gameId,
      playerId,
      expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
      origin,
    };

    // Encode as base64 JSON
    return Buffer.from(JSON.stringify(authToken)).toString('base64');
  }

  /**
   * Checks if origin is allowed
   */
  private isOriginAllowed(requestOrigin: string, tokenOrigin: string): boolean {
    // Exact match
    if (requestOrigin === tokenOrigin) {
      return true;
    }

    // Check against allowed origins list
    return this.allowedOrigins.some(
      (allowed) =>
        requestOrigin === allowed ||
        requestOrigin.endsWith(`.${allowed}`) ||
        allowed === '*'
    );
  }
}

