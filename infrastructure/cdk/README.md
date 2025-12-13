# Infrastructure CDK

Este diretório contém a infraestrutura AWS definida usando AWS CDK.

## Stacks

### GitHubActionsRoleStack

Cria a Role IAM necessária para GitHub Actions usar OIDC.

**Parâmetros:**
- `GITHUB_REPOSITORY`: Repositório GitHub no formato `owner/repo-name` (ex: `usuario/keep-the-sequence`)
- `GITHUB_ORGANIZATION` (opcional): Organização GitHub (permite todos os repositórios da org)
- `ALLOWED_BRANCHES` (opcional): Branches permitidas separadas por vírgula (ex: `main,develop`)

### TheGameStack

Cria a infraestrutura do jogo:
- DynamoDB Tables (games, connections, gameEvents)
- SQS Queue com Dead Letter Queue
- API Gateway WebSocket

## Deploy

### Deploy da Role do GitHub Actions

```bash
cd infrastructure/cdk

# Opção 1: Via variável de ambiente
GITHUB_REPOSITORY=usuario/keep-the-sequence npm run deploy -- --all

# Opção 2: Permitir apenas branch main
GITHUB_REPOSITORY=usuario/keep-the-sequence ALLOWED_BRANCHES=main npm run deploy -- --all

# Opção 3: Permitir organização inteira
GITHUB_ORGANIZATION=minha-org npm run deploy -- --all
```

### Deploy apenas da infraestrutura do jogo

```bash
cd infrastructure/cdk
npm run deploy -- TheGameStack
```

## Outputs

Após o deploy da `GitHubActionsRoleStack`, você verá o ARN da Role no output:

```
GitHubActionsRoleStack.GitHubActionsRoleArn = arn:aws:iam::123456789012:role/github-actions-deploy-role
```

Use este ARN para configurar o secret `AWS_ROLE_ARN` no GitHub.

## Configuração via cdk.json

Você também pode configurar via `cdk.json`:

```json
{
  "context": {
    "githubRepository": "usuario/keep-the-sequence",
    "allowedBranches": ["main"]
  }
}
```

