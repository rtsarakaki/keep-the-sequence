# Como Reconectar a uma Partida

## Visão Geral

Se você cair ou fechar o navegador durante uma partida, você pode reconectar facilmente usando apenas o **ID do jogo** e seu **nome**.

## Como Funciona

### Opção 1: Usando Player ID (Recomendado)

Se você tem o `playerId` salvo (por exemplo, no `sessionStorage`):

1. Acesse: `/game/[gameId]?playerId=[seu-player-id]`
2. O sistema conecta automaticamente usando o `playerId`

### Opção 2: Usando Nome do Jogador (Reconexão Simples)

Se você não tem o `playerId`, mas lembra do seu nome:

1. Acesse: `/game/[gameId]?playerName=[seu-nome]`
2. O sistema busca o `playerId` correspondente ao seu nome no jogo
3. Conecta automaticamente

**Nota**: O nome deve ser exatamente igual ao que você usou ao entrar na partida.

## Fluxo de Reconexão

```
1. Jogador acessa /game/[gameId] com playerId ou playerName
2. Frontend tenta conectar usando playerId (se disponível)
3. Se playerId não disponível ou falhar:
   - Frontend usa playerName
   - Backend busca o playerId correspondente ao nome no jogo
   - Conecta usando o playerId encontrado
4. Jogador recebe o estado atual do jogo
```

## Exemplo Prático

### Cenário: Você caiu durante a partida

**Informações que você precisa:**
- ID do jogo: `cf929eb9-992b-44be-8816-1ae9b3b6ea9b`
- Seu nome: `João`

**Solução:**

1. Acesse: `https://seu-site.com/game/cf929eb9-992b-44be-8816-1ae9b3b6ea9b?playerName=João`
2. O sistema reconecta automaticamente

## Limitações

- **Nome deve ser único no jogo**: Se dois jogadores tiverem o mesmo nome, o sistema pode não conseguir identificar qual é você
- **Nome deve ser exato**: O nome deve ser exatamente igual ao usado ao entrar (case-sensitive)
- **Jogo deve existir**: O jogo deve ainda estar ativo no sistema

## Melhor Prática

**Salve o `playerId` no `sessionStorage`** quando você entrar na partida. Isso permite reconexão mais rápida e confiável.

O sistema já faz isso automaticamente quando você cria ou entra em uma partida pela primeira vez.

## Troubleshooting

### Erro: "Player not found in this game"

**Possíveis causas:**
1. Nome digitado incorretamente
2. Você não entrou nesta partida ainda
3. Nome com espaços extras ou caracteres especiais

**Solução:**
- Verifique se o nome está exatamente igual ao usado ao entrar
- Tente usar o `playerId` se você tiver salvo

### Erro: "Game not found"

**Possíveis causas:**
1. ID do jogo incorreto
2. Jogo foi deletado ou expirou (TTL)

**Solução:**
- Verifique o ID do jogo
- Crie uma nova partida se necessário




