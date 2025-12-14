# Configuração WebSocket na Vercel

Este guia explica como configurar a conexão WebSocket do frontend (Vercel) com o API Gateway WebSocket (AWS).

## ⚠️ IMPORTANTE: Arquitetura de Segurança

**A URL do WebSocket NÃO é mais exposta diretamente!**

Em vez de usar `NEXT_PUBLIC_WS_URL`, agora usamos um endpoint HTTP intermediário que:
- Valida autenticação antes de retornar a URL
- Gera token temporário para conexão
- Protege contra abuso e exposição de URLs

Veja `SECURITY_ARCHITECTURE.md` para detalhes completos.

## Configuração Necessária na Vercel

### Variável de Ambiente: `NEXT_PUBLIC_API_URL`

Você precisa configurar a URL do **REST API Gateway** (não o WebSocket diretamente):

1. **Obter a URL do REST API**:
   - Após deploy do backend, o Serverless Framework cria um REST API Gateway
   - Formato: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`
   - Você pode ver no AWS Console → API Gateway → REST APIs

2. **Configurar na Vercel**:
   - Acesse seu projeto na Vercel
   - Vá em **Settings** → **Environment Variables**
   - Adicione:
     - **Name**: `NEXT_PUBLIC_API_URL`
     - **Value**: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`
     - **Environment**: Production, Preview, Development

**Importante**: Esta é a URL do REST API, não do WebSocket. O WebSocket URL será obtido dinamicamente via endpoint `/api/websocket-url`.

## Como o Frontend Conecta

```typescript
// 1. Obter URL do WebSocket com token autenticado
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const gameId = 'game-123';
const playerId = 'player-1';

const response = await fetch(
  `${apiUrl}/api/websocket-url?gameId=${gameId}&playerId=${playerId}`,
  {
    headers: {
      'Origin': window.location.origin, // Importante para validação CORS
    },
  }
);

const { wsUrl } = await response.json();

// 2. Conectar ao WebSocket usando a URL retornada (já contém token)
const ws = new WebSocket(wsUrl);
```

## Segurança

### Camadas de Segurança Implementadas

1. **Endpoint HTTP Intermediário** (`/api/websocket-url`):
   - Valida `gameId` e `playerId` antes de retornar URL
   - Gera token temporário (válido 30 minutos)
   - Valida origem (Origin header) para prevenir CSRF

2. **Token Authentication** (no `onConnect` handler):
   - Token contém `gameId`, `playerId`, `origin`, `expiresAt`
   - Validação de expiração
   - Validação de origem
   - Token é obrigatório para conectar

3. **Rate Limiting**:
   - WebSocket Stage: 100 req/s por conexão, burst 200
   - Endpoint HTTP: Rate limiting via API Gateway (configurável)

4. **Validação de Ações** (no `gameHandler`):
   - Cada ação valida se o jogador pode executá-la
   - Não pode jogar carta de outro jogador
   - Não pode executar ações fora do seu turno

### Arquitetura de Segurança

Veja `SECURITY_ARCHITECTURE.md` para detalhes completos da implementação.

## Checklist de Configuração

### 1. Deploy da Infraestrutura ✅
- [ ] CDK stack deployado
- [ ] WebSocket API Gateway criado
- [ ] URL do WebSocket anotada

### 2. Configurar Vercel
- [ ] Variável `NEXT_PUBLIC_API_URL` configurada
- [ ] Valor: URL do REST API Gateway (não WebSocket)
- [ ] Ambiente: Production (e Preview se necessário)

### 3. Implementar Frontend
- [ ] Criar função para obter WebSocket URL via `/api/websocket-url`
- [ ] Criar WebSocket client
- [ ] Conectar usando URL retornada (já contém token)

### 4. Testar Conexão
- [ ] Abrir aplicação na Vercel
- [ ] Verificar conexão WebSocket no DevTools
- [ ] Verificar logs no CloudWatch

## Exemplo de Código Frontend

```typescript
// frontend/src/services/websocket.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getWebSocketUrl(gameId: string, playerId: string): Promise<string> {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL not configured');
  }

  const response = await fetch(
    `${API_URL}/api/websocket-url?gameId=${gameId}&playerId=${playerId}`,
    {
      headers: {
        'Origin': window.location.origin,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get WebSocket URL: ${response.statusText}`);
  }

  const { wsUrl } = await response.json();
  return wsUrl;
}

export async function connectToGame(gameId: string, playerId: string) {
  // 1. Obter URL do WebSocket com token
  const wsUrl = await getWebSocketUrl(gameId, playerId);
  
  // 2. Conectar ao WebSocket
  const ws = new WebSocket(wsUrl);

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

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Opcional: Reconectar automaticamente
  };

  return ws;
}
```

## Troubleshooting

### Erro: "NEXT_PUBLIC_API_URL is not defined"

**Solução**: Configure a variável de ambiente na Vercel:
1. Settings → Environment Variables
2. Adicione `NEXT_PUBLIC_API_URL` (URL do REST API, não WebSocket)
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
2. ✅ Deploy do backend (cria REST API Gateway)
3. ⏳ Obter URL do REST API Gateway (não WebSocket)
4. ⏳ Configurar `NEXT_PUBLIC_API_URL` na Vercel
5. ⏳ Implementar função `getWebSocketUrl` no frontend
6. ⏳ Implementar WebSocket client no frontend
7. ⏳ Testar conexão end-to-end

## Referências

- [API Gateway WebSocket Authentication](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

