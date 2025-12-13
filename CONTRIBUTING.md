# Guia de Contribuição

## Desenvolvimento com TDD

Seguimos Test-Driven Development (TDD). Sempre escreva os testes ANTES da implementação.

### Ciclo TDD

1. **Red**: Escreva um teste que falha (descreve o comportamento esperado)
2. **Green**: Implemente código mínimo para passar no teste
3. **Refactor**: Melhore o código mantendo os testes passando

### Exemplo

```typescript
// 1. Escrever teste primeiro
describe('PlayCardUseCase', () => {
  it('deve jogar carta válida na pilha', async () => {
    // Arrange
    const useCase = new PlayCardUseCase(...);
    
    // Act
    const result = await useCase.execute(...);
    
    // Assert
    expect(result.isSuccess()).toBe(true);
  });
});

// 2. Implementar código mínimo para passar
// 3. Refatorar mantendo testes passando
```

## Estrutura de Código

### Domain Layer (Regras de Negócio)
- **Entities**: Entidades imutáveis do domínio
- **Value Objects**: Objetos de valor imutáveis
- **Services**: Funções puras com regras de negócio
- **Repositories**: Interfaces (não implementações)

### Application Layer (Casos de Uso)
- **Use Cases**: Orquestram a lógica de negócio
- **DTOs**: Data Transfer Objects
- **Mappers**: Convertem entre camadas

### Infrastructure Layer (Implementações)
- **Repositories**: Implementações concretas (DynamoDB, etc.)
- **Services**: Implementações de serviços externos
- **Config**: Configurações

### Presentation Layer (Handlers)
- **Handlers**: Lambda handlers que orquestram casos de uso

## Imutabilidade

Todas as entidades devem ser imutáveis:

```typescript
export class Game {
  readonly id: string;
  readonly players: readonly Player[];
  
  addPlayer(player: Player): Game {
    // Retorna NOVA instância
    return new Game({
      ...this,
      players: Object.freeze([...this.players, player]),
    });
  }
}
```

## Testes

### Cobertura Mínima
- 80% para regras de negócio (domain layer)
- 70% para outras camadas

### Executar Testes

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
npm run test:coverage
```

## Commits

- Commits pequenos e focados
- Mensagens descritivas
- Um commit por feature/refatoração
- Sempre incluir testes

## Deploy

1. Fazer commit e push para `main`
2. CI executa automaticamente
3. Você receberá notificação para aprovar deploy
4. Após aprovação, deploy é executado

## Checklist antes de fazer PR

- [ ] Testes passando
- [ ] Cobertura de testes adequada
- [ ] Lint passando
- [ ] Type-check passando
- [ ] Código segue princípios SOLID
- [ ] Entidades são imutáveis
- [ ] Sem uso de `any`
- [ ] Nomes descritivos

