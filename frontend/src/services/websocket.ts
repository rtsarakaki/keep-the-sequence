/**
 * WebSocket Service for game communication
 */

import { getWebSocketUrl } from './api';

export type WebSocketMessage = 
  | { type: 'gameUpdated'; game: unknown }
  | { type: 'gameState'; game: unknown }
  | { type: 'error'; error: string };

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketCallbacks {
  onMessage?: (message: WebSocketMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onError?: (error: Error) => void;
}

/**
 * WebSocket client for game communication
 */
export class GameWebSocket {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'disconnected';
  private readonly callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(callbacks: WebSocketCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to WebSocket using gameId and playerId (or playerName)
   */
  async connect(
    gameId: string, 
    playerIdOrName: string,
    options?: { useName?: boolean }
  ): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    try {
      this.setStatus('connecting');

      // Get WebSocket URL with token
      let wsUrl: string;
      try {
        const result = await getWebSocketUrl(gameId, playerIdOrName, options);
        wsUrl = result.wsUrl;
      } catch (error) {
        // Error getting WebSocket URL (before connecting)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao obter URL do WebSocket';
        this.setStatus('error');
        this.callbacks.onError?.(new Error(`Não foi possível obter URL do WebSocket: ${errorMessage}`));
        throw error;
      }

      // Connect to WebSocket
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket conectado');
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.callbacks.onMessage?.(message);
        } catch (error) {
          console.error('Erro ao parsear mensagem WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        // Error details will be in onclose event
        this.setStatus('error');
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket desconectado:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        this.setStatus('disconnected');

        // Provide detailed error message based on close code
        if (event.code !== 1000) {
          let errorMessage = 'Erro na conexão WebSocket';
          
          // API Gateway WebSocket close codes
          // 1000: Normal closure
          // 1006: Abnormal closure (connection lost)
          // 4001-4004: Custom error codes from API Gateway
          
          if (event.code === 1006) {
            // Connection closed unexpectedly - could be:
            // - Game not found
            // - Player not in game
            // - Token expired/invalid
            // - Network issue
            errorMessage = 'Conexão fechada inesperadamente.\n\nPossíveis causas:\n';
            errorMessage += '1. O jogo não existe ou foi deletado\n';
            errorMessage += '2. Você não faz parte deste jogo\n';
            errorMessage += '3. Token de autenticação expirado\n';
            errorMessage += '4. Problema de rede\n\n';
            errorMessage += `Código: ${event.code}`;
            if (event.reason) {
              errorMessage += `\nDetalhes: ${event.reason}`;
            }
          } else if (event.code >= 4001 && event.code <= 4004) {
            // API Gateway custom error codes
            let reasonText = event.reason || 'Erro desconhecido';
            try {
              const reasonData = JSON.parse(reasonText);
              reasonText = reasonData.error || reasonText;
            } catch {
              // Not JSON, use as-is
            }
            
            if (event.code === 4001) {
              errorMessage = `Erro de autenticação: ${reasonText}`;
            } else if (event.code === 4003) {
              errorMessage = `Acesso negado: ${reasonText}`;
            } else {
              errorMessage = `Erro do servidor (código ${event.code}): ${reasonText}`;
            }
          } else if (event.reason) {
            try {
              const reasonData = JSON.parse(event.reason);
              errorMessage = reasonData.error || event.reason;
            } catch {
              errorMessage = event.reason;
            }
          } else {
            errorMessage = `Conexão fechada (código: ${event.code}). Verifique se o jogo existe e você faz parte dele.`;
          }
          
          this.callbacks.onError?.(new Error(errorMessage));
        }

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(gameId, playerIdOrName, options);
        }
      };
    } catch (error) {
      this.setStatus('error');
      const err = error instanceof Error ? error : new Error('Erro desconhecido ao conectar');
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(
    gameId: string, 
    playerIdOrName: string,
    options?: { useName?: boolean }
  ): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(gameId, playerIdOrName, options).catch((error) => {
        console.error('Erro ao reconectar:', error);
      });
    }, delay);
  }

  /**
   * Send message via WebSocket
   */
  send(message: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket não está conectado');
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Get current status
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Set status and notify callback
   */
  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }
}

