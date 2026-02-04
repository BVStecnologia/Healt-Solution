# CLAUDE.md - Essence Medical Clinic

Este arquivo documenta toda a arquitetura, funcionalidades e padrões do sistema de gestão da clínica médica.

## Visão Geral do Projeto

**Essence Medical Clinic** - Sistema completo de gestão de clínica médica com:
- Portal do Paciente (agendamento, histórico, perfil)
- Painel Administrativo (gestão completa)
- Integração WhatsApp (Evolution API)
- Autenticação via Supabase (email/senha + Google OAuth)

### Identidade Visual
- **Cor Primária:** #92563E (Marrom terracota)
- **Cor Secundária:** #8C8B8B (Cinza)
- **Background:** #FAF8F6 (Bege claro)
- **Fontes:** Italiana (headings) + Raleway (body)

---

## Comandos Principais

```bash
# ==================
# DOCKER (tudo junto)
# ==================
docker compose up -d              # Subir tudo (Supabase + Evolution)
docker compose down               # Parar tudo
docker compose logs -f            # Ver logs de tudo
docker compose logs -f evolution-api  # Logs específico
docker compose ps                 # Status dos containers

# ==================
# MIGRAÇÕES
# ==================
./scripts/migrate.sh local        # Aplicar migrações (local)
./scripts/migrate.sh vps          # Aplicar migrações (VPS)

# Verificar status
docker exec -i supabase-db psql -U postgres -d postgres \
  -c "SELECT * FROM schema_migrations ORDER BY version;"

# ==================
# BANCO DE DADOS
# ==================
docker exec -it supabase-db psql -U postgres -d postgres  # Shell SQL

# ==================
# FRONTEND
# ==================
cd frontend && npm install && npm start   # Dev
cd frontend && npm run build              # Build produção

# ==================
# DEPLOY VPS
# ==================
git push                          # Envia código
ssh clinica-vps "cd /root/Clinica && git pull"
ssh clinica-vps "cd /root/Clinica && ./scripts/migrate.sh vps"
ssh clinica-vps "cd /root/Clinica && docker compose up -d"
```

---

## Arquitetura

### Stack Tecnológico
| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Styled Components + React Router v7 |
| Backend | Supabase Self-hosted (PostgreSQL 15 + GoTrue + PostgREST + Realtime) |
| Comunicação | Evolution API (WhatsApp), Twilio (SMS), Resend (Email) |
| Infraestrutura | Docker Compose (16 services), Nginx, Let's Encrypt SSL |
| Calendário | react-big-calendar + date-fns |
| Ícones | Lucide React |

### Estrutura do Projeto
```
Clinica/
├── docker-compose.yml      # Compose unificado (Supabase + Evolution)
├── .env                    # Variáveis ativas (não commitar)
├── .env.local              # Template dev
├── .env.production         # Template produção
├── frontend/               # React app
├── supabase/               # Configs e migrations
├── scripts/                # migrate.sh
└── docs/                   # Documentação
```

