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

### 5. Subir Webhook (WhatsApp Bot)
```bash
scp webhook/.env.production clinica-vps:/root/Clinica/webhook/.env
ssh clinica-vps "cd /root/Clinica/webhook && docker compose up -d --build"
```

### 6. Build Frontend
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

## Futuro: SSL + Domínio (Subdomínio)

O domínio `essencemedicalclinic.com` já está em uso pelo site institucional.
Será criado um **subdomínio** para o sistema (aguardando resposta do cliente).

### Opção recomendada: subdomínio único
```
app.essencemedicalclinic.com → Nginx reverse proxy
  /              → Frontend React (porta 3000)
  /api/          → Supabase Kong (porta 8000)
  /go/           → Webhook shortener (porta 3002)
```

### Opção alternativa: múltiplos subdomínios
```
app.essencemedicalclinic.com   → Frontend React
api.essencemedicalclinic.com   → Supabase Kong
wa.essencemedicalclinic.com    → Webhook server (shortener + bot)
```

### Configuração SSL
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d app.essencemedicalclinic.com
```

### Variáveis de ambiente para produção (com subdomínio)

**supabase/.env**
```env
SITE_URL=https://app.essencemedicalclinic.com
API_EXTERNAL_URL=https://app.essencemedicalclinic.com
SUPABASE_PUBLIC_URL=https://app.essencemedicalclinic.com
```

**frontend/.env**
```env
REACT_APP_SUPABASE_URL=https://app.essencemedicalclinic.com
```

**webhook/.env**
```env
PANEL_BASE_URL=https://app.essencemedicalclinic.com
SUPABASE_PUBLIC_URL=https://app.essencemedicalclinic.com
SHORTENER_BASE_URL=https://app.essencemedicalclinic.com
```

> Os links do WhatsApp ficarão como:
> `https://app.essencemedicalclinic.com/go/LE_HcQ`
> (clicáveis + preview automático no WhatsApp)

---

*Atualizado: 06/02/2026*
