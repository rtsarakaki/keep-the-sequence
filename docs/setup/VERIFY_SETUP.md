# Como Verificar se a Configuração Está Funcionando

## ✅ Checklist de Verificação

### 1. OIDC Provider Criado
- [x] OIDC Provider criado no console AWS
- [ ] Provider visível em IAM → Identity providers
- [ ] URL: `token.actions.githubusercontent.com`

### 2. Role IAM Criada
- [ ] Role criada via CloudFormation
- [ ] Role visível em IAM → Roles
- [ ] Nome: `github-actions-deploy-role`
- [ ] Trust policy aponta para o OIDC Provider

### 3. Secrets no GitHub
- [ ] `AWS_ROLE_ARN` adicionado
- [ ] `AWS_REGION` adicionado

### 4. Workflow Executando
- [ ] Workflow aparece em Actions
- [ ] Autenticação OIDC funcionando
- [ ] Sem erros de credenciais

## Como Verificar

### Verificar OIDC Provider

1. Acesse: https://console.aws.amazon.com/iamv2/home#/identity_providers
2. Você deve ver o provider `token.actions.githubusercontent.com`
3. Clique nele para ver os detalhes

### Verificar Role

1. Acesse: https://console.aws.amazon.com/iamv2/home#/roles
2. Procure por `github-actions-deploy-role`
3. Clique na role → **Trust relationships**
4. Deve mostrar o OIDC Provider como Principal

### Verificar Workflow

1. Acesse: https://github.com/rtsarakaki/keep-the-sequence/actions
2. Você deve ver o workflow **Deploy Infrastructure** executando ou executado
3. Clique no workflow para ver os detalhes

### Verificar Logs de Autenticação

No workflow, procure por:
- ✅ "Assuming role with OIDC" - indica que está tentando autenticar
- ✅ "Successfully assumed role" - autenticação funcionou
- ❌ "No OpenIDConnect provider found" - OIDC Provider não criado
- ❌ "Not authorized" - problema na trust policy da Role

## Próximos Passos Após Verificar

Se tudo estiver funcionando:

1. **Aguardar deploy da infraestrutura completar**
2. **Verificar outputs do CloudFormation** (ARNs, URLs, etc.)
3. **Ativar próximo workflow** (CI, Backend ou Frontend)
4. **Continuar desenvolvimento**

## Troubleshooting

### Erro: "No OpenIDConnect provider found"
- Verifique se o OIDC Provider foi criado
- Verifique se está na mesma conta AWS
- Verifique se o URL está correto: `token.actions.githubusercontent.com`

### Erro: "Not authorized to perform sts:AssumeRoleWithWebIdentity"
- Verifique a trust policy da Role
- Verifique se o repositório está correto: `rtsarakaki/keep-the-sequence`
- Verifique se a branch é `main` (se configurou AllowedBranch)

### Workflow não executa
- Verifique se fez push para `main`
- Verifique se os workflows estão habilitados em Settings → Actions

