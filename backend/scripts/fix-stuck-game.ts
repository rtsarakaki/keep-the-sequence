#!/usr/bin/env ts-node

/**
 * Script to fix a stuck game where the current player has no cards
 * 
 * Usage:
 *   npm run fix-stuck-game -- <gameId>
 *   or
 *   ts-node scripts/fix-stuck-game.ts <gameId>
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Find the next player with cards in their hand, starting from the given player index.
 * Skips players with empty hands. If no player has cards, returns null.
 */
function findNextPlayerWithCards(
  players: Array<{ id: string; hand?: Array<unknown> }>,
  startIndex: number
): { id: string; hand: Array<unknown> } | null {
  // Start from the next player (circular)
  for (let i = 0; i < players.length; i++) {
    const nextIndex = (startIndex + 1 + i) % players.length;
    const nextPlayer = players[nextIndex];
    
    // If this player has cards, return them
    if (nextPlayer.hand && nextPlayer.hand.length > 0) {
      return { id: nextPlayer.id, hand: nextPlayer.hand };
    }
  }
  
  // No player has cards
  return null;
}

const GAMES_TABLE = process.env.GAMES_TABLE || 'the-game-backend-games-prod';
const REGION = process.env.AWS_REGION || 'us-east-1';

async function fixStuckGame(gameId: string) {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

  console.log(`Fixing stuck game: ${gameId}`);
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
    console.log(`  Status: ${game.status}`);
    console.log(`  Current Turn: ${game.currentTurn || 'None'}`);
    console.log(`  Players: ${game.players?.length || 0}\n`);

    // Check if game is in playing status
    if (game.status !== 'playing') {
      console.log('⚠️  Game is not in playing status. Nothing to fix.');
      return;
    }

    // Check if there's a current turn
    if (!game.currentTurn) {
      console.log('⚠️  No current turn set. Cannot fix automatically.');
      return;
    }

    // Find current player
    const currentPlayer = game.players?.find((p: { id: string }) => p.id === game.currentTurn);
    if (!currentPlayer) {
      console.log('❌ Current player not found in game players');
      return;
    }

    console.log(`Current player: ${currentPlayer.name || currentPlayer.id}`);
    console.log(`  Cards in hand: ${currentPlayer.hand?.length || 0}\n`);

    // Check if current player has cards
    if (currentPlayer.hand && currentPlayer.hand.length > 0) {
      console.log('✅ Current player has cards. Game is not stuck.');
      return;
    }

    console.log('⚠️  Current player has no cards. Game is stuck!\n');

    // Find next player with cards
    const currentPlayerIndex = game.players.findIndex((p: { id: string }) => p.id === game.currentTurn);
    const nextPlayer = findNextPlayerWithCards(game.players, currentPlayerIndex);

    if (!nextPlayer) {
      console.log('⚠️  No player has cards. Game should end in victory.');
      console.log('Updating game status to finished...');
      
      const updateCommand = new UpdateCommand({
        TableName: GAMES_TABLE,
        Key: { gameId },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': 'finished',
          ':updatedAt': Date.now(), // Unix timestamp in milliseconds (number)
        },
      });

      await client.send(updateCommand);
      console.log('✅ Game status updated to finished (victory)');
      return;
    }

    // Find full player object to get name
    const nextPlayerFull = game.players.find((p: { id: string; name?: string }) => p.id === nextPlayer.id);
    console.log(`Next player with cards: ${nextPlayerFull?.name || nextPlayer.id}`);
    console.log(`  Cards in hand: ${nextPlayer.hand?.length || 0}\n`);

    // Update game to pass turn to next player with cards
    const updateCommand = new UpdateCommand({
      TableName: GAMES_TABLE,
      Key: { gameId },
      UpdateExpression: 'SET #currentTurn = :nextPlayerId, #cardsPlayedThisTurn = :zero, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#currentTurn': 'currentTurn',
        '#cardsPlayedThisTurn': 'cardsPlayedThisTurn',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':nextPlayerId': nextPlayer.id,
        ':zero': 0,
        ':updatedAt': Date.now(), // Unix timestamp in milliseconds (number)
      },
    });

    await client.send(updateCommand);
    console.log('✅ Game fixed! Turn passed to next player with cards.');
    console.log(`   New current turn: ${nextPlayerFull?.name || nextPlayer.id}`);
  } catch (error) {
    console.error('Error fixing game:', error);
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
  console.error('Usage: npm run fix-stuck-game -- <gameId>');
  console.error('Example: npm run fix-stuck-game -- UTEYY2');
  process.exit(1);
}

const gameId = args[0];

fixStuckGame(gameId).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
