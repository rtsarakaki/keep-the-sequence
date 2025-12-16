#!/usr/bin/env ts-node

/**
 * Script to clear all items from DynamoDB tables
 * 
 * Usage:
 *   npm run clear-tables
 *   or
 *   ts-node scripts/clear-dynamodb-tables.ts
 * 
 * WARNING: This will delete ALL items from the tables!
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLES = [
  'the-game-games',
  'the-game-connections',
  'the-game-game-events',
];

const REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Delete all items from a DynamoDB table
 */
async function clearTable(
  client: DynamoDBDocumentClient,
  tableName: string
): Promise<number> {
  let deletedCount = 0;
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    // Scan table to get all items
    const scanCommand = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const scanResult = await client.send(scanCommand);
    const items = scanResult.Items || [];

    if (items.length === 0) {
      break;
    }

    // Delete items in batches (max 25 items per batch)
    const batches: Array<Array<Record<string, unknown>>> = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }

    for (const batch of batches) {
      const deleteRequests = batch.map((item) => {
        // Extract key attributes based on table structure
        if (tableName === 'the-game-games') {
          return {
            DeleteRequest: {
              Key: { gameId: item.gameId },
            },
          };
        } else if (tableName === 'the-game-connections') {
          return {
            DeleteRequest: {
              Key: { connectionId: item.connectionId },
            },
          };
        } else if (tableName === 'the-game-game-events') {
          return {
            DeleteRequest: {
              Key: {
                gameId: item.gameId,
                timestamp: item.timestamp,
              },
            },
          };
        }
        throw new Error(`Unknown table structure: ${tableName}`);
      });

      const batchWriteCommand = new BatchWriteCommand({
        RequestItems: {
          [tableName]: deleteRequests,
        },
      });

      await client.send(batchWriteCommand);
      deletedCount += batch.length;
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return deletedCount;
}

/**
 * Main function
 */
async function main() {
  console.log('🚨 WARNING: This will delete ALL items from DynamoDB tables!');
  console.log(`Region: ${REGION}`);
  console.log(`Tables: ${TABLES.join(', ')}\n`);

  // Check if running in non-interactive mode
  if (process.env.CI || process.env.NON_INTERACTIVE) {
    console.log('Running in non-interactive mode. Proceeding...\n');
  } else {
    // In interactive mode, we'd ask for confirmation
    // For now, just proceed (user can Ctrl+C to cancel)
    console.log('Starting in 3 seconds... (Press Ctrl+C to cancel)');
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

  const results: Record<string, number> = {};

  for (const tableName of TABLES) {
    try {
      console.log(`Clearing table: ${tableName}...`);
      const count = await clearTable(client, tableName);
      results[tableName] = count;
      console.log(`✅ Deleted ${count} items from ${tableName}\n`);
    } catch (error) {
      console.error(`❌ Error clearing ${tableName}:`, error);
      if (error instanceof Error) {
        if (error.message.includes('ResourceNotFoundException')) {
          console.log(`   Table ${tableName} does not exist. Skipping...\n`);
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log('─'.repeat(50));
  for (const [table, count] of Object.entries(results)) {
    console.log(`${table}: ${count} items deleted`);
  }
  console.log('─'.repeat(50));
  const total = Object.values(results).reduce((sum, count) => sum + count, 0);
  console.log(`Total: ${total} items deleted`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});




