# CLAUDE.md - Essence Medical Clinic

Este arquivo documenta toda a arquitetura, funcionalidades e padrões do sistema de gestão da clínica médica.

---

## REGRAS DE SEGURANÇA (OBRIGATÓRIO — LER PRIMEIRO)

### Dados de Teste / Demo
- **NUNCA** usar telefones reais em dados de teste/demo. Sempre usar padrão fake: `+15550000001`, `+15550000002`, etc.
- **NUNCA** usar emails reais de pessoas/clínica em dados de teste. Usar `@example.com` ou `@test.com`.
- **NUNCA** inserir dados de teste no banco de produção (VPS) sem ANTES parar o webhook: `docker stop webhook-server`
- O cron do webhook roda a cada 5 minutos e ENVIA mensagens WhatsApp reais. Qualquer dado com telefone real no DB será alvo de lembretes, no-show, confirmações.

### Antes de Inserir Dados de Teste no DB de Produção
1. **Verificar TODOS os telefones** — nenhum número real permitido, APENAS padrão fake
2. **Verificar TODOS os emails** — nenhum email real permitido, APENAS @example.com ou @test.com
3. O webhook PODE ficar ligado — o problema é ter dados reais no DB, não o webhook rodar
4. Na dúvida, parar o webhook primeiro (`docker stop webhook-server`), inserir dados, verificar, e religar

### Ações que Podem Comprometer o Usuário
- Enviar mensagem WhatsApp para qualquer número que não seja explicitamente um número de teste autorizado pelo usuário
- Criar usuários no auth.users com emails reais que podem receber notificações
- Modificar dados de pacientes/médicos reais sem confirmação do usuário
- Qualquer ação que dispare comunicação externa (WhatsApp, SMS, email) sem aprovação explícita

### Números de Teste Autorizados
- Apenas os 2 números que o usuário conectou na Evolution API (perguntar antes de usar)
- Para dados demo, SEMPRE usar: `+1555000XXXX` (padrão US fake) ou `+5500000000XX` (padrão BR fake)

---

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
├── index.ts                # Express server + webhook routes + handoff API + Evolution proxy
├── config.ts               # URLs Supabase, Evolution API, panel
├── types.ts                # Tipos compartilhados
├── scheduleManager.ts      # Supabase client (service_role_key)
├── whatsappResponder.ts    # sendMessage(), getTypeLabel(), formatDateShort()
├── router.ts               # Dual-role routing (paciente + provider)
├── stateManager.ts         # State + menu management (extends conversationState)
├── menuBuilder.ts          # Dynamic numbered menu builder
├── patientMainMenu.ts      # Patient main menu + handoff trigger
├── patientServices.ts      # Services browsing sub-menu
├── patientClinicInfo.ts    # Clinic info sub-menu
├── patientAppointments.ts  # View/confirm/cancel appointments
├── patientBooking.ts       # Booking flow
├── patientResponder.ts     # Patient message formatters (bilíngue)
├── patientManager.ts       # Manager de pacientes
├── providerMainMenu.ts     # Provider menu handler
├── providerResponder.ts    # Provider message formatters
├── handoffManager.ts       # Handoff sessions (Set<string> + DB)
├── attendantNotifier.ts    # Notifica atendentes (timezone-aware, bilíngue)
├── commandParser.ts        # Parser de comandos WhatsApp
├── reminderScheduler.ts    # Cron job a cada 5 min (node-cron)
├── reminderSender.ts       # getTemplate(), sendReminder(), dedup
├── retrySender.ts          # Retry de mensagens falhas (até 3 tentativas)
├── conversationState.ts    # Estado de conversação (booking, cancel)
├── rateLimiter.ts          # Rate limiting (3 msgs/10s)
├── messageLogger.ts        # Conversation logging
├── treatmentCache.ts       # Treatment types cache
├── phoneUtils.ts           # Phone number utilities
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
| `/admin/attendants` | AttendantsPage | CRUD de atendentes + horários |
| `/admin/handoff` | HandoffSessionsPage | Monitor de sessões handoff |

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

**31 migrações (000-030).** Últimas 10:

