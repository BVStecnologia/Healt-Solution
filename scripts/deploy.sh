#!/bin/bash

# ===========================================
# SCRIPT DE DEPLOY - CLINICA (VPS)
# ===========================================

set -e

echo "🚀 Iniciando deploy na VPS..."

# Variáveis
DOMAIN=${DOMAIN:-"suaclinica.com"}
EMAIL=${SSL_EMAIL:-"admin@suaclinica.com"}

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ]; then
    echo "Por favor, execute como root ou com sudo"
    exit 1
fi

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt-get update && apt-get upgrade -y

# Instalar dependências
echo "📦 Instalando dependências..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    certbot

# Instalar Docker se não existir
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Instalar Docker Compose se não existir
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "🐳 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Gerar certificado SSL com Let's Encrypt
if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    echo "🔐 Gerando certificado SSL com Let's Encrypt..."
    certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

    # Copiar certificados para pasta do nginx
    mkdir -p nginx/ssl
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
fi

# Build das imagens
echo "🔨 Construindo imagens Docker..."
docker compose build --no-cache

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose down || true

# Iniciar em produção
echo "🚀 Iniciando containers em produção..."
docker compose --profile production up -d

# Executar migrations
echo "📊 Executando migrations do banco de dados..."
docker compose exec -T api npx prisma migrate deploy

# Verificar status
echo ""
echo "✅ Deploy concluído!"
echo ""
docker compose ps
echo ""
echo "URLs:"
echo "  https://$DOMAIN"
echo "  https://$DOMAIN/api/health"
echo ""

# Configurar renovação automática do certificado
echo "📅 Configurando renovação automática do SSL..."
(crontab -l 2>/dev/null; echo "0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/*.pem /path/to/nginx/ssl/ && docker compose restart nginx") | crontab -
