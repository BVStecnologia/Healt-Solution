#!/bin/bash
# ===========================================
# Script de Migrações - Clinica
# Uso: ./scripts/migrate.sh [local|vps] [--backup]
# ===========================================

set -e

ENV=${1:-local}
BACKUP_FLAG=${2:-""}
MIGRATIONS_DIR="supabase/migrations"
BACKUP_DIR="/root/backups"

# Configuração por ambiente
if [ "$ENV" = "local" ]; then
  DB_CONTAINER="supabase-db"
  DB_USER="postgres"
  DB_NAME="postgres"
  echo "🏠 Ambiente: LOCAL"
else
  DB_CONTAINER="supabase-db"
  DB_USER="postgres"
  DB_NAME="postgres"
  echo "🌐 Ambiente: VPS"
fi

# Função para executar SQL
run_sql() {
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "$1" 2>/dev/null | tr -d ' '
}

# Função para backup do banco
do_backup() {
  if [ "$ENV" = "vps" ]; then
    mkdir -p $BACKUP_DIR
    local BACKUP_FILE="$BACKUP_DIR/db-pre-migration-$(date +%Y%m%d-%H%M%S).sql.gz"
    echo "💾 Criando backup antes de migrar..."
    docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_FILE"
    local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "  ✅ Backup salvo: $BACKUP_FILE ($SIZE)"

    # Limpar backups antigos (manter últimos 10)
    ls -1t $BACKUP_DIR/db-pre-migration-*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    echo "  📁 Backups armazenados: $(ls -1 $BACKUP_DIR/db-pre-migration-*.sql.gz 2>/dev/null | wc -l)"
  else
    echo "⏭️  Backup ignorado (ambiente local)"
  fi
}

# Função para aplicar migração com transação
apply_migration() {
  local file=$1
  local version=$(basename "$file" | cut -d'_' -f1)
  local name=$(basename "$file" .sql)

  echo "  📄 Aplicando: $name"

  # Executar migração dentro de uma transação
  # Se qualquer comando falhar, toda a migração é revertida
  {
    echo "BEGIN;"
    cat "$file"
    echo ""
    echo "INSERT INTO schema_migrations (version, name) VALUES ('$version', '$name') ON CONFLICT DO NOTHING;"
    echo "COMMIT;"
  } | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -v ON_ERROR_STOP=1

  if [ $? -ne 0 ]; then
    echo "  ❌ ERRO na migração $name! Transação revertida automaticamente."
    exit 1
  fi

  echo "  ✅ Migração $name aplicada com sucesso"
}

# Garantir que tabela de controle existe
echo "🔍 Verificando tabela de controle..."
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME <<EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
EOF

# Contar migrações pendentes
PENDING=0
for file in $(ls -1 $MIGRATIONS_DIR/*.sql | sort); do
  version=$(basename "$file" | cut -d'_' -f1)
  applied=$(run_sql "SELECT COUNT(*) FROM schema_migrations WHERE version = '$version';")
  if [ "$applied" = "0" ]; then
    PENDING=$((PENDING + 1))
  fi
done

if [ "$PENDING" = "0" ]; then
  echo ""
  echo "✅ Nenhuma migração pendente!"
  echo ""
  echo "📊 Status:"
  run_sql "SELECT version || ' - ' || name || ' (' || applied_at::date || ')' FROM schema_migrations ORDER BY version;"
  exit 0
fi

echo "📋 $PENDING migração(ões) pendente(s)"

# Backup antes de migrar (VPS apenas)
if [ "$PENDING" -gt 0 ]; then
  do_backup
fi

echo ""

# Listar migrações aplicadas
echo "📋 Migrações já aplicadas:"
run_sql "SELECT version || ' - ' || name FROM schema_migrations ORDER BY version;"
echo ""

# Aplicar migrações pendentes
echo "🚀 Aplicando migrações pendentes..."
for file in $(ls -1 $MIGRATIONS_DIR/*.sql | sort); do
  version=$(basename "$file" | cut -d'_' -f1)

  # Verificar se já foi aplicada
  applied=$(run_sql "SELECT COUNT(*) FROM schema_migrations WHERE version = '$version';")

  if [ "$applied" = "0" ]; then
    apply_migration "$file"
  else
    echo "  ⏭️  Já aplicada: $(basename $file)"
  fi
done

echo ""
echo "✅ Migrações concluídas!"
echo ""
echo "📊 Status final:"
run_sql "SELECT version || ' - ' || name || ' (' || applied_at::date || ')' FROM schema_migrations ORDER BY version;"
