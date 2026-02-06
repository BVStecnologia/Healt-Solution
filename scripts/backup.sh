#!/bin/bash
# ===========================================
# Script de Backup - Clinica
# Uso: ./scripts/backup.sh [tag]
# Exemplo: ./scripts/backup.sh pre-deploy
#          ./scripts/backup.sh manual
#          ./scripts/backup.sh (usa "manual" como padrão)
# ===========================================

set -e

TAG=${1:-manual}
DB_CONTAINER="supabase-db"
DB_USER="postgres"
DB_NAME="postgres"
BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db-${TAG}-${TIMESTAMP}.sql.gz"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

echo "💾 Backup do banco de dados"
echo "  Tag: $TAG"
echo "  Container: $DB_CONTAINER"

# Verificar se container está rodando
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "  ❌ Container $DB_CONTAINER não está rodando!"
  exit 1
fi

# Fazer dump comprimido
echo "  Exportando..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_FILE"

# Verificar se arquivo foi criado
if [ ! -f "$BACKUP_FILE" ]; then
  echo "  ❌ Falha ao criar backup!"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  ✅ Backup salvo: $BACKUP_FILE ($SIZE)"

# Listar backups existentes
echo ""
echo "📁 Backups disponíveis:"
ls -1th $BACKUP_DIR/db-*.sql.gz 2>/dev/null | head -10 | while read f; do
  echo "  $(du -h "$f" | cut -f1)  $(basename "$f")"
done

TOTAL=$(ls -1 $BACKUP_DIR/db-*.sql.gz 2>/dev/null | wc -l)
echo ""
echo "  Total: $TOTAL backup(s)"

# Limpar backups antigos (manter últimos 20)
REMOVED=$(ls -1t $BACKUP_DIR/db-*.sql.gz 2>/dev/null | tail -n +21 | wc -l)
ls -1t $BACKUP_DIR/db-*.sql.gz 2>/dev/null | tail -n +21 | xargs -r rm -f
if [ "$REMOVED" -gt 0 ]; then
  echo "  🗑️  $REMOVED backup(s) antigo(s) removido(s)"
fi

echo ""
echo "🔄 Para restaurar:"
echo "  gunzip < $BACKUP_FILE | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME"
