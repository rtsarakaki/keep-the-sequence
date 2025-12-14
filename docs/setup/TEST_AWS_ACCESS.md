# Testar Acesso aos Serviços AWS

Este guia explica como testar se você consegue acessar os serviços AWS localmente.

## Pré-requisitos

1. **AWS CLI instalado**:
   ```bash
   aws --version
   ```

2. **Credenciais AWS configuradas**:
   ```bash
   aws configure
   ```
   
   Ou configure variáveis de ambiente:
   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_REGION=us-east-1
   ```

## Executar Testes

### Opção 1: Usando npm script (Recomendado)

```bash
cd backend
npm install
npm run test:aws
```

### Opção 2: Executar diretamente

```bash
cd backend
npm install
npx ts-node scripts/test-aws-access.ts
```

## O que o Script Testa

1. **Acesso ao DynamoDB**
   - Lista todas as tabelas
   - Verifica se as tabelas esperadas existem:
     - `the-game-games`
     - `the-game-connections`
     - `the-game-game-events`

2. **Acesso ao SQS**
   - Lista todas as filas
   - Verifica se as filas esperadas existem:
     - `the-game-game-events`
     - `the-game-game-events-dlq`

3. **Teste de GameRepository** (se tabela existir)
   - Cria um jogo de teste
   - Salva no DynamoDB
   - Busca do DynamoDB
   - Remove o jogo de teste

4. **Teste de ConnectionRepository** (se tabela existir)
   - Cria uma conexão de teste
   - Salva no DynamoDB
   - Busca do DynamoDB
   - Remove a conexão de teste

## Resultado Esperado

Se tudo estiver funcionando, você verá:

```
🚀 Testando Acesso aos Serviços AWS

📍 Região: us-east-1
🔑 Credenciais: ✅ Configuradas

🔍 Testando acesso ao DynamoDB...
✅ Conectado ao DynamoDB com sucesso!
📊 Tabelas encontradas: 3

Tabelas:
  🎮 the-game-games
  📋 the-game-connections
  📋 the-game-game-events

🔎 Verificando tabelas esperadas:
  ✅ the-game-games (encontrada)
  ✅ the-game-connections (encontrada)
  ✅ the-game-game-events (encontrada)

[... testes de SQS e repositories ...]

📊 RESUMO DOS TESTES
==================================================
DynamoDB:              ✅
SQS:                   ✅
Game Repository:       ✅
Connection Repository: ✅
==================================================

✅ Acesso aos serviços AWS funcionando!
```

## Troubleshooting

### Erro: "Unable to locate credentials"

**Solução**: Configure suas credenciais AWS:
```bash
aws configure
```

Ou use variáveis de ambiente:
```bash
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-1
```

### Erro: "Access Denied"

**Solução**: Verifique se suas credenciais têm permissões para:
- `dynamodb:ListTables`
- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:DeleteItem`
- `sqs:ListQueues`

### Erro: "Table not found"

**Solução**: As tabelas precisam ser criadas primeiro. Execute o deploy da infraestrutura:
```bash
# Via GitHub Actions (recomendado)
# Ou localmente:
cd infrastructure/cdk
npm install
npm run deploy
```

### Erro: "Region not found"

**Solução**: Verifique se a região está correta:
```bash
export AWS_REGION=us-east-1  # ou sua região
```

## Verificar Recursos Deployados

Você também pode verificar manualmente no AWS Console:

1. **DynamoDB**: https://console.aws.amazon.com/dynamodb/
2. **SQS**: https://console.aws.amazon.com/sqs/
3. **API Gateway**: https://console.aws.amazon.com/apigateway/

Ou via AWS CLI:

```bash
# Listar tabelas DynamoDB
aws dynamodb list-tables --region us-east-1

# Listar filas SQS
aws sqs list-queues --region us-east-1

# Verificar recursos CDK
cd infrastructure/cdk
npm run synth
```

## Próximos Passos

Após confirmar que o acesso está funcionando:

1. ✅ Você pode testar os repositories localmente
2. ✅ Você pode desenvolver e testar handlers localmente
3. ✅ Você pode fazer deploy via GitHub Actions com confiança

