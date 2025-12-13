# Atualizar ou Recriar a Role?

## Opção 1: Recriar via CloudFormation (Recomendado)

Se você criou a Role antes do OIDC Provider, é melhor **deletar e recriar** via CloudFormation para garantir que está tudo correto.

### Passos:

1. **Deletar a Role existente:**
   - Console AWS → CloudFormation → Stacks
   - Selecione o stack `github-actions-role`
   - Clique em **Delete**
   - Aguarde a deleção completar

2. **Recriar a Role:**
   - Siga o Passo 2 da documentação `docs/SETUP.md`
   - Agora o OIDC Provider já existe, então a Role será criada corretamente

## Opção 2: Atualizar a Role Existente (Alternativa)

Se preferir manter a Role existente, você precisa atualizar a **Trust Policy**:

1. Console AWS → IAM → Roles
2. Selecione `github-actions-deploy-role`
3. Aba **Trust relationships** → **Edit trust policy**
4. Substitua a política por:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::SUA_CONTA_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:rtsarakaki/keep-the-sequence:*"
        }
      }
    }
  ]
}
```

**Substitua:**
- `SUA_CONTA_ID` pelo ID da sua conta AWS
- `rtsarakaki/keep-the-sequence` pelo seu repositório
- `:*` por `:ref:refs/heads/main` se quiser apenas a branch main

5. Clique em **Update policy**

## Qual Escolher?

**Recomendo recriar (Opção 1)** porque:
- ✅ Garante que está tudo correto
- ✅ Usa o template CloudFormation (versionado)
- ✅ Mais fácil de manter
- ✅ Menos chance de erro

**Use atualizar (Opção 2)** se:
- Você já tem outras coisas dependendo da Role
- Quer evitar downtime
- Tem certeza que consegue atualizar corretamente

## Verificação

Após recriar ou atualizar, verifique:

1. Role tem trust policy apontando para OIDC Provider
2. Condição permite seu repositório: `repo:rtsarakaki/keep-the-sequence:*`
3. Workflow consegue assumir a Role (ver logs em Actions)

