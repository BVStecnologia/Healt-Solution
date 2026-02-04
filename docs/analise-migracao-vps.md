# Análise: Migração Local → VPS

## Pergunta Central
> As configurações entre Supabase e Evolution (e outros microserviços) precisam ser reconfiguradas ao migrar para VPS?

## Resposta Curta
**NÃO** para comunicação interna entre containers.
**SIM** apenas para URLs que o mundo externo acessa.

---

## Como Funciona a Rede Docker

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DOCKER NETWORK                              │
│                    (mesmo ambiente local ou VPS)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐  │
│   │  SUPABASE   │         │  EVOLUTION  │         │   FUTURO    │  │
│   │             │◄───────►│             │◄───────►│ MICROSERVIÇO│  │
│   │ supabase-db │         │ evolution_api│        │             │  │
│   │ :5432       │         │ :8080        │         │ :XXXX       │  │
│   └─────────────┘         └─────────────┘         └─────────────┘  │
│         ▲                       ▲                       ▲          │
│         │                       │                       │          │
│         └───────────────────────┴───────────────────────┘          │
│                    REDE INTERNA (bridge)                           │
│              Comunicação por NOME do container                     │
│                     NUNCA MUDA! ✅                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Portas expostas
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MUNDO EXTERNO                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   LOCAL:                        VPS:                                │
│   http://localhost:8000    →    https://api.clinica.com            │
│   http://localhost:8082    →    https://whatsapp.clinica.com       │
│   http://localhost:3000    →    https://app.clinica.com            │
│                                                                     │
│                    SÓ ISSO MUDA! ⚠️                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Análise Detalhada por Tipo de Comunicação

### 1. COMUNICAÇÃO INTERNA (Container ↔ Container)

| De | Para | URL | Muda na VPS? |
|----|------|-----|--------------|
| Evolution | Supabase DB | `postgresql://supabase-db:5432` | ❌ NÃO |
| Evolution | Supabase API | `http://supabase-kong:8000` | ❌ NÃO |
| Supabase Auth | Supabase DB | `postgresql://supabase-db:5432` | ❌ NÃO |
| Supabase Rest | Supabase DB | `postgresql://supabase-db:5432` | ❌ NÃO |
| Supabase Studio | Supabase Meta | `http://supabase-meta:8080` | ❌ NÃO |
| Qualquer serviço | Redis | `redis://evolution_redis:6379` | ❌ NÃO |

**Por quê não muda?**
- Docker cria uma rede virtual interna
- Containers se encontram pelo NOME (DNS interno)
- Funciona igual em qualquer lugar (local, VPS, AWS, etc.)

### 2. COMUNICAÇÃO EXTERNA (Usuário/Webhook → Sistema)

| Quem acessa | O quê | Local | VPS | Muda? |
|-------------|-------|-------|-----|-------|
| Navegador usuário | Frontend | localhost:3000 | app.clinica.com | ✅ SIM |
| Navegador usuário | Supabase Studio | localhost:8000 | api.clinica.com | ✅ SIM |
| Frontend (JS) | Supabase API | localhost:8000 | api.clinica.com | ✅ SIM |
| WhatsApp (webhook) | Evolution | localhost:8082 | whatsapp.clinica.com | ✅ SIM |
| Meta/Facebook | Evolution | localhost:8082 | whatsapp.clinica.com | ✅ SIM |

**Por quê muda?**
- São URLs que sistemas EXTERNOS precisam acessar
- WhatsApp precisa enviar webhooks para URL pública
- Navegador do usuário precisa acessar de fora

---

## Exemplo Prático: Configurações

### Evolution API - Conexão com Supabase

```yaml
# docker-compose.yml (IGUAL local e VPS)
evolution:
  environment:
    # Conexão INTERNA com banco do Supabase
    DATABASE_CONNECTION_URI: postgresql://postgres:senha@supabase-db:5432/postgres
    #                                                    ^^^^^^^^^^^
    #                                              Nome do container
    #                                              NUNCA MUDA!

    # URL EXTERNA (webhook do WhatsApp)
    SERVER_URL: ${SERVER_URL}  # ← Essa vem do .env
```

### Arquivos .env

```bash
# .env (LOCAL)
SERVER_URL=http://localhost:8082
SUPABASE_PUBLIC_URL=http://localhost:8000
SITE_URL=http://localhost:3000

# .env.production (VPS)
SERVER_URL=https://whatsapp.clinica.com
SUPABASE_PUBLIC_URL=https://api.clinica.com
SITE_URL=https://app.clinica.com
```

---

## O Que Precisa Fazer na Migração

### Não precisa fazer nada ✅
- Configurações de conexão entre containers
- URLs internas (supabase-db, evolution_api, redis, etc.)
- docker-compose.yml (95% igual)
- Estrutura do banco de dados
- Lógica do sistema

### Precisa ajustar ⚠️
| Arquivo | O que mudar |
|---------|-------------|
| `.env` | URLs públicas (SERVER_URL, SITE_URL, etc.) |
| `.env` | Senhas (usar mais fortes em produção) |
| Nginx | Configurar domínios e SSL |
| DNS | Apontar domínios para IP da VPS |

---

## Fluxo de Migração Simplificado

```
1. Copiar pasta do projeto para VPS
   └── scp -r Clinica/ user@vps:/home/

2. Criar .env.production
   └── Trocar localhost por domínios reais

3. Configurar Nginx + SSL
   └── Proxy reverso para os containers

4. Subir containers
   └── docker compose up -d

5. Configurar DNS
   └── api.clinica.com → IP da VPS
   └── whatsapp.clinica.com → IP da VPS

PRONTO! ✅
```

---

## Resumo Final

| Tipo de Configuração | Exemplo | Muda? |
|---------------------|---------|-------|
| Container → Container | `supabase-db:5432` | ❌ NUNCA |
| Container → Container | `evolution_api:8080` | ❌ NUNCA |
| Container → Container | `redis:6379` | ❌ NUNCA |
| Usuário → Sistema | `localhost:8000` → `api.clinica.com` | ✅ SIM |
| Webhook → Sistema | `localhost:8082` → `whatsapp.clinica.com` | ✅ SIM |

**Conclusão:**
Pode desenvolver 100% local. Na hora de migrar, só troca as URLs públicas no `.env` e configura o Nginx. A comunicação entre Supabase, Evolution e qualquer outro microserviço que adicionar **permanece idêntica**.

---

*Análise criada em: 04/02/2026*
