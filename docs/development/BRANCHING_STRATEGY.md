# Estratégia de Branching

Este projeto segue **Trunk-Based Development** com feature branches curtas.

## Estrutura de Branches

### `main` (Branch Principal)
- ✅ **Sempre deployável**: Código em `main` está sempre pronto para produção
- ✅ **Protegida**: Requer PR e aprovação para merge
- ✅ **Deploy automático**: Cada push em `main` dispara deploy

### `feature/*` (Feature Branches)
- ✅ **Curta duração**: Branches vivem apenas alguns dias
- ✅ **Uma feature por branch**: Cada branch implementa uma funcionalidade específica
- ✅ **Validação automática**: CI roda automaticamente em PRs

## Fluxo de Trabalho Recomendado

### 1. Criar Feature Branch

```bash
# Atualizar main
git checkout main
git pull origin main

# Criar branch para nova feature
git checkout -b feature/nome-da-feature

# Exemplos:
git checkout -b feature/websocket-client
git checkout -b feature/game-board-component
git checkout -b feature/player-hand-component
```

### 2. Desenvolver na Feature Branch

```bash
# Fazer mudanças
# ... editar arquivos ...

# Commitar (pre-commit hooks validam automaticamente)
git add .
git commit -m "feat: implement websocket client"

# Continuar desenvolvendo...
git add .
git commit -m "feat: add reconnection logic"
```

**Pre-commit hooks**:
- ✅ Validam lint e type-check automaticamente
- ✅ Bloqueiam commits com erros
- ✅ Feedback rápido antes do commit

### 3. Criar Pull Request

```bash
# Push da branch
git push origin feature/nome-da-feature
```

No GitHub:
1. Criar Pull Request de `feature/nome-da-feature` → `main`
2. **CI workflow executa automaticamente**:
   - ✅ Lint (backend + frontend)
   - ✅ Type-check (backend + frontend)
   - ✅ Testes (backend + frontend)
   - ✅ Coverage check
3. Se passar: PR pode ser mergeado
4. Se falhar: Corrigir erros e fazer novo push

### 4. Revisar e Mergear

- ✅ Revisar código no PR
- ✅ Verificar que CI passou (✅ verde)
- ✅ Mergear PR para `main`
- ✅ Deletar branch após merge

### 5. Deploy Automático

Após merge em `main`:
- ✅ **Backend**: Deploy workflow valida e faz deploy para AWS
- ✅ **Frontend**: Vercel detecta mudanças e faz deploy automaticamente

## Quando Commitar Direto em `main`?

### ❌ Não recomendado para:
- Features novas
- Mudanças significativas
- Código que precisa revisão

### ✅ Pode ser aceitável para:
- Correções de documentação
- Ajustes de configuração (seguindo boas práticas)
- Hotfixes críticos (mas ainda melhor usar branch)

**Regra geral**: Se você tem dúvida, use feature branch!

## Exemplo Prático

### Cenário: Implementar componente GameBoard

```bash
# 1. Criar branch
git checkout main
git pull origin main
git checkout -b feature/game-board-component

# 2. Desenvolver
# ... criar GameBoard.tsx ...
git add frontend/src/components/GameBoard.tsx
git commit -m "feat: create GameBoard component"
# ✅ Pre-commit hooks validam

# 3. Continuar desenvolvendo
# ... adicionar estilos ...
git add frontend/src/components/GameBoard.module.css
git commit -m "feat: add GameBoard styles"
# ✅ Pre-commit hooks validam novamente

# 4. Push e criar PR
git push origin feature/game-board-component
# No GitHub: Criar PR
# ✅ CI workflow valida automaticamente

# 5. Após aprovação e merge
git checkout main
git pull origin main
git branch -d feature/game-board-component  # Deletar branch local
# No GitHub: Deletar branch remota também
```

## Benefícios desta Estratégia

### ✅ Qualidade
- PRs são revisados antes do merge
- CI valida código antes de chegar em `main`
- Pre-commit hooks evitam commits com erros

### ✅ Segurança
- `main` sempre está estável
- Deploys são previsíveis
- Rollback é fácil (apenas reverter PR)

### ✅ Colaboração
- Revisão de código via PRs
- Discussão sobre mudanças antes do merge
- Histórico claro de mudanças

### ✅ CI/CD
- CI valida PRs automaticamente
- Deploy só acontece se tudo passar
- Feedback rápido sobre problemas

## Configuração Recomendada no GitHub

### Branch Protection Rules

Configure em **Settings → Branches → Add rule**:

**Branch name pattern**: `main`

**Protect matching branches**:
- ✅ Require a pull request before merging
- ✅ Require approvals: 1 (ou mais, conforme necessário)
- ✅ Require status checks to pass before merging
  - ✅ `backend-ci` (CI workflow)
  - ✅ `frontend-ci` (CI workflow)
- ✅ Require branches to be up to date before merging

Isso garante que:
- ✅ PRs são obrigatórios
- ✅ CI deve passar antes do merge
- ✅ Código está atualizado antes do merge

## Troubleshooting

### Erro: "CI failed"

1. Verificar logs do CI no GitHub
2. Corrigir erros localmente
3. Fazer novo commit e push
4. CI roda novamente automaticamente

### Erro: "Pre-commit hook failed"

1. Verificar mensagem de erro
2. Corrigir problemas (lint, type-check)
3. Tentar commit novamente

### Quer pular pre-commit hook?

```bash
git commit --no-verify -m "message"
```

**⚠️ Não recomendado**: O CI ainda vai validar e pode falhar!

## Referências

- [Trunk-Based Development](https://trunkbaseddevelopment.com/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Git Branching Strategies](https://www.atlassian.com/git/tutorials/comparing-workflows)




