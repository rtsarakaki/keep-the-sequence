#!/bin/bash

# Script para obter informações da AWS para configuração local
# Uso: ./scripts/get-aws-info.sh

echo "🔍 Obtendo informações da AWS para desenvolvimento local..."
echo ""

cd backend

echo "📋 Informações do Serverless Framework:"
echo "----------------------------------------"
npx serverless info --stage prod 2>/dev/null | grep -A 20 "Service Information" || echo "❌ Erro ao obter informações. Verifique se o Serverless está configurado."

echo ""
echo "📝 Próximos passos:"
echo "1. Copie os valores acima para os arquivos .env.local"
echo "2. Frontend: cp frontend/.env.local.example frontend/.env.local"
echo "3. Backend: cp backend/.env.local.example backend/.env.local"
echo "4. Preencha NEXT_PUBLIC_API_URL no frontend/.env.local"
echo "5. Preencha todas as variáveis no backend/.env.local"
echo ""
echo "💡 Dica: As URLs do API Gateway estão em 'endpoints' acima"

