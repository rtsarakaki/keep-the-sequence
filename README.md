# The Game - Online Cooperative Card Game

Sistema de jogo cooperativo online baseado no jogo de cartas "The Game" com suporte a 2-5 jogadores, comunicação em tempo real via WebSocket, persistência de estado para reconexão e processamento assíncrono de eventos.

## Status

✅ Infraestrutura AWS configurada
✅ GitHub Actions workflows configurados
✅ CI/CD pipeline ativo

## Arquitetura

- **Backend**: Node.js/TypeScript com AWS Lambda, API Gateway WebSocket, DynamoDB, SQS
- **Frontend**: Next.js com design responsivo mobile-first
- **Infraestrutura**: AWS CDK gerenciado via GitHub Actions
- **CI/CD**: Deploy automático com aprovação manual via GitHub Actions

## Tecnologias

- TypeScript (strict mode)
- Node.js
- Next.js
- AWS Lambda
- API Gateway WebSocket
- DynamoDB
- SQS
- Jest (TDD)
- Serverless Framework

## Princípios

- SOLID
- Clean Code
- TDD (Test-Driven Development)
- Imutabilidade
- Trunk-Based Development
- Accelerate (DORA Metrics)

## Setup

Consulte `docs/SETUP.md` para instruções completas de configuração.

**Importante**: Este projeto usa **OIDC com Roles** para autenticação AWS (não access keys de usuários). Isso é mais seguro e segue as melhores práticas da AWS.

## Desenvolvimento

```bash
# Backend
cd backend
npm install
npm test
npm run dev

# Frontend
cd frontend
npm install
npm test
npm run dev
```

## Estrutura do Projeto

```
/
├── backend/          # Backend Lambda functions
├── frontend/         # Frontend Next.js
├── infrastructure/   # AWS CDK
└── docs/            # Documentação
```

# Test workflow
# Test after SSM permissions
# Test after S3 permissions added
