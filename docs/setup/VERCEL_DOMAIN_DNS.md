# Configuração de Domínio Personalizado e DNS na Vercel

Este guia explica como configurar um domínio personalizado na Vercel e gerenciar registros DNS.

## Visão Geral

A Vercel oferece gerenciamento de DNS para domínios personalizados, mas **não é um serviço completo como Route53 da AWS**. Ela permite:

- ✅ Configurar domínios personalizados
- ✅ Gerenciar registros DNS básicos (A, AAAA, CNAME, MX, TXT)
- ✅ SSL/TLS automático via Let's Encrypt
- ❌ Não oferece todas as funcionalidades do Route53 (health checks, routing policies avançadas, etc.)

## Opções de Configuração

### Opção 1: Domínio Gerenciado pela Vercel (Recomendado)

Se você comprou o domínio na Vercel ou transferiu para a Vercel:

1. **Vantagens**:
   - Configuração automática
   - DNS gerenciado pela Vercel
   - SSL automático
   - Sem configuração manual

2. **Como configurar**:
   - Acesse **Settings** → **Domains** no projeto Vercel
   - Adicione seu domínio
   - A Vercel configura automaticamente os registros DNS necessários

### Opção 2: Domínio Externo com DNS na Vercel

Se você tem um domínio externo mas quer usar o DNS da Vercel:

1. **Configurar Nameservers**:
   - Acesse seu registrador de domínio (GoDaddy, Namecheap, etc.)
   - Altere os nameservers para os fornecidos pela Vercel:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```

2. **Adicionar Domínio na Vercel**:
   - Acesse **Settings** → **Domains**
   - Adicione seu domínio
   - A Vercel detectará que você está usando seus nameservers

3. **Gerenciar Registros DNS**:
   - Acesse **Settings** → **Domains** → Seu domínio → **DNS**
   - Adicione registros conforme necessário:
     - **A**: Para apontar para IPs
     - **AAAA**: Para IPv6
     - **CNAME**: Para apontar para outros domínios
     - **MX**: Para email
     - **TXT**: Para verificações e SPF

### Opção 3: Domínio Externo com DNS Externo (Route53, Cloudflare, etc.)

Se você quer manter o DNS em outro serviço (como Route53):

1. **Configurar na Vercel**:
   - Acesse **Settings** → **Domains**
   - Adicione seu domínio
   - A Vercel mostrará os registros DNS que você precisa configurar

2. **Configurar no Route53 (ou outro DNS)**:
   - Acesse Route53 → **Hosted Zones**
   - Adicione os registros mostrados pela Vercel:
     - **A Record**: Aponta para IPs da Vercel (fornecidos pela Vercel)
     - **CNAME**: Para subdomínios (ex: `www`)
     - **TXT Record**: Para verificação (se necessário)

3. **Vantagens desta abordagem**:
   - ✅ Controle total sobre DNS
   - ✅ Pode usar funcionalidades avançadas do Route53
   - ✅ Pode configurar health checks, routing policies, etc.
   - ✅ Pode gerenciar múltiplos serviços no mesmo domínio

## Registros DNS Comuns

### Para o Frontend (Vercel)

```
# Domínio principal
A Record: @ → IPs da Vercel (fornecidos pela Vercel)
AAAA Record: @ → IPv6 da Vercel (se disponível)

# Subdomínio www
CNAME: www → cname.vercel-dns.com
```

### Para APIs Externas (AWS)

Se você quiser criar subdomínios para APIs AWS:

```
# API REST
CNAME: api → abc123.execute-api.us-east-1.amazonaws.com

# WebSocket API
CNAME: ws → abc123.execute-api.us-east-1.amazonaws.com
```

**Nota**: Para APIs AWS, você pode usar Route53 para ter mais controle sobre routing e health checks.

## Comparação: Vercel DNS vs Route53

| Funcionalidade | Vercel DNS | Route53 |
|----------------|------------|---------|
| Registros básicos (A, CNAME, MX, TXT) | ✅ | ✅ |
| Health Checks | ❌ | ✅ |
| Routing Policies (Weighted, Latency, etc.) | ❌ | ✅ |
| Failover automático | ❌ | ✅ |
| Geoproximity routing | ❌ | ✅ |
| SSL automático | ✅ | ❌ (precisa ACM) |
| Integração com Vercel | ✅ Nativo | ⚠️ Manual |
| Custo | ✅ Incluído | 💰 Pago por uso |

## Recomendação

### Para Aplicações Simples
- **Use DNS da Vercel**: Mais simples, SSL automático, suficiente para maioria dos casos

### Para Aplicações Complexas
- **Use Route53**: Se você precisa de:
  - Health checks
  - Routing policies avançadas
  - Failover entre múltiplos serviços
  - Integração com múltiplos serviços AWS

## Exemplo: Configuração Híbrida

Você pode usar uma abordagem híbrida:

```
Domínio: example.com

# DNS na Vercel (para frontend)
A Record: @ → Vercel IPs
CNAME: www → cname.vercel-dns.com

# DNS no Route53 (para APIs AWS)
CNAME: api.example.com → AWS API Gateway
CNAME: ws.example.com → AWS WebSocket API
```

Para isso, você precisaria:
1. Configurar o domínio principal na Vercel
2. Criar uma Hosted Zone no Route53 para subdomínios
3. Configurar os nameservers do Route53 no registrador de domínio (ou usar delegations)

## Troubleshooting

### Domínio não resolve

1. Verifique se os nameservers estão corretos
2. Aguarde propagação DNS (pode levar até 48 horas)
3. Use `dig` ou `nslookup` para verificar:
   ```bash
   dig example.com
   nslookup example.com
   ```

### SSL não funciona

1. A Vercel gera SSL automaticamente via Let's Encrypt
2. Pode levar alguns minutos após configurar o domínio
3. Verifique se os registros DNS estão corretos

### Subdomínios não funcionam

1. Certifique-se de adicionar o subdomínio na Vercel
2. Configure o registro CNAME ou A apropriado
3. Aguarde propagação DNS

## Referências

- [Vercel Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel DNS Management](https://vercel.com/docs/concepts/projects/domains/dns-records)
- [AWS Route53 Documentation](https://docs.aws.amazon.com/route53/)

