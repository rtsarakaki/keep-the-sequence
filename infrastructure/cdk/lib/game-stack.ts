import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class GameStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Simple SQS Queue for testing
    const gameEventsQueue = new sqs.Queue(this, 'GameEventsQueue', {
      queueName: 'the-game-game-events',
      retentionPeriod: cdk.Duration.days(14),
    });

    // Output
    new cdk.CfnOutput(this, 'GameEventsQueueUrl', {
      value: gameEventsQueue.queueUrl,
      exportName: 'GameEventsQueueUrl',
    });
  }
}

