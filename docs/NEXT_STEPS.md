# Próximos Passos Após Criar a Role

## ✅ Passo 1: Copiar o ARN da Role

1. No console AWS CloudFormation, vá até o stack que você criou (`github-actions-role`)
2. Clique na aba **Outputs**
3. Você verá o **RoleArn** - copie este valor
   - Formato: `arn:aws:iam::123456789012:role/github-actions-deploy-role`

## ✅ Passo 2: Adicionar Secrets no GitHub

1. Acesse: https://github.com/rtsarakaki/keep-the-sequence/settings/secrets/actions
2. Clique em **New repository secret**

### Secret 1: AWS_ROLE_ARN
- **Name**: `AWS_ROLE_ARN`
- **Secret**: Cole o ARN que você copiou (ex: `arn:aws:iam::123456789012:role/github-actions-deploy-role`)
- Clique em **Add secret**

### Secret 2: AWS_REGION
- **Name**: `AWS_REGION`
- **Secret**: `us-east-1` (ou a região onde você criou a Role)
- Clique em **Add secret**

## ✅ Passo 3: Verificar se Está Funcionando

### Opção 1: Fazer um Commit de Teste

1. Faça uma pequena alteração (ex: adicionar um comentário em um arquivo)
2. Commit e push:
   ```bash
   git add .
   git commit -m "test: verify GitHub Actions workflow"
   git push origin main
   ```

3. Vá para: https://github.com/rtsarakaki/keep-the-sequence/actions
4. Você verá os workflows sendo executados:
   - ✅ **CI** deve executar automaticamente
   - ⏳ **Deploy Backend** e **Deploy Frontend** aguardarão sua aprovação

### Opção 2: Verificar Secrets Configurados

1. Vá para: https://github.com/rtsarakaki/keep-the-sequence/settings/secrets/actions
2. Você deve ver:
   - ✅ `AWS_ROLE_ARN` (com valor oculto)
   - ✅ `AWS_REGION` (com valor oculto)

### Opção 3: Executar Workflow Manualmente

1. Vá para: https://github.com/rtsarakaki/keep-the-sequence/actions
2. Selecione um workflow (ex: **CI**)
3. Clique em **Run workflow** → **Run workflow**
4. O workflow será executado e você verá se há erros

## ✅ Passo 4: Verificar Logs dos Workflows

### Se o Workflow Falhar

1. Clique no workflow que falhou
2. Clique no job que falhou (ex: **Backend CI**)
3. Expanda os steps para ver onde falhou
4. Verifique os logs para identificar o problema

### Erros Comuns

**Erro: "Not authorized to perform sts:AssumeRoleWithWebIdentity"**
- Verifique se o OIDC Provider foi criado corretamente
- Verifique se o repositório no parâmetro está correto: `rtsarakaki/keep-the-sequence`
- Verifique se a branch é `main` (se você configurou AllowedBranch)

**Erro: "Role ARN not found"**
- Verifique se o secret `AWS_ROLE_ARN` está correto
- Verifique se a Role existe na conta AWS correta

**Erro: "Region mismatch"**
- Verifique se o `AWS_REGION` está correto
- Verifique se a Role foi criada na mesma região

## ✅ Passo 5: Testar Deploy (Após CI Passar)

1. Após o CI passar, você receberá uma notificação (ou veja em Actions)
2. Vá para o workflow de deploy (ex: **Deploy Backend**)
3. Clique em **Review deployments**
4. Revise as mudanças
5. Clique em **Approve and deploy**
6. O deploy será executado

## Checklist de Verificação

- [ ] ARN da Role copiado
- [ ] Secret `AWS_ROLE_ARN` adicionado no GitHub
- [ ] Secret `AWS_REGION` adicionado no GitHub
- [ ] Workflow CI executado com sucesso
- [ ] Sem erros de autenticação nos logs
- [ ] Pronto para aprovar deploys

## Próximos Desenvolvimentos

Após verificar que tudo está funcionando:

1. **Instalar dependências localmente:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Executar testes localmente:**
   ```bash
   cd backend && npm test
   cd ../frontend && npm test
   ```

3. **Começar desenvolvimento seguindo TDD:**
   - Escrever testes primeiro
   - Implementar código
   - Fazer commit e push
   - Workflows executarão automaticamente

