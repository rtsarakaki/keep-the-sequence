# Configuração Rápida: WEBSOCKET_API_URL

## URL do WebSocket API

```
wss://b69v17bl4d.execute-api.us-east-1.amazonaws.com/prod/
```

## Passo a Passo Rápido

### 1. Adicionar no GitHub Secrets

1. Acesse: https://github.com/rtsarakaki/keep-the-sequence/settings/secrets/actions
2. Clique em **New repository secret**
3. Configure:
   - **Name**: `WEBSOCKET_API_URL`
   - **Value**: `wss://b69v17bl4d.execute-api.us-east-1.amazonaws.com/prod/`
4. Clique em **Add secret**

### 2. Fazer Deploy

Após adicionar o secret, você tem duas opções:

**Opção A: Aguardar próximo commit** (automático)
- O workflow `Deploy Backend` vai executar automaticamente no próximo push

**Opção B: Deploy manual** (mais rápido)
1. Vá em **Actions** → **Deploy Backend**
2. Clique em **Run workflow**
3. Selecione branch `main`
4. Clique em **Run workflow**

### 3. Verificar

Após o deploy, teste:

```bash
curl "https://ga8w9ineg6.execute-api.us-east-1.amazonaws.com/prod/api/websocket-url?gameId=test&playerId=test"
```

Deve retornar:
```json
{
  "wsUrl": "wss://b69v17bl4d.execute-api.us-east-1.amazonaws.com/prod/?token=...",
  "expiresIn": 1800
}
```

## Pronto! 🎉

Após configurar, o frontend deve conseguir conectar com a API.

