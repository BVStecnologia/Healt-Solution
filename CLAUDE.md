# CLAUDE.md - Essence Medical Clinic

Este arquivo documenta toda a arquitetura, funcionalidades e padrões do sistema de gestão da clínica médica.

## Visão Geral do Projeto

**Essence Medical Clinic** - Sistema completo de gestão de clínica médica com:
- Portal do Paciente (agendamento, histórico, perfil)
- Painel Administrativo (gestão completa)
- Integração WhatsApp (Evolution API)
- Autenticação via Supabase (email/senha + Google OAuth)

### Informações da Clínica
- **Nome:** Essence Medical Clinic
- **Endereço:** 2000 NE 44th ST, Suite 101B, Fort Lauderdale, FL 33308
- **Telefone:** +1 (954) 756-2565
- **Email:** team@essencemedicalclinic.com
- **Horário:** Mon-Fri 10am-6pm, Sat 11am-3pm (2x/month)
- **Site:** https://essencemedicalclinic.com
- **Lead Provider:** Dr. Rosane Nunes

### Identidade Visual
- **Manual da Marca:** WABOO Creative — [Google Drive](https://drive.google.com/drive/folders/1s6mm7RaJIo8742CBAcGZV_RwXcV4eMfi)
- **Material de Apoio (Design):** [Google Drive](https://drive.google.com/drive/folders/1hHPKdrL5EnxPosXNYAutslywFQ4Uwo09) — referência do Mateus para layout/UI
- **Cor Primária:** #92563E (Marrom terracota)
- **Cor Secundária:** #8C8B8B (Cinza)
- **Background:** #FAF8F6 (Bege claro)
- **Fonte:** Satoshi Variable (weight 200-900, sans-serif, geométrica) — via @font-face local
- **Logo:** SVGs oficiais em `public/images/logo-horizontal.svg` (dark) e `logo-horizontal-dark.svg` (light)
- **Componente:** `EssenceLogo` — variant (horizontal/vertical), color (dark/light), size (xs-xl)
- **Slogans:** "Your health begins with your essence", "Balance is the new beauty"
- **Tema:** Apenas claro (dark mode desabilitado, ThemeContext mantido para futuro)

> **REGRA PARA /frontend-design:** Ao usar o plugin frontend-design neste projeto, SEMPRE seguir a identidade visual acima (Satoshi, terracota #92563E, background #FAF8F6). NÃO criar designs "bold" ou "inesperados" que fujam da marca. Consultar os links do Google Drive para referência visual. O estilo é: refinado, médico-editorial, clean, warm, premium wellness.

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
# BACKUP
# ==================
ssh clinica-vps "cd /root/Clinica && bash scripts/backup.sh manual"     # Backup manual
ssh clinica-vps "cd /root/Clinica && bash scripts/backup.sh pre-deploy" # Backup pré-deploy
ssh clinica-vps "ls -1th /root/backups/db-*.sql.gz"                     # Listar backups
# Restaurar: gunzip < backup.sql.gz | docker exec -i supabase-db psql -U postgres -d postgres

# ==================
# DEPLOY VPS (usar skill /deploy para deploy assistido)
# ==================
git push                          # Envia código
ssh clinica-vps "cd /root/Clinica && git pull"
ssh clinica-vps "cd /root/Clinica && ./scripts/migrate.sh vps"  # Backup automático + transações
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
├── CLAUDE.md               # Arquitetura completa (este arquivo)
├── .env                    # Variáveis ativas (não commitar)
├── .env.example            # Template público
├── .env.production         # Template produção
├── frontend/               # React app
├── supabase/               # Configs e migrations
├── webhook/                # Bot WhatsApp (Express + cron)
├── evolution/              # Config Evolution API
├── scripts/                # migrate.sh, backup.sh
├── nginx/                  # Config Nginx VPS
├── docs/                   # Documentação, referências, manual da marca
└── Servidor/               # Espelho do estado VPS
```

### Regras de Organização (OBRIGATÓRIO)
- **Raiz limpa:** Na raiz só ficam: CLAUDE.md, .env*, .gitignore, e as pastas do projeto. NENHUM arquivo avulso (PDFs, HTMLs, imagens, YMLs de referência)
- **Pastas temporárias:** Deletar `.playwright-mcp/`, `.claude-images/`, `.clipshot/` após uso
- **Componentes:** Componentes reutilizáveis vão em `components/ui/`. Componentes de domínio vão na subpasta do domínio (`admin/`, `patient/`, `scheduling/`, `doctor/`). NADA solto na raiz de `components/` exceto Layout, ProtectedRoute, LanguageSwitcher, LoadingSpinner
- **Documentos/referências:** PDFs, YMLs de referência, manuais → `docs/`
- **Migrações:** Numeração sequencial SEM conflitos (nunca dois arquivos com mesmo número)

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
├── constants/
│   └── treatments.ts       # Source of truth: tipos de tratamento, categorias, patient types, clinic info
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
│   ├── auth/               # LoginPage, RegisterPage
│   ├── admin/              # Painel Admin (ver seção Rotas)
│   ├── patient/            # ProfilePage, SettingsPage, PatientDocumentsPage
│   ├── scheduling/         # Agendamento do paciente
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

webhook/src/
├── index.ts                # Express server + webhook routes
├── config.ts               # URLs Supabase, Evolution API, panel
├── types.ts                # Tipos compartilhados
├── scheduleManager.ts      # Supabase client (service_role_key)
├── whatsappResponder.ts    # sendMessage(), getTypeLabel(), formatDateShort()
├── commandParser.ts        # Parser de comandos WhatsApp
├── reminderScheduler.ts    # Cron job a cada 5 min (node-cron)
├── reminderSender.ts       # getTemplate(), sendReminder(), dedup
├── conversationState.ts    # Estado de conversação
├── patientHandler.ts       # Handler de pacientes
├── patientManager.ts       # Manager de pacientes
├── patientResponder.ts     # Responder para pacientes
├── retrySender.ts          # Retry de mensagens falhas (até 3 tentativas)
├── urlShortener.ts         # Encurtador de URLs
└── userIdentifier.ts       # Identificação de usuário

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
| `/admin/notifications` | NotificationRulesPage | Regras de lembrete para pacientes |
| `/admin/failed-messages` | FailedMessagesPage | Mensagens WhatsApp falhas com retry |
| `/admin/my-schedule` | MySchedulePage | Agenda dos médicos |

### Painel Médico
| Rota | Componente | Descrição |
|------|------------|-----------|
| `/doctor/login` | AdminLoginPage | Login médico |
| `/doctor` | AdminDashboard | Dashboard do médico |
| `/doctor/calendar` | CalendarPage | Calendário de consultas |
| `/doctor/appointments` | AdminAppointmentsPage | Consultas do médico |
| `/doctor/my-schedule` | MySchedulePage | Minha agenda |
| `/doctor/notifications` | NotificationRulesPage | Meus lembretes (auto-configurável) |

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
patient_type      patient_type      -- 'new' | 'wellness' | 'bhrt' | 'rejuvenation' | 'iv_therapy' | 'vip' (+ legados)
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

#### `treatment_types` (Referência de Tratamentos)
```sql
key               TEXT PRIMARY KEY      -- ex: 'morpheus8', 'bhrt'
label_pt          TEXT NOT NULL         -- "Morpheus8"
label_en          TEXT NOT NULL         -- "Morpheus8"
short_label_pt    TEXT NOT NULL         -- "Morpheus8" (abreviado)
short_label_en    TEXT NOT NULL
description_pt    TEXT
description_en    TEXT
category          TEXT NOT NULL         -- 'general' | 'wellbeing' | 'personalized' | 'rejuvenation' | 'iv_therapy'
duration_minutes  INTEGER NOT NULL      -- Duração real (usada pelo RPC create_appointment)
is_active         BOOLEAN DEFAULT true  -- false para tipos legados
sort_order        INTEGER DEFAULT 0
```

### ENUMs

#### `user_role`
- `patient` - Paciente
- `provider` - Médico/Prestador
- `admin` - Administrador

#### `patient_type`
**Ativos:**
- `new` - Novo Paciente (#10B981 verde)
- `wellness` - Bem-estar (#14B8A6 teal)
- `bhrt` - BHRT (#8B5CF6 roxo)
- `rejuvenation` - Rejuvenescimento (#EC4899 rosa)
- `iv_therapy` - Terapia IV (#3B82F6 azul)
- `vip` - VIP (#D4AF37 dourado)

**Legados (ocultos na UI):** `trt`, `hormone`, `general`

#### `appointment_type` (18 ativos + 6 legados)

Tipos organizados por categoria. Duração correta é buscada da tabela `treatment_types` pelo RPC `create_appointment`.

| Categoria | Tipo | Descrição | Duração |
|-----------|------|-----------|---------|
| **General** | `initial_consultation` | Consulta Inicial | 60 min |
| **General** | `follow_up` | Retorno | 30 min |
| **Well-being** | `functional_medicine` | Medicina Funcional | 60 min |
| **Well-being** | `bhrt` | BHRT | 45 min |
| **Well-being** | `male_hypertrophy` | Hipertrofia Masculina | 45 min |
| **Well-being** | `female_hypertrophy` | Hipertrofia Feminina | 45 min |
| **Personalized** | `insulin_resistance` | Resistência à Insulina | 45 min |
| **Personalized** | `chronic_inflammation` | Inflamação Crônica | 45 min |
| **Personalized** | `thyroid_support` | Suporte de Tireoide | 45 min |
| **Rejuvenation** | `morpheus8` | Morpheus8 | 60 min |
| **Rejuvenation** | `botulinum_toxin` | Toxina Botulínica | 30 min |
| **Rejuvenation** | `fillers` | Preenchimento | 45 min |
| **Rejuvenation** | `skin_boosters` | Skin Boosters | 30 min |
| **IV Therapy** | `iv_protocols` | Protocolos IV | 60 min |
| **IV Therapy** | `customized_iv_nutrition` | Nutrição IV Personalizada | 60 min |
| **IV Therapy** | `nutrient_testing` | Teste de Nutrientes | 30 min |
| **IV Therapy** | `nad_therapy` | Terapia NAD+ | 90 min |
| **IV Therapy** | `vitamin_injections` | Injeções de Vitaminas | 20 min |

**Legados (is_active=false):** `hormone_check`, `lab_review`, `nutrition`, `health_coaching`, `therapy`, `personal_training`

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
| 003 | admin_rls_policies | Políticas RLS para admins |
| 004 | avatar_url | Campo avatar_url nos profiles |
| 005 | add_preferred_language | Idioma preferido + templates EN |
| 006 | provider_notifications | Templates de notificação para médicos |
| 007 | provider_blocks | Bloqueios de agenda |
| 008 | admin_provider_schedules | Gestão de horários pelo admin |
| 009 | multiple_schedule_segments | Múltiplos turnos por dia |
| 010 | patient_theme | Tema escuro/claro do paciente |
| 011 | notification_rules | Regras de notificação configuráveis + templates provider_reminder_2h/15min |
| 012 | no_show_system | no_show_count, confirmed_by_patient_at, trigger auto-increment, templates no_show_patient/provider |
| 013 | auto_create_profile | Trigger on auth.users para auto-criar profile (Google OAuth + email/senha) |
| 014 | message_retry | retry_count e last_retry_at no message_logs + índice para retry |
| 015 | add_enum_values | Novos valores nos ENUMs appointment_type (16) e patient_type (4) |
| 016 | treatment_types | Tabela treatment_types + fix duração no create_appointment + elegibilidade novos patient_types |
| 017 | add_new_treatments_enum | Novos ENUMs: high_cortisol, iron_infusions, chelation_therapy + 8 peptide types |
| 018 | new_treatments_data | Dados dos novos tratamentos na tabela treatment_types |
| 019 | provider_view_patients | RLS para providers verem pacientes |
| 020 | patient_documents | Tabela patient_documents + Storage bucket + RLS |

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
| `new` | Só pode agendar `initial_consultation` ou `functional_medicine` |
| `bhrt` / `trt` / `hormone` | Requer exames (labs) nos últimos 6 meses para tratamentos hormonais (bhrt, male/female_hypertrophy, thyroid_support) |
| `wellness` / `rejuvenation` / `iv_therapy` / `vip` / `general` | Sem restrições |

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

### Tipos de Tratamento (Source of Truth)
```typescript
// SEMPRE importar de constants/treatments.ts — NUNCA criar mapas locais
import { getTreatmentLabel, getTreatmentShortLabel, getTreatmentDuration } from '../constants/treatments';
import { getPatientTypeLabel, getPatientTypeColor } from '../constants/treatments';
import { getTreatmentsByCategory, ACTIVE_TREATMENTS, CLINIC_INFO } from '../constants/treatments';

// Labels
getTreatmentLabel('morpheus8')       // "Morpheus8"
getTreatmentLabel('bhrt', 'en')      // "BHRT"
getTreatmentShortLabel('botulinum_toxin') // "Botox"

// Duração
getTreatmentDuration('nad_therapy')  // 90

// Categorias (para UI agrupada)
getTreatmentsByCategory()  // [{ category: CategoryInfo, treatments: TreatmentType[] }, ...]

// Patient types
getPatientTypeLabel('wellness')  // "Bem-estar"
getPatientTypeColor('bhrt')      // "#8B5CF6"
```

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

### Lembretes Automáticos (WhatsApp)
- [x] Tabela `notification_rules` com regras configuráveis
- [x] Cron job a cada 5 min no webhook (node-cron)
- [x] Deduplica por `message_logs` (appointment_id + template_name + phone)
- [x] Bilíngue (PT/EN) baseado no `preferred_language` do destinatário
- [x] Override: regra específica do médico substitui global (mesmo minutes_before)
- [x] UI Admin: `/admin/notifications` - CRUD de regras para pacientes
- [x] UI Médico: `/doctor/notifications` - "Meus Lembretes" (auto-configurável) + "Regras da Clínica" (read-only)
- [x] Templates: reminder_24h, reminder_1h, provider_reminder_2h, provider_reminder_15min, no_show_patient, no_show_provider

### Cancelamento Inteligente e No-Show
- [x] Bug fix: `rejection_reason` → `cancellation_reason` + `cancelled_at` no admin
- [x] Admin pede motivo via `window.prompt()` ao rejeitar consulta
- [x] Aviso de cancelamento tardio (<24h) no portal do paciente e WhatsApp
- [x] Link de reagendamento ({link}) nos templates de cancelamento
- [x] Detecção automática de no-show (30min após fim da consulta)
- [x] Notificação WhatsApp de no-show para paciente e médico
- [x] `no_show_count` no profiles com trigger auto-increment
- [x] Badge de no-show na lista de pacientes e ficha
- [x] Confirmação de presença via WhatsApp ("OK", "sim", "yes", "confirmo")
- [x] `confirmed_by_patient_at` registrado na appointments

### Confiabilidade WhatsApp (Retry + Monitoramento)
- [x] Webhook `sendMessage()` retorna `boolean` (sucesso/falha)
- [x] Falhas de envio gravadas no `message_logs` com `status: 'failed'`
- [x] Dedup ignora mensagens falhas (permite retry)
- [x] Retry automático: até 3 tentativas via cron (5min)
- [x] `retry_count` e `last_retry_at` no `message_logs` (migration 014)
- [x] Admin alertado via `window.alert` quando notificação WhatsApp falha
- [x] Página "Mensagens Falhas" (`/admin/failed-messages`) com retry manual
- [x] Sidebar admin: link "Msgs Falhas" na seção configurações

### Internacionalização
- [x] Português (padrão)
- [x] Inglês
- [x] Espanhol
- [x] Seletor de idioma fixo no canto

---

## TODO / Pendências

### Crítico para Produção
- [x] Configurar Google OAuth no Supabase (via nip.io — 217-216-81-92.nip.io)
- [x] Trigger para criar profile automático em novo usuário (migration 013)
- [ ] Configurar HTTPS/SSL para produção (precisa de domínio)
- [x] Variáveis de ambiente de produção (configuradas na VPS)
- [x] Backup pré-deploy (`scripts/backup.sh` + integrado no `migrate.sh`)

### Funcionalidades Futuras
- [x] Envio de lembretes por WhatsApp (webhook cron + notification_rules)
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

### Pasta `Servidor/` (Espelho do VPS)
A pasta `Servidor/` contém o estado atual de produção para comparar antes de deploy:
```
Servidor/
├── README.md              # Visão geral + comandos
├── supabase/VERSOES.md    # Containers + migrations aplicadas
├── evolution/VERSOES.md   # Containers + config
└── frontend/VERSOES.md    # Commit atual + pendentes
```
**Sempre consultar antes de deploy** para ver diferenças entre local e VPS.

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

## Backup e Segurança de Dados

### Estratégia de Backup
| Camada | O que protege | Frequência |
|--------|--------------|------------|
| **Contabo VPS** | Disco inteiro (OS + Docker + tudo) | Snapshots nativos (7 dias) |
| **scripts/backup.sh** | Banco PostgreSQL (pg_dump) | Antes de cada deploy |
| **migrate.sh** | Banco antes de migrações | Automático (VPS) |

### Scripts de Backup

**Backup manual:**
```bash
ssh clinica-vps "cd /root/Clinica && bash scripts/backup.sh manual"
```

**Backup pré-deploy (automático na skill /deploy):**
```bash
ssh clinica-vps "cd /root/Clinica && bash scripts/backup.sh pre-deploy"
```

**Listar backups:**
```bash
ssh clinica-vps "ls -1th /root/backups/db-*.sql.gz"
```

**Restaurar backup:**
```bash
ssh clinica-vps "gunzip < /root/backups/db-<arquivo>.sql.gz | docker exec -i supabase-db psql -U postgres -d postgres"
```

### Segurança do Versionamento
- `.gitignore` bloqueia todos `.env.*` (exceto `.env.example`)
- Repositório público — NUNCA commitar secrets
- `is_admin()` usa SECURITY DEFINER para evitar recursão RLS
- Migration 013: trigger auto-cria profile para Google OAuth

### Migrações Seguras
- `migrate.sh` executa cada migração dentro de BEGIN/COMMIT (transação)
- Flag `-v ON_ERROR_STOP=1` reverte automaticamente se houver erro
- Backup automático antes de migrações (ambiente VPS)
- Migrações são idempotentes (`ON CONFLICT DO NOTHING`, `IF EXISTS`)

### NUNCA fazer em produção
- `docker compose down -v` (deleta TODOS os volumes/dados!)
- `DROP TABLE` sem backup
- Commitar arquivos `.env` com secrets
- Rodar migrações sem backup prévio

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

## Organização de Settings (Claude Code)

As permissões estão organizadas em **3 camadas** que se acumulam:

```
~/.claude/settings.json              (GLOBAL - todos os projetos)
  + Clinica/.claude/settings.local.json    (PROJETO - só Clinica)
    + Clinica/frontend/.claude/settings.local.json  (SUBPROJETO - só frontend)
```

### Global (`~/.claude/settings.json`)
- Ferramentas genéricas: git, npm, docker, ssh, curl, etc.
- Playwright MCP (todas as tools)
- Context7 + Sequential Thinking MCP
- WebSearch + domínios genéricos (github, npmjs, docker docs)
- Plugins: frontend-design, code-review, feature-dev
- Denied: .env, credentials, rm -rf, sudo, chmod 777

### Projeto (`Clinica/.claude/settings.local.json`)
- Supabase MCP (10 tools: execute_sql, apply_migration, deploy_edge_function, etc.)
- Plugin: supabase
- Domínios: essencemedicalclinic.com, evolution-api, supabase, portainer
- Scripts: migrate.sh

### Frontend (`Clinica/frontend/.claude/settings.local.json`)
- npm start/build com diferentes portas

### IMPORTANTE
- `settings.local.json` = local da máquina, **NÃO commitar** (já está no .gitignore)
- `settings.json` = compartilhado, pode commitar
- **NÃO** colocar tokens, API keys ou senhas em regras de permissão
- Novas permissões específicas da Clinica vão no `Clinica/.claude/settings.local.json`
- Permissões genéricas (usadas em qualquer projeto) vão no global

---

*Última atualização: Fevereiro 2026*
