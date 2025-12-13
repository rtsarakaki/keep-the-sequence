# Guia de Setup - The Game

Este guia orienta você na configuração das credenciais AWS necessárias para o deploy via GitHub Actions usando **OIDC com Roles** (abordagem recomendada e mais segura).

## ⚠️ IMPORTANTE: Segurança

**NUNCA compartilhe suas credenciais AWS com ninguém, incluindo assistentes de IA.**
**NUNCA faça commit de credenciais no repositório.**
**Usar Roles com OIDC é mais seguro que access keys de usuários.**

## Por que usar Roles com OIDC?

- ✅ **Mais seguro**: Não precisa armazenar credenciais long-lived
- ✅ **Credenciais temporárias**: Geradas automaticamente a cada execução
- ✅ **Melhor auditoria**: Rastreamento mais claro de quem fez o quê
- ✅ **Recomendado pela AWS**: Prática recomendada para integrações CI/CD
- ✅ **Infraestrutura como Código**: Role criada via CloudFormation, versionada no repositório

## Passo 1: Criar OIDC Provider (Console AWS)

Primeiro, você precisa criar o OIDC Provider para GitHub. Isso é feito uma única vez.

### 1.1 Criar Identity Provider

1. Acesse o [AWS Console](https://console.aws.amazon.com/)
2. Navegue até **IAM** → **Identity providers** → **Add provider**
3. Configure o provider:
   - **Provider type**: Selecione **OpenID Connect**
   - **Provider URL**: `https://token.actions.githubusercontent.com`
   - **Audience**: `sts.amazonaws.com`
4. Clique em **Add provider**

**Importante**: Anote o ARN do provider criado (será usado automaticamente pelo template).

## Passo 2: Criar Role IAM via CloudFormation (Console AWS)

Agora você criará a Role usando o template CloudFormation fornecido.

### 2.1 Preparar o Template

1. Abra o arquivo `infrastructure/cloudformation/github-actions-role.yaml` no seu editor
2. Copie todo o conteúdo do arquivo (você precisará colar no console)

### 2.2 Criar Stack no CloudFormation

1. Acesse o [AWS Console](https://console.aws.amazon.com/)
2. Navegue até **CloudFormation** → **Stacks** → **Create stack** → **With new resources (standard)**
3. Na seção **Specify template**:
   - Selecione **Upload a template file**
   - Clique em **Choose file** e selecione o arquivo `infrastructure/cloudformation/github-actions-role.yaml`
   - OU selecione **Template is ready** e cole o conteúdo do arquivo YAML na área de texto
4. Clique em **Next**

### 2.3 Configurar Parâmetros

Na seção **Specify stack details**:

1. **Stack name**: `github-actions-role` (ou outro nome de sua escolha)

2. **Parameters**:
   
   **GitHubRepository** (obrigatório):
   - Informe seu repositório no formato: `usuario/repositorio`
   - Exemplo: `rtsarakaki/keep-the-sequence`
   
   **AllowedBranch** (opcional):
   - Deixe vazio para permitir todas as branches
   - OU informe uma branch específica: `main`
   - Exemplo: `main` (apenas branch main)

3. Clique em **Next**

### 2.4 Configurar Opções (Opcional)

Na seção **Configure stack options**:

1. Você pode adicionar tags se desejar:
   - **Key**: `Project`
   - **Value**: `TheGame`
   
   - **Key**: `ManagedBy`
   - **Value**: `CloudFormation`

2. Clique em **Next**

### 2.5 Revisar e Criar

1. Na seção **Review**, revise todas as configurações
2. Marque a caixa **I acknowledge that AWS CloudFormation might create IAM resources**
3. Clique em **Submit**

### 2.6 Aguardar Criação

1. O stack será criado (pode levar alguns minutos)
2. Aguarde até que o status seja **CREATE_COMPLETE**
3. Clique no stack para ver os detalhes

### 2.7 Copiar o ARN da Role

1. Na aba **Outputs** do stack, você verá:
   - **RoleArn**: ARN da Role criada
   - **GitHubRepository**: Repositório configurado
2. **Copie o valor de `RoleArn`** (formato: `arn:aws:iam::ACCOUNT_ID:role/github-actions-deploy-role`)
3. Você precisará deste ARN para configurar o GitHub

## Passo 3: Adicionar Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

   **Secret 1:**
   - **Name**: `AWS_ROLE_ARN`
   - **Secret**: [Cole o ARN da role que você copiou no Passo 2.7]
   
   Exemplo: `arn:aws:iam::123456789012:role/github-actions-deploy-role`

   **Secret 2:**
   - **Name**: `AWS_REGION`
   - **Secret**: `us-east-1` (ou sua região preferida: `us-west-2`, `eu-west-1`, etc.)

5. Clique em **Add secret** para cada um

## Passo 4: Verificar Configuração

Os workflows já estão configurados para usar OIDC. Eles usarão automaticamente:
- `AWS_ROLE_ARN` do GitHub Secrets
- `AWS_REGION` do GitHub Secrets

**Não é necessário** adicionar `AWS_ACCESS_KEY_ID` ou `AWS_SECRET_ACCESS_KEY` - o OIDC gerencia isso automaticamente.

## Verificação da Configuração

Após configurar:
1. Faça um commit e push para `main`
2. O workflow de CI será executado automaticamente
3. Você receberá uma notificação para aprovar o deploy
4. Após aprovação, o deploy será executado usando a Role

## Troubleshooting

### Erro: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

- Verifique se o OIDC Provider foi criado corretamente pelo CloudFormation
- Verifique se o repositório no parâmetro `GitHubRepository` está correto
- Verifique se a branch que está fazendo push está nas `AllowedBranches` (se configurado)
- Verifique se o ARN da Role está correto no GitHub Secret

### Erro: "Access Denied" ao criar o stack

- Verifique se você tem permissões para criar recursos IAM
- Verifique se marcou a caixa de confirmação sobre criação de recursos IAM

### Erro: "Region not found"

- Verifique se o `AWS_REGION` está correto no GitHub Secret
- Use o formato correto: `us-east-1`, `us-west-2`, etc.

### Erro: "Template validation error"

- Verifique se copiou o template completo
- Verifique se o formato YAML está correto (indentação, etc.)
- Use o arquivo `infrastructure/cloudformation/github-actions-role.yaml` diretamente

### Workflow não executa

- Verifique se os secrets foram adicionados corretamente
- Verifique se o workflow está configurado para usar OIDC (já está configurado)

### Atualizar Repositório Permitido

Se você precisar mudar qual repositório tem acesso:

1. Vá até o stack no CloudFormation
2. Clique em **Update**
3. Selecione **Use current template** ou faça upload do template atualizado
4. Atualize o parâmetro `GitHubRepository`
5. Revise e confirme a atualização

## Alternativa: Usar Script Bash (Opcional)

Se preferir usar o script bash ao invés do console:

```bash
cd infrastructure/cloudformation
./create-github-role.sh usuario/keep-the-sequence
```

Consulte `infrastructure/cloudformation/README.md` para mais detalhes.

## Próximos Passos

Após configurar a Role e os secrets:
1. Faça um commit e push para `main`
2. O workflow de CI será executado automaticamente
3. Você receberá uma notificação para aprovar o deploy
4. Após aprovação, o deploy será executado usando a Role

## Suporte

Se encontrar problemas, verifique:
- [Documentação AWS CloudFormation](https://docs.aws.amazon.com/cloudformation/)
- [Documentação AWS IAM OIDC](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [Documentação AWS IAM Roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)
