#!/usr/bin/env node

/**
 * Script de teste para verificar se a API está funcionando corretamente
 * 
 * Uso:
 *   NEXT_PUBLIC_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod node test-api.js
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.error('❌ Erro: NEXT_PUBLIC_API_URL não está definida');
  console.error('   Use: NEXT_PUBLIC_API_URL=<sua-url> node test-api.js');
  process.exit(1);
}

async function testAPI() {
  console.log('🧪 Testando API:', API_URL);
  console.log('');
  
  try {
    // Teste 1: Obter WebSocket URL
    console.log('1️⃣ Testando GET /api/websocket-url...');
    const testGameId = 'test-game-' + Date.now();
    const testPlayerId = 'test-player-' + Date.now();
    
    const url = `${API_URL}/api/websocket-url?gameId=${testGameId}&playerId=${testPlayerId}`;
    console.log('   URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    console.log('   ✅ Sucesso!');
    console.log('   Resposta:', JSON.stringify(data, null, 2));
    
    // Teste 2: Validar estrutura da resposta
    console.log('\n2️⃣ Validando estrutura da resposta...');
    
    if (!data.wsUrl) {
      throw new Error('Resposta não contém wsUrl');
    }
    console.log('   ✅ wsUrl presente');
    
    if (typeof data.expiresIn !== 'number') {
      throw new Error('expiresIn não é um número');
    }
    console.log('   ✅ expiresIn presente:', data.expiresIn, 'segundos');
    
    // Teste 3: Validar formato WebSocket
    console.log('\n3️⃣ Validando formato da URL WebSocket...');
    
    if (!data.wsUrl.startsWith('wss://')) {
      throw new Error('URL WebSocket deve começar com wss://');
    }
    console.log('   ✅ URL usa wss:// (WebSocket seguro)');
    
    // Teste 4: Validar token
    if (data.wsUrl.includes('token=')) {
      const tokenMatch = data.wsUrl.match(/token=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) {
        console.log('   ✅ Token presente na URL');
        console.log('   Token (primeiros 20 chars):', tokenMatch[1].substring(0, 20) + '...');
      } else {
        console.log('   ⚠️ Token encontrado mas vazio');
      }
    } else {
      console.log('   ⚠️ Token não encontrado na URL');
    }
    
    // Teste 5: Testar POST também
    console.log('\n4️⃣ Testando POST /api/websocket-url...');
    const postResponse = await fetch(`${API_URL}/api/websocket-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId: testGameId,
        playerId: testPlayerId,
      }),
    });
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('   ✅ POST também funciona');
      if (postData.wsUrl) {
        console.log('   ✅ wsUrl retornada via POST');
      }
    } else {
      console.log('   ⚠️ POST retornou:', postResponse.status, postResponse.statusText);
    }
    
    console.log('\n✅ Todos os testes passaram!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Configure NEXT_PUBLIC_API_URL na Vercel');
    console.log('   2. Faça um redeploy na Vercel');
    console.log('   3. Teste no browser usando o console');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error('\n🔍 Verifique:');
    console.error('   - Se a URL da API está correta');
    console.error('   - Se o backend está deployado');
    console.error('   - Se o endpoint /api/websocket-url existe');
    console.error('   - Se o CORS está configurado');
    console.error('\n💡 Dica: Verifique os logs do CloudWatch para mais detalhes');
    process.exit(1);
  }
}

testAPI();




