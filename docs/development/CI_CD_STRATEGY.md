# Estratégia CI/CD

Este documento explica a estratégia de CI/CD do projeto e como os diferentes workflows se complementam.

## Workflows Existentes

### 1. **CI Workflow** (`ci.yml`)
**Status**: Temporariamente desabilitado  
**Propósito**: Validar código em PRs e pushes sem fazer deploy

**Quando executa**:
- Pull Requests para `main`
- Pushes em `main` e `feature/**`

**O que valida**:
- ✅ Lint (backend + frontend)
- ✅ Type-check (backend + frontend)
- ✅ Testes (backend + frontend)
- ✅ Coverage (opcional, não bloqueia)

**Por que é importante**:
- Valida PRs **antes** do merge
- Valida código sem precisar fazer deploy
- Mais rápido que workflows de deploy
- Pode bloquear PRs com problemas

### 2. **Deploy Backend** (`deploy-backend.yml`)
**Status**: ✅ Ativo  
**Propósito**: Validar e fazer deploy do backend

**Quando executa**:
- Push em `main`

**O que faz**:
- ✅ Lint + Type-check + Testes + Coverage
- ✅ Build
- ✅ Deploy para AWS Lambda

### 3. **Deploy Frontend** (Vercel)
**Status**: ✅ Ativo (via integração GitHub)  
**Propósito**: Deploy automático do frontend

**Quando executa**:
- Push em `main` (detectado automaticamente pela Vercel)
- Pull Requests (cria preview deployments)

**O que faz**:
- ✅ Build automático
- ✅ Deploy para produção (main) ou preview (PRs)
- ✅ Configurado via integração GitHub (sem workflow necessário)

## Pre-commit Hooks vs CI

### Pre-commit Hooks (Husky)
- ✅ **Local**: Valida antes do commit
- ✅ **Rápido**: Feedback imediato
- ⚠️ **Pode ser pulado**: `git commit --no-verify`
- ⚠️ **Não garante**: Alguém pode não ter configurado

### CI Workflow
- ✅ **Servidor**: Valida no GitHub
- ✅ **Garantido**: Sempre executa
- ✅ **Bloqueia PRs**: Não permite merge com erros
- ✅ **Ambiente limpo**: Valida em ambiente isolado

## Recomendação

### Opção A: Reativar CI (Recomendado) ✅

**Vantagens**:
- Valida PRs antes do merge
- Não precisa fazer deploy para validar
- Bloqueia código com problemas antes de chegar em `main`
- Complementa os pre-commit hooks

**Configuração sugerida**:
```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main, 'feature/**']
```

### Opção B: Remover CI (Não recomendado) ❌

**Desvantagens**:
- PRs podem ser mergeados com erros
- Só valida quando faz deploy
- Mais lento (precisa fazer deploy para validar)
- Não valida feature branches

## Estratégia Recomendada

### Camadas de Validação

```
1. Pre-commit Hooks (Local)
   ↓ (pode ser pulado)
2. CI Workflow (GitHub - PRs)
   ↓ (bloqueia PRs com erros)
3. Deploy Workflows (GitHub - main)
   ↓ (valida antes de deployar)
4. Deploy
```

### Fluxo Ideal

1. **Desenvolvedor faz commit**
   - Pre-commit hooks validam localmente
   - Se passar, commit é feito

2. **Cria Pull Request**
   - CI workflow valida automaticamente
   - Se falhar, PR não pode ser mergeado
   - Se passar, PR pode ser mergeado

3. **Merge para main**
   - Deploy workflows validam novamente
   - Se passar, deploy é feito
   - Se falhar, deploy não acontece

## Decisão

**Recomendação**: **Reativar o CI workflow** para validar PRs e pushes.

**Motivos**:
- ✅ Complementa pre-commit hooks
- ✅ Garante qualidade antes do merge
- ✅ Não duplica trabalho (deploy workflows ainda são necessários)
- ✅ Segue boas práticas de CI/CD

**O que fazer**:
1. Reativar triggers no `ci.yml`
2. Manter workflows de deploy como estão
3. CI valida PRs, deploy workflows validam antes de deployar

## Comparação: CI vs Deploy Workflows

| Aspecto | CI Workflow | Deploy Workflows |
|---------|-------------|------------------|
| **Quando executa** | PRs e pushes | Push em main |
| **Propósito** | Validar código | Validar + Deployar |
| **Bloqueia PRs** | ✅ Sim | ❌ Não (só executa em main) |
| **Valida feature branches** | ✅ Sim | ❌ Não |
| **Velocidade** | ⚡ Rápido | 🐢 Mais lento (faz deploy) |
| **Necessário?** | ✅ Sim (para PRs) | ✅ Sim (para deploy) |

## Conclusão

**SIM, o CI workflow ainda é necessário!**

Ele serve para:
- ✅ Validar PRs antes do merge
- ✅ Validar código sem fazer deploy
- ✅ Garantir qualidade mesmo se pre-commit hooks forem pulados
- ✅ Validar em ambiente limpo do GitHub

**Ação recomendada**: Reativar o CI workflow para PRs e pushes.

