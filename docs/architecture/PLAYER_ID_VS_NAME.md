# Player ID vs Player Name

## Design Atual

Atualmente, o sistema usa **dois campos separados**:

- **`playerId`**: UUID único gerado automaticamente (ex: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- **`playerName`**: Nome informado pelo usuário (ex: `"João"`)

## Por que separar?

### Vantagens de usar UUID como ID:

1. **Unicidade garantida**: UUIDs são únicos globalmente
2. **Sem conflitos**: Múltiplos jogadores podem ter o mesmo nome
3. **Imutável**: IDs não mudam, mesmo se o jogador mudar de nome
4. **Segurança**: Não expõe informações pessoais na URL/query params
5. **Padrão da indústria**: Prática comum em sistemas distribuídos

### Desvantagens:

1. **Menos intuitivo**: UUIDs são difíceis de lembrar
2. **URLs menos amigáveis**: `?playerId=a1b2c3d4...` vs `?player=João`
3. **Mais complexo**: Precisa gerenciar dois campos

## Alternativa: Usar Nome como ID

### Vantagens:

1. **Simples**: Um único campo
2. **Intuitivo**: Mais fácil de entender
3. **URLs amigáveis**: `?player=João`

### Desvantagens:

1. **Conflitos**: Dois jogadores com mesmo nome causam problemas
2. **Caracteres especiais**: Nomes podem ter espaços, acentos, etc.
3. **Mudanças**: Se o jogador mudar de nome, precisa atualizar referências
4. **Segurança**: Expõe nomes nas URLs

## Recomendação

**Manter como está (UUID + Name)** porque:

- ✅ Suporta múltiplos jogadores com mesmo nome
- ✅ Mais seguro e robusto
- ✅ Segue boas práticas de design de sistemas
- ✅ Facilita futuras melhorias (perfis, histórico, etc.)

## Se quiser simplificar

Podemos usar o nome como ID, mas precisaríamos:

1. Validar unicidade do nome no jogo
2. Sanitizar o nome (remover espaços, caracteres especiais)
3. Tratar conflitos quando dois jogadores têm mesmo nome

**Quer que eu implemente usando nome como ID, ou prefere manter UUID?**

