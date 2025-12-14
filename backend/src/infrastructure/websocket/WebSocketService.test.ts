import { WebSocketService, getWebSocketEndpoint } from './WebSocketService';
import { PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-apigatewaymanagementapi', () => {
  const mockSend = jest.fn();
  return {
    ApiGatewayManagementApiClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PostToConnectionCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      mock: true,
    })),
    mockSend,
  };
});

describe('WebSocketService', () => {
  const mockEndpoint = 'https://abc123.execute-api.us-east-1.amazonaws.com/prod';
  let service: WebSocketService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { mockSend: ms } = require('@aws-sdk/client-apigatewaymanagementapi');
    mockSend = ms;
    service = new WebSocketService(mockEndpoint);
  });

  describe('constructor', () => {
    it('deve criar instância com endpoint correto', () => {
      const newService = new WebSocketService(mockEndpoint);
      expect(newService).toBeInstanceOf(WebSocketService);
    });

    it('deve lançar erro se endpoint não for fornecido', () => {
      expect(() => new WebSocketService('')).toThrow('WebSocket endpoint is required');
      expect(() => new WebSocketService(null as any)).toThrow('WebSocket endpoint is required');
    });
  });

  describe('sendToConnection', () => {
    it('deve enviar mensagem para uma conexão', async () => {
      const connectionId = 'conn-123';
      const message = { type: 'test', data: 'hello' };

      mockSend.mockResolvedValue({});

      await service.sendToConnection(connectionId, message);

      expect(PostToConnectionCommand).toHaveBeenCalledWith({
        ConnectionId: connectionId,
        Data: JSON.stringify(message),
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('deve serializar mensagem como JSON', async () => {
      const connectionId = 'conn-123';
      const message = { type: 'gameUpdate', gameId: 'game-1' };

      mockSend.mockResolvedValue({});

      await service.sendToConnection(connectionId, message);

      expect(PostToConnectionCommand).toHaveBeenCalledWith({
        ConnectionId: connectionId,
        Data: JSON.stringify(message),
      });
    });

    it('deve lançar erro específico se conexão não existir (410)', async () => {
      const connectionId = 'conn-invalid';
      const message = { type: 'test' };

      const error = new Error('Connection not found');
      (error as any).statusCode = 410; // Gone status code
      mockSend.mockRejectedValue(error);

      await expect(service.sendToConnection(connectionId, message)).rejects.toThrow(
        'Connection conn-invalid is no longer available'
      );
    });

    it('deve lançar erro específico se não tiver permissão (403)', async () => {
      const connectionId = 'conn-123';
      const message = { type: 'test' };

      const error = new Error('Permission denied');
      (error as any).statusCode = 403;
      mockSend.mockRejectedValue(error);

      await expect(service.sendToConnection(connectionId, message)).rejects.toThrow(
        'Permission denied for connection conn-123'
      );
    });

    it('deve lançar erro se connectionId não for fornecido', async () => {
      const message = { type: 'test' };

      await expect(service.sendToConnection('', message)).rejects.toThrow(
        'ConnectionId is required'
      );
      await expect(service.sendToConnection(null as any, message)).rejects.toThrow(
        'ConnectionId is required'
      );
    });

    it('deve lançar erro se mensagem for null ou undefined', async () => {
      const connectionId = 'conn-123';

      await expect(service.sendToConnection(connectionId, null as any)).rejects.toThrow(
        'Message cannot be null or undefined'
      );
      await expect(service.sendToConnection(connectionId, undefined as any)).rejects.toThrow(
        'Message cannot be null or undefined'
      );
    });

    it('deve lançar erro genérico para outros erros', async () => {
      const connectionId = 'conn-123';
      const message = { type: 'test' };

      const error = new Error('Network error');
      mockSend.mockRejectedValue(error);

      await expect(service.sendToConnection(connectionId, message)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('sendToConnections', () => {
    it('deve enviar mensagem para múltiplas conexões', async () => {
      const connectionIds = ['conn-1', 'conn-2', 'conn-3'];
      const message = { type: 'broadcast', data: 'hello all' };

      mockSend.mockResolvedValue({});

      await service.sendToConnections(connectionIds, message);

      expect(mockSend).toHaveBeenCalledTimes(3);
      expect(PostToConnectionCommand).toHaveBeenCalledTimes(3);
    });

    it('deve continuar enviando mesmo se uma conexão falhar', async () => {
      const connectionIds = ['conn-1', 'conn-invalid', 'conn-3'];
      const message = { type: 'broadcast' };

      const error = new Error('Connection not found');
      (error as any).statusCode = 410;

      mockSend
        .mockResolvedValueOnce({}) // conn-1 success
        .mockRejectedValueOnce(error) // conn-invalid fails
        .mockResolvedValueOnce({}); // conn-3 success

      // Não deve lançar erro
      await expect(service.sendToConnections(connectionIds, message)).resolves.not.toThrow();

      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('deve lidar com array vazio', async () => {
      const connectionIds: string[] = [];
      const message = { type: 'broadcast' };

      await service.sendToConnections(connectionIds, message);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('deve lidar com múltiplas falhas', async () => {
      const connectionIds = ['conn-1', 'conn-2', 'conn-3'];
      const message = { type: 'broadcast' };

      const error = new Error('Connection error');
      mockSend.mockRejectedValue(error);

      // Não deve lançar erro, apenas logar
      await expect(service.sendToConnections(connectionIds, message)).resolves.not.toThrow();

      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('deve lançar erro se connectionIds não for array', async () => {
      const message = { type: 'broadcast' };

      await expect(service.sendToConnections(null as any, message)).rejects.toThrow(
        'ConnectionIds must be an array'
      );
      await expect(service.sendToConnections('not-array' as any, message)).rejects.toThrow(
        'ConnectionIds must be an array'
      );
    });
  });
});

describe('getWebSocketEndpoint', () => {
  it('deve extrair endpoint do evento Lambda', () => {
    const event = {
      requestContext: {
        connectionId: 'conn-123',
        domainName: 'abc123.execute-api.us-east-1.amazonaws.com',
        stage: 'prod',
      },
    } as Parameters<APIGatewayProxyWebsocketHandlerV2>[0];

    const endpoint = getWebSocketEndpoint(event);

    expect(endpoint).toBe('https://abc123.execute-api.us-east-1.amazonaws.com/prod');
  });

  it('deve lançar erro se domainName estiver faltando', () => {
    const event = {
      requestContext: {
        connectionId: 'conn-123',
        stage: 'prod',
      },
    } as any;

    expect(() => getWebSocketEndpoint(event)).toThrow('Missing domainName or stage in request context');
  });

  it('deve lançar erro se stage estiver faltando', () => {
    const event = {
      requestContext: {
        connectionId: 'conn-123',
        domainName: 'abc123.execute-api.us-east-1.amazonaws.com',
      },
    } as any;

    expect(() => getWebSocketEndpoint(event)).toThrow('Missing domainName or stage in request context');
  });
});

