#!/bin/bash
# ===========================================
# Script de Migrações - Clinica
# Uso: ./scripts/migrate.sh [local|vps]
# ===========================================

set -e

ENV=${1:-local}
MIGRATIONS_DIR="supabase/migrations"

# Configuração por ambiente
if [ "$ENV" = "local" ]; then
  DB_CONTAINER="supabase-db"
  DB_USER="postgres"
  DB_NAME="postgres"
  echo "🏠 Ambiente: LOCAL"
else
  # Para VPS, ajustar conforme necessário
  DB_CONTAINER="supabase-db"
  DB_USER="postgres"
  DB_NAME="postgres"
  echo "🌐 Ambiente: VPS"
fi

# Função para executar SQL
run_sql() {
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "$1" 2>/dev/null | tr -d ' '
}

# Função para aplicar migração
apply_migration() {
  local file=$1
  local version=$(basename "$file" | cut -d'_' -f1)
  local name=$(basename "$file" .sql)

  echo "  📄 Aplicando: $name"
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < "$file"

  # Registrar migração
  run_sql "INSERT INTO schema_migrations (version, name) VALUES ('$version', '$name') ON CONFLICT DO NOTHING;"
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

# Listar migrações aplicadas
echo "📋 Migrações já aplicadas:"
run_sql "SELECT version || ' - ' || name FROM schema_migrations ORDER BY version;"
echo ""

# Aplicar migrações pendentes
echo "🚀 Verificando migrações pendentes..."
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
