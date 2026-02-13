# Deploy - Essence Medical Clinic

## Producao

| Item | Valor |
|------|-------|
| **Dominio** | `https://portal.essencemedicalclinic.com` |
| **VPS** | 217.216.81.92 (Contabo, Ubuntu 24.04, 8 CPU, 24GB RAM, 400GB SSD) |
| **SSH** | `ssh clinica-vps` |
| **SSL** | Let's Encrypt (certbot auto-renew) |
| **DNS** | GoDaddy — `portal` A record → 217.216.81.92 |
| **Nginx** | `/etc/nginx/sites-available/portal.essencemedicalclinic.com` |

---

## Deploy Assistido (Recomendado)

Usar o skill `/deploy` no Claude Code. Ele faz tudo automaticamente:
- Verificacao pre-deploy (git, containers, migracoes, backups)
- Backup do banco antes de qualquer alteracao
- Git push + pull
- Migracoes SQL com transacoes
- Webhook rebuild
- Frontend safe build (sem downtime)
- Verificacao pos-deploy

```
/deploy full       # Deploy completo
/deploy frontend   # So rebuild do frontend
/deploy webhook    # So rebuild do webhook
/deploy migrations # Backup + migracoes pendentes
/deploy check      # Apenas verifica estado
/deploy backup     # Apenas faz backup
```

---

## Deploy Manual

### 1. Git push + pull
```bash
cd C:/Users/User/Desktop/Clinica && git push origin main
ssh clinica-vps "cd /root/Clinica && git pull origin main"
```

### 2. Migracoes
```bash
ssh clinica-vps "cd /root/Clinica && bash scripts/backup.sh pre-deploy"
ssh clinica-vps "cd /root/Clinica && bash scripts/migrate.sh vps"
```

### 3. Webhook
```bash
ssh clinica-vps "cd /root/Clinica/webhook && docker compose up -d --build"
```

### 4. Frontend (Safe Build — sem downtime)
```bash
ssh clinica-vps "cd /root/Clinica/frontend && npm install --legacy-peer-deps"
ssh clinica-vps "cd /root/Clinica/frontend && BUILD_PATH=build_tmp npm run build"
# So troca se build OK:
ssh clinica-vps "cd /root/Clinica/frontend && rm -rf build_old && mv build build_old && mv build_tmp build && rm -rf build_old"
ssh clinica-vps "systemctl reload nginx"
```

> **IMPORTANTE:** `npm run build` apaga a pasta `build/` antes de compilar. Se compilar direto e falhar, o site cai. SEMPRE usar `BUILD_PATH=build_tmp` e trocar atomicamente.

---

## Arquitetura Nginx

```
portal.essencemedicalclinic.com (443 HTTPS)
  /                  → /root/Clinica/frontend/build/ (SPA, try_files → index.html)
  /rest/v1/          → 127.0.0.1:8000 (Supabase PostgREST)
  /auth/v1/          → 127.0.0.1:8000 (Supabase GoTrue)
  /realtime/v1/      → 127.0.0.1:8000 (Supabase Realtime, WebSocket)
  /storage/v1/       → 127.0.0.1:8000 (Supabase Storage)
  /functions/v1/     → 127.0.0.1:8000 (Supabase Edge Functions)
  /evolution/        → 127.0.0.1:8082 (Evolution API)
```

Permissoes: `chmod o+x /root /root/Clinica /root/Clinica/frontend /root/Clinica/frontend/build` (nginx roda como www-data)

---

## 3 Stacks Docker

| Stack | Porta | Compose |
|-------|-------|---------|
| Supabase (13 containers) | 8000 | `supabase/docker-compose.yml` |
| Evolution API (3 containers) | 8082 | `evolution/docker-compose.yml` |
| Webhook Server (1 container) | 3002 | `webhook/docker-compose.yml` |

Frontend servido por Nginx (nao e container).

---

## Variaveis de Ambiente (Producao)

**frontend/.env**
```env
REACT_APP_SUPABASE_URL=https://portal.essencemedicalclinic.com
REACT_APP_SUPABASE_ANON_KEY=eyJ...
REACT_APP_EVOLUTION_API_URL=https://portal.essencemedicalclinic.com/evolution
```

**supabase/.env**
```env
SITE_URL=https://portal.essencemedicalclinic.com
API_EXTERNAL_URL=https://portal.essencemedicalclinic.com
SUPABASE_PUBLIC_URL=https://portal.essencemedicalclinic.com
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://portal.essencemedicalclinic.com/auth/v1/callback
```

**webhook/.env**
```env
PANEL_BASE_URL=https://portal.essencemedicalclinic.com
SUPABASE_PUBLIC_URL=https://portal.essencemedicalclinic.com
SHORTENER_BASE_URL=https://portal.essencemedicalclinic.com
```

---

## Backup e Restauracao

```bash
# Backup manual
ssh clinica-vps "cd /root/Clinica && bash scripts/backup.sh manual"

# Backup pre-deploy (automatico no migrate.sh vps)
ssh clinica-vps "cd /root/Clinica && bash scripts/backup.sh pre-deploy"

# Listar backups
ssh clinica-vps "ls -1th /root/backups/db-*.sql.gz"

# Restaurar (CUIDADO: sobrescreve dados atuais!)
ssh clinica-vps "gunzip < /root/backups/db-XXXXX.sql.gz | docker exec -i supabase-db psql -U postgres -d postgres"
```

---

## Verificar Status

```bash
# Containers
ssh clinica-vps "docker ps --format 'table {{.Names}}\t{{.Status}}' | head -25"

# Frontend
ssh clinica-vps "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/"

# Supabase API
ssh clinica-vps "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/rest/v1/"

# Evolution API
ssh clinica-vps "curl -s -o /dev/null -w '%{http_code}' http://localhost:8082/"

# Webhook
ssh clinica-vps "curl -s -o /dev/null -w '%{http_code}' http://localhost:3002/health"

# Migracoes aplicadas
ssh clinica-vps "docker exec supabase-db psql -U postgres -c \"SELECT version, name FROM schema_migrations ORDER BY version;\""

# Logs
ssh clinica-vps "docker logs webhook-server --tail 20"
ssh clinica-vps "docker logs supabase-kong --tail 20"
```

---

## Troubleshooting

### Frontend nao carrega (403/404)
```bash
# Verificar permissoes
ssh clinica-vps "ls -la /root/Clinica/frontend/build/index.html"
ssh clinica-vps "chmod o+x /root /root/Clinica /root/Clinica/frontend /root/Clinica/frontend/build"
ssh clinica-vps "systemctl reload nginx"
```

### Build falha por TypeScript
```bash
# react-scripts usa TS 4.9, i18next exige TS 5
ssh clinica-vps "cd /root/Clinica/frontend && npm install --legacy-peer-deps"
```

### Webhook nao inicia
```bash
ssh clinica-vps "cd /root/Clinica/webhook && docker compose logs --tail 30"
# Verificar .env existe
ssh clinica-vps "ls /root/Clinica/webhook/.env"
```

### Limpeza Docker (apos deploy)
```bash
ssh clinica-vps "docker image prune -f"
```

---

*Atualizado: 13/02/2026*
