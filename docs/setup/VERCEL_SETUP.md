# Configuração do Deploy na Vercel

Este guia explica como configurar o deploy automático do frontend na Vercel via GitHub Actions.

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Repositório conectado ao GitHub

## Passo 1: Criar Projeto na Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Clique em **Add New...** → **Project**
3. Importe seu repositório `keep-the-sequence`
4. Configure o projeto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (ou deixe padrão)
   - **Output Directory**: `.next` (ou deixe padrão)
   - **Install Command**: `npm install` (ou deixe padrão)
5. Clique em **Deploy** (pode falhar, mas não importa - só precisamos do projeto criado)

## Passo 2: Obter Credenciais da Vercel

### 2.1 Obter Vercel Token

1. Acesse [Vercel Account Settings](https://vercel.com/account/tokens)
2. Clique em **Create Token**
3. Dê um nome: `github-actions-deploy`
4. Escopo: **Full Account** (ou apenas o projeto específico)
5. Clique em **Create**
6. **Copie o token** (só é mostrado uma vez!)

### 2.2 Obter Org ID e Project ID

1. Acesse as [Settings do Projeto](https://vercel.com/dashboard)
2. Selecione seu projeto `keep-the-sequence`
3. Vá em **Settings** → **General**
4. Você verá:
   - **Team ID** (ou **Org ID**) - copie este valor
   - **Project ID** - copie este valor

**Alternativa via API:**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Listar projetos
vercel projects ls

# Ver detalhes do projeto
vercel inspect
```

## Passo 3: Adicionar Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

   **Secret 1: VERCEL_TOKEN**
   - **Name**: `VERCEL_TOKEN`
   - **Secret**: [Cole o token que você copiou no Passo 2.1]

   **Secret 2: VERCEL_ORG_ID**
   - **Name**: `VERCEL_ORG_ID`
   - **Secret**: [Cole o Org ID/Team ID do Passo 2.2]

   **Secret 3: VERCEL_PROJECT_ID**
   - **Name**: `VERCEL_PROJECT_ID`
   - **Secret**: [Cole o Project ID do Passo 2.2]

   **Secret 4: NEXT_PUBLIC_WS_URL** (Opcional, para depois)
   - **Name**: `NEXT_PUBLIC_WS_URL`
   - **Secret**: [URL do WebSocket API - será configurado depois quando a infraestrutura estiver pronta]
   - Exemplo: `wss://abc123.execute-api.us-east-1.amazonaws.com/prod`

## Passo 4: Verificar Configuração

Após adicionar os secrets:

1. Faça um commit e push para `main`
2. O workflow `Deploy Frontend` será executado automaticamente
3. Acompanhe em: **Actions** → **Deploy Frontend**
4. Após o deploy, você verá a URL do site na Vercel

## Estrutura do Deploy

O workflow faz:

1. **Build and Test**:
   - Instala dependências
   - Executa lint
   - Executa type-check
   - Executa testes
   - Faz build do Next.js

2. **Deploy**:
   - Deploy automático para produção na Vercel
   - Usa a action `amondnet/vercel-action@v25`

## Variáveis de Ambiente na Vercel

Se precisar configurar variáveis de ambiente específicas:

1. Acesse **Settings** → **Environment Variables** no projeto Vercel
2. Adicione variáveis como:
   - `NEXT_PUBLIC_WS_URL`: URL do WebSocket API
   - Outras variáveis públicas (precisam começar com `NEXT_PUBLIC_`)

**Nota**: Variáveis de ambiente configuradas na Vercel têm precedência sobre as do GitHub Secrets durante o build.

## Troubleshooting

### Erro: "Vercel token is invalid"

- Verifique se o token foi copiado corretamente
- Verifique se o token não expirou
- Crie um novo token se necessário

### Erro: "Project not found"

- Verifique se o `VERCEL_PROJECT_ID` está correto
- Verifique se o projeto existe na Vercel
- Verifique se o `VERCEL_ORG_ID` está correto

### Erro: "Build failed"

- Verifique os logs do workflow
- Verifique se todas as dependências estão instaladas
- Verifique se o `package.json` está correto

### Deploy não acontece automaticamente

- Verifique se o workflow está habilitado (não está com `#` comentando o `on: push`)
- Verifique se você fez push para a branch `main`
- Verifique se mudou arquivos em `frontend/` (o workflow só roda se houver mudanças no frontend)

## Próximos Passos

Após configurar o deploy:

1. ✅ Frontend será deployado automaticamente a cada push em `main`
2. ⏳ Configure `NEXT_PUBLIC_WS_URL` quando a infraestrutura AWS estiver pronta
3. ⏳ Teste a integração completa

## Referências

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel GitHub Action](https://github.com/amondnet/vercel-action)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

