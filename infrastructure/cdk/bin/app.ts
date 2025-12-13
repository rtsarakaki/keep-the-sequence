#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GameStack } from '../lib/game-stack';

const app = new cdk.App();

// Create Game Infrastructure Stack
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

console.log(`Deploying to account: ${account}, region: ${region}`);

new GameStack(app, 'TheGameStack', {
  env: {
    account,
    region,
  },
});

