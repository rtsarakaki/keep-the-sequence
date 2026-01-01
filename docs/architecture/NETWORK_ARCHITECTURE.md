# Arquitetura de Rede - AWS

Este documento explica a arquitetura de rede da aplicação na AWS.

## Visão Geral

A aplicação **não utiliza VPC (Virtual Private Cloud)**. Todos os recursos AWS executam na **rede pública/default** da AWS.

## Por que não usar VPC?

### ✅ Vantagens da Rede Pública (Atual)

1. **Menor Latência**
   - Lambdas sem VPC têm menor latência de cold start
   - Acesso direto a serviços AWS gerenciados (DynamoDB, SQS)
   - Sem overhead de ENI (Elastic Network Interface)

2. **Simplicidade**
   - Não precisa configurar VPC, subnets, route tables, NAT Gateway
   - Menos complexidade de infraestrutura
   - Menor custo (sem NAT Gateway)

3. **Ideal para Serverless**
   - DynamoDB e SQS são acessíveis diretamente via internet
   - API Gateway é público por padrão
   - Não precisa de VPC endpoints

4. **Segurança via IAM**
   - Controle de acesso via IAM Roles e Policies
   - Não depende de network isolation
   - DynamoDB e SQS já são seguros via IAM

### ⚠️ Quando Considerar VPC

Use VPC se você precisar de:

1. **Acesso a Recursos Privados**
   - RDS (PostgreSQL, MySQL) em VPC privada
   - ElastiCache (Redis) em VPC privada
   - EC2 instances privadas
   - Redes on-premises via VPN/Direct Connect

2. **Isolamento de Rede**
   - Requisitos de compliance que exigem isolamento
   - Múltiplos ambientes isolados
   - Controle granular de tráfego de rede

3. **Integração com Redes Corporativas**
   - VPN site-to-site
   - Direct Connect
   - Peering com outras VPCs

## Arquitetura Atual

```
Internet
   │
   ├── Vercel (Frontend)
   │   └── HTTPS → API Gateway
   │
   └── AWS Cloud (Public Network)
       ├── API Gateway (Public)
       │   ├── WebSocket API
       │   └── REST API
       │
       ├── Lambda Functions (Public Network)
       │   ├── onConnect
       │   ├── onDisconnect
       │   ├── gameHandler
       │   ├── getWebSocketUrl
       │   └── sqsConsumer
       │
       ├── DynamoDB (Public Endpoint)
       │   ├── Games Table
       │   ├── Connections Table
       │   └── Game Events Table
       │
       └── SQS (Public Endpoint)
           ├── Game Events Queue
           └── Dead Letter Queue
```

## Segurança sem VPC

### Como a Segurança é Garantida

1. **IAM Roles e Policies**
   - Cada Lambda tem uma IAM Role específica
   - Permissões mínimas necessárias (princípio do menor privilégio)
   - DynamoDB e SQS são acessíveis apenas via IAM

2. **API Gateway**
   - Rate limiting configurado
   - CORS configurado
   - Autenticação via tokens (se necessário)

3. **DynamoDB**
   - Acesso apenas via IAM
   - Não exposto publicamente
   - Encryption at rest habilitado

4. **SQS**
   - Acesso apenas via IAM
   - Mensagens não são expostas publicamente
   - Encryption at rest habilitado

## Recursos e Localização

### Recursos na Rede Pública

- ✅ **Lambda Functions**: Executam na rede pública da AWS
- ✅ **API Gateway**: Publicamente acessível (necessário para WebSocket)
- ✅ **DynamoDB**: Acessível via endpoint público (protegido por IAM)
- ✅ **SQS**: Acessível via endpoint público (protegido por IAM)

### Sem VPC Configurada

- ❌ Não há VPC criada
- ❌ Não há subnets configuradas
- ❌ Não há security groups
- ❌ Não há NAT Gateway
- ❌ Não há VPC Endpoints

## Custos

### Rede Pública (Atual)
- ✅ **Custo**: $0 adicional
- ✅ **NAT Gateway**: Não necessário ($0)
- ✅ **VPC Endpoints**: Não necessário ($0)
- ✅ **Data Transfer**: Apenas tráfego de internet (normal)

### Se Usasse VPC
- 💰 **NAT Gateway**: ~$32/mês + data transfer
- 💰 **VPC Endpoints**: ~$7/mês por endpoint
- 💰 **Data Transfer**: Pode ser mais caro dependendo do uso

## Performance

### Latência

**Rede Pública (Atual)**:
- Cold start Lambda: ~100-300ms
- Acesso DynamoDB: ~5-10ms
- Acesso SQS: ~5-10ms

**Com VPC**:
- Cold start Lambda: ~1-3s (devido a ENI)
- Acesso DynamoDB via VPC Endpoint: ~5-10ms
- Acesso SQS via VPC Endpoint: ~5-10ms

**Conclusão**: Rede pública é mais rápida para serverless.

## Migração para VPC (Se Necessário)

Se no futuro você precisar de VPC, aqui está o que mudaria:

### 1. Criar VPC e Subnets

```typescript
// CDK
const vpc = new ec2.Vpc(this, 'GameVPC', {
  maxAzs: 2,
  natGateways: 1, // Para acesso à internet
});

const privateSubnets = vpc.privateSubnets;
```

### 2. Configurar Lambdas na VPC

```yaml
# serverless.yml
functions:
  gameHandler:
    handler: src/presentation/handlers/websocket/gameHandler.handler
    vpc:
      securityGroupIds:
        - ${self:custom.securityGroupId}
      subnetIds:
        - ${self:custom.subnetId1}
        - ${self:custom.subnetId2}
```

### 3. Criar VPC Endpoints (Opcional)

Para evitar usar NAT Gateway:

```typescript
// CDK
new ec2.VpcEndpoint(this, 'DynamoDBEndpoint', {
  vpc,
  service: ec2.VpcEndpointService.DYNAMODB,
});

new ec2.VpcEndpoint(this, 'SQSEndpoint', {
  vpc,
  service: ec2.VpcEndpointService.SQS,
});
```

### 4. Trade-offs

**Com VPC**:
- ✅ Isolamento de rede
- ✅ Acesso a recursos privados
- ❌ Maior latência (cold starts)
- ❌ Maior complexidade
- ❌ Maior custo

## Recomendação

Para esta aplicação serverless:
- ✅ **Mantenha na rede pública** (atual)
- ✅ É a melhor opção para serverless
- ✅ Menor custo e latência
- ✅ Segurança via IAM é suficiente

**Use VPC apenas se**:
- Precisar acessar RDS, ElastiCache ou outros recursos privados
- Tiver requisitos de compliance que exijam isolamento
- Precisar integrar com redes corporativas

## Referências

- [AWS Lambda in VPC](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html)
- [VPC vs Public Network for Serverless](https://aws.amazon.com/blogs/compute/announcing-improved-vpc-networking-for-aws-lambda-functions/)
- [DynamoDB VPC Endpoints](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/vpc-endpoints.html)

