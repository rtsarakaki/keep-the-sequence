#!/usr/bin/env ts-node

/**
 * Script to check if a game exists in DynamoDB
 * 
 * Usage:
 *   npm run check-game -- <gameId> [playerId]
 *   or
 *   ts-node scripts/check-game.ts <gameId> [playerId]
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const GAMES_TABLE = process.env.GAMES_TABLE || 'the-game-games-prod';
const REGION = process.env.AWS_REGION || 'us-east-1';

async function checkGame(gameId: string, playerId?: string) {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

  console.log(`Checking game: ${gameId}`);
  console.log(`Table: ${GAMES_TABLE}`);
  console.log(`Region: ${REGION}\n`);

  try {
    const command = new GetCommand({
      TableName: GAMES_TABLE,
      Key: { gameId },
    });

    const result = await client.send(command);

    if (!result.Item) {
      console.log('❌ Game not found in DynamoDB');
      console.log('\nPossible reasons:');
      console.log('1. Game was deleted (TTL expired)');
      console.log('2. Game ID is incorrect');
      console.log('3. Table name is incorrect');
      return;
    }

    const game = result.Item;
    console.log('✅ Game found!\n');
    console.log('Game Details:');
    console.log(`  ID: ${game.gameId}`);
    console.log(`  Status: ${game.status}`);
    console.log(`  Players: ${game.players?.length || 0}`);
    console.log(`  Created: ${game.createdAt ? new Date(game.createdAt).toISOString() : 'N/A'}`);
    console.log(`  Updated: ${game.updatedAt ? new Date(game.updatedAt).toISOString() : 'N/A'}`);
    console.log(`  TTL: ${game.ttl ? new Date(game.ttl * 1000).toISOString() : 'Not set'}`);

    if (game.players && Array.isArray(game.players)) {
      console.log('\nPlayers:');
      game.players.forEach((player: { id?: string; name?: string }, index: number) => {
        console.log(`  ${index + 1}. ${player.name || 'Unknown'} (ID: ${player.id || 'N/A'})`);
      });

      if (playerId) {
        const player = game.players.find((p: { id?: string }) => p.id === playerId);
        if (player) {
          console.log(`\n✅ Player ${playerId} is part of this game`);
          console.log(`   Name: ${player.name || 'Unknown'}`);
          console.log(`   Cards in hand: ${player.hand?.length || 0}`);
        } else {
          console.log(`\n❌ Player ${playerId} is NOT part of this game`);
          console.log('\nAvailable player IDs:');
          game.players.forEach((p: { id?: string; name?: string }) => {
            console.log(`  - ${p.id} (${p.name || 'Unknown'})`);
          });
        }
      }
    }

    console.log('\nPiles:');
    if (game.piles) {
      console.log(`  Ascending 1: ${game.piles.ascending1?.length || 0} cards`);
      console.log(`  Ascending 2: ${game.piles.ascending2?.length || 0} cards`);
      console.log(`  Descending 1: ${game.piles.descending1?.length || 0} cards`);
      console.log(`  Descending 2: ${game.piles.descending2?.length || 0} cards`);
    }
  } catch (error) {
    console.error('Error checking game:', error);
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
  console.error('Usage: npm run check-game -- <gameId> [playerId]');
  console.error('Example: npm run check-game -- ABC123 dbf0c226-955a-4ffe-a719-6a111e789e6c');
  process.exit(1);
}

const gameId = args[0];
const playerId = args[1];

checkGame(gameId, playerId).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

