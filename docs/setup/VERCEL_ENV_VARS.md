# Configuração de Variáveis de Ambiente na Vercel

Este guia explica como configurar as variáveis de ambiente necessárias para o frontend na Vercel.

## Variáveis Necessárias

O frontend precisa das seguintes variáveis de ambiente (todas devem começar com `NEXT_PUBLIC_` para serem acessíveis no browser):

### 1. `NEXT_PUBLIC_API_URL`
**Descrição**: URL base da API HTTP do backend (API Gateway REST API)  
**Exemplo**: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`  
**Uso**: Para chamar endpoints HTTP como `/api/websocket-url`

### 2. `NEXT_PUBLIC_WS_URL` (Opcional - será obtido via API)
**Descrição**: URL base do WebSocket API  
**Exemplo**: `wss://abc123.execute-api.us-east-1.amazonaws.com/prod`  
**Nota**: Na verdade, esta URL será obtida via chamada HTTP para `/api/websocket-url`, então pode não ser necessária como variável de ambiente.

## Como Obter os Valores

### Passo 1: Obter URL da API HTTP

Após o deploy do backend via Serverless Framework:

1. Acesse o [AWS Console](https://console.aws.amazon.com)
2. Vá para **API Gateway** → **REST APIs**
3. Encontre a API criada pelo Serverless Framework:
   - **Nome**: `prod-the-game-backend` (ou similar)
   - **Tipo**: REST API (HTTP)
4. Vá em **Stages** → **prod**
5. Copie a **Invoke URL** (exemplo: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)

**⚠️ Importante**: Use a API **REST** (`prod-the-game-backend`), não a WebSocket API!

**📖 Dúvida sobre qual API usar?** Consulte [`WHICH_API.md`](./WHICH_API.md)

**Ou via AWS CLI:**
```bash
aws apigateway get-rest-apis --query "items[?name=='the-game-backend-prod'].id" --output text
aws apigateway get-stage --rest-api-id <API_ID> --stage-name prod --query "invokeUrl" --output text
```

### Passo 2: Obter URL do WebSocket API

1. Acesse o [AWS Console](https://console.aws.amazon.com)
2. Vá para **API Gateway** → **WebSocket APIs**
3. Encontre a API WebSocket criada pelo CDK (nome será algo como `the-game-websocket-prod`)
4. Vá em **Stages** → **prod**
5. Copie a **WebSocket URL** (exemplo: `wss://abc123.execute-api.us-east-1.amazonaws.com/prod`)

**Ou via AWS CLI:**
```bash
aws apigatewayv2 get-apis --query "Items[?Name=='the-game-websocket-prod'].ApiEndpoint" --output text
```

**Nota**: O WebSocket URL será obtido via chamada HTTP para `/api/websocket-url`, então você pode não precisar configurá-lo diretamente. O endpoint HTTP já retorna a URL completa com token.

## Como Configurar na Vercel

### Método 1: Via Dashboard da Vercel (Recomendado)

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto `keep-the-sequence`
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Para cada variável:
   - **Key**: `NEXT_PUBLIC_API_URL` (ou outra)
   - **Value**: Cole o valor obtido do AWS
   - **Environment**: Selecione:
     - ✅ **Production** (para produção)
     - ✅ **Preview** (para preview deployments)
     - ✅ **Development** (opcional, para desenvolvimento local)
6. Clique em **Save**
7. **Importante**: Após adicionar/alterar variáveis, você precisa fazer um novo deploy:
   - Vá em **Deployments**
   - Clique nos três pontos (...) do último deployment
   - Selecione **Redeploy**

### Método 2: Via Vercel CLI (Alternativo)

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Adicionar variável de ambiente
vercel env add NEXT_PUBLIC_API_URL production

# Quando solicitado, cole o valor da URL
```

## Estrutura Esperada

Após configurar, o frontend poderá acessar:

```typescript
// No código do frontend
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
// Exemplo: https://abc123.execute-api.us-east-1.amazonaws.com/prod

// Para obter WebSocket URL (com token)
const response = await fetch(`${apiUrl}/api/websocket-url`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ gameId, playerId }),
});
const { wsUrl } = await response.json();
// wsUrl já vem com token: wss://...?token=...
```

## Variáveis por Ambiente

### Production
- `NEXT_PUBLIC_API_URL`: URL da API em produção (stage `prod`)

### Preview (PRs)
- `NEXT_PUBLIC_API_URL`: Pode usar a mesma URL de produção ou criar um stage separado

### Development (Local)
- Crie um arquivo `.env.local` no diretório `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Nota**: `.env.local` está no `.gitignore` e não será commitado.

## Verificação

Após configurar as variáveis:

1. Faça um novo deploy na Vercel (ou aguarde o próximo push)
2. Acesse o site deployado
3. Abra o console do browser (F12)
4. Verifique se as variáveis estão disponíveis:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL);
```

## Troubleshooting

### Variável não aparece no browser
- ✅ Verifique se o nome começa com `NEXT_PUBLIC_`
- ✅ Faça um novo deploy após adicionar a variável
- ✅ Limpe o cache do browser

### CORS Errors
- ✅ Verifique se a URL da API está correta
- ✅ Verifique se o CORS está configurado no API Gateway
- ✅ Verifique se o `ALLOWED_ORIGINS` no backend inclui o domínio da Vercel

### WebSocket não conecta
- ✅ Verifique se a URL do WebSocket está correta
- ✅ Verifique se o token está sendo incluído na URL
- ✅ Verifique os logs do CloudWatch para erros no backend

## Próximos Passos

Após configurar as variáveis:

1. ✅ Implementar serviços HTTP e WebSocket no frontend
2. ✅ Testar conexão com o backend
3. ✅ Implementar componentes do jogo
4. ✅ Testar fluxo completo

## Referências

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)

