import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

export class GameStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const gamesTable = new dynamodb.Table(this, 'GamesTable', {
      tableName: 'the-game-games',
      partitionKey: { name: 'gameId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
    });

    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: 'the-game-connections',
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
    });

    const gameEventsTable = new dynamodb.Table(this, 'GameEventsTable', {
      tableName: 'the-game-game-events',
      partitionKey: { name: 'gameId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
    });

    // Dead Letter Queue
    const gameEventsDLQ = new sqs.Queue(this, 'GameEventsDLQ', {
      queueName: 'the-game-game-events-dlq',
      retentionPeriod: cdk.Duration.days(14),
    });

    // SQS Queue
    const gameEventsQueue = new sqs.Queue(this, 'GameEventsQueue', {
      queueName: 'the-game-game-events',
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: gameEventsDLQ,
        maxReceiveCount: 3,
      },
    });

    // WebSocket API Gateway
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'GameWebSocketApi', {
      apiName: 'the-game-websocket-api',
      description: 'WebSocket API for The Game',
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'GameWebSocketStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Outputs
    new cdk.CfnOutput(this, 'GamesTableName', {
      value: gamesTable.tableName,
      exportName: 'GamesTableName',
    });

    new cdk.CfnOutput(this, 'ConnectionsTableName', {
      value: connectionsTable.tableName,
      exportName: 'ConnectionsTableName',
    });

    new cdk.CfnOutput(this, 'GameEventsTableName', {
      value: gameEventsTable.tableName,
      exportName: 'GameEventsTableName',
    });

    new cdk.CfnOutput(this, 'GameEventsQueueUrl', {
      value: gameEventsQueue.queueUrl,
      exportName: 'GameEventsQueueUrl',
    });

    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: webSocketApi.apiEndpoint,
      exportName: 'WebSocketApiUrl',
    });
  }
}