| Versão | Nome | Descrição |
|--------|------|-----------|
| 021 | patient_profile_fields | Campos extras no perfil do paciente |
| 022 | admin_update_profiles | RPC para admin atualizar profiles |
| 023 | treatment_prices | Preços nos treatment_types |
| 024 | create_treatment_type | RPC para criar treatment_type |
| 025 | add_services_enum | Novos ENUMs de serviços |
| 026 | add_services_data | Dados dos novos serviços |
| 027 | telehealth | Suporte a telemedicina |
| 028 | insurance_fields | Campos de seguro/insurance |
| 029 | conversation_logs | Tabela conversation_logs |
| 030 | handoff_system | Tabelas attendants, attendant_schedules, handoff_sessions + RLS |

Migrações 000-020: ver `supabase/migrations/`. Aplicar: `./scripts/migrate.sh local|vps`. Nova: criar `XXX_nome.sql` + INSERT em `schema_migrations`.

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

- **Dashboard Admin**: Estatísticas, consultas pendentes com aprovação/rejeição, status WhatsApp em tempo real
- **Calendário**: Mês/semana/dia/agenda, cores por status, modal de detalhes, navegação por URL
- **Gestão de Pacientes**: CRUD, busca/filtro, ficha completa (`/admin/patients/:id`)
- **Gestão de Médicos/Admins**: CRUD completo, ativar/desativar
- **WhatsApp**: CRUD de instâncias, QR Code, status em tempo real
- **Lembretes Automáticos**: `notification_rules`, cron 5min, bilíngue, override por médico, UI admin + médico
- **Cancelamento e No-Show**: Aviso tardio (<24h), no-show automático (30min), `no_show_count`, confirmação via WhatsApp
- **Confiabilidade WhatsApp**: Retry até 3x, `message_logs` com status, página "Msgs Falhas", alertas admin
- **Human Handoff**: 3 tabelas (migration 030), Set in-memory + DB, timezone-aware (EST/EDT), 4 formas de encerrar, bloqueio de "trocar" durante handoff, rollback se sendMessage falhar, dual-role routing, resolve via webhook API
- **Chatbot WhatsApp**: Menu dinâmico numerado, sub-menus (serviços, clínica, agendamento), rate limiting, session timeout, confirmação rápida, conversation logging, URL shortener, dual-role
- **Internacionalização**: PT/EN/ES, seletor fixo

---

## TODO / Pendências

- [ ] Upload de documentos/exames
- [ ] Relatórios e analytics
- [ ] Notificações push
- [ ] Pagamentos online
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoramento (Sentry, etc)

---

## Dados de Demonstração

- **Admin:** valdair3d@gmail.com
- **Médicos:** dr.carlos@teste.com, dr.ana.costa@teste.com, dr.pedro.santos@teste.com
- **Pacientes:** 10 pacientes (tipos variados), emails @email.com, senha `demo123456`

---

## Servidor de Produção (VPS)

**IP:** 217.216.81.92 | **OS:** Ubuntu 24.04 | **CPU:** 8 cores | **RAM:** 24 GB | **Disco:** 400 GB SSD | **Provedor:** Contabo
**SSH:** `ssh clinica-vps` | **Portainer:** http://217.216.81.92:9000 (admin / 2026projectessence@)
**Espelho:** `Servidor/` contém estado VPS para comparar antes de deploy.

---

## Deploy para Produção

Usar **skill `/deploy`** para deploy assistido completo. Detalhes em `docs/DEPLOY.md`.

**3 stacks Docker:** supabase (8000), evolution (8082), webhook (3002), frontend (nginx 443)

**Deploy rápido:**
```bash
ssh clinica-vps "cd /root/Clinica && git pull"
ssh clinica-vps "cd /root/Clinica && ./scripts/migrate.sh vps"
ssh clinica-vps "cd /root/Clinica/webhook && docker compose up -d --build"
ssh clinica-vps "cd /root/Clinica/frontend && npm install --legacy-peer-deps && npm run build"
ssh clinica-vps "systemctl reload nginx"
```

---

## Backup e Segurança

**Backup:** `scripts/backup.sh manual|pre-deploy` → `/root/backups/db-*.sql.gz`
**Restaurar:** `gunzip < backup.sql.gz | docker exec -i supabase-db psql -U postgres -d postgres`
**Migrações:** `migrate.sh` usa transações (BEGIN/COMMIT) + backup automático (VPS) + `ON_ERROR_STOP=1`

**NUNCA em produção:** `docker compose down -v`, `DROP TABLE` sem backup, commitar `.env` com secrets

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
