# Pre-commit Hooks

Este projeto usa **Husky** e **lint-staged** para validar código antes de fazer commit.

## O que é validado

Antes de cada commit, os seguintes checks são executados automaticamente:

### Backend (`backend/**/*.ts`)
- ✅ **Lint**: ESLint valida regras de código
- ✅ **Type Check**: TypeScript valida tipos

### Frontend (`frontend/**/*.{ts,tsx}`)
- ✅ **Lint**: Next.js ESLint valida regras de código
- ✅ **Type Check**: TypeScript valida tipos

## Como funciona

1. Você faz `git add` nos arquivos
2. Você executa `git commit`
3. O hook `pre-commit` é executado automaticamente
4. `lint-staged` roda lint e type-check apenas nos arquivos staged
5. Se tudo passar, o commit é feito
6. Se houver erros, o commit é bloqueado

## Instalação

Os hooks são instalados automaticamente quando você roda `npm install` na raiz do projeto (graças ao script `prepare` no `package.json`).

Se precisar reinstalar manualmente:

```bash
npm install
# ou
npx husky install
```

## Como usar

### Commit normal

```bash
git add backend/src/something.ts
git commit -m "feat: add something"
# ✅ Se passar nos checks, commit é feito
# ❌ Se falhar, commit é bloqueado e você vê os erros
```

### Pular o hook (não recomendado)

Se você realmente precisar pular a validação (não recomendado):

```bash
git commit --no-verify -m "feat: something"
```

**⚠️ Atenção**: Use apenas em casos excepcionais. O CI também vai validar e pode falhar.

## O que acontece quando falha

Se o lint ou type-check falhar, você verá algo como:

```
✖ lint-staged failed
✖ ESLint found errors
✖ TypeScript found type errors

Commit aborted. Fix the errors and try again.
```

## Benefícios

- ✅ **Catch errors early**: Erros são pegos antes do commit
- ✅ **Faster feedback**: Não precisa esperar o CI
- ✅ **Clean history**: Commits sempre passam nos checks básicos
- ✅ **Team consistency**: Todos seguem as mesmas regras

## Configuração

A configuração está em:
- **Husky**: `.husky/pre-commit`
- **lint-staged**: `package.json` → `lint-staged`

## Troubleshooting

### Hook não está executando

```bash
# Reinstalar hooks
npm install
# ou
npx husky install
```

### Erro: "command not found"

Certifique-se de que `node_modules/.bin` está no PATH ou use `npx`:

```bash
# Verificar se husky está instalado
ls node_modules/.bin/husky
```

### Quer adicionar mais validações?

Edite `.husky/pre-commit` e adicione comandos antes ou depois de `npx lint-staged`.

Exemplo:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Rodar testes também
npm run test:backend
npm run test:frontend

# Depois lint-staged
npx lint-staged
```

## Referências

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)




