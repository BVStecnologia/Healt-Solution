#!/bin/bash

# ===========================================
# SCRIPT DE SETUP - CLINICA
# ===========================================

set -e

echo "🏥 Configurando projeto Clínica..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale o Docker Compose primeiro."
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  Edite o arquivo .env com suas configurações antes de continuar."
fi

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p nginx/ssl
mkdir -p database/init
mkdir -p uploads

# Gerar certificado SSL auto-assinado para desenvolvimento
if [ ! -f nginx/ssl/fullchain.pem ]; then
    echo "🔐 Gerando certificado SSL para desenvolvimento..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Para iniciar o projeto em desenvolvimento:"
echo "  docker compose up -d"
echo ""
echo "Para ver os logs:"
echo "  docker compose logs -f"
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:3001"
echo "  API Docs: http://localhost:3001/health"
echo ""
