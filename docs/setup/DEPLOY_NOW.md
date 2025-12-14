# Fazer Deploy Agora

O `WEBSOCKET_API_URL` já está configurado no GitHub Secrets. Agora você precisa fazer o deploy.

## Opção 1: Deploy Manual (Recomendado - Mais Rápido)

1. Acesse: https://github.com/rtsarakaki/keep-the-sequence/actions/workflows/deploy-backend.yml
2. Clique em **Run workflow**
3. Selecione branch `main`
4. Clique em **Run workflow**
5. Aguarde o deploy completar (cerca de 2-3 minutos)

## Opção 2: Aguardar Próximo Commit

Se você fizer um novo commit, o deploy vai acontecer automaticamente.

## Verificar se Funcionou

Após o deploy completar, teste:

```bash
curl "https://ga8w9ineg6.execute-api.us-east-1.amazonaws.com/prod/api/websocket-url?gameId=test&playerId=test"
```

**Sucesso esperado:**
```json
{
  "wsUrl": "wss://b69v17bl4d.execute-api.us-east-1.amazonaws.com/prod/?token=...",
  "expiresIn": 1800
}
```

**Se ainda der erro:**
- Verifique os logs do workflow no GitHub Actions
- Verifique se o secret `WEBSOCKET_API_URL` está configurado corretamente
- Verifique se o deploy foi bem-sucedido

## Próximo Passo

Após o deploy funcionar, o frontend deve conseguir conectar com a API! 🎉

