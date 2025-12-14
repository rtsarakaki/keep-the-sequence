# Arquitetura de Segurança - WebSocket e Autenticação

Este documento explica a arquitetura de segurança implementada para proteger o WebSocket e evitar exposição de URLs e abuso de endpoints.

## Problema Original

1. **Exposição da URL**: Usar `NEXT_PUBLIC_WS_URL` expõe a URL do WebSocket no código cliente
2. **Múltiplas chamadas**: Sem proteção, o endpoint pode receber muitas requisições, impactando custo e desempenho
3. **Sem autenticação**: Qualquer um pode tentar conectar ao WebSocket

## Solução Implementada

### 1. Endpoint HTTP Intermediário

Criamos um endpoint HTTP (`/api/websocket-url`) que:
- **Valida** `gameId` e `playerId` antes de retornar a URL
- **Gera** um token temporário (válido por 30 minutos)
- **Retorna** a URL do WebSocket com o token embutido
- **Valida origem** (Origin header) para prevenir CSRF

**Fluxo:**
```
Frontend → GET /api/websocket-url?gameId=X&playerId=Y
         ← { wsUrl: "wss://...?token=ABC123" }
         
Frontend → Conecta ao WebSocket com token
         → WebSocket valida token antes de aceitar conexão
```

### 2. Autenticação por Token

**Token Structure:**
```typescript
{
  gameId: string;
  playerId: string;
  expiresAt: number;  // Timestamp
  origin: string;      // Allowed origin
}
```

**Codificação:** Base64 JSON (simples, mas funcional)
- Em produção, considere usar JWT com assinatura

**Validação:**
- Token expira após 30 minutos
- Origin deve corresponder ao token
- Token é validado no `onConnect` handler

### 3. Rate Limiting

**No WebSocket Stage:**
- Rate limit: 100 requisições/segundo por conexão
- Burst limit: 200 requisições

**No Endpoint HTTP:**
- Rate limiting será implementado via API Gateway (quando criar REST API)
- Ou via Lambda com DynamoDB para tracking por IP

### 4. Validação de Origem

**Camadas de proteção:**
1. **Token contém origin**: Token criado com origin específico
2. **Validação no onConnect**: Compara Origin header com origin do token
3. **CORS no endpoint HTTP**: Apenas origens permitidas podem chamar

**Configuração:**
```bash
ALLOWED_ORIGINS=https://your-app.vercel.app,https://preview.vercel.app
```

## Arquitetura Completa

```
┌─────────────┐
│   Frontend  │
│   (Vercel)  │
└──────┬──────┘
       │
       │ 1. GET /api/websocket-url?gameId=X&playerId=Y
       │    Headers: Origin: https://app.vercel.app
       ▼
┌─────────────────────────┐
│   REST API Gateway      │
│   (Lambda: getWebSocketUrl)│
└──────┬──────────────────┘
       │
       │ 2. Valida gameId, playerId, origin
       │ 3. Cria token temporário
       │ 4. Retorna: { wsUrl: "wss://...?token=ABC" }
       │
       ▼
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ 5. Conecta: wss://api...?token=ABC
       │    Headers: Origin: https://app.vercel.app
       ▼
┌─────────────────────────┐
│  WebSocket API Gateway  │
│  (Lambda: onConnect)    │
└──────┬──────────────────┘
       │
       │ 6. Valida token
       │ 7. Valida origin
       │ 8. Valida gameId/playerId
       │ 9. Aceita conexão
       │
       ▼
┌─────────────┐
│   DynamoDB  │
│ (Connections)│
└─────────────┘
```

## Configuração

### Variáveis de Ambiente

**Backend (Lambda):**
```bash
WEBSOCKET_API_URL=wss://abc123.execute-api.us-east-1.amazonaws.com/prod
ALLOWED_ORIGINS=https://your-app.vercel.app,https://preview.vercel.app
```

**Frontend (Vercel):**
```bash
# NÃO precisa mais de NEXT_PUBLIC_WS_URL!
# Apenas a URL do REST API (que retorna o WebSocket URL)
NEXT_PUBLIC_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

### Como Usar no Frontend

```typescript
// 1. Obter URL do WebSocket com token
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/websocket-url?gameId=${gameId}&playerId=${playerId}`,
  {
    headers: {
      'Origin': window.location.origin,
    },
  }
);

const { wsUrl } = await response.json();

// 2. Conectar ao WebSocket usando a URL retornada
const ws = new WebSocket(wsUrl);
```

## Benefícios

### Segurança
- ✅ URL do WebSocket não exposta no código cliente
- ✅ Token temporário com expiração
- ✅ Validação de origem previne CSRF
- ✅ Validação de gameId/playerId antes de conectar

### Performance e Custo
- ✅ Rate limiting previne abuso
- ✅ Token expira automaticamente (30 min)
- ✅ Validação rápida (sem chamadas externas desnecessárias)

### Manutenibilidade
- ✅ Fácil adicionar mais validações no endpoint HTTP
- ✅ Pode trocar implementação de token sem afetar frontend
- ✅ Logs centralizados no endpoint HTTP

## Próximos Passos (Melhorias Futuras)

### 1. JWT com Assinatura
Substituir Base64 JSON por JWT assinado:
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { gameId, playerId, origin },
  process.env.JWT_SECRET,
  { expiresIn: '30m' }
);
```

### 2. Rate Limiting por IP
Implementar rate limiting no endpoint HTTP:
- Usar DynamoDB para tracking de requisições por IP
- Limitar: 10 requisições/minuto por IP

### 3. Validação de Game/Player
No endpoint HTTP, validar:
- Game existe no DynamoDB
- Player faz parte do game
- Game não está finalizado

### 4. AWS Cognito (Opcional)
Para autenticação mais robusta:
- Integrar com AWS Cognito
- Usar tokens Cognito no lugar de tokens customizados
- Validação automática no API Gateway

## Troubleshooting

### Erro: "Missing authentication token"
**Causa**: Token não foi passado na query string do WebSocket
**Solução**: Certifique-se de usar a URL retornada pelo endpoint HTTP

### Erro: "Token expired"
**Causa**: Token expirou (30 minutos)
**Solução**: Obter novo token chamando `/api/websocket-url` novamente

### Erro: "Origin not allowed"
**Causa**: Origin não corresponde ao token ou não está na lista permitida
**Solução**: Verificar `ALLOWED_ORIGINS` e garantir que o frontend está usando a origem correta

### Erro: "WebSocket URL not configured"
**Causa**: Variável `WEBSOCKET_API_URL` não configurada no Lambda
**Solução**: Configurar variável de ambiente no Serverless ou CDK

## Referências

- [API Gateway WebSocket Authentication](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [API Gateway Rate Limiting](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html)
- [CORS Configuration](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)

