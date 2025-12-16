# Como Testar a Configuração

Este guia explica como testar se as variáveis de ambiente e a integração com o backend estão funcionando corretamente.

## Pré-requisitos

- ✅ Variável `NEXT_PUBLIC_API_URL` configurada na Vercel
- ✅ Backend deployado no AWS
- ✅ Site deployado na Vercel (ou rodando localmente)

## Método 1: Teste via Browser Console (Mais Fácil)

### Passo 1: Acesse o site na Vercel

1. Acesse a URL do seu site na Vercel (exemplo: `https://keep-the-sequence.vercel.app`)
2. Abra o Console do Browser (F12 → Console)

### Passo 2: Verifique se a variável está disponível

No console, digite:

```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

**Resultado esperado:**
- ✅ Deve mostrar a URL da API (exemplo: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)
- ❌ Se mostrar `undefined`, a variável não está configurada corretamente

### Passo 3: Teste o endpoint HTTP

No console, digite:

```javascript
// Teste básico do endpoint
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/websocket-url?gameId=test-game&playerId=test-player`)
  .then(res => res.json())
  .then(data => {
    console.log('✅ Sucesso!', data);
    console.log('WebSocket URL:', data.wsUrl);
  })
  .catch(err => {
    console.error('❌ Erro:', err);
  });
```

**Resultado esperado:**
```json
{
  "wsUrl": "wss://xyz789.execute-api.us-east-1.amazonaws.com/prod?token=...",
  "expiresIn": 1800
}
```

**Possíveis erros:**
- ❌ `CORS error`: Verifique se o `ALLOWED_ORIGINS` no backend inclui o domínio da Vercel
- ❌ `404 Not Found`: Verifique se a URL da API está correta
- ❌ `500 Internal Server Error`: Verifique os logs do CloudWatch

## Método 2: Teste via cURL (Terminal)

### Teste 1: Verificar se o endpoint responde

```bash
# Substitua pela sua URL da API
curl -X GET "https://abc123.execute-api.us-east-1.amazonaws.com/prod/api/websocket-url?gameId=test-game&playerId=test-player"
```

**Resultado esperado:**
```json
{
  "wsUrl": "wss://xyz789.execute-api.us-east-1.amazonaws.com/prod?token=...",
  "expiresIn": 1800
}
```

### Teste 2: Teste com POST (incluindo Origin)

```bash
curl -X POST "https://abc123.execute-api.us-east-1.amazonaws.com/prod/api/websocket-url" \
  -H "Content-Type: application/json" \
  -H "Origin: https://keep-the-sequence.vercel.app" \
  -d '{"gameId": "test-game", "playerId": "test-player"}'
```

### Teste 3: Verificar CORS

```bash
curl -X OPTIONS "https://abc123.execute-api.us-east-1.amazonaws.com/prod/api/websocket-url" \
  -H "Origin: https://keep-the-sequence.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**Resultado esperado:**
- Deve retornar headers `Access-Control-Allow-Origin` e `Access-Control-Allow-Methods`

## Método 3: Teste Local (Desenvolvimento)

### Passo 1: Criar arquivo `.env.local`

No diretório `frontend/`, crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

### Passo 2: Rodar localmente

```bash
cd frontend
npm run dev
```

### Passo 3: Testar no browser

1. Acesse `http://localhost:3000`
2. Abra o Console (F12)
3. Execute os mesmos testes do Método 1

## Método 4: Script de Teste Automatizado

Crie um arquivo `test-api.js` na raiz do projeto:

```javascript
// test-api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://abc123.execute-api.us-east-1.amazonaws.com/prod';

async function testAPI() {
  console.log('🧪 Testando API:', API_URL);
  
  try {
    // Teste 1: Obter WebSocket URL
    console.log('\n1️⃣ Testando GET /api/websocket-url...');
    const response = await fetch(`${API_URL}/api/websocket-url?gameId=test-game&playerId=test-player`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Sucesso!');
    console.log('   WebSocket URL:', data.wsUrl);
    console.log('   Expires in:', data.expiresIn, 'segundos');
    
    // Teste 2: Validar token
    if (data.wsUrl && data.wsUrl.includes('token=')) {
      console.log('✅ Token incluído na URL');
    } else {
      console.log('⚠️ Token não encontrado na URL');
    }
    
    // Teste 3: Validar formato WebSocket
    if (data.wsUrl.startsWith('wss://')) {
      console.log('✅ URL WebSocket válida (wss://)');
    } else {
      console.log('❌ URL WebSocket inválida');
    }
    
    console.log('\n✅ Todos os testes passaram!');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error('   Verifique:');
    console.error('   - Se a URL da API está correta');
    console.error('   - Se o backend está deployado');
    console.error('   - Se o CORS está configurado');
    process.exit(1);
  }
}

testAPI();
```

**Como usar:**
```bash
# No diretório raiz do projeto
NEXT_PUBLIC_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod node test-api.js
```

## Checklist de Verificação

Marque cada item conforme testa:

- [ ] Variável `NEXT_PUBLIC_API_URL` está disponível no browser
- [ ] Endpoint `/api/websocket-url` responde com sucesso
- [ ] Resposta contém `wsUrl` válida
- [ ] URL do WebSocket começa com `wss://`
- [ ] Token está incluído na URL do WebSocket
- [ ] CORS está funcionando (sem erros no browser)
- [ ] Teste funciona tanto em produção quanto localmente

## Troubleshooting

### Erro: "process.env.NEXT_PUBLIC_API_URL is undefined"

**Causa**: Variável não configurada ou deploy não atualizado

**Solução**:
1. Verifique se a variável está configurada na Vercel
2. Faça um **Redeploy** na Vercel após adicionar a variável
3. Limpe o cache do browser

### Erro: CORS

**Causa**: Domínio da Vercel não está em `ALLOWED_ORIGINS`

**Solução**:
1. Acesse AWS Console → Lambda → Função `getWebSocketUrl`
2. Verifique a variável `ALLOWED_ORIGINS`
3. Adicione o domínio da Vercel (ex: `https://keep-the-sequence.vercel.app`)
4. Ou use `*` para desenvolvimento (não recomendado para produção)

### Erro: 404 Not Found

**Causa**: URL da API incorreta ou endpoint não existe

**Solução**:
1. Verifique se a URL está correta no AWS Console
2. Verifique se o endpoint `/api/websocket-url` está deployado
3. Teste via cURL para confirmar

### Erro: 500 Internal Server Error

**Causa**: Erro no backend

**Solução**:
1. Verifique os logs do CloudWatch
2. Verifique se `WEBSOCKET_API_URL` está configurada no Lambda
3. Verifique se as tabelas DynamoDB existem

## Próximos Passos

Após confirmar que tudo está funcionando:

1. ✅ Implementar serviços HTTP e WebSocket no frontend
2. ✅ Implementar hooks React
3. ✅ Implementar componentes do jogo
4. ✅ Testar fluxo completo: criar jogo → jogar carta → sincronizar

## Referências

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [AWS API Gateway Testing](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-test-method.html)




