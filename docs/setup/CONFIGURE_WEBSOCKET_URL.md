# Configurar WEBSOCKET_API_URL no Lambda

O erro "WebSocket URL not configured" indica que a variável de ambiente `WEBSOCKET_API_URL` não está configurada no Lambda.

## Passo 1: Obter URL do WebSocket API

1. Acesse o [AWS Console](https://console.aws.amazon.com)
2. Vá para **API Gateway** → **WebSocket APIs**
3. Encontre a API WebSocket criada pelo CDK (nome será algo como `the-game-websocket-prod`)
4. Vá em **Stages** → **prod**
5. Copie a **WebSocket URL** (exemplo: `wss://abc123.execute-api.us-east-1.amazonaws.com/prod`)

**Ou via AWS CLI:**
```bash
aws apigatewayv2 get-apis --query "Items[?Name=='the-game-websocket-prod'].ApiEndpoint" --output text
```

**Nota**: A URL deve começar com `wss://` (WebSocket Secure)

## Passo 2: Configurar no Serverless Framework

A variável `WEBSOCKET_API_URL` precisa ser passada como variável de ambiente durante o deploy.

### Opção A: Via GitHub Secrets (Recomendado)

1. No GitHub, vá em **Settings** → **Secrets and variables** → **Actions**
2. Adicione um novo secret:
   - **Name**: `WEBSOCKET_API_URL`
   - **Value**: A URL do WebSocket API (ex: `wss://abc123.execute-api.us-east-1.amazonaws.com/prod`)

3. Atualize o workflow `.github/workflows/deploy-backend.yml` para usar essa variável:

```yaml
- name: Deploy to AWS Lambda
  working-directory: ./backend
  run: npx serverless deploy --stage prod
  env:
    AWS_REGION: ${{ secrets.AWS_REGION }}
    WEBSOCKET_API_URL: ${{ secrets.WEBSOCKET_API_URL }}
```

### Opção B: Via Variável de Ambiente Local (Para teste)

Se quiser testar localmente primeiro:

```bash
cd backend
export WEBSOCKET_API_URL="wss://abc123.execute-api.us-east-1.amazonaws.com/prod"
npx serverless deploy --stage prod
```

## Passo 3: Verificar Configuração

Após o deploy, verifique se a variável está configurada:

**No AWS Console:**
1. Lambda → Functions → `the-game-backend-prod-getWebSocketUrl`
2. Configuration → Environment variables
3. Verifique se `WEBSOCKET_API_URL` existe e tem o valor correto

**Ou via AWS CLI:**
```bash
aws lambda get-function-configuration \
  --function-name the-game-backend-prod-getWebSocketUrl \
  --query 'Environment.Variables.WEBSOCKET_API_URL' \
  --output text
```

## Passo 4: Testar

Após configurar, teste novamente:

```bash
curl "https://ga8w9ineg6.execute-api.us-east-1.amazonaws.com/prod/api/websocket-url?gameId=test&playerId=test"
```

Deve retornar algo como:
```json
{
  "wsUrl": "wss://abc123.execute-api.us-east-1.amazonaws.com/prod?token=...",
  "expiresIn": 1800
}
```

## Troubleshooting

### Erro: "WebSocket URL not configured"
- Verifique se `WEBSOCKET_API_URL` está configurada no Lambda
- Verifique se o valor está correto (deve começar com `wss://`)
- Faça um novo deploy após configurar

### Erro: "Invalid WebSocket URL"
- Verifique se a URL está correta
- Verifique se o WebSocket API está deployado
- Verifique se o stage está correto (`prod`)

## Próximos Passos

Após configurar `WEBSOCKET_API_URL`:
1. ✅ O endpoint `/api/websocket-url` deve funcionar
2. ✅ O frontend deve conseguir obter a URL do WebSocket
3. ✅ Os jogadores devem conseguir conectar via WebSocket




