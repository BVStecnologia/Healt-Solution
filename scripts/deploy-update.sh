#!/bin/bash
# ==============================================
# DEPLOY UPDATE - Atualização segura com snapshot
# Uso: ./deploy-update.sh [--skip-snapshot]
# ==============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== DEPLOY UPDATE - ESSENCE MEDICAL CLINIC ===${NC}"
echo ""

cd /root/Clinica

# 1. Criar snapshot antes do deploy
if [[ "$1" != "--skip-snapshot" ]]; then
    echo -e "${YELLOW}📸 Criando snapshot do estado atual...${NC}"
    bash /root/Clinica/scripts/snapshot-versions.sh
    echo ""
fi

# 2. Mostrar o que vai mudar
echo -e "${YELLOW}📋 Verificando alterações...${NC}"
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✅ Já está atualizado!${NC}"
    exit 0
fi

echo ""
echo "Commits que serão aplicados:"
git log --oneline $LOCAL..$REMOTE
echo ""

# 3. Confirmar deploy
read -p "Continuar com o deploy? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deploy cancelado${NC}"
    exit 1
fi

# 4. Pull das alterações
echo -e "${YELLOW}⬇️ Baixando alterações...${NC}"
git pull origin main

# 5. Rebuild frontend se necessário
if git diff --name-only $LOCAL $REMOTE | grep -q "^frontend/"; then
    echo -e "${YELLOW}🔨 Rebuild do frontend...${NC}"
    cd /root/Clinica/frontend
    npm install
    npm run build
    cd /root/Clinica
fi

# 6. Restart containers se docker-compose mudou
if git diff --name-only $LOCAL $REMOTE | grep -q "docker-compose\|supabase/"; then
    echo -e "${YELLOW}🐳 Reiniciando Supabase...${NC}"
    cd /root/Clinica/supabase && docker compose up -d
    cd /root/Clinica
fi

if git diff --name-only $LOCAL $REMOTE | grep -q "evolution/"; then
    echo -e "${YELLOW}🐳 Reiniciando Evolution...${NC}"
    cd /root/Clinica/evolution && docker compose up -d
    cd /root/Clinica
fi

# 7. Copiar edge functions se mudaram
if git diff --name-only $LOCAL $REMOTE | grep -q "volumes/functions"; then
    echo -e "${YELLOW}⚡ Atualizando Edge Functions...${NC}"
    docker restart supabase-edge-functions
fi

echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "Novo commit: $(git rev-parse --short HEAD)"
echo ""
echo "Para rollback:"
echo "  git reset --hard $LOCAL"
echo "  # E reiniciar containers necessários"
