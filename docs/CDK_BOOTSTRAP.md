# CDK Bootstrap - Primeira Execução

## O que é CDK Bootstrap?

O CDK precisa de um "bootstrap stack" na sua conta AWS antes de fazer o primeiro deploy. Este stack cria recursos necessários como:
- S3 bucket para assets do CDK
- IAM roles para deployment
- SSM parameters para versionamento

## Primeira Execução

Se este for o primeiro deploy do CDK na sua conta, você precisa executar o bootstrap **manualmente uma vez**.

### Opção 1: Executar Bootstrap Manualmente (Recomendado)

1. **Configure credenciais AWS localmente** (se ainda não tiver):
   ```bash
   aws configure
   ```

2. **Execute o bootstrap**:
   ```bash
   cd infrastructure/cdk
   npm install
   npx cdk bootstrap aws://ACCOUNT_ID/REGION
   ```
   
   Substitua:
   - `ACCOUNT_ID`: Seu Account ID da AWS (ex: `736638055338`)
   - `REGION`: Sua região (ex: `us-east-1`)

   Exemplo:
   ```bash
   npx cdk bootstrap aws://736638055338/us-east-1
   ```

3. **Aguarde o bootstrap completar** (pode levar alguns minutos)

4. **Após o bootstrap**, o workflow do GitHub Actions deve funcionar normalmente

### Opção 2: Adicionar Bootstrap ao Workflow (Alternativa)

Se preferir fazer o bootstrap via GitHub Actions, podemos adicionar um passo condicional no workflow que verifica se o bootstrap existe e executa se necessário.

**Nota**: Isso requer permissões adicionais na Role (S3, IAM para criar roles de bootstrap).

## Verificar se Bootstrap Existe

Você pode verificar se o bootstrap já existe:

```bash
aws ssm get-parameter --name /cdk-bootstrap/hnb659fds/version --region REGION
```

Se retornar um erro `ParameterNotFound`, o bootstrap não existe ainda.

## Troubleshooting

### Erro: "Bootstrap stack version mismatch"

Se você já tem um bootstrap antigo, pode precisar atualizá-lo:

```bash
npx cdk bootstrap --force
```

### Erro: "AccessDenied" no bootstrap

Certifique-se de que suas credenciais locais têm permissões de:
- CloudFormation
- S3 (criar bucket)
- IAM (criar roles)
- SSM (criar parâmetros)

## Após o Bootstrap

Uma vez feito o bootstrap, você não precisa fazer novamente. O workflow do GitHub Actions vai usar os recursos criados pelo bootstrap para fazer os deploys.

