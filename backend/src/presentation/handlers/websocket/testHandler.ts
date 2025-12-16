import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

/**
 * Simple test handler - "Hello World" version
 * 
 * This handler:
 * - Receives WebSocket messages
 * - Returns fixed mock data
 * - Does NOT access DynamoDB or any persistence
 * - Tries to send response via WebSocket
 * - Always returns success
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  console.log('[TEST] Handler invoked', {
    connectionId: event.requestContext.connectionId,
    routeKey: event.requestContext.routeKey,
    hasBody: !!event.body,
    bodyLength: event.body?.length || 0,
    domainName: event.requestContext.domainName,
    stage: event.requestContext.stage,
  });

  const connectionId = event.requestContext.connectionId;

  if (!connectionId) {
    console.error('[TEST] Missing connectionId');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing connectionId' }),
    };
  }

  // Parse message body
  let messageBody: unknown;
  try {
    messageBody = event.body ? JSON.parse(event.body) : null;
  } catch (error) {
    console.error('[TEST] Failed to parse body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  console.log('[TEST] Parsed message:', {
    messageBody,
    action: messageBody && typeof messageBody === 'object' && 'action' in messageBody 
      ? (messageBody as { action: string }).action 
      : 'no action',
  });

  // Fixed mock data - no external dependencies
  const mockResponse = {
    type: 'gameState',
    game: {
      id: 'TEST_GAME_123',
      players: [
        {
          id: 'test-player-1',
          name: 'Test Player',
          hand: [
            { value: 10, suit: 'hearts' },
            { value: 20, suit: 'clubs' },
          ],
          isConnected: true,
        },
      ],
      piles: {
        ascending1: [],
        ascending2: [],
        descending1: [],
        descending2: [],
      },
      deck: [],
      discardPile: [],
      currentTurn: null,
      status: 'waiting' as const,
    },
  };

  console.log('[TEST] Prepared mock response');

  // Try to send via WebSocket (non-blocking)
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;

  if (domainName && stage) {
    try {
      const endpoint = `https://${domainName}/${stage}`;
      console.log('[TEST] Creating WebSocket client with endpoint:', endpoint);

      const client = new ApiGatewayManagementApiClient({
        endpoint,
        region: process.env.AWS_REGION || 'us-east-1',
      });

      const messageString = JSON.stringify(mockResponse);
      console.log('[TEST] Sending message (non-blocking):', messageString.substring(0, 100));

      // Send asynchronously - start the promise but don't wait for it
      // Use Promise.resolve() to satisfy lint requirement for await
      await Promise.resolve(
        client.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: messageString,
        }))
          .then(() => {
            console.log('[TEST] Message sent successfully to', connectionId);
          })
          .catch((error) => {
            console.error('[TEST] Failed to send message (non-blocking):', {
              errorMessage: error instanceof Error ? error.message : String(error),
              connectionId,
            });
          })
      );
    } catch (error) {
      console.error('[TEST] Failed to create WebSocket client:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        connectionId,
        domainName,
        stage,
      });
    }
  } else {
    console.warn('[TEST] Missing domainName or stage, skipping WebSocket send', {
      domainName: !!domainName,
      stage: !!stage,
    });
  }

  // Always return success immediately
  console.log('[TEST] Returning success response');
  return {
    statusCode: 200,
  };
};