### Estrutura de Diretórios
```
frontend/src/
├── components/
│   ├── admin/              # AdminLayout, AdminSidebar, AdminProtectedRoute
│   ├── scheduling/         # AppointmentCard, TimeSlotPicker, ProviderSelect
│   ├── ui/                 # Button, Card, Badge (componentes reutilizáveis)
│   ├── LanguageSwitcher.tsx
│   ├── LoadingSpinner.tsx
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── context/
│   ├── AuthContext.tsx     # Autenticação Supabase + roles
│   ├── LanguageContext.tsx # i18n (PT/EN/ES)
│   └── LoadingContext.tsx
├── hooks/
│   ├── useAppointments.ts  # CRUD de agendamentos
│   ├── useAvailability.ts  # Slots disponíveis
│   ├── useEligibility.ts   # Verificação de elegibilidade
│   ├── useProviders.ts     # Lista de médicos
│   └── admin/
│       └── useWhatsAppNotifications.ts  # Notificações WhatsApp
├── lib/
│   ├── supabaseClient.ts   # Cliente Supabase + callRPC helper
│   ├── adminService.ts     # Serviços administrativos
│   └── whatsappService.ts  # Envio de mensagens WhatsApp
├── pages/
│   ├── admin/              # Painel Admin (ver seção Rotas)
│   ├── scheduling/         # Agendamento do paciente
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── Dashboard.tsx
├── styles/
│   └── GlobalStyle.ts      # Theme + cores + tipografia
└── types/
    └── database.ts         # Tipos TypeScript do Supabase

supabase/
├── migrations/
│   ├── 000_schema_migrations.sql    # Controle de versões
│   ├── 001_scheduling_tables.sql    # Schema + RLS + Functions
│   └── 002_whatsapp_notifications.sql # WhatsApp + templates
├── volumes/functions/      # Edge Functions
└── docker-compose.yml      # 13 serviços Supabase

scripts/
└── migrate.sh              # Script de migrações (local/vps)
```

---

## Rotas da Aplicação

### Portal do Paciente
| Rota | Componente | Descrição |
|------|------------|-----------|
| `/login` | LoginPage | Login com email/senha ou Google |
| `/register` | RegisterPage | Cadastro de novo paciente |
| `/` | Dashboard | Dashboard do paciente |
| `/appointments` | AppointmentsPage | Lista de consultas |
| `/appointments/new` | NewAppointmentPage | Agendar nova consulta |
| `/appointments/:id` | AppointmentDetailPage | Detalhes da consulta |

### Painel Administrativo
| Rota | Componente | Descrição |
|------|------------|-----------|
| `/admin/login` | AdminLoginPage | Login admin |
| `/admin` | AdminDashboard | Dashboard com estatísticas e status WhatsApp |
| `/admin/calendar` | CalendarPage | Calendário de consultas (mês/semana/dia) |
| `/admin/appointments` | AdminAppointmentsPage | Lista de todas consultas |
| `/admin/patients` | PatientsPage | Lista de pacientes |
| `/admin/patients/:id` | PatientProfilePage | **Ficha completa do paciente** |
| `/admin/providers` | ProvidersPage | CRUD de médicos |
| `/admin/admins` | AdminsPage | CRUD de administradores |
| `/admin/whatsapp` | WhatsAppPage | Configuração Evolution API |

---

## Banco de Dados

### Tabelas Principais

#### `profiles` (Perfis de Usuário)
```sql
id                UUID PRIMARY KEY  -- FK para auth.users
email             TEXT NOT NULL
role              user_role         -- 'patient' | 'provider' | 'admin'
first_name        TEXT NOT NULL
last_name         TEXT NOT NULL
phone             TEXT
patient_type      patient_type      -- 'new' | 'trt' | 'hormone' | 'general' | 'vip'
last_visit_at     TIMESTAMPTZ       -- Atualizado automaticamente quando consulta = completed
labs_completed_at TIMESTAMPTZ       -- Data dos últimos exames
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

#### `providers` (Médicos)
```sql
id          UUID PRIMARY KEY
user_id     UUID FK profiles(id)  -- Perfil do médico
specialty   TEXT NOT NULL         -- Especialidade
bio         TEXT                  -- Biografia
is_active   BOOLEAN DEFAULT true  -- Ativo/Inativo
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

#### `provider_schedules` (Horários dos Médicos)
```sql
id            UUID PRIMARY KEY
provider_id   UUID FK providers(id)
day_of_week   INTEGER              -- 0=Domingo, 1=Segunda, ..., 6=Sábado
start_time    TIME                 -- Horário início (ex: 08:00)
end_time      TIME                 -- Horário fim (ex: 18:00)
slot_duration INTEGER DEFAULT 30   -- Duração do slot em minutos
is_active     BOOLEAN DEFAULT true
```

