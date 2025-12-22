# Proteção contra DDoS - AWS API Gateway

## Resposta Rápida

**Sim, o AWS API Gateway tem proteções nativas contra DDoS**, mas você pode melhorar ainda mais com AWS Shield e AWS WAF.

## Proteções Nativas do AWS API Gateway

### 1. Proteção Automática (Gratuita)

O AWS API Gateway já possui proteções automáticas contra DDoS:

- **AWS Shield Standard**: Ativado automaticamente para todos os recursos AWS
  - Proteção contra ataques de camada 3 e 4 (SYN floods, UDP floods, etc.)
  - Mitigação automática de ataques comuns
  - Sem custo adicional

- **Rate Limiting**: Já configurado no seu projeto
  - WebSocket Stage: 100 req/s por conexão, burst 200
  - Limita requisições por conexão individual

- **Auto-scaling**: API Gateway escala automaticamente
  - Suporta até 100.000 conexões simultâneas
  - Escala sob demanda sem intervenção manual

### 2. Limitações Atuais

**O que você tem:**
- ✅ Rate limiting por conexão (100 req/s)
- ✅ AWS Shield Standard (automático)
- ✅ Auto-scaling

**O que falta:**
- ❌ Rate limiting por IP (proteção contra múltiplas conexões do mesmo IP)
- ❌ AWS WAF (Web Application Firewall)
- ❌ AWS Shield Advanced (proteção adicional)
- ❌ Rate limiting no endpoint HTTP `/api/websocket-url`

## Recomendações de Melhoria

### 1. AWS WAF (Recomendado para Produção)

**O que faz:**
- Filtra requisições maliciosas antes de chegar ao API Gateway
- Regras customizadas (rate limiting por IP, geolocalização, etc.)
- Proteção contra SQL injection, XSS, e outros ataques

**Custo:** ~$5/mês + $1 por milhão de requisições

**Como implementar:**
```typescript
// infrastructure/cdk/lib/game-stack.ts
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

// Criar Web ACL
const webAcl = new wafv2.CfnWebACL(this, 'GameWebACL', {
  name: 'the-game-waf',
  scope: 'REGIONAL', // Para API Gateway Regional
  defaultAction: { allow: {} },
  rules: [
    // Rate limiting por IP
    {
      name: 'RateLimitRule',
      priority: 1,
      statement: {
        rateBasedStatement: {
          limit: 2000, // Requisições por 5 minutos
          aggregateKeyType: 'IP',
        },
      },
      action: { block: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'RateLimitRule',
      },
    },
    // Bloquear IPs conhecidos maliciosos (opcional)
    {
      name: 'AWSManagedRulesCommonRuleSet',
      priority: 2,
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS',
          name: 'AWSManagedRulesCommonRuleSet',
        },
      },
      overrideAction: { none: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'CommonRuleSet',
      },
    },
  ],
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'GameWebACL',
  },
});

// Associar WAF ao API Gateway
new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
  resourceArn: webSocketApi.arnForExecuteApi(),
  webAclArn: webAcl.attrArn,
});
```

### 2. Rate Limiting por IP no Endpoint HTTP

**Problema atual:** O endpoint `/api/websocket-url` não tem rate limiting por IP.

**Solução:** Implementar rate limiting no Lambda handler:

```typescript
// backend/src/presentation/handlers/http/getWebSocketUrl.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const RATE_LIMIT_TABLE = 'the-game-rate-limits';
const MAX_REQUESTS_PER_MINUTE = 10;

async function checkRateLimit(ip: string): Promise<boolean> {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  const key = `ip:${ip}:${Math.floor(Date.now() / 60000)}`; // Por minuto
  
  try {
    const result = await client.send(new GetCommand({
      TableName: RATE_LIMIT_TABLE,
      Key: { key },
    }));
    
    const count = result.Item?.count || 0;
    
    if (count >= MAX_REQUESTS_PER_MINUTE) {
      return false; // Rate limit excedido
    }
    
    // Incrementar contador
    await client.send(new PutCommand({
      TableName: RATE_LIMIT_TABLE,
      Item: {
        key,
        count: count + 1,
        ttl: Math.floor(Date.now() / 1000) + 120, // Expira em 2 minutos
      },
    }));
    
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Em caso de erro, permitir (fail open)
  }
}

export const handler = async (event: APIGatewayProxyEvent) => {
  const ip = event.requestContext.identity.sourceIp;
  
  if (!await checkRateLimit(ip)) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Too many requests' }),
    };
  }
  
  // ... resto do código
};
```

