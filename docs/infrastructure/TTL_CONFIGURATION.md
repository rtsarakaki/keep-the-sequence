# Configuração de TTL (Time To Live) no DynamoDB

## Visão Geral

O DynamoDB suporta TTL (Time To Live) para excluir automaticamente itens antigos, reduzindo custos e mantendo o banco de dados limpo.

## Tabelas com TTL Configurado

### 1. `the-game-games` (Jogos)

**TTL:** 7 dias após criação

**Configuração:**
- Atributo TTL: `ttl` (Unix timestamp em segundos)
- Definido automaticamente quando o jogo é criado
- Jogos são automaticamente deletados após 7 dias

**Código:**
```typescript
// GameInitializer.createGame()
ttl: Math.floor(now.getTime() / 1000) + (7 * 24 * 60 * 60) // 7 dias
```

**Motivo:** Limpar jogos antigos/abandonados automaticamente.

### 2. `the-game-connections` (Conexões WebSocket)

**TTL:** 24 horas após conexão

**Configuração:**
- Atributo TTL: `ttl` (Unix timestamp em segundos)
- Definido quando o jogador conecta via WebSocket
- Conexões desconectadas são automaticamente deletadas após 24h

**Código:**
```typescript
// onConnect handler
ttl: Math.floor(now.getTime() / 1000) + (24 * 60 * 60) // 24 horas
```

**Motivo:** Limpar conexões antigas de jogadores que desconectaram.

### 3. `the-game-game-events` (Eventos do Jogo)

**TTL:** Configurado, mas não implementado ainda

**Configuração:**
- Atributo TTL: `ttl` (Unix timestamp em segundos)
- Tabela configurada para suportar TTL
- **Nota:** A implementação de eventos ainda não está completa

**Motivo:** Limpar histórico de eventos antigos (ex: após 30 dias).

## Como Funciona

1. **Definição do TTL:**
   - O valor TTL é um Unix timestamp em **segundos** (não milissegundos)
   - Exemplo: `1704067200` = 1 de janeiro de 2024, 00:00:00 UTC

2. **Deleção Automática:**
   - DynamoDB verifica itens com TTL expirado periodicamente (dentro de 48 horas)
   - Itens são deletados automaticamente sem custo adicional
   - Não há garantia de deleção exata no momento do TTL (pode levar até 48h)

3. **Formato:**
   ```typescript
   // Converter Date para Unix timestamp (segundos)
   const ttl = Math.floor(new Date().getTime() / 1000) + (dias * 24 * 60 * 60);
   ```

## Benefícios

- **Redução de Custos:** Menos dados armazenados = menor custo
- **Limpeza Automática:** Não precisa de jobs ou scripts manuais
- **Manutenção Simplificada:** DynamoDB cuida da limpeza automaticamente
- **Performance:** Tabelas menores = queries mais rápidas

## Configuração no CDK

```typescript
const gamesTable = new dynamodb.Table(this, 'GamesTable', {
  // ...
  timeToLiveAttribute: 'ttl',
});
```

## Configuração no Serverless Framework

```yaml
TimeToLiveSpecification:
  Enabled: true
  AttributeName: ttl
```

## Notas Importantes

1. **TTL é em segundos:** Sempre converter `Date.getTime()` (milissegundos) para segundos dividindo por 1000
2. **Deleção não é instantânea:** Pode levar até 48 horas após o TTL expirar
3. **TTL expirado:** Se `ttl < agora`, o item será deletado
4. **TTL não definido:** Se `ttl` não existir ou for `undefined`, o item não será deletado

## Exemplo de Uso

```typescript
// Criar jogo com TTL de 7 dias
const game = new Game({
  // ...
  ttl: Math.floor(new Date().getTime() / 1000) + (7 * 24 * 60 * 60),
});

// Criar conexão com TTL de 24 horas
const connection: Connection = {
  // ...
  ttl: Math.floor(new Date().getTime() / 1000) + (24 * 60 * 60),
};
```




