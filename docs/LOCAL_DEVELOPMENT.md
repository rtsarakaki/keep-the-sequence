# Desenvolvimento Local

Este guia explica como rodar o jogo localmente conectando aos serviços de produção da AWS.

## Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- Credenciais AWS configuradas (Access Key ID e Secret Access Key)
- Acesso aos recursos AWS de produção (DynamoDB, SQS, API Gateway)

## Configuração

### 1. Backend

1. Copie o arquivo de exemplo:
   ```bash
   cd backend
   cp .env.local.example .env.local
   ```

2. Preencha as variáveis de ambiente no arquivo `.env.local`:
   - `AWS_REGION`: Região AWS (ex: `us-east-1`)
   - `AWS_ACCESS_KEY_ID`: Sua Access Key ID da AWS
   - `AWS_SECRET_ACCESS_KEY`: Sua Secret Access Key da AWS
   - `GAMES_TABLE`: Nome da tabela DynamoDB de jogos (ex: `the-game-backend-games-prod`)
   - `CONNECTIONS_TABLE`: Nome da tabela DynamoDB de conexões (ex: `the-game-backend-connections-prod`)
   - `GAME_EVENTS_TABLE`: Nome da tabela DynamoDB de eventos (ex: `the-game-backend-game-events-prod`)
   - `GAME_EVENTS_QUEUE`: Nome da fila SQS (ex: `the-game-backend-game-events-prod`)
   - `WEBSOCKET_API_URL`: URL do API Gateway WebSocket (ex: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)
   - `ALLOWED_ORIGINS`: Origens permitidas para CORS (ex: `http://localhost:3000,http://localhost:3001`)

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Compile o código TypeScript:
   ```bash
   npm run build
   ```

### 2. Frontend

1. Copie o arquivo de exemplo:
   ```bash
   cd frontend
   cp .env.local.example .env.local
   ```

2. Preencha as variáveis de ambiente no arquivo `.env.local`:
   - `NEXT_PUBLIC_API_URL`: URL do API Gateway HTTP (ex: `https://ga8w9ineg6.execute-api.us-east-1.amazonaws.com/prod`)

3. Instale as dependências:
   ```bash
   npm install
   ```

## Como Obter os Valores das Variáveis de Ambiente

### DynamoDB Tables

1. Acesse o AWS Console → DynamoDB
2. Veja a lista de tabelas e copie os nomes:
   - `the-game-backend-games-prod`
   - `the-game-backend-connections-prod`
   - `the-game-backend-game-events-prod`

### SQS Queue

1. Acesse o AWS Console → SQS
2. Veja a lista de filas e copie o nome:
   - `the-game-backend-game-events-prod`

### API Gateway URLs

#### HTTP API (para NEXT_PUBLIC_API_URL)

1. Acesse o AWS Console → API Gateway
2. Selecione a API HTTP (não WebSocket)
3. Veja o "Invoke URL" no painel
4. Copie a URL completa (ex: `https://ga8w9ineg6.execute-api.us-east-1.amazonaws.com/prod`)

Ou execute:
```bash
cd backend
npx serverless info --stage prod
```

Procure por `Service Information` → `endpoints` → `GET - https://...`

#### WebSocket API (para WEBSOCKET_API_URL)

1. Acesse o AWS Console → API Gateway
2. Selecione a API WebSocket
3. Veja o "WebSocket URL" no painel
4. Copie a URL completa (ex: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)

Ou execute:
```bash
cd backend
npx serverless info --stage prod
```

Procure por `Service Information` → `endpoints` → `wss://...`

## Executando Localmente

### Backend (API HTTP)

O backend não precisa rodar localmente - você pode usar diretamente a API HTTP de produção. Mas se quiser testar handlers localmente, você pode usar o Serverless Framework Offline:

```bash
cd backend
npx serverless offline --stage prod
```

Isso iniciará um servidor local em `http://localhost:3000` simulando a API Gateway.

### Frontend

1. Inicie o servidor de desenvolvimento:
   ```bash
   cd frontend
   npm run dev
   ```

2. Acesse `http://localhost:3000` no navegador

3. O frontend estará conectado aos serviços de produção da AWS

## Scripts Úteis

### Backend

- `npm run build`: Compila o código TypeScript
- `npm run test`: Executa os testes
- `npm run lint`: Verifica problemas de lint
- `npm run type-check`: Verifica tipos TypeScript
- `npm run clear-tables`: Limpa as tabelas do DynamoDB (cuidado!)
- `npm run check-game`: Verifica um jogo específico no DynamoDB

### Frontend

- `npm run dev`: Inicia servidor de desenvolvimento
- `npm run build`: Compila para produção
- `npm run start`: Inicia servidor de produção (após build)
- `npm run lint`: Verifica problemas de lint
- `npm run type-check`: Verifica tipos TypeScript

## Troubleshooting

### Erro: "API URL não configurada"

- Verifique se o arquivo `.env.local` existe no diretório `frontend`
- Verifique se `NEXT_PUBLIC_API_URL` está preenchido corretamente
- Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro: "Access Denied" ao acessar DynamoDB

- Verifique se suas credenciais AWS estão corretas
- Verifique se o usuário/role AWS tem permissões para acessar DynamoDB, SQS e API Gateway
- Verifique se a região AWS está correta

### Erro: "Connection refused" ao conectar WebSocket

- Verifique se `WEBSOCKET_API_URL` está correto no backend
- Verifique se o API Gateway WebSocket está deployado
- Verifique se o CORS está configurado corretamente

### Erro: "Table not found"

- Verifique se os nomes das tabelas estão corretos no `.env.local`
- Verifique se as tabelas existem na região AWS correta
- Verifique se você tem permissões para acessar as tabelas

## Notas Importantes

⚠️ **ATENÇÃO**: Você estará conectado aos serviços de **produção** da AWS. Qualquer alteração feita localmente afetará os dados de produção.

- Não execute `npm run clear-tables` a menos que tenha certeza
- Teste cuidadosamente antes de fazer alterações
- Considere criar um ambiente de staging separado para testes

## Próximos Passos

- [ ] Criar ambiente de staging separado
- [ ] Adicionar suporte para Serverless Framework Offline
- [ ] Adicionar scripts de seed para dados de teste
- [ ] Adicionar suporte para hot-reload no backend

