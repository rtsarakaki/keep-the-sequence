#!/bin/bash

# Script para criar a Role IAM do GitHub Actions via CloudFormation
# Uso: ./create-github-role.sh <github-repository> [allowed-branches]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se o repositório foi fornecido
if [ -z "$1" ]; then
    echo -e "${RED}Erro: Repositório GitHub não fornecido${NC}"
    echo ""
    echo "Uso: $0 <github-repository> [allowed-branches]"
    echo ""
    echo "Exemplos:"
    echo "  $0 usuario/keep-the-sequence"
    echo "  $0 usuario/keep-the-sequence main,develop"
    echo ""
    exit 1
fi

GITHUB_REPOSITORY="$1"
ALLOWED_BRANCHES="${2:-}"

# Validar formato do repositório
if ! echo "$GITHUB_REPOSITORY" | grep -qE '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'; then
    echo -e "${RED}Erro: Formato de repositório inválido${NC}"
    echo "Formato esperado: owner/repo-name"
    echo "Exemplo: usuario/keep-the-sequence"
    exit 1
fi

# Verificar se AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Erro: AWS CLI não está instalado${NC}"
    echo "Instale em: https://aws.amazon.com/cli/"
    exit 1
fi

# Verificar se está autenticado
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Erro: Não autenticado na AWS${NC}"
    echo "Execute: aws configure"
    exit 1
fi

# Obter região e conta
AWS_REGION=$(aws configure get region || echo "us-east-1")
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${GREEN}=== Criando Role IAM para GitHub Actions ===${NC}"
echo ""
echo "Repositório GitHub: ${GREEN}$GITHUB_REPOSITORY${NC}"
if [ -n "$ALLOWED_BRANCHES" ]; then
    echo "Branches permitidas: ${GREEN}$ALLOWED_BRANCHES${NC}"
else
    echo "Branches permitidas: ${YELLOW}Todas${NC}"
fi
echo "Região AWS: ${GREEN}$AWS_REGION${NC}"
echo "Conta AWS: ${GREEN}$AWS_ACCOUNT_ID${NC}"
echo ""

# Preparar parâmetros do CloudFormation
STACK_NAME="github-actions-role"
TEMPLATE_FILE="$(dirname "$0")/github-actions-role.yaml"

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}Erro: Template não encontrado em $TEMPLATE_FILE${NC}"
    exit 1
fi

# Construir parâmetros
PARAMETERS="ParameterKey=GitHubRepository,ParameterValue=$GITHUB_REPOSITORY"

if [ -n "$ALLOWED_BRANCHES" ]; then
    PARAMETERS="$PARAMETERS ParameterKey=AllowedBranches,ParameterValue=$ALLOWED_BRANCHES"
fi

# Verificar se o stack já existe
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo -e "${YELLOW}Aviso: Stack '$STACK_NAME' já existe${NC}"
    read -p "Deseja atualizar o stack? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operação cancelada"
        exit 0
    fi
    OPERATION="update-stack"
else
    OPERATION="create-stack"
fi

# Criar ou atualizar o stack
echo -e "${GREEN}Executando: aws cloudformation $OPERATION ...${NC}"
echo ""

if [ "$OPERATION" = "create-stack" ]; then
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_FILE" \
        --parameters $PARAMETERS \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$AWS_REGION" \
        --tags Key=Project,Value=TheGame Key=ManagedBy,Value=CloudFormation
    
    echo ""
    echo -e "${GREEN}Stack sendo criado...${NC}"
    echo "Aguardando conclusão..."
    
    aws cloudformation wait stack-create-complete \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION"
else
    aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_FILE" \
        --parameters $PARAMETERS \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$AWS_REGION" \
        --tags Key=Project,Value=TheGame Key=ManagedBy,Value=CloudFormation || {
        if [ $? -eq 254 ]; then
            echo -e "${YELLOW}Nenhuma atualização necessária${NC}"
            exit 0
        else
            exit 1
        fi
    }
    
    echo ""
    echo -e "${GREEN}Stack sendo atualizado...${NC}"
    echo "Aguardando conclusão..."
    
    aws cloudformation wait stack-update-complete \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION"
fi

# Obter outputs
echo ""
echo -e "${GREEN}=== Stack criado/atualizado com sucesso! ===${NC}"
echo ""

ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`RoleArn`].OutputValue' \
    --output text)

echo -e "${GREEN}Role ARN:${NC}"
echo "$ROLE_ARN"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Adicione este ARN como secret no GitHub:"
echo "   Name: AWS_ROLE_ARN"
echo "   Value: $ROLE_ARN"
echo ""
echo "2. Adicione também:"
echo "   Name: AWS_REGION"
echo "   Value: $AWS_REGION"
echo ""

