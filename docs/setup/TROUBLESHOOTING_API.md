# Troubleshooting: API não acessível

Este guia ajuda a diagnosticar e resolver o erro "API não acessível: Failed to fetch".

## Checklist de Diagnóstico

### 1. ✅ Verificar se a variável está configurada na Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Verifique se `NEXT_PUBLIC_API_URL` existe
5. Verifique se está marcada para **Production** (e Preview, se necessário)

**Se não existir:**
- Adicione seguindo [`VERCEL_ENV_VARS.md`](./VERCEL_ENV_VARS.md)
- **Importante**: Após adicionar, faça um **Redeploy**

### 2. ✅ Verificar se o valor está correto

A URL deve ser da API **REST** (`prod-the-game-backend`), não da WebSocket!

**Formato correto:**
```
https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

**Formato incorreto (WebSocket):**
```
wss://xyz789.execute-api.us-east-1.amazonaws.com/prod  ❌
```

**Como obter a URL correta:**
1. AWS Console → **API Gateway** → **REST APIs**
2. Encontre `prod-the-game-backend`
3. Stages → **prod** → copie a **Invoke URL**

### 3. ✅ Verificar se o backend está deployado

**Verificar no AWS Console:**
1. AWS Console → **Lambda**
2. Procure por funções com prefixo `the-game-backend-prod-`
3. Deve ter pelo menos:
   - `the-game-backend-prod-getWebSocketUrl`
   - `the-game-backend-prod-createGame`

**Se não existir:**
- O backend não foi deployado ainda
- Execute o workflow `Deploy Backend` no GitHub Actions
- Ou faça deploy manual: `cd backend && npx serverless deploy --stage prod`

### 4. ✅ Testar a API diretamente

Teste se a API está respondendo:

```bash
# Substitua pela sua URL
curl https://abc123.execute-api.us-east-1.amazonaws.com/prod/api/websocket-url?gameId=test&playerId=test
```

**Resposta esperada (sucesso):**
```json
{
  "wsUrl": "wss://xyz789.execute-api.us-east-1.amazonaws.com/prod?token=...",
  "expiresIn": 1800
}
```

**Resposta de erro:**
- `404 Not Found`: Endpoint não existe ou URL incorreta
- `500 Internal Server Error`: Erro no backend (ver logs do Lambda)
- `Failed to fetch`: CORS ou URL incorreta

### 5. ✅ Verificar CORS

O erro "Failed to fetch" pode ser CORS. Verifique:

1. A URL da Vercel está na lista de origens permitidas?
2. O backend está configurado para aceitar requisições da Vercel?

**Verificar no código:**
- `backend/serverless.yml` → `custom.allowedOrigins`
- Deve incluir o domínio da Vercel (ex: `https://seu-projeto.vercel.app`)

### 6. ✅ Verificar logs do Lambda

Se a API retorna erro, verifique os logs:

1. AWS Console → **CloudWatch** → **Log Groups**
2. Procure por `/aws/lambda/the-game-backend-prod-getWebSocketUrl`
3. Veja os logs mais recentes para identificar o erro

### 7. ✅ Verificar redeploy na Vercel

**Após alterar variáveis de ambiente:**
1. Vercel Dashboard → **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Selecione **Redeploy**
4. Aguarde o deploy completar

**Importante**: Variáveis de ambiente só são aplicadas em novos deploys!

## Erros Comuns

### Erro: "API não configurada"
**Causa**: `NEXT_PUBLIC_API_URL` não está configurada na Vercel  
**Solução**: Configure seguindo [`VERCEL_ENV_VARS.md`](./VERCEL_ENV_VARS.md)

### Erro: "Failed to fetch"
**Possíveis causas**:
1. URL incorreta (usando WebSocket ao invés de REST)
2. Backend não está deployado
3. CORS não configurado
4. URL com erro de digitação

**Solução**:
1. Verifique a URL no AWS Console
2. Teste com `curl` primeiro
3. Verifique se o backend está deployado
4. Verifique CORS no `serverless.yml`

### Erro: "404 Not Found"
**Causa**: Endpoint não existe ou URL incorreta  
**Solução**:
1. Verifique se o backend foi deployado
2. Verifique se a URL está correta (deve terminar em `/prod`)
3. Verifique se o endpoint existe em `serverless.yml`

### Erro: "500 Internal Server Error"
**Causa**: Erro no backend  
**Solução**:
1. Verifique logs do Lambda no CloudWatch
2. Verifique se as tabelas DynamoDB existem
3. Verifique se as variáveis de ambiente do Lambda estão configuradas

## Teste Rápido

Execute este comando substituindo pela sua URL:

```bash
# Teste 1: Verificar se a API está acessível
curl https://SUA-URL.execute-api.us-east-1.amazonaws.com/prod/api/websocket-url?gameId=test&playerId=test

# Teste 2: Criar um jogo (POST)
curl -X POST https://SUA-URL.execute-api.us-east-1.amazonaws.com/prod/api/games \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Teste"}'
```

**Se ambos funcionarem**: O problema está na configuração da Vercel  
**Se falharem**: O problema está no backend (deploy ou configuração)

## Próximos Passos

1. ✅ Verifique cada item do checklist acima
2. ✅ Teste a API diretamente com `curl`
3. ✅ Verifique os logs do Lambda se houver erro 500
4. ✅ Faça redeploy na Vercel após alterar variáveis
5. ✅ Se ainda não funcionar, verifique os logs do browser (F12 → Console)

## Ainda não funcionou?

Verifique:
- [ ] Backend está deployado?
- [ ] URL está correta (REST API, não WebSocket)?
- [ ] Variável configurada na Vercel?
- [ ] Redeploy feito após configurar variável?
- [ ] CORS configurado corretamente?
- [ ] Logs do Lambda mostram algum erro?

Se tudo estiver correto e ainda não funcionar, verifique os logs do browser (F12 → Console) para mais detalhes do erro.

