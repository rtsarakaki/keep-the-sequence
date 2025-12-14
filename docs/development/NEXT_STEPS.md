# Próximos Passos de Implementação

## Status Atual ✅

### Completado
- ✅ **Domain Layer**: Entidades, Value Objects, Regras de Negócio, Interfaces
- ✅ **Infrastructure Layer**: Repositórios DynamoDB, WebSocket Service, Mappers
- ✅ **Segurança**: AuthService, endpoint intermediário, rate limiting
- ✅ **Testes**: Domain e Infrastructure com boa cobertura
- ✅ **Frontend**: Homepage protótipo

### Pendente
- ⚠️ **Application Layer**: Use Cases, DTOs, Mappers
- ⚠️ **Presentation Layer**: Lógica dos handlers (tem TODOs)
- ⚠️ **Frontend**: WebSocket client, componentes do jogo

## Próximos Passos Recomendados

### Fase 1: Application Layer (Prioridade Alta)

**Por quê primeiro?**
- Os handlers precisam dos Use Cases para funcionar
- Use Cases encapsulam a lógica de negócio
- Facilita testes e manutenção

**O que implementar:**

1. **Use Cases Principais**
   - `CreateGameUseCase` - Criar nova partida
   - `JoinGameUseCase` - Jogador entrar na partida
   - `PlayCardUseCase` - Jogar uma carta
   - `SyncGameUseCase` - Sincronizar estado do jogo (reconexão)

2. **DTOs (Data Transfer Objects)**
   - `CreateGameDTO`
   - `JoinGameDTO`
   - `PlayCardDTO`
   - `GameStateDTO` (para resposta)

3. **Mappers Application → Domain**
   - Converter DTOs em entidades de domínio
   - Converter entidades em DTOs para resposta

**Estrutura esperada:**
```
backend/src/application/
├── useCases/
│   ├── CreateGameUseCase.ts
│   ├── JoinGameUseCase.ts
│   ├── PlayCardUseCase.ts
│   └── SyncGameUseCase.ts
├── dto/
│   ├── CreateGameDTO.ts
│   ├── JoinGameDTO.ts
│   ├── PlayCardDTO.ts
│   └── GameStateDTO.ts
└── mappers/
    └── GameMapper.ts
```

### Fase 2: Completar Presentation Layer

**Depois dos Use Cases, implementar:**

1. **onConnect Handler**
   - Validar token (já feito ✅)
   - Validar game/player existe
   - Salvar conexão no DynamoDB
   - Notificar outros jogadores

2. **onDisconnect Handler**
   - Remover conexão do DynamoDB
   - Atualizar status do jogador (isConnected: false)
   - Notificar outros jogadores

3. **gameHandler**
   - Parsear ação (playCard, joinGame, etc.)
   - Chamar Use Case apropriado
   - Broadcast resultado para outros jogadores
   - Enviar evento para SQS

4. **syncHandler**
   - Buscar estado do jogo
   - Retornar estado completo para o jogador

5. **sqsConsumer**
   - Salvar eventos no DynamoDB (game-events table)
   - Processar eventos críticos

### Fase 3: Frontend WebSocket Client

**Implementar:**

1. **WebSocket Service**
   - Função para obter URL do WebSocket
   - Cliente WebSocket com reconexão automática
   - Gerenciamento de estado da conexão

2. **Componentes do Jogo**
   - `GameBoard` - Visualização das 4 pilhas
   - `PlayerHand` - Cartas do jogador
   - `PlayersList` - Lista de jogadores
   - `GameStatus` - Status da partida

3. **Hooks React**
   - `useWebSocket` - Gerenciar conexão WebSocket
   - `useGame` - Estado do jogo
   - `usePlayer` - Estado do jogador

### Fase 4: Testes e Integração

1. **Testes de Integração**
   - Testar fluxo completo: criar jogo → jogar carta → sincronizar
   - Testar reconexão
   - Testar múltiplos jogadores

2. **Testes E2E**
   - Testar frontend + backend integrados
   - Simular cenários reais de uso

3. **Aumentar Cobertura**
   - Application Layer: mínimo 80%
   - Presentation Layer: mínimo 70%

## Ordem de Implementação Recomendada

### Opção A: Sequencial (Recomendado)
1. ✅ Application Layer (Use Cases)
2. ✅ Presentation Layer (Handlers)
3. ✅ Frontend (WebSocket Client)
4. ✅ Testes de Integração

### Opção B: Paralelo (Avançado)
- Application + Presentation em paralelo
- Frontend em paralelo após Application

## Decisões Técnicas Pendentes

### Dependency Injection
- **Pergunta**: Como injetar dependências nos handlers?
- **Opções**:
  - Container simples (tsyringe, inversify)
  - Factory functions
  - Injeção manual (simples para começar)

### Error Handling
- **Pergunta**: Como padronizar tratamento de erros?
- **Sugestão**: Result pattern ou exceptions customizadas

### Logging
- **Pergunta**: Como fazer logging estruturado?
- **Sugestão**: AWS CloudWatch Logs com contexto

## Próximo Passo Imediato

**Recomendação**: Começar pela **Fase 1 - Application Layer**

**Primeiro Use Case sugerido**: `CreateGameUseCase`
- É o mais simples
- Não depende de outros use cases
- Permite validar a estrutura

**Quer que eu comece implementando o `CreateGameUseCase`?**

