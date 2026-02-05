#!/bin/bash
# ==============================================
# SNAPSHOT DE VERSÕES - Salva estado atual do VPS
# Executar ANTES de cada deploy
# ==============================================

SNAPSHOT_DIR="/root/Clinica/.snapshots"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SNAPSHOT_FILE="$SNAPSHOT_DIR/snapshot_$TIMESTAMP.md"

# Criar diretório se não existir
mkdir -p $SNAPSHOT_DIR

echo "# Snapshot de Produção - $TIMESTAMP" > $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE
echo "## Git" >> $SNAPSHOT_FILE
echo "\`\`\`" >> $SNAPSHOT_FILE
echo "Commit: $(git rev-parse HEAD)" >> $SNAPSHOT_FILE
echo "Branch: $(git branch --show-current)" >> $SNAPSHOT_FILE
echo "Date: $(git log -1 --format=%ci)" >> $SNAPSHOT_FILE
echo "Message: $(git log -1 --format=%s)" >> $SNAPSHOT_FILE
echo "\`\`\`" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

echo "## Containers" >> $SNAPSHOT_FILE
echo "\`\`\`" >> $SNAPSHOT_FILE
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' >> $SNAPSHOT_FILE
echo "\`\`\`" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

echo "## Disco" >> $SNAPSHOT_FILE
echo "\`\`\`" >> $SNAPSHOT_FILE
df -h / >> $SNAPSHOT_FILE
echo "\`\`\`" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

echo "## Memória" >> $SNAPSHOT_FILE
echo "\`\`\`" >> $SNAPSHOT_FILE
free -h >> $SNAPSHOT_FILE
echo "\`\`\`" >> $SNAPSHOT_FILE

echo "✅ Snapshot salvo em: $SNAPSHOT_FILE"
echo ""
echo "Para comparar com snapshot anterior:"
echo "  diff $SNAPSHOT_FILE \$(ls -t $SNAPSHOT_DIR/*.md | head -2 | tail -1)"
