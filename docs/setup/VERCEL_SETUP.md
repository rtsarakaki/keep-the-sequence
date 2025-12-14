# Configuração do Deploy na Vercel

Este guia explica como configurar o deploy automático do frontend na Vercel usando a integração nativa com GitHub.

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

## Passo 2: Configurar Variáveis de Ambiente (Opcional)

Se precisar de variáveis de ambiente específicas:

1. Acesse **Settings** → **Environment Variables** no projeto Vercel
2. Adicione variáveis como:
   - `NEXT_PUBLIC_WS_URL`: URL do WebSocket API (quando a infraestrutura estiver pronta)
   - Outras variáveis públicas (precisam começar com `NEXT_PUBLIC_`)

**Nota**: A Vercel automaticamente detecta mudanças no GitHub e faz deploy. Não é necessário configurar secrets no GitHub para o deploy básico.

## Passo 3: Verificar Configuração

Após conectar o repositório:

1. A Vercel automaticamente detecta mudanças no GitHub
2. A cada push em `main`, a Vercel faz deploy automaticamente
3. Você pode acompanhar os deploys no dashboard da Vercel
4. Preview deployments são criados automaticamente para PRs

## Como Funciona

**Deploy Automático:**
- ✅ A Vercel monitora o repositório GitHub
- ✅ A cada push em `main`, faz deploy para produção
- ✅ A cada PR, cria preview deployment
- ✅ Não precisa de configuração adicional

**CI no GitHub Actions:**
- O workflow `Frontend CI` roda testes, lint e type-check
- Garante qualidade do código antes do merge
- A Vercel faz o deploy depois que o código está no `main`

## Troubleshooting

### Deploy não acontece automaticamente

- Verifique se o repositório está conectado na Vercel
- Verifique se você fez push para a branch `main`
- Verifique os logs no dashboard da Vercel

### Erro: "Build failed"

- Verifique os logs no dashboard da Vercel
- Verifique se todas as dependências estão instaladas
- Verifique se o `package.json` está correto
- Verifique se o `Root Directory` está configurado como `frontend`

### Preview deployments não aparecem

- Verifique se os PRs estão abertos no GitHub
- Verifique se o repositório está conectado corretamente
- Preview deployments são criados automaticamente para PRs

## Próximos Passos

Após configurar o deploy:

1. ✅ Frontend será deployado automaticamente a cada push em `main`
2. ✅ Preview deployments serão criados automaticamente para PRs
3. ⏳ Configure `NEXT_PUBLIC_WS_URL` nas variáveis de ambiente da Vercel quando a infraestrutura AWS estiver pronta
4. ⏳ Teste a integração completa

## Vantagens da Integração Nativa

- ✅ **Simplicidade**: Não precisa configurar tokens ou secrets
- ✅ **Automático**: Deploy automático a cada push
- ✅ **Preview Deployments**: PRs têm previews automáticos
- ✅ **Rollback fácil**: Interface visual para fazer rollback
- ✅ **Analytics**: Métricas de performance integradas
- ✅ **Zero configuração**: Funciona out-of-the-box

## Referências

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

