import { APIGatewayProxyEventV2, APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { getClientIp } from './getClientIp';

describe('getClientIp', () => {
  describe('HTTP events (APIGatewayProxyEventV2)', () => {
    it('should extract IP from requestContext.http.sourceIp', () => {
      const event = {
        requestContext: {
          http: {
            sourceIp: '192.168.1.1',
          },
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBe('192.168.1.1');
    });

    it('should fallback to X-Forwarded-For header when sourceIp is not available', () => {
      const event = {
        requestContext: {
          http: {},
        },
        headers: {
          'X-Forwarded-For': '10.0.0.1',
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBe('10.0.0.1');
    });

    it('should fallback to x-forwarded-for header (lowercase)', () => {
      const event = {
        requestContext: {
          http: {},
        },
        headers: {
          'x-forwarded-for': '10.0.0.2',
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBe('10.0.0.2');
    });

    it('should take first IP from X-Forwarded-For when multiple IPs are present', () => {
      const event = {
        requestContext: {
          http: {},
        },
        headers: {
          'X-Forwarded-For': '10.0.0.1, 192.168.1.1, 172.16.0.1',
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBe('10.0.0.1');
    });

    it('should fallback to X-Real-Ip header when X-Forwarded-For is not available', () => {
      const event = {
        requestContext: {
          http: {},
        },
        headers: {
          'X-Real-Ip': '172.16.0.1',
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBe('172.16.0.1');
    });

    it('should fallback to x-real-ip header (lowercase)', () => {
      const event = {
        requestContext: {
          http: {},
        },
        headers: {
          'x-real-ip': '172.16.0.2',
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBe('172.16.0.2');
    });

    it('should return undefined when no IP information is available', () => {
      const event = {
        requestContext: {
          http: {},
        },
        headers: {},
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBeUndefined();
    });

    it('should return undefined when headers are not present', () => {
      const event = {
        requestContext: {
          http: {},
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBeUndefined();
    });
  });

  describe('WebSocket events', () => {
    it('should extract IP from requestContext.identity.sourceIp', () => {
      const event = {
        requestContext: {
          connectionId: 'test-connection-id',
          identity: {
            sourceIp: '192.168.1.2',
          },
        },
      } as unknown as Parameters<APIGatewayProxyWebsocketHandlerV2>[0];

      const result = getClientIp(event);
      expect(result).toBe('192.168.1.2');
    });

    it('should fallback to X-Forwarded-For header for WebSocket events', () => {
      const event = {
        requestContext: {
          connectionId: 'test-connection-id',
          identity: {},
        },
        headers: {
          'X-Forwarded-For': '10.0.0.3',
        },
      } as unknown as Parameters<APIGatewayProxyWebsocketHandlerV2>[0];

      const result = getClientIp(event);
      expect(result).toBe('10.0.0.3');
    });

    it('should fallback to X-Real-Ip header for WebSocket events', () => {
      const event = {
        requestContext: {
          connectionId: 'test-connection-id',
          identity: {},
        },
        headers: {
          'X-Real-Ip': '172.16.0.3',
        },
      } as unknown as Parameters<APIGatewayProxyWebsocketHandlerV2>[0];

      const result = getClientIp(event);
      expect(result).toBe('172.16.0.3');
    });

    it('should return undefined when no IP information is available for WebSocket', () => {
      const event = {
        requestContext: {
          connectionId: 'test-connection-id',
          identity: {},
        },
        headers: {},
      } as unknown as Parameters<APIGatewayProxyWebsocketHandlerV2>[0];

      const result = getClientIp(event);
      expect(result).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string in sourceIp', () => {
      const event = {
        requestContext: {
          http: {
            sourceIp: '',
          },
        },
        headers: {
          'X-Forwarded-For': '10.0.0.4',
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBe('10.0.0.4');
    });

    it('should trim whitespace from X-Forwarded-For', () => {
      const event = {
        requestContext: {
          http: {},
        },
        headers: {
          'X-Forwarded-For': '  10.0.0.5  ',
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBe('10.0.0.5');
    });

    it('should trim whitespace from X-Real-Ip', () => {
      const event = {
        requestContext: {
          http: {},
        },
        headers: {
          'X-Real-Ip': '  172.16.0.4  ',
        },
      } as unknown as APIGatewayProxyEventV2;

      const result = getClientIp(event);
      expect(result).toBe('172.16.0.4');
    });
  });
});
