# Servidor VPS - Essence Medical Clinic

> Espelho do estado de produção para comparação antes de deploy

## Acesso Rápido

```bash
# SSH
ssh clinica-vps

# Portainer (Docker UI)
http://217.216.81.92:9000
User: admin
Pass: 2026projectessence@

# URLs
http://217.216.81.92:3000    # Frontend
http://217.216.81.92:8000    # Supabase API
http://217.216.81.92:8082    # Evolution API
http://217.216.81.92:3001    # Supabase Studio
```

## Dados do Servidor

| Campo | Valor |
|-------|-------|
| **IP** | 217.216.81.92 |
| **User** | root |
| **OS** | Ubuntu 24.04.3 LTS |
| **CPU** | 8 cores |
| **RAM** | 24 GB |
| **Disco** | 400 GB SSD |
| **Provedor** | Contabo |

---

## 📊 Status das Stacks

| Stack | Containers | Status | Detalhes |
|-------|------------|--------|----------|
| **Supabase** | 13 | ✅ Online | [Ver versões](./supabase/VERSOES.md) |
| **Evolution** | 3 | ✅ Online | [Ver versões](./evolution/VERSOES.md) |
| **Frontend** | 1 | ✅ Online | [Ver versões](./frontend/VERSOES.md) |

---

## 🔄 Antes de Fazer Deploy

### 1. Comparar Versões

```bash
# Ver o que mudou localmente
git log origin/main..HEAD --oneline

# Ver o que falta no VPS
ssh clinica-vps "cd /root/Clinica && git fetch && git log HEAD..origin/main --oneline"
```

### 2. Verificar Migrations Pendentes

```bash
# Migrations aplicadas no VPS
ssh clinica-vps "docker exec supabase-db psql -U postgres -c 'SELECT * FROM schema_migrations;'"

# Migrations locais
ls supabase/migrations/
```

### 3. Atualizar Esta Pasta

Após cada deploy, atualizar os arquivos VERSOES.md com:
```bash
# Copiar versões atuais do VPS
ssh clinica-vps "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'"
```

---

## 🚀 Fazer Deploy

```bash
# 1. Push local para origin
git push origin main

# 2. Pull no VPS + rebuild
ssh clinica-vps "cd /root/Clinica && git pull && \
  cd frontend && npm install && npm run build"

# 3. Aplicar migrations (se houver)
ssh clinica-vps "cd /root/Clinica && bash scripts/migrate.sh"

# 4. Reiniciar containers (se necessário)
ssh clinica-vps "cd /root/Clinica/supabase && docker compose restart"
```

---

## 📁 Estrutura

```
Servidor/
├── README.md              # Este arquivo (visão geral)
├── supabase/
│   └── VERSOES.md         # Containers + Migrations
├── evolution/
│   └── VERSOES.md         # Containers + Config
└── frontend/
    └── VERSOES.md         # Git commit + Dependências
```

---

*Última atualização: 05/02/2026*
