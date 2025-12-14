# Troubleshooting: Erro de Conexão WebSocket (Código 1006)

## Erro Comum

```
Erro na conexão: Conexão fechada inesperadamente.
Possíveis causas:
1. O jogo não existe ou foi deletado
2. Você não faz parte deste jogo
3. Token de autenticação expirado
4. Problema de rede
Código: 1006
```

## Diagnóstico Passo a Passo

### 1. Verificar se o Jogo Existe

Use o script de verificação:

```bash
cd backend
npm run check-game -- <gameId> [playerId]
```

**Exemplo:**
```bash
npm run check-game -- 0VY27U dbf0c226-955a-4ffe-a719-6a111e789e6c
```

**O que o script mostra:**
- ✅ Se o jogo existe no DynamoDB
- ✅ Status do jogo (waiting, playing, finished)
- ✅ Lista de jogadores
- ✅ Se o playerId está associado ao jogo
- ✅ TTL (quando o jogo será deletado)

### 2. Possíveis Causas e Soluções

#### Causa 1: Jogo Não Existe

**Sintomas:**
- Script `check-game` retorna "Game not found"
- Erro ao tentar conectar

**Solução:**
1. O jogo pode ter sido deletado (TTL expirou - 7 dias)
2. O gameId está incorreto
3. Crie um novo jogo na página inicial

#### Causa 2: Player Não Está no Jogo

**Sintomas:**
- Script `check-game` mostra o jogo, mas o playerId não está na lista
- Erro "Player is not part of this game"

**Solução:**
1. Use o endpoint `/api/games/join` para entrar no jogo primeiro
2. Ou use seu nome (`playerName`) ao invés do `playerId`
3. Verifique se o `playerId` está correto

#### Causa 3: Token Expirado

**Sintomas:**
- Erro ao obter URL do WebSocket
- Token inválido ou expirado

**Solução:**
1. Os tokens expiram em 30 minutos
2. Recarregue a página para obter um novo token
3. Ou volte à página inicial e entre novamente

#### Causa 4: Problema de Rede/CORS

**Sintomas:**
- Erro "Failed to fetch" ao obter URL do WebSocket
- CORS errors no console

**Solução:**
1. Verifique se `NEXT_PUBLIC_API_URL` está configurado no Vercel
2. Verifique se o backend está deployado e acessível
3. Verifique os logs do CloudWatch para erros do backend

### 3. Verificar Logs do Backend

**CloudWatch Logs:**
1. Acesse AWS Console → CloudWatch → Log Groups
2. Procure por `/aws/lambda/the-game-backend-prod-onConnect`
3. Verifique os logs mais recentes para ver o erro exato

**O que procurar:**
- `Game not found: <gameId>`
- `Player not in game: <playerId>`
- `Invalid token`
- Erros de DynamoDB

### 4. Verificar Console do Navegador

Abra o DevTools (F12) e verifique:

**Console:**
- Mensagens de erro detalhadas
- Logs de conexão WebSocket
- Erros de rede

**Network:**
- Requisição para `/api/websocket-url` - verificar status code
- Conexão WebSocket - verificar close code e reason

### 5. Solução Rápida

**Se nada funcionar:**

1. **Volte à página inicial**
2. **Crie um novo jogo** ou **entre em um jogo existente**
3. **Use o novo `gameId` e `playerId`** retornados

## Scripts Úteis

### Verificar Jogo
```bash
cd backend
npm run check-game -- <gameId> [playerId]
```

### Limpar Tabelas (CUIDADO!)
```bash
cd backend
npm run clear-tables
```

### Verificar Acesso AWS
```bash
cd backend
npm run test:aws
```

## Mensagens de Erro Melhoradas

Após o deploy, você verá mensagens mais específicas:

- **"Erro ao obter URL do WebSocket"** = Problema antes de conectar (jogo não existe, player não no jogo)
- **"Conexão fechada inesperadamente"** = Problema durante a conexão (token inválido, validação falhou)

## Próximos Passos

1. Execute `npm run check-game` para verificar o jogo
2. Verifique os logs do CloudWatch
3. Se o jogo não existir, crie um novo
4. Se o player não estiver no jogo, use `/api/games/join` primeiro

