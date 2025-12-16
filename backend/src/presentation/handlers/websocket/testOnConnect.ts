import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

/**
 * Simple test $connect handler - "Hello World" version
 * 
 * This handler:
 * - Accepts ALL connections without validation
 * - Does NOT access DynamoDB or any persistence
 * - Does NOT validate tokens
 * - Always returns success
 * 
 * Used for testing WebSocket connectivity without authentication/persistence
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  console.log('[TEST_CONNECT] Connection attempt', {
    connectionId,
    routeKey: event.requestContext.routeKey,
    domainName: event.requestContext.domainName,
    stage: event.requestContext.stage,
    hasQueryParams: !!event.requestContext,
  });

  if (!connectionId) {
    console.error('[TEST_CONNECT] Missing connectionId');
    return Promise.resolve({
      statusCode: 400,
    });
  }

  // Accept connection immediately - no validation
  console.log('[TEST_CONNECT] Accepting connection:', connectionId);
  
  return Promise.resolve({
    statusCode: 200,
  });
};

