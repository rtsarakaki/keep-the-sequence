# Qual API Usar?

Você tem 3 APIs no AWS API Gateway. Aqui está qual usar para cada propósito:

## 1. `prod-the-game-backend` ✅ **USE ESTA PARA O FRONTEND**

**Tipo**: REST API (HTTP)  
**Criada por**: Serverless Framework  
**Propósito**: Endpoints HTTP do backend

**O que fazer:**
- AWS Console → API Gateway → **REST APIs** → `prod-the-game-backend`
- Stages → **prod** → copie a **Invoke URL**
- Esta URL vai em `NEXT_PUBLIC_API_URL` na Vercel

**Exemplo de URL**: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`

**Endpoints disponíveis:**
- `GET/POST /api/websocket-url` - Obter URL do WebSocket com token

---

## 2. `the-game-websocket-api` ⚠️ **NÃO PRECISA CONFIGURAR**

**Tipo**: WebSocket API  
**Criada por**: CDK  
**Propósito**: Conexões WebSocket do jogo

**O que fazer:**
- **Nada!** Você não precisa configurar esta URL diretamente
- A URL do WebSocket será obtida automaticamente via chamada HTTP para `/api/websocket-url`
- O endpoint HTTP retorna a URL completa do WebSocket com token de autenticação

**Por quê não precisa:**
- O frontend chama `GET /api/websocket-url` (da API REST)
- O backend retorna: `{ wsUrl: "wss://...?token=..." }`
- O frontend usa essa URL retornada para conectar

---

## 3. `prod-the-game-backend-websockets` ❓ **VERIFICAR**

**Tipo**: Provavelmente WebSocket API  
**Criada por**: Possivelmente uma duplicata ou versão antiga

**O que fazer:**
- Verifique se esta é uma API duplicada ou antiga
- Se for duplicada, pode ser deletada (mas verifique primeiro!)
- Se não tiver certeza, deixe como está

---

## Resumo Visual

```
Frontend (Vercel)
    ↓
NEXT_PUBLIC_API_URL = URL de "prod-the-game-backend"
    ↓
Chama: GET /api/websocket-url
    ↓
Backend retorna: { wsUrl: "wss://the-game-websocket-api/..." }
    ↓
Frontend conecta no WebSocket usando a URL retornada
```

## Passo a Passo

1. ✅ Use `prod-the-game-backend` → Stages → prod → Invoke URL
2. ✅ Cole essa URL em `NEXT_PUBLIC_API_URL` na Vercel
3. ✅ Faça redeploy na Vercel
4. ✅ Pronto! O WebSocket será obtido automaticamente

## Verificação

Após configurar, você pode testar:

```bash
# Substitua pela sua URL
curl https://abc123.execute-api.us-east-1.amazonaws.com/prod/api/websocket-url?gameId=test&playerId=test
```

Deve retornar algo como:
```json
{
  "wsUrl": "wss://xyz789.execute-api.us-east-1.amazonaws.com/prod?token=...",
  "expiresIn": 1800
}
```

