# Deploy - Guia Prático

## Requisitos
- VPS com Docker instalado
- SSH configurado
- Repositório clonado

---

## Passo a Passo

### 1. Clonar no VPS
```bash
ssh clinica-vps
cd /root
git clone <repo> Clinica
```

### 2. Copiar .env de produção
```bash
# Do local para o VPS
scp frontend/.env.production clinica-vps:/root/Clinica/frontend/.env
scp supabase/.env.production clinica-vps:/root/Clinica/supabase/.env
scp evolution/.env.production clinica-vps:/root/Clinica/evolution/.env
```

### 3. Subir Supabase
```bash
ssh clinica-vps "cd /root/Clinica/supabase && docker compose up -d"
```

### 4. Subir Evolution
```bash
ssh clinica-vps "cd /root/Clinica/evolution && docker compose up -d"
```

### 5. Build Frontend
```bash
ssh clinica-vps "cd /root/Clinica/frontend && npm install && npm run build"
ssh clinica-vps "npm install -g serve"
ssh clinica-vps "nohup serve -s /root/Clinica/frontend/build -l 3000 > /var/log/frontend.log 2>&1 &"
```

---

## Problemas Comuns

### vector.yml é diretório
```bash
# Erro: "Is a directory (os error 21)"
# Solução:
docker compose down
rm -rf volumes/logs/vector.yml
# Copiar arquivo correto do repo local
scp supabase/volumes/logs/vector.yml clinica-vps:/root/Clinica/supabase/volumes/logs/
docker compose up -d
```

### Functions não encontradas
```bash
# Erro: "could not find an appropriate entrypoint"
# Solução:
scp -r supabase/volumes/functions/* clinica-vps:/root/Clinica/supabase/volumes/functions/
docker restart supabase-edge-functions
```

### Node.js não instalado
```bash
ssh clinica-vps "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
```

---

## Verificar Status

```bash
# Todos os containers
ssh clinica-vps "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Testar APIs
curl http://217.216.81.92:8000/rest/v1/
curl http://217.216.81.92:8082/

# Logs de erro
ssh clinica-vps "docker logs supabase-kong --tail 20"
ssh clinica-vps "docker logs evolution_api --tail 20"
```

---

## Rede Docker

```
Container → Container = Nome do container (nunca muda)
Exemplo: supabase-db:5432, evolution_api:8080

Externo → Sistema = IP ou domínio (muda conforme ambiente)
Exemplo: localhost:8000 → 217.216.81.92:8000
```

---

## Futuro: SSL + Domínio

```bash
# Quando tiver domínio configurado:
apt install certbot python3-certbot-nginx -y
certbot --nginx -d essencemedicalclinic.com

# Atualizar .env com HTTPS
SITE_URL=https://essencemedicalclinic.com
API_EXTERNAL_URL=https://essencemedicalclinic.com
```

---

*Atualizado: 05/02/2026*
