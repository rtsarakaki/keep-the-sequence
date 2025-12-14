#!/usr/bin/env ts-node

/**
 * Script para testar acesso aos serviços AWS
 * 
 * Pré-requisitos:
 * 1. Configure credenciais AWS: aws configure
 * 2. Ou configure variáveis de ambiente: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
 * 
 * Executar:
 * cd backend
 * npm install
 * npx ts-node scripts/test-aws-access.ts
 */

import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { DynamoGameRepository } from '../src/infrastructure/repositories/DynamoGameRepository';
import { DynamoConnectionRepository } from '../src/infrastructure/repositories/DynamoConnectionRepository';
import { Game } from '../src/domain/entities/Game';
import { Player } from '../src/domain/entities/Player';
import { Card } from '../src/domain/valueObjects/Card';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

async function testDynamoDBAccess() {
  console.log('\n🔍 Testando acesso ao DynamoDB...\n');

  try {
    const client = new DynamoDBClient({ region: AWS_REGION });
    const command = new ListTablesCommand({});
    const response = await client.send(command);

    console.log('✅ Conectado ao DynamoDB com sucesso!');
    console.log(`📊 Tabelas encontradas: ${response.TableNames?.length || 0}`);

    if (response.TableNames && response.TableNames.length > 0) {
      console.log('\nTabelas:');
      response.TableNames.forEach((table) => {
        const isGameTable = table.includes('game');
        const icon = isGameTable ? '🎮' : '📋';
        console.log(`  ${icon} ${table}`);
      });
    }

    // Verificar se as tabelas esperadas existem
    const expectedTables = [
      'the-game-games',
      'the-game-connections',
      'the-game-game-events',
    ];

    console.log('\n🔎 Verificando tabelas esperadas:');
    expectedTables.forEach((tableName) => {
      const exists = response.TableNames?.includes(tableName);
      const icon = exists ? '✅' : '❌';
      console.log(`  ${icon} ${tableName} ${exists ? '(encontrada)' : '(não encontrada)'}`);
    });

    return response.TableNames || [];
  } catch (error) {
    console.error('❌ Erro ao acessar DynamoDB:', error);
    throw error;
  }
}

async function testSQSAccess() {
  console.log('\n🔍 Testando acesso ao SQS...\n');

  try {
    const client = new SQSClient({ region: AWS_REGION });
    const command = new ListQueuesCommand({});
    const response = await client.send(command);

    console.log('✅ Conectado ao SQS com sucesso!');
    console.log(`📊 Filas encontradas: ${response.QueueUrls?.length || 0}`);

    if (response.QueueUrls && response.QueueUrls.length > 0) {
      console.log('\nFilas:');
      response.QueueUrls.forEach((queueUrl) => {
        const queueName = queueUrl.split('/').pop();
        const isGameQueue = queueName?.includes('game');
        const icon = isGameQueue ? '🎮' : '📋';
        console.log(`  ${icon} ${queueName}`);
      });
    }

    // Verificar se as filas esperadas existem
    const expectedQueues = ['the-game-game-events', 'the-game-game-events-dlq'];

    console.log('\n🔎 Verificando filas esperadas:');
    expectedQueues.forEach((queueName) => {
      const exists = response.QueueUrls?.some((url) => url.includes(queueName));
      const icon = exists ? '✅' : '❌';
      console.log(`  ${icon} ${queueName} ${exists ? '(encontrada)' : '(não encontrada)'}`);
    });

    return response.QueueUrls || [];
  } catch (error) {
    console.error('❌ Erro ao acessar SQS:', error);
    throw error;
  }
}

