import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { IConnectionRepository } from '../../domain/repositories/IConnectionRepository';
import { JoinGameDTO } from '../dto/JoinGameDTO';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { GameInitializer } from '../../domain/services/GameInitializer';
import { hasAnyCardsBeenPlayed } from '../../domain/services/GameRules';
import { Result, success, failure } from './Result';
import { randomUUID } from 'crypto';

/**
 * Use Case: Join an existing game
 * 
 * Adds a new player to an existing game, deals cards to the new player,
 * and updates the game state.
 */
export class JoinGameUseCase {
  private readonly MAX_PLAYERS = 5;

  constructor(
    private readonly gameRepository: IGameRepository,
    private readonly connectionRepository: IConnectionRepository
  ) {}

  async execute(dto: JoinGameDTO): Promise<Result<Game>> {
    try {
      // Find existing game
      const existingGame = await this.gameRepository.findById(dto.gameId);

      if (!existingGame) {
        return failure('Game not found');
      }

      // Generate player ID if not provided
      const playerId = dto.playerId || randomUUID();

      // Check if player already exists in the game (case-insensitive name comparison)
      const existingPlayer = existingGame.players.find(
        p => p.id === playerId || p.name.toLowerCase() === dto.playerName.toLowerCase()
      );

      // If player exists, allow reconnection (IP may change due to network changes)
      // This allows legitimate reconnections while still preventing initial impersonation
      if (existingPlayer) {
        // Player is reconnecting - just update connection status
        const updatedGame = existingGame.updatePlayer(existingPlayer.id, (p) =>
          p.updateConnectionStatus(true)
        );
        
        await this.gameRepository.save(updatedGame);
        return success(updatedGame);
      }

      // For new players, validate that they're not trying to impersonate someone else
      // Check if someone with the same IP is already using a different name/ID
      // This prevents the same person from joining multiple times with different names
      if (dto.clientIp) {
        const allConnections = await this.connectionRepository.findByGameId(dto.gameId);
        const existingConnectionWithSameIp = allConnections.find(c => c.clientIp === dto.clientIp);
        
        if (existingConnectionWithSameIp) {
          const existingPlayerWithSameIp = existingGame.players.find(
            p => p.id === existingConnectionWithSameIp.playerId
          );
          
          if (existingPlayerWithSameIp) {
            return failure('Você já está conectado a este jogo com outro nome. Use o mesmo nome para reconectar.');
          }
        }
        
        // Check if someone is trying to use a name/ID that belongs to a different IP
        // This prevents impersonation: if playerId or name matches an existing player,
        // but the IP is different, it's likely an impersonation attempt
        const existingPlayerWithDifferentIp = existingGame.players.find(
          p => p.name.toLowerCase() === dto.playerName.toLowerCase()
        );
        
        if (existingPlayerWithDifferentIp) {
          // Check if there's a connection for this player with a different IP
          const playerConnection = allConnections.find(c => c.playerId === existingPlayerWithDifferentIp.id);
          
          if (playerConnection && playerConnection.clientIp && playerConnection.clientIp !== dto.clientIp) {
            return failure('Este nome já está sendo usado por outro jogador. Escolha um nome diferente.');
          }
        }
      }

      // New player joining - allow if:
      // 1. Game is in 'waiting' status, OR
      // 2. Game is in 'playing' status but no cards have been played yet
      const canJoinNewPlayer = 
        existingGame.status === 'waiting' || 
        (existingGame.status === 'playing' && !hasAnyCardsBeenPlayed(existingGame.piles));
      
      if (!canJoinNewPlayer) {
        return failure('Game is not accepting new players');
      }

      if (existingGame.players.length >= this.MAX_PLAYERS) {
        return failure('Game is full (maximum 5 players)');
      }

      // When a new player joins, we need to redistribute cards for all players
      // Collect all cards from existing players' hands back to the deck
      const allCards = [
        ...existingGame.deck,
        ...existingGame.players.flatMap(p => p.hand),
      ];

      // Shuffle the combined deck
      const shuffledDeck = GameInitializer.shuffleDeck(allCards);

      // Deal cards to all players (including the new one)
      const numPlayersAfterJoin = existingGame.players.length + 1;
      const { hands, remainingDeck } = GameInitializer.dealCards(
        shuffledDeck,
        numPlayersAfterJoin
      );

      // Update existing players with new hands (redistribute cards)
      const updatedExistingPlayers = existingGame.players.map((player, index) => {
        return new Player({
          id: player.id,
          name: player.name,
          hand: hands[index],
          isConnected: player.isConnected,
        });
      });

      // Get cards for the new player (last hand in the array)
      const newPlayerHand = hands[hands.length - 1];

      // Create new player
      const newPlayer = new Player({
        id: playerId,
        name: dto.playerName,
        hand: newPlayerHand,
        isConnected: false,
      });

      // Create game with updated players
      const gameWithUpdatedPlayers = new Game({
        id: existingGame.id,
        players: Object.freeze([...updatedExistingPlayers, newPlayer]),
        piles: existingGame.piles,
        deck: existingGame.deck, // Will be updated below
        discardPile: existingGame.discardPile,
        currentTurn: existingGame.currentTurn,
        cardsPlayedThisTurn: existingGame.cardsPlayedThisTurn,
        createdBy: existingGame.createdBy, // Preserve creator
        status: existingGame.status,
        createdAt: existingGame.createdAt,
        updatedAt: existingGame.updatedAt,
        ttl: existingGame.ttl,
      });
      
      const gameWithNewPlayer = gameWithUpdatedPlayers;
      
      // Determine new game status and current turn
      // Game starts (status: 'playing') when there are at least 2 players
      const shouldStartGame = numPlayersAfterJoin >= 2 && gameWithNewPlayer.status === 'waiting';
      
      // If game should start, set status to 'playing' and assign first turn to first player
      const newStatus = shouldStartGame ? 'playing' as const : gameWithNewPlayer.status;
      const newCurrentTurn = shouldStartGame 
        ? gameWithNewPlayer.players[0]?.id || null 
        : gameWithNewPlayer.currentTurn;
      
      // Create updated game with new deck (Game is immutable, so we create a new instance)
      const gameWithUpdatedDeck = new Game({
        id: gameWithNewPlayer.id,
        players: gameWithNewPlayer.players,
        piles: gameWithNewPlayer.piles,
        deck: remainingDeck,
        discardPile: gameWithNewPlayer.discardPile,
        currentTurn: newCurrentTurn,
        cardsPlayedThisTurn: 0, // Reset when game starts
        createdBy: gameWithNewPlayer.createdBy, // Preserve creator
        status: newStatus,
        createdAt: gameWithNewPlayer.createdAt,
        updatedAt: new Date(),
        ttl: gameWithNewPlayer.ttl,
      });

      // Save updated game
      await this.gameRepository.save(gameWithUpdatedDeck);

      return success(gameWithUpdatedDeck);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return failure(`Failed to join game: ${errorMessage}`);
    }
  }
}

