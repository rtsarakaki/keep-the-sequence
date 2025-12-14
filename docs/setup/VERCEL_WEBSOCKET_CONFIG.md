# Configuração WebSocket na Vercel

Este guia explica como configurar a conexão WebSocket do frontend (Vercel) com o API Gateway WebSocket (AWS).

## Autenticação do WebSocket

### Status Atual: Sem Autenticação (Público)

Atualmente, o **API Gateway WebSocket não requer autenticação**. Qualquer cliente pode conectar-se diretamente.

**Como funciona:**
- Frontend conecta via `wss://` (WebSocket Secure)
- API Gateway aceita a conexão
- Handler `onConnect` valida e registra a conexão
- Não há tokens ou credenciais necessárias

### Por que não precisa de autenticação?

1. **WebSocket é stateless na conexão**: A autenticação acontece no handler `onConnect`
2. **Validação no backend**: O handler valida `gameId` e `playerId` via query string
3. **Segurança por design**: Apenas quem conhece o `gameId` pode entrar no jogo

## Configuração Necessária na Vercel

### Variável de Ambiente: `NEXT_PUBLIC_WS_URL`

Você precisa configurar a URL do WebSocket API Gateway na Vercel:

1. **Obter a URL do WebSocket**:
   - Após deploy da infraestrutura, o CDK retorna o output `WebSocketApiUrl`
   - Formato: `wss://abc123.execute-api.us-east-1.amazonaws.com/prod`
   - Você pode ver no AWS Console → API Gateway → WebSocket APIs

2. **Configurar na Vercel**:
   - Acesse seu projeto na Vercel
   - Vá em **Settings** → **Environment Variables**
   - Adicione:
     - **Name**: `NEXT_PUBLIC_WS_URL`
     - **Value**: `wss://abc123.execute-api.us-east-1.amazonaws.com/prod`
     - **Environment**: Production, Preview, Development (ou só Production)

**Importante**: Variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente (browser). Isso é necessário porque o WebSocket precisa conectar do browser.

## Como o Frontend Conecta

```typescript
// Exemplo de conexão WebSocket no frontend
const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
const gameId = 'game-123';
const playerId = 'player-1';

// Conectar com gameId e playerId na query string
const ws = new WebSocket(
  `${wsUrl}?gameId=${gameId}&playerId=${playerId}`
);
```

## Segurança

### Camadas de Segurança

1. **Query String Validation** (no `onConnect` handler):
   - Valida `gameId` e `playerId`
   - Verifica se o jogo existe
   - Verifica se o jogador tem permissão

2. **Validação de Ações** (no `gameHandler`):
   - Cada ação valida se o jogador pode executá-la
   - Não pode jogar carta de outro jogador
   - Não pode executar ações fora do seu turno

3. **Rate Limiting** (API Gateway):
   - Limita conexões por IP
   - Protege contra abuso

### Se Quiser Adicionar Autenticação (Opcional)

Se quiser adicionar autenticação mais robusta no futuro:

**Opção 1: API Key (Simples)**
```typescript
// No frontend
const ws = new WebSocket(
  `${wsUrl}?gameId=${gameId}&playerId=${playerId}&apiKey=${apiKey}`
);

// No handler onConnect
const apiKey = event.queryStringParameters?.apiKey;
if (!isValidApiKey(apiKey)) {
  return { statusCode: 401 };
}
```

**Opção 2: JWT Token (Recomendado para produção)**
```typescript
// No frontend
const token = await getAuthToken();
const ws = new WebSocket(
  `${wsUrl}?gameId=${gameId}&playerId=${playerId}&token=${token}`
);

// No handler onConnect
const token = event.queryStringParameters?.token;
const decoded = await verifyJWT(token);
if (!decoded) {
  return { statusCode: 401 };
}
```

**Opção 3: AWS Cognito (Mais robusto)**
- Integrar com AWS Cognito
- Usar Authorization header
- Validar no API Gateway antes de chamar Lambda

## Checklist de Configuração

### 1. Deploy da Infraestrutura ✅
- [ ] CDK stack deployado
- [ ] WebSocket API Gateway criado
- [ ] URL do WebSocket anotada

### 2. Configurar Vercel
- [ ] Variável `NEXT_PUBLIC_WS_URL` configurada
- [ ] Valor: URL do WebSocket API Gateway
- [ ] Ambiente: Production (e Preview se necessário)

### 3. Implementar Frontend
- [ ] Criar WebSocket client
- [ ] Conectar usando `NEXT_PUBLIC_WS_URL`
- [ ] Passar `gameId` e `playerId` na query string

### 4. Testar Conexão
- [ ] Abrir aplicação na Vercel
- [ ] Verificar conexão WebSocket no DevTools
- [ ] Verificar logs no CloudWatch

## Exemplo de Código Frontend

```typescript
// frontend/src/services/websocket.ts
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

export function connectToGame(gameId: string, playerId: string) {
  if (!WS_URL) {
    throw new Error('NEXT_PUBLIC_WS_URL not configured');
  }

  const url = `${WS_URL}?gameId=${gameId}&playerId=${playerId}`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('Connected to game');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    // Processar mensagem
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}
```

## Troubleshooting

### Erro: "NEXT_PUBLIC_WS_URL is not defined"

**Solução**: Configure a variável de ambiente na Vercel:
1. Settings → Environment Variables
2. Adicione `NEXT_PUBLIC_WS_URL`
3. Faça redeploy

### Erro: "WebSocket connection failed"

**Possíveis causas**:
1. URL incorreta (verifique se começa com `wss://`)
2. API Gateway não deployado
3. CORS não configurado (mas WebSocket não usa CORS)

**Solução**: Verifique:
- URL no AWS Console → API Gateway
- Logs do CloudWatch para ver erros no `onConnect`

### Erro: "403 Forbidden"

**Causa**: API Gateway bloqueando a conexão

**Solução**: Verifique:
- Se o WebSocket API está deployado
- Se o stage está correto (`prod`)
- Se há alguma política de segurança configurada

## Próximos Passos

1. ✅ Deploy da infraestrutura (já feito)
2. ⏳ Obter URL do WebSocket do output do CDK
3. ⏳ Configurar `NEXT_PUBLIC_WS_URL` na Vercel
4. ⏳ Implementar WebSocket client no frontend
5. ⏳ Testar conexão end-to-end

## Referências

- [API Gateway WebSocket Authentication](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