### 3. AWS Shield Advanced (Opcional - Para Ataques Grandes)

**Quando usar:**
- Se você espera ataques DDoS grandes (> 1 Gbps)
- Se precisa de suporte 24/7 da AWS durante ataques
- Se precisa de proteção de custos (AWS cobre custos de escalonamento durante ataques)

**Custo:** $3.000/mês (caro, mas cobre custos de escalonamento)

**Recomendação:** Comece com Shield Standard (gratuito) e WAF. Considere Shield Advanced apenas se:
- Você já sofreu ataques grandes
- Você tem orçamento para isso
- Você precisa de proteção de custos

### 4. CloudWatch Alarms

Configure alertas para detectar ataques:

```typescript
// infrastructure/cdk/lib/game-stack.ts
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

// Alarme para muitas requisições
new cloudwatch.Alarm(this, 'HighRequestRateAlarm', {
  metric: webSocketApi.metricCount(),
  threshold: 10000, // 10k requisições em 5 minutos
  evaluationPeriods: 1,
  alarmDescription: 'Alerta para possível ataque DDoS',
});

// Alarme para muitas conexões
new cloudwatch.Alarm(this, 'HighConnectionCountAlarm', {
  metric: webSocketApi.metricConnectionCount(),
  threshold: 5000, // 5k conexões simultâneas
  evaluationPeriods: 1,
  alarmDescription: 'Alerta para muitas conexões simultâneas',
});
```

## Estratégia de Proteção em Camadas

```
┌─────────────────────────────────────┐
│  1. AWS Shield Standard (Automático) │ ← Camada 1: Proteção básica
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  2. AWS WAF (Recomendado)           │ ← Camada 2: Filtragem de requisições
│     - Rate limiting por IP          │
│     - Regras de segurança           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  3. API Gateway Rate Limiting        │ ← Camada 3: Limite por conexão
│     - 100 req/s por conexão         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  4. Lambda Rate Limiting (Custom)   │ ← Camada 4: Limite por IP no HTTP
│     - DynamoDB tracking              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  5. CloudWatch Alarms               │ ← Camada 5: Monitoramento
│     - Alertas em tempo real         │
└─────────────────────────────────────┘
```

## Resumo de Proteções

### O que você já tem (Gratuito):
- ✅ AWS Shield Standard (automático)
- ✅ Rate limiting por conexão (100 req/s)
- ✅ Auto-scaling do API Gateway

### O que recomendo adicionar:
1. **AWS WAF** (~$5-10/mês)
   - Rate limiting por IP
   - Regras de segurança comuns
   - **Prioridade: Alta**

2. **Rate limiting no endpoint HTTP** (Custo: DynamoDB on-demand)
   - Proteção contra abuso do endpoint `/api/websocket-url`
   - **Prioridade: Média**

3. **CloudWatch Alarms** (Gratuito até certo limite)
   - Alertas para detectar ataques
   - **Prioridade: Média**

4. **AWS Shield Advanced** ($3.000/mês)
   - Apenas se você espera ataques muito grandes
   - **Prioridade: Baixa** (para a maioria dos casos)

## Conclusão

**Para a maioria dos casos, você está bem protegido com:**
- AWS Shield Standard (automático)
- AWS WAF com rate limiting por IP
- Rate limiting no endpoint HTTP

**Isso deve proteger contra:**
- ✅ Ataques DDoS pequenos/médios
- ✅ Abuso de endpoints
- ✅ Ataques de força bruta

**Para ataques muito grandes (> 1 Gbps), considere:**
- AWS Shield Advanced (se tiver orçamento)
- Suporte AWS 24/7

## Próximos Passos

1. ✅ Implementar AWS WAF (recomendado)
2. ✅ Implementar rate limiting no endpoint HTTP
3. ✅ Configurar CloudWatch Alarms
4. ⏳ Monitorar métricas e ajustar limites conforme necessário

## Referências

- [AWS Shield](https://aws.amazon.com/shield/)
- [AWS WAF](https://aws.amazon.com/waf/)
- [API Gateway Rate Limiting](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html)
- [AWS Shield vs WAF](https://aws.amazon.com/shield/faqs/)

