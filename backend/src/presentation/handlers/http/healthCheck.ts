import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Simple health check endpoint.
 * 
 * Returns 200 OK if the API is accessible.
 * Does not require any parameters or authentication.
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // Get HTTP method from request context (API Gateway v2 format)
  const httpMethod = event.requestContext?.http?.method || 'GET';
  
  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    const origin = event.headers?.origin || event.headers?.Origin || '*';
    return Promise.resolve({
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Origin',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    });
  }

  const origin = event.headers?.origin || event.headers?.Origin || '*';

  // Simple health check - just return OK
  return Promise.resolve({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin',
    },
    body: JSON.stringify({
      status: 'ok',
      service: 'the-game-backend',
      timestamp: new Date().toISOString(),
    }),
  });
};