async function testGameRepository() {
  console.log('\n🔍 Testando DynamoGameRepository...\n');

  const tableName = process.env.GAMES_TABLE || 'the-game-games';
  console.log(`📋 Usando tabela: ${tableName}`);

  try {
    const repository = new DynamoGameRepository(tableName);

    // Criar um jogo de teste
    const testGame = new Game({
      id: `test-game-${Date.now()}`,
      players: [
        new Player({
          id: 'test-player-1',
          name: 'Test Player',
          hand: [new Card(10, 'hearts'), new Card(25, 'spades')],
          isConnected: true,
        }),
      ],
      piles: {
        ascending1: [new Card(1, 'spades')],
        ascending2: [],
        descending1: [new Card(100, 'diamonds')],
        descending2: [],
      },
      deck: [new Card(50, 'clubs')],
      discardPile: [],
      currentTurn: 'test-player-1',
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('💾 Salvando jogo de teste...');
    await repository.save(testGame);
    console.log('✅ Jogo salvo com sucesso!');

    console.log('🔍 Buscando jogo...');
    const retrievedGame = await repository.findById(testGame.id);

    if (retrievedGame) {
      console.log('✅ Jogo recuperado com sucesso!');
      console.log(`   ID: ${retrievedGame.id}`);
      console.log(`   Status: ${retrievedGame.status}`);
      console.log(`   Jogadores: ${retrievedGame.players.length}`);
      console.log(`   Cartas no deck: ${retrievedGame.deck.length}`);

      // Limpar teste
      console.log('\n🧹 Removendo jogo de teste...');
      await repository.delete(testGame.id);
      console.log('✅ Jogo removido!');
    } else {
      console.log('❌ Jogo não foi encontrado após salvar');
    }
  } catch (error) {
    console.error('❌ Erro ao testar GameRepository:', error);
    if (error instanceof Error) {
      console.error(`   Mensagem: ${error.message}`);
    }
    throw error;
  }
}

async function testConnectionRepository() {
  console.log('\n🔍 Testando DynamoConnectionRepository...\n');

  const tableName = process.env.CONNECTIONS_TABLE || 'the-game-connections';
  console.log(`📋 Usando tabela: ${tableName}`);

  try {
    const repository = new DynamoConnectionRepository(tableName);

    const testConnection = {
      connectionId: `test-conn-${Date.now()}`,
      gameId: 'test-game-123',
      playerId: 'test-player-1',
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    console.log('💾 Salvando conexão de teste...');
    await repository.save(testConnection);
    console.log('✅ Conexão salva com sucesso!');

    console.log('🔍 Buscando conexão...');
    const retrieved = await repository.findByConnectionId(testConnection.connectionId);

    if (retrieved) {
      console.log('✅ Conexão recuperada com sucesso!');
      console.log(`   ConnectionId: ${retrieved.connectionId}`);
      console.log(`   GameId: ${retrieved.gameId}`);
      console.log(`   PlayerId: ${retrieved.playerId}`);

      // Limpar teste
      console.log('\n🧹 Removendo conexão de teste...');
      await repository.delete(testConnection.connectionId);
      console.log('✅ Conexão removida!');
    } else {
      console.log('❌ Conexão não foi encontrada após salvar');
    }
  } catch (error) {
    console.error('❌ Erro ao testar ConnectionRepository:', error);
    if (error instanceof Error) {
      console.error(`   Mensagem: ${error.message}`);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Testando Acesso aos Serviços AWS\n');
  console.log(`📍 Região: ${AWS_REGION}`);
  console.log(`🔑 Credenciais: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Configuradas' : '⚠️  Não encontradas (usando perfil padrão)'}\n`);

  const results = {
    dynamodb: false,
    sqs: false,
    gameRepository: false,
    connectionRepository: false,
  };

  try {
    // Teste 1: DynamoDB
    await testDynamoDBAccess();
    results.dynamodb = true;

    // Teste 2: SQS
    await testSQSAccess();
    results.sqs = true;

    // Teste 3: Game Repository (opcional - só se tabela existir)
    const tables = await testDynamoDBAccess();
    if (tables.includes('the-game-games')) {
      await testGameRepository();
      results.gameRepository = true;
    } else {
      console.log('\n⚠️  Pulando teste de GameRepository: tabela não encontrada');
    }

    // Teste 4: Connection Repository (opcional - só se tabela existir)
    if (tables.includes('the-game-connections')) {
      await testConnectionRepository();
      results.connectionRepository = true;
    } else {
      console.log('\n⚠️  Pulando teste de ConnectionRepository: tabela não encontrada');
    }

    // Resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(50));
    console.log(`DynamoDB:              ${results.dynamodb ? '✅' : '❌'}`);
    console.log(`SQS:                   ${results.sqs ? '✅' : '❌'}`);
    console.log(`Game Repository:       ${results.gameRepository ? '✅' : '⚠️ '}`);
    console.log(`Connection Repository: ${results.connectionRepository ? '✅' : '⚠️ '}`);
    console.log('='.repeat(50));

    if (results.dynamodb && results.sqs) {
      console.log('\n✅ Acesso aos serviços AWS funcionando!');
      process.exit(0);
    } else {
      console.log('\n❌ Alguns testes falharam. Verifique suas credenciais AWS.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

main();