#### `appointments` (Consultas)
```sql
id                  UUID PRIMARY KEY
patient_id          UUID FK profiles(id)
provider_id         UUID FK providers(id)
type                appointment_type    -- Tipo de consulta
status              appointment_status  -- Status atual
scheduled_at        TIMESTAMPTZ         -- Data/hora agendada
duration            INTEGER DEFAULT 30  -- Duração em minutos
notes               TEXT                -- Observações
cancelled_at        TIMESTAMPTZ
cancellation_reason TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### ENUMs

#### `user_role`
- `patient` - Paciente
- `provider` - Médico/Prestador
- `admin` - Administrador

#### `patient_type`
- `new` - Novo paciente (verde)
- `general` - Paciente geral (marrom)
- `trt` - Paciente TRT (roxo)
- `hormone` - Paciente hormonal (rosa)
- `vip` - Paciente VIP (dourado)

#### `appointment_type`
| Tipo | Descrição | Duração |
|------|-----------|---------|
| `initial_consultation` | Consulta Inicial | 60 min |
| `follow_up` | Retorno | 30 min |
| `hormone_check` | Avaliação Hormonal | 45 min |
| `lab_review` | Revisão de Exames | 20 min |
| `nutrition` | Nutrição | 45 min |
| `health_coaching` | Health Coaching | 30 min |
| `therapy` | Terapia | 50 min |
| `personal_training` | Personal Training | 60 min |

#### `appointment_status`
```
pending → confirmed → checked_in → in_progress → completed
              ↓                                      ↓
          cancelled                               no_show
```

### Funções RPC (PostgreSQL)

| Função | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `get_available_slots` | provider_id, date, type | TimeSlot[] | Retorna slots disponíveis |
| `check_patient_eligibility` | patient_id, type | EligibilityResult | Verifica elegibilidade |
| `create_appointment` | patient_id, provider_id, type, scheduled_at, notes | Appointment | Cria agendamento com validação |
| `get_patient_appointments` | patient_id | Appointment[] | Lista consultas do paciente |
| `is_admin` | - | boolean | Verifica se usuário é admin |
| `update_patient_last_visit` | - | trigger | Atualiza last_visit_at ao completar consulta |

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado:
- **Pacientes:** Veem apenas seus próprios dados
- **Providers:** Veem consultas onde são o médico
- **Admins:** Acesso total via função `is_admin()`

---

## Controle de Migrações

### Tabela `schema_migrations`
Registra quais migrações foram aplicadas em cada ambiente.

```sql
CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,   -- "001", "002"
  name TEXT,                  -- "scheduling_tables"
  applied_at TIMESTAMPTZ
);
```

### Migrações Existentes

| Versão | Nome | Descrição |
|--------|------|-----------|
| 000 | schema_migrations | Tabela de controle |
| 001 | scheduling_tables | Profiles, providers, appointments, RLS, RPCs |
| 002 | whatsapp_notifications | Instâncias, templates, logs de mensagens |

### Aplicar Migrações

**Local:**
```bash
./scripts/migrate.sh local
```

**VPS:**
```bash
./scripts/migrate.sh vps
```

**Manual (SQL direto):**
```bash
docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/002_whatsapp_notifications.sql
```

### Verificar Status
```bash
docker exec -i supabase-db psql -U postgres -d postgres -c "SELECT * FROM schema_migrations ORDER BY version;"
```

### Criar Nova Migração
1. Criar arquivo `supabase/migrations/XXX_nome.sql`
2. Adicionar no final: `INSERT INTO schema_migrations (version, name) VALUES ('XXX', 'nome');`
3. Rodar `./scripts/migrate.sh`

### Rollback
Criar script manual `XXX_nome_down.sql` com os DROPs necessários.

---

## Regras de Negócio

### Elegibilidade para Agendamento

| Tipo de Paciente | Regras |
|------------------|--------|
| `new` | Só pode agendar `initial_consultation` |
| `trt` / `hormone` | Requer exames (labs) nos últimos 6 meses + visita médica nos últimos 6 meses |
| `general` / `vip` | Sem restrições |

### Validações de Agendamento
- Mínimo 24h de antecedência
- Máximo 1 consulta por dia por paciente
- Slot deve estar disponível (provider_schedules)
- Não pode conflitar com outro agendamento do mesmo provider

### Fluxo de Status
1. **pending** - Aguardando confirmação
2. **confirmed** - Confirmada pela clínica
3. **checked_in** - Paciente fez check-in
4. **in_progress** - Consulta em andamento
5. **completed** - Finalizada (atualiza `last_visit_at`)
6. **cancelled** - Cancelada
7. **no_show** - Paciente não compareceu

---

## Integrações

### Evolution API (WhatsApp)
```
URL: http://localhost:8082
API Key: configurada em .env (EVOLUTION_API_KEY)
```

**Endpoints usados:**
- `GET /instance/fetchInstances` - Listar instâncias
- `GET /instance/connectionState/:name` - Status da conexão
- `GET /instance/connect/:name` - Gerar QR Code
- `POST /instance/create` - Criar nova instância
- `DELETE /instance/delete/:name` - Deletar instância

### Supabase Auth
- Email/Senha
- Google OAuth (configurar no Supabase Dashboard)

**IMPORTANTE:** Ao criar usuário via Google OAuth, o profile deve ser criado automaticamente ou manualmente (verificar trigger/função).

---

## Padrões de Código

### Custom Hooks
```typescript
const { data, loading, error, refetch, create, update } = useHookName();
```

### Chamadas RPC
```typescript
import { callRPC } from '../lib/supabaseClient';
const result = await callRPC<ReturnType>('function_name', { param1, param2 });
```

### Styled Components
```typescript
import styled from 'styled-components';
import { theme } from '../../styles/GlobalStyle';

