# Servidor VPS - Essence Medical Clinic

## Acesso Rápido

```bash
# SSH
ssh clinica-vps

# Portainer (Docker UI)
http://217.216.81.92:9000
User: admin
Pass: 2026projectessence@
```

## Dados do Servidor

| Campo | Valor |
|-------|-------|
| **IP** | 217.216.81.92 |
| **IPv6** | 2605:a143:2306:4648::1/64 |
| **User** | root |
| **Região** | US-east (Orangeburg, SC) |
| **OS** | Ubuntu 24.04.3 LTS |![image_20260204_200850_001.png](./.clipshot/image_20260204_200850_001.png)![image_20260204_201532_001.png](./.clipshot/image_20260204_201532_001.png)![image_20260204_203931_001.png](./.clipshot/image_20260204_203931_001.png)
| **CPU** | 8 cores |
| **RAM** | 24 GB |
| **Disco** | 400 GB SSD |
| **Provedor** | Contabo |
| **Vencimento** | Fevereiro 2027 |

## Chaves SSH

```
Privada: ~/.ssh/clinica_vps
Pública: ~/.ssh/clinica_vps.pub
```

---

## Deploy da Aplicação

### Estrutura

```
/root/Clinica/
├── supabase/           # Stack Supabase (13 serviços)
│   ├── docker-compose.yml
│   └── .env
├── evolution/          # Stack Evolution API (3 serviços)
│   ├── docker-compose.yml
│   └── .env
├── frontend/           # React App
│   ├── Dockerfile
│   ├── .env
│   └── build/          # Build de produção
└── nginx/              # Reverse Proxy
    └── nginx.conf
```

### Primeiro Deploy

```bash
# 1. Conectar ao VPS
ssh clinica-vps

# 2. Clonar repositório
cd /root
git clone https://github.com/SEU_USUARIO/Clinica.git
cd Clinica

# 3. Configurar variáveis de ambiente
# Editar: supabase/.env, evolution/.env, frontend/.env

# 4. Subir Supabase
cd supabase
docker compose up -d

# 5. Subir Evolution API
cd ../evolution
docker compose up -d

# 6. Build e servir frontend
cd ../frontend
npm install
npm run build
# Servir com nginx ou container
```

### Atualizar Deploy

```bash
# Do computador local:
ssh clinica-vps "cd /root/Clinica && git pull && \
  cd frontend && npm install && npm run build && \
  cd ../supabase && docker compose restart && \
  cd ../evolution && docker compose restart"
```

---

## Comandos Úteis

### Docker
```bash
# Ver todos os containers
docker ps -a

# Ver logs
docker logs <container> --tail 100 -f

# Reiniciar container
docker restart <container>

# Ver uso de recursos
docker stats --no-stream

# Limpar recursos não usados
docker system prune -a
```

### Stacks
```bash
# Supabase
cd /root/Clinica/supabase
docker compose up -d      # Iniciar
docker compose down       # Parar
docker compose logs -f    # Ver logs
docker compose restart    # Reiniciar

# Evolution
cd /root/Clinica/evolution
docker compose up -d
docker compose down
docker compose logs -f
```

### Banco de Dados
```bash
# Acessar PostgreSQL do Supabase
docker exec -it supabase-db psql -U postgres

# Backup
docker exec supabase-db pg_dump -U postgres > backup.sql

# Restore
cat backup.sql | docker exec -i supabase-db psql -U postgres
```

---

## Portas

| Porta | Serviço |
|-------|---------|
| 22 | SSH |
| 80 | HTTP (nginx) |
| 443 | HTTPS (nginx) |
| 3001 | Supabase Studio |
| 4000 | Supabase Analytics |
| 5432 | PostgreSQL |
| 8000 | Supabase API (Kong) |
| 8082 | Evolution API |
| 9000 | Portainer HTTP |
| 9443 | Portainer HTTPS |

---

## Troubleshooting

### Container não inicia
```bash
docker logs <container> --tail 50
docker inspect <container>
```

### Erro de permissão
```bash
chmod -R 755 /root/Clinica
chown -R root:root /root/Clinica
```

### Disco cheio
```bash
df -h
docker system prune -a
```

### Memória insuficiente
```bash
free -h
docker stats --no-stream
# Parar containers não essenciais
```
