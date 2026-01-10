#!/usr/bin/env ts-node

/**
 * Script to fix game timestamps in DynamoDB
 * Converts ISO string timestamps to Unix timestamps (numbers)
 * 
 * Usage:
 *   npm run fix-game-timestamps -- <gameId>
 *   or
 *   ts-node scripts/fix-game-timestamps.ts <gameId>
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const GAMES_TABLE = process.env.GAMES_TABLE || 'the-game-backend-games-prod';
const REGION = process.env.AWS_REGION || 'us-east-1';

function toUnixTimestamp(value: unknown): number | null {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Try to parse ISO string
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
    
    // Try to parse as Unix timestamp (seconds)
    const seconds = parseInt(value, 10);
    if (!isNaN(seconds)) {
      // If it's a reasonable timestamp (after 2000), assume it's in seconds and convert to ms
      if (seconds > 946684800) { // 2000-01-01
        return seconds * 1000;
      }
      // Otherwise assume it's already in milliseconds
      return seconds;
    }
  }
  
  return null;
}

async function fixGameTimestamps(gameId: string) {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

  console.log(`Fixing timestamps for game: ${gameId}`);
  console.log(`Table: ${GAMES_TABLE}`);
  console.log(`Region: ${REGION}\n`);

  try {
    // Get current game state
    const getCommand = new GetCommand({
      TableName: GAMES_TABLE,
      Key: { gameId },
    });

    const result = await client.send(getCommand);

    if (!result.Item) {
      console.log('❌ Game not found in DynamoDB');
      return;
    }

    const game = result.Item;
    console.log('✅ Game found!\n');

    // Check timestamps
    const createdAt = game.createdAt;
    const updatedAt = game.updatedAt;
    
    console.log('Current timestamps:');
    console.log(`  createdAt: ${createdAt} (type: ${typeof createdAt})`);
    console.log(`  updatedAt: ${updatedAt} (type: ${typeof updatedAt})\n`);

    // Convert timestamps if needed
    const createdAtFixed = toUnixTimestamp(createdAt);
    const updatedAtFixed = toUnixTimestamp(updatedAt);

    if (!createdAtFixed || !updatedAtFixed) {
      console.log('❌ Could not convert timestamps');
      console.log(`  createdAt: ${createdAtFixed ? 'OK' : 'FAILED'}`);
      console.log(`  updatedAt: ${updatedAtFixed ? 'OK' : 'FAILED'}`);
      return;
    }

    // Check if timestamps need fixing
    if (typeof createdAt === 'number' && typeof updatedAt === 'number') {
      console.log('✅ Timestamps are already in correct format (numbers)');
      return;
    }

    console.log('⚠️  Timestamps need fixing!\n');
    console.log('Fixed timestamps:');
    console.log(`  createdAt: ${createdAtFixed} (${new Date(createdAtFixed).toISOString()})`);
    console.log(`  updatedAt: ${updatedAtFixed} (${new Date(updatedAtFixed).toISOString()})\n`);

    // Update game with fixed timestamps
    const updateCommand = new UpdateCommand({
      TableName: GAMES_TABLE,
      Key: { gameId },
      UpdateExpression: 'SET #createdAt = :createdAt, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#createdAt': 'createdAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':createdAt': createdAtFixed,
        ':updatedAt': updatedAtFixed,
      },
    });

    await client.send(updateCommand);
    console.log('✅ Game timestamps fixed!');
  } catch (error) {
    console.error('Error fixing timestamps:', error);
    if (error instanceof Error) {
      if (error.message.includes('ResourceNotFoundException')) {
        console.error('\n❌ Table does not exist:', GAMES_TABLE);
        console.error('Make sure the table name is correct and the table exists in DynamoDB');
      } else {
        console.error('\n❌ Error:', error.message);
      }
    }
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: npm run fix-game-timestamps -- <gameId>');
  console.error('Example: npm run fix-game-timestamps -- UTEYY2');
  process.exit(1);
}

const gameId = args[0];

fixGameTimestamps(gameId).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
