#!/bin/bash
# ===========================================
# Script de Backup - Clinica
# Uso: ./scripts/backup.sh [tag]
# Exemplo: ./scripts/backup.sh pre-deploy
#          ./scripts/backup.sh manual
#          ./scripts/backup.sh (usa "manual" como padrao)
#
# Encryption: Set BACKUP_ENCRYPT_PASS env var to enable AES-256 encryption.
#   export BACKUP_ENCRYPT_PASS="your-secret-passphrase"
#
# Off-site: Set BACKUP_REMOTE to enable rsync to remote server.
#   export BACKUP_REMOTE="user@remote:/path/to/backups/"
# ===========================================

set -e

TAG=${1:-manual}
DB_CONTAINER="supabase-db"
DB_USER="postgres"
DB_NAME="postgres"
BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db-${TAG}-${TIMESTAMP}.sql.gz"

# Criar diretorio se nao existir
mkdir -p $BACKUP_DIR

echo "Backup do banco de dados"
echo "  Tag: $TAG"
echo "  Container: $DB_CONTAINER"

# Verificar se container esta rodando
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "  ERROR: Container $DB_CONTAINER nao esta rodando!"
  exit 1
fi

# Fazer dump comprimido
echo "  Exportando..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_FILE"

# Verificar se arquivo foi criado
if [ ! -f "$BACKUP_FILE" ]; then
  echo "  ERROR: Falha ao criar backup!"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  OK: Backup salvo: $BACKUP_FILE ($SIZE)"

# Optional: Encrypt backup with AES-256 (symmetric, passphrase-based)
if [ -n "$BACKUP_ENCRYPT_PASS" ]; then
  echo "  Encrypting backup..."
  openssl enc -aes-256-cbc -salt -pbkdf2 -in "$BACKUP_FILE" -out "${BACKUP_FILE}.enc" -pass env:BACKUP_ENCRYPT_PASS
  if [ -f "${BACKUP_FILE}.enc" ]; then
    rm -f "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.enc"
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "  OK: Encrypted backup: $BACKUP_FILE ($SIZE)"
  else
    echo "  WARN: Encryption failed, keeping unencrypted backup"
  fi
fi

# Optional: Copy to off-site via rsync
if [ -n "$BACKUP_REMOTE" ]; then
  echo "  Syncing to remote: $BACKUP_REMOTE"
  if rsync -az "$BACKUP_FILE" "$BACKUP_REMOTE" 2>/dev/null; then
    echo "  OK: Remote sync complete"
  else
    echo "  WARN: Remote sync failed (backup still saved locally)"
  fi
fi

# Listar backups existentes
echo ""
echo "Backups disponiveis:"
ls -1th $BACKUP_DIR/db-*.sql.gz* 2>/dev/null | head -10 | while read f; do
  echo "  $(du -h "$f" | cut -f1)  $(basename "$f")"
done

TOTAL=$(ls -1 $BACKUP_DIR/db-*.sql.gz* 2>/dev/null | wc -l)
echo ""
echo "  Total: $TOTAL backup(s)"

# Limpar backups antigos (manter ultimos 20)
REMOVED=$(ls -1t $BACKUP_DIR/db-*.sql.gz* 2>/dev/null | tail -n +21 | wc -l)
ls -1t $BACKUP_DIR/db-*.sql.gz* 2>/dev/null | tail -n +21 | xargs -r rm -f
if [ "$REMOVED" -gt 0 ]; then
  echo "  $REMOVED backup(s) antigo(s) removido(s)"
fi

echo ""
echo "Para restaurar:"
if [[ "$BACKUP_FILE" == *.enc ]]; then
  echo "  # Decrypt first:"
  echo "  openssl enc -aes-256-cbc -d -pbkdf2 -in $BACKUP_FILE -out backup.sql.gz -pass pass:YOUR_PASSPHRASE"
  echo "  gunzip < backup.sql.gz | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME"
else
  echo "  gunzip < $BACKUP_FILE | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME"
fi