const Component = styled.div`
  background: ${theme.colors.surface};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.xl};
`;
```

### Animações
```typescript
import { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;
```

---

## Variáveis de Ambiente

### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=http://localhost:8000
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

### Backend (supabase/.env)
```env
POSTGRES_PASSWORD=sua-senha-segura
JWT_SECRET=seu-jwt-secret-super-secreto
ANON_KEY=eyJ...
SERVICE_ROLE_KEY=eyJ...
EVOLUTION_API_KEY=sua-chave-evolution
```

---

## Rede Docker

### Comunicação Interna
- Frontend → `supabase-kong:8000`
- Qualquer serviço → `supabase-db:5432`

### Portas Expostas
| Porta | Serviço |
|-------|---------|
| 3000 | Frontend React |
| 8000 | Supabase API (Kong) |
| 8082 | Evolution API (WhatsApp) |
| 5432 | PostgreSQL |

---

## Funcionalidades Implementadas

### Dashboard Admin
- [x] Estatísticas (pacientes, médicos, consultas pendentes, consultas hoje)
- [x] Lista de consultas pendentes com aprovação/rejeição
- [x] Status do WhatsApp em tempo real (polling 10s)
- [x] Número conectado exibido

### Calendário
- [x] Visualização mês/semana/dia/agenda
- [x] Cores por status de consulta
- [x] Legenda de status
- [x] Navegação por URL (?view=week&date=2026-02-04)
- [x] Modal de detalhes ao clicar no evento
- [x] Botões: Confirmar, Cancelar, Ver Ficha

### Gestão de Pacientes
- [x] Lista com busca e filtro por tipo
- [x] Estatísticas por tipo de paciente
- [x] Edição de dados
- [x] **Ficha completa** (`/admin/patients/:id`):
  - Header com avatar colorido por tipo
  - Dados pessoais e médicos
  - Estatísticas de consultas
  - Próximas consultas agendadas
  - Histórico de consultas

### Gestão de Médicos
- [x] CRUD completo
- [x] Vinculação com profile
- [x] Especialidade e bio
- [x] Ativar/Desativar

### Gestão de Admins
- [x] CRUD completo
- [x] Lista de administradores

### WhatsApp
- [x] Lista de instâncias
- [x] Criar nova instância
- [x] Conectar (QR Code)
- [x] Desconectar
- [x] Deletar instância
- [x] Status em tempo real

### Internacionalização
- [x] Português (padrão)
- [x] Inglês
- [x] Espanhol
- [x] Seletor de idioma fixo no canto

---

## TODO / Pendências

### Crítico para Produção
- [ ] Configurar Google OAuth no Supabase
- [ ] Trigger para criar profile automático em novo usuário
- [ ] Configurar HTTPS/SSL para produção
- [ ] Variáveis de ambiente de produção
- [ ] Backup automático do banco

### Funcionalidades Futuras
- [ ] Envio de lembretes por WhatsApp (Edge Function + Cron)
- [x] Confirmação de consulta por WhatsApp
- [x] Histórico de mensagens (message_logs)
- [ ] Upload de documentos/exames
- [ ] Relatórios e analytics
- [ ] Notificações push
- [ ] Pagamentos online

### Melhorias
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Logs estruturados
- [ ] Monitoramento (Sentry, etc)

---

## Dados de Demonstração

### Usuários Admin
```
Email: valdair3d@gmail.com
Role: admin
```

### Médicos de Teste
- Dr. Carlos Mendes (dr.carlos@teste.com)
- Dra. Ana Costa (dr.ana.costa@teste.com)
- Dr. Pedro Santos (dr.pedro.santos@teste.com)

### Pacientes de Teste
- 10 pacientes criados com diferentes tipos (new, general, trt, hormone, vip)
- Emails: joao.pereira@email.com, ana.souza@email.com, etc.
- Senha demo: `demo123456`

---

## Servidor de Produção (VPS)

### Acesso SSH
```bash
# Conexão rápida (configurado em ~/.ssh/config)
ssh clinica-vps

# Conexão completa
ssh -i ~/.ssh/clinica_vps root@217.216.81.92
```

### Dados do Servidor
| Campo | Valor |
|-------|-------|
| **IP** | 217.216.81.92 |
| **Região** | US-east (Orangeburg, SC) |
| **OS** | Ubuntu 24.04.3 LTS |
| **CPU** | 8 cores |
| **RAM** | 24 GB |
| **Disco** | 400 GB SSD |
| **Provedor** | Contabo |

### Portainer (Gerenciador Docker)
| Campo | Valor |
|-------|-------|
| **URL** | http://217.216.81.92:9000 |
| **Usuário** | admin |
| **Senha** | 2026projectessence@ |

### Comandos Úteis VPS
```bash
# Ver containers
ssh clinica-vps "docker ps"

# Ver logs
ssh clinica-vps "docker logs <container>"

# Reiniciar
ssh clinica-vps "docker restart <container>"

# Ver uso de recursos
ssh clinica-vps "docker stats --no-stream"
```

---

## Deploy para Produção

### Estrutura das Stacks

O projeto usa **3 stacks** Docker separadas:

| Stack | Serviços | Porta |
|-------|----------|-------|
| **supabase** | db, kong, auth, rest, realtime, storage, imgproxy, meta, functions, analytics, vector, supavisor, studio | 8000, 5432, 3001, 4000 |
| **evolution** | api, db (postgres), redis | 8082 |
| **frontend** | nginx + react build | 80, 443 |

### Passo a Passo do Deploy

#### 1. Clonar Repositório no VPS
```bash
ssh clinica-vps
cd /root
git clone https://github.com/SEU_USUARIO/Clinica.git
cd Clinica
```

#### 2. Configurar Variáveis de Ambiente

**supabase/.env** - Alterar para produção:
```env
# Mudar URLs para o domínio/IP público
SITE_URL=https://seudominio.com
API_EXTERNAL_URL=https://seudominio.com
SUPABASE_PUBLIC_URL=https://seudominio.com

# Google OAuth - Atualizar redirect URI
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://seudominio.com/auth/v1/callback

# IMPORTANTE: Gerar novas chaves para produção!
# Usar: openssl rand -base64 32
POSTGRES_PASSWORD=<nova_senha_segura>
JWT_SECRET=<novo_jwt_secret_32_chars>
```

**evolution/.env** - Alterar para produção:
```env
EVOLUTION_API_KEY=<sua_chave_segura>
POSTGRES_PASSWORD=<senha_evolution>
```

**frontend/.env** - Alterar para produção:
```env
REACT_APP_SUPABASE_URL=https://seudominio.com
REACT_APP_SUPABASE_ANON_KEY=<mesma_anon_key_do_supabase>
```

#### 3. Build do Frontend para Produção
```bash
cd /root/Clinica/frontend
npm install
npm run build
```

#### 4. Subir Stacks via Portainer

**Opção A - Via Portainer UI:**
1. Acessar http://217.216.81.92:9000
2. Ir em Stacks > Add Stack
3. Colar conteúdo do docker-compose.yml
4. Configurar variáveis de ambiente
5. Deploy

**Opção B - Via CLI:**
```bash
# Stack Supabase
cd /root/Clinica/supabase
docker compose up -d

# Stack Evolution
cd /root/Clinica/evolution
docker compose up -d
```

#### 5. Configurar Nginx + SSL (Produção com Domínio)
```bash
# Instalar certbot
apt install certbot python3-certbot-nginx -y

# Gerar certificado SSL
certbot --nginx -d seudominio.com

# Configurar nginx
cp /root/Clinica/nginx/nginx.conf /etc/nginx/nginx.conf
nginx -t && systemctl reload nginx
```

### Deploy Rápido (Sem Domínio - Apenas IP)

Para teste rápido usando apenas IP (sem SSL):

```bash
ssh clinica-vps "cd /root/Clinica && git pull"

# Rebuild frontend
ssh clinica-vps "cd /root/Clinica/frontend && npm install && npm run build"

# Restart stacks
ssh clinica-vps "cd /root/Clinica/supabase && docker compose down && docker compose up -d"
ssh clinica-vps "cd /root/Clinica/evolution && docker compose down && docker compose up -d"
```

### Verificar Deploy
```bash
# Status dos containers
ssh clinica-vps "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# Logs de erro
ssh clinica-vps "docker logs supabase-kong --tail 50"
ssh clinica-vps "docker logs evolution_api --tail 50"

# Testar API
curl http://217.216.81.92:8000/rest/v1/
curl http://217.216.81.92:8082/api/health
```

### Rollback
```bash
# Voltar para versão anterior
ssh clinica-vps "cd /root/Clinica && git checkout HEAD~1"

# Rebuild e restart
ssh clinica-vps "cd /root/Clinica/supabase && docker compose down && docker compose up -d"
```

---

## Troubleshooting

### Erro 406 no Supabase
Usuário existe em `auth.users` mas não tem `profile`. Criar manualmente:
```sql
INSERT INTO profiles (id, email, role, first_name, last_name)
VALUES ('uuid-do-usuario', 'email@exemplo.com', 'admin', 'Nome', 'Sobrenome');
```

### WhatsApp não conecta
1. Verificar se Evolution API está rodando: `docker logs evolution-api`
2. Verificar API Key em `EVOLUTION_API_KEY`
3. Criar nova instância se necessário

### Frontend não carrega dados
1. Verificar console do browser (F12)
2. Verificar se Supabase está rodando: `docker ps`
3. Verificar RLS policies se retornar vazio

---

*Última atualização: Fevereiro 2026*
