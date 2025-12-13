# CloudFormation - GitHub Actions Role (Opcional)

Este diretório contém o template CloudFormation e script para criar a Role IAM necessária para GitHub Actions usar OIDC.

**Nota:** A criação da Role pode ser feita manualmente no console AWS (recomendado). Este template é uma alternativa caso prefira usar CloudFormation.

## Arquivos

- `github-actions-role.yaml`: Template CloudFormation que cria:
  - OIDC Provider para GitHub
  - IAM Role com permissões necessárias
  - Condições de trust policy baseadas no repositório

- `create-github-role.sh`: Script bash que facilita o deploy do template

## Uso

### Opção 1: Usar o Script (Recomendado)

```bash
cd infrastructure/cloudformation
./create-github-role.sh usuario/keep-the-sequence
```

**Com branches específicas:**
```bash
./create-github-role.sh usuario/keep-the-sequence main,develop
```

### Opção 2: Usar AWS CLI Diretamente

```bash
aws cloudformation create-stack \
  --stack-name github-actions-role \
  --template-body file://github-actions-role.yaml \
  --parameters ParameterKey=GitHubRepository,ParameterValue=usuario/keep-the-sequence \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

**Com branches específicas:**
```bash
aws cloudformation create-stack \
  --stack-name github-actions-role \
  --template-body file://github-actions-role.yaml \
  --parameters \
    ParameterKey=GitHubRepository,ParameterValue=usuario/keep-the-sequence \
    ParameterKey=AllowedBranches,ParameterValue=main,develop \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Parâmetros

- `GitHubRepository` (obrigatório): Repositório GitHub no formato `owner/repo-name`
- `AllowedBranches` (opcional): Lista de branches permitidas separadas por vírgula. Se vazio, permite todas as branches.

## Outputs

Após o deploy, o stack retorna:

- `RoleArn`: ARN da Role criada (use este valor no GitHub Secret `AWS_ROLE_ARN`)
- `GitHubRepository`: Repositório configurado

## Atualizar

Para atualizar o repositório ou branches permitidas:

```bash
./create-github-role.sh novo-usuario/novo-repositorio
```

O script detectará que o stack já existe e perguntará se deseja atualizar.

## Deletar

Para deletar o stack:

```bash
aws cloudformation delete-stack --stack-name github-actions-role
```

