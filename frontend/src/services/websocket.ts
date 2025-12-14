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
   * Connect to WebSocket using gameId and playerId
   */
  async connect(gameId: string, playerId: string): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    try {
      this.setStatus('connecting');

      // Get WebSocket URL with token
      const { wsUrl } = await getWebSocketUrl(gameId, playerId);

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
        this.callbacks.onError?.(new Error('Erro na conexão WebSocket'));
        this.setStatus('error');
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket desconectado:', event.code, event.reason);
        this.setStatus('disconnected');

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(gameId, playerId);
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
  private attemptReconnect(gameId: string, playerId: string): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(gameId, playerId).catch((error) => {
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

