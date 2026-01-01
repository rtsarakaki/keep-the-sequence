import { APIGatewayProxyEventV2, APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

/**
 * Extracts client IP address from API Gateway event
 * 
 * For HTTP events (APIGatewayProxyEventV2):
 * - Checks requestContext.http.sourceIp
 * - Falls back to X-Forwarded-For header
 * 
 * For WebSocket events (APIGatewayProxyWebsocketHandlerV2):
 * - Checks requestContext.identity.sourceIp
 * - Falls back to X-Forwarded-For header
 */
export function getClientIp(
  event: APIGatewayProxyEventV2 | Parameters<APIGatewayProxyWebsocketHandlerV2>[0]
): string | undefined {
  // Try to get IP from request context
  const requestContext = event.requestContext;
  
  // For HTTP events (APIGatewayProxyEventV2)
  if ('http' in requestContext && requestContext.http) {
    const httpContext = requestContext.http as { sourceIp?: string };
    const sourceIp = httpContext.sourceIp;
    if (sourceIp && typeof sourceIp === 'string') {
      return sourceIp;
    }
  }
  
  // For WebSocket events
  if ('identity' in requestContext && requestContext.identity) {
    const identity = requestContext.identity as { sourceIp?: string };
    const sourceIp = identity.sourceIp;
    if (sourceIp && typeof sourceIp === 'string') {
      return sourceIp;
    }
  }
  
  // Fallback to X-Forwarded-For header
  // Type-safe access to headers
  const eventWithHeaders = event as { headers?: Record<string, string | undefined> };
  const headers = eventWithHeaders.headers;
  const xForwardedFor = headers?.['X-Forwarded-For'] || headers?.['x-forwarded-for'];
  
  if (xForwardedFor && typeof xForwardedFor === 'string') {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  // Fallback to X-Real-Ip header
  const xRealIp = headers?.['X-Real-Ip'] || headers?.['x-real-ip'];
  if (xRealIp && typeof xRealIp === 'string') {
    return xRealIp.trim();
  }
  
  return undefined;
}
