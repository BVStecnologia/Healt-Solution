# Essence Medical Clinic - Projeto

**Cliente:** Shapeup Health Solutions (Essence Medical Clinic)
**Contrato:** Upwork - Workflow Automation Expert for Wellness Clinic
**Início:** 04/02/2026
**Stack:** React 18 + TypeScript + Supabase Self-hosted + Evolution API + Docker

---

## Status Atual

| # | Módulo | Status | Upwork To-do |
|---|--------|--------|--------------|
| 1 | Infraestrutura Docker (13 serviços) | ✅ Completo | ✅ Completed |
| 2 | Database Schema (15 migrações, 000-014) | ✅ Completo | ✅ Completed |
| 3 | Portal do Paciente (7 páginas) | ✅ Completo | ✅ Completed |
| 4 | Painel Admin + Portal Médico (13 páginas) | ✅ Completo | ✅ Completed |
| 5 | WhatsApp - Notificações Bilíngues (28 templates) | ✅ Completo | ✅ Completed |
| 6 | WhatsApp - Automation Médico + Paciente | ✅ Completo | ⬜ Active |
| 7 | Lembretes automáticos (cron + notification_rules) | ✅ Completo | - |
| 8 | No-show automático + Cancelamento inteligente | ✅ Completo | - |
| 9 | Dark/Light mode + Onboarding admin | ✅ Completo | ⬜ Active |
| 10 | Google OAuth (VPS via nip.io) | ✅ Completo | - |
| 11 | Confiabilidade WhatsApp (retry + monitoramento) | ✅ Completo | - |
| 12 | Tratamentos reais do site (18 tipos + categorias) | ✅ Completo | - |
| 13 | Brand Identity (manual da marca WABOO) | 🔄 Em progresso | ⬜ Active |
| 14 | Deploy producao (dominio + SSL + Nginx) | ✅ Completo | - |
| 15 | i18n completo (PT/EN/ES) | 🔄 Em progresso | - |
| 16 | Analise OptiMantra (gap analysis) | ✅ Completo | - |

### Proximas Fases (baseado na analise do OptiMantra)

| # | Feature | Prioridade | Status |
|---|---------|------------|--------|
| 17 | Perfil completo do paciente (endereco, emergency, insurance) | 🔴 Alta | Pendente |
| 18 | Servicos faltantes + precos (19 tipos novos do OptiMantra) | 🔴 Alta | Pendente |
| 19 | Pagamento com cartao (Stripe POS) | 🔴 Alta | Pendente |
| 20 | Superbill / Faturamento basico | 🔴 Alta | Pendente |
| 21 | Telehealth (flag In-Office vs Telehealth) | 🟡 Media | Pendente |
| 22 | Upload de documentos/exames | 🟡 Media | Em progresso |
| 23 | Modulo de exames (labs) | 🟡 Media | Pendente |
| 24 | Inventario (suplementos/meds - 73 itens) | 🟡 Media | Pendente |
| 25 | Analytics / Relatorios financeiros | 🟡 Media | Pendente |
| 26 | Email notifications (alem do WhatsApp) | 🟡 Media | Pendente |
| 27 | Intake/Consent forms digitais | 🟡 Media | Pendente |
| 28 | Chatbot IA WhatsApp | 🟢 Baixa | Pendente |
| 29 | E-commerce (produtos/suplementos) | 🟢 Baixa | Pendente |
| 30 | AI Scribe (Plaud → SOAP → OptiMantra) | 🟢 Baixa | Pendente |
| 31 | Charting/EMR (SOAP notes) | 🟢 Baixa | Pendente |
| 32 | SMS 2-way (Twilio) | 🟢 Baixa | Pendente |
| 33 | Memberships/assinaturas | 🟢 Baixa | Pendente |
| 34 | Nurturing sequences (follow-up 7/30/90 dias) | 🟢 Baixa | Pendente |

---

## O Que Foi Entregue

### 1. Infraestrutura (13 containers Docker)
- **Supabase** (9 containers): PostgreSQL 15, PostgREST, GoTrue Auth, Kong Gateway, Realtime WebSockets, Storage, Imgproxy, Meta, Studio
- **Evolution API** (3 containers): API v2.3.6 + PostgreSQL + Redis
- **Webhook Server**: Node.js com cron scheduler para lembretes + WhatsApp interativo
- Scripts: migrate.sh, deploy.sh, setup.sh, deploy-update.sh, snapshot-versions.sh
- VPS Contabo configurada e rodando (217.216.81.92)
- Portainer para gerenciamento visual

### 2. Banco de Dados (17 migrações)
| Migração | Descrição |
|----------|-----------|
| 000 | Schema migrations (controle de versões) |
| 001 | Tabelas core: profiles, providers, provider_schedules, appointments + ENUMs + RPCs + RLS |
| 002 | WhatsApp: whatsapp_instances, message_templates, message_logs |
| 003 | RLS policies para admin (CRUD completo) |
| 004 | avatar_url em profiles (Google OAuth) |
| 005 | preferred_language (PT/EN) + templates inglês + índices |
| 006 | Auto-confirmação de consultas + notificações para médicos |
| 007 | provider_blocks (bloqueios de agenda) |
| 008 | Admin pode gerenciar provider_schedules |
| 009 | Múltiplos turnos por dia + RPC update_provider_schedules atômico |
| 010 | Tema escuro/claro do paciente (preferred_theme) |
| 011 | Regras de notificação configuráveis (notification_rules) |
| 012 | No-show automático + confirmação de presença + templates no-show |
| 013 | Auto-create profile (trigger on auth.users para Google OAuth + email) |
| 014 | retry_count e last_retry_at no message_logs (sistema de retry) |
| 015 | Novos ENUMs: appointment_type (16 novos) + patient_type (4 novos) |
| 016 | treatment_types table + fix duração create_appointment + elegibilidade |

**Totais:** 10 tabelas, 4 ENUMs, 8+ RPCs, RLS completo, triggers automáticos

### 3. Portal do Paciente (7 páginas)
- **Login**: Email/senha + Google OAuth (auto-criação de perfil com idioma do navegador)
- **Registro**: Validação de senha, criação de profile tipo "new"
- **Dashboard**: Estatísticas + próximas consultas + CTA agendamento
- **Agendamento multi-step**: Tipo → Elegibilidade → Médico → Data/Hora → Confirmação
- **Consultas**: Lista com filtros + detalhes + cancelamento com motivo
- **Perfil**: Dados pessoais + avatar + tema preferido
- **Configurações**: Idioma + tema + preferências
- **i18n**: PT/EN/ES com detecção automática e persistência no banco

### 4. Painel Administrativo + Portal do Médico (12 páginas)
- **Dashboard**: 4 cards de stats + gráficos (Recharts: area, pie, bar) + lista pendentes + status WhatsApp + setup checklist (onboarding)
- **Calendário**: react-big-calendar (mês/semana/dia/agenda) + cores por status + URL params + modal de detalhes + dark mode completo + popup overflow
- **Consultas**: Kanban com colunas por status + confirmar/rejeitar/cancelar + notificações WhatsApp
- **Pacientes**: Grid com filtros + criação de paciente pelo admin (preservação de sessão) + badge no-show
- **Ficha Paciente**: Avatar colorido + dados pessoais/médicos + estatísticas + histórico + próximas consultas + contador no-show
- **Médicos**: CRUD + horários (provider_schedules) + bloqueios de agenda (provider_blocks) + ativar/desativar
- **Admins**: CRUD completo
- **WhatsApp**: Instâncias (criar/QR Code/conectar/desconectar/deletar) + histórico mensagens + status real-time
- **Notificações**: Regras de lembrete configuráveis para pacientes e médicos (CRUD)
- **Agenda Médicos**: Gestão de horários com múltiplos turnos por dia (manhã + tarde com pausa almoço) + bloqueios flexíveis (férias, reuniões, horários personalizados)
- **Portal do Médico**: Ambiente separado (/doctor) com dashboard, calendário e consultas — médico acessa apenas seus dados
- **Notificações Médico**: "Meus Lembretes" auto-configurável pelo próprio médico

### 5. WhatsApp - Notificações Bilíngues (14 tipos x 2 idiomas = 28 templates)

**Templates Paciente (PT/EN):**
- appointment_confirmed, appointment_rejected, appointment_cancelled
- appointment_cancelled_by_provider (com link reagendamento)
- appointment_auto_confirmed
- reminder_24h, reminder_1h
- no_show_patient

**Templates Médico (PT/EN):**
- new_appointment_provider, new_appointment_clinic
- appointment_cancelled_provider
- reminder_daily_provider
- provider_reminder_2h, provider_reminder_15min
- no_show_provider

**Funcionalidades:**
- Notificações automáticas ao confirmar/rejeitar/cancelar
- Notificações cruzadas (paciente + médico)
- Idioma baseado na preferência (profiles.preferred_language)
- Logging completo em message_logs com deduplicação
- Status da conexão em tempo real (polling 10s)

### 6. WhatsApp - Automation Interativa
- **Menu paciente**: Opções 1-5 (próximas consultas, agendar, cancelar, histórico, falar com clínica)
- **Confirmação de presença**: Paciente responde "OK/sim/yes" ao lembrete → confirma presença
- **Cancelamento inteligente**: Aviso se <24h, motivo obrigatório, link reagendamento
- **Estado de conversação**: Fluxos multi-step com timeout

### 7. Lembretes Automáticos
- Cron job a cada 5 min (node-cron no webhook server)
- Tabela notification_rules com regras configuráveis
- Override: regra do médico substitui global (mesmo minutes_before)
- Deduplicação via message_logs (não envia duplicado)
- UI Admin: `/admin/notifications` - CRUD de regras
- UI Médico: `/doctor/notifications` - auto-configurável

### 8. No-show + Cancelamento Inteligente
- Detecção automática: 30min após fim da consulta → marca no_show
- Contador no_show_count por paciente (trigger automático)
- Badge vermelho na lista de pacientes
- Notificação WhatsApp para paciente e médico
- Cancelamento tardio (<24h): aviso ao paciente (frontend + WhatsApp)
- confirmed_by_patient_at: registro de confirmação de presença

### 9. Dark/Light Mode + Onboarding Admin
- Tema escuro/claro com persistência no DB (preferred_theme)
- ThemeContext + ThemeToggle em todas as páginas
- Calendário totalmente adaptado (21 variáveis CSS de status)
- Setup Checklist: guia passo-a-passo para configuração inicial
- Empty States educativos: orientações quando listas estão vazias
- Help Tips: dicas contextuais dismissíveis por página

### 10. Google OAuth + Segurança
- Google OAuth na VPS via nip.io (217-216-81-92.nip.io)
- Auto-create profile: trigger on auth.users (migration 013)
- RLS fix: is_admin() com SECURITY DEFINER (sem recursão)
- .gitignore: bloqueia .env.* (exceto .example)
- .env.local removido do histórico git (filter-branch)
- Backup pré-deploy: scripts/backup.sh (pg_dump + gzip + rotação)
- Migrações seguras: BEGIN/COMMIT + ON_ERROR_STOP + backup automático

### 11. Confiabilidade WhatsApp (Retry + Monitoramento)
- Webhook `sendMessage()` retorna boolean (sucesso/falha)
- Falhas de envio gravadas corretamente no `message_logs` com `status: 'failed'`
- Dedup de lembretes ignora mensagens falhas (permite retry automático)
- Retry automático: cron a cada 5min, até 3 tentativas por mensagem
- `retry_count` e `last_retry_at` no message_logs (migration 014)
- Admin alertado via popup quando notificação WhatsApp falha ao confirmar/rejeitar
- Página `/admin/failed-messages`: lista mensagens falhas com retry manual
- Sidebar admin: link "Msgs Falhas" na seção configurações

### 12. Tratamentos Reais do Site (18 tipos + 5 categorias)
- Source of truth: `frontend/src/constants/treatments.ts`
- 18 tipos ativos baseados no site essencemedicalclinic.com + 6 legados
- 5 categorias: General, Well-being, Personalized, Rejuvenation, IV Therapy
- Tabela `treatment_types` no DB com duração real por tipo
- RPC `create_appointment` busca duração da tabela (não mais hardcoded 30min)
- Patient types novos: wellness, bhrt, rejuvenation, iv_therapy
- NewAppointmentPage redesenhada com seções por categoria

### 13. Brand Identity (em progresso)
- Fonte Satoshi Variable (woff2, @font-face local)
- Logo SVG: 4 variantes (horizontal/vertical, dark/light)
- Componente EssenceLogo para uso em toda a app
- Backgrounds: brand-bg-1 (dark), brand-bg-2 (light), brand-bg-3 (alt), brand-bg-spheres (paciente login)
- Ondas decorativas: 4 SVGs em 4 cores (bege, dourado, marrom, preto)
- Linhas decorativas: 3 estilos x 4 cores = 12 SVGs
- Favicon: "E" terracota (16/32/180/192/512px)
- Admin login page: redesenhada com brand-bg-1 + linhas decorativas
- Patient login page: redesenhada com spheres + CSS filter marrom + linhas
- PatientsPage: stat cards minimalistas na paleta da marca
- PatientProfilePage: redesenhada com linha decorativa + avatares neutros

---

## URLs de Producao

| Servico | URL |
|---------|-----|
| **Frontend** | https://portal.essencemedicalclinic.com |
| **Supabase API** | https://portal.essencemedicalclinic.com/rest/v1/ |
| **Evolution API** | https://portal.essencemedicalclinic.com/evolution/ |
| Portainer | http://217.216.81.92:9000 |
| Supabase Studio | http://217.216.81.92:3001 (interno) |

---

## Credenciais

### Portainer
- User: `admin`
- Pass: `2026projectessence@`

### VPS SSH
```bash
ssh clinica-vps
# ou
ssh -i ~/.ssh/clinica_vps root@217.216.81.92
```

---

## Dados Reais do OptiMantra (09/02/2026)

> Analise completa em `docs/ANALISE_OPTIMANTRA.md`

| Dado | Valor |
|------|-------|
| **Pacientes** | 1.138 |
| **Servicos** | 65 (10 consultas, 21 procedimentos, 30 labs, 4 outros) |
| **Inventario** | 73 itens (56 com estoque baixo) |
| **Practitioners** | Rosane Nunes, MD + Registered Nurse |
| **Faturamento diario** | ~$1,800/dia (cartao) |
| **Gateway pagamento** | Configurado no OptiMantra (Fiserv/Stripe/Authorize.Net disponiveis) |
| **Insurance** | Sim (pacientes com plano ex: OSCAR SILVER SIMPLE) |
| **Telehealth** | Sim (In-Office + Telehealth) |
| **Comunicacao** | SMS (99+), Email, Fax, Office Chat, Notifications (99+) |

### Servicos do OptiMantra que NAO temos ainda:
- Weight Loss Injection ($75), Male Pellet ($850), Female Pellet ($450)
- Testosterone/Nandrolone Injection ($25-30), Tirzepatide ($300-375)
- Inbody ($50), Calorimetry ($70), Nutritionist Consult ($120)
- Mid-Level Consultation ($200), Office Visit generico ($125)
- 5 tipos especificos de IV ($180-250 cada)
- Morpheus8 Session ($1,000 - 120min)
- 30+ exames laboratoriais individuais com precos

### Campos do paciente que NAO temos:
- Endereco completo (address, city, state, zip)
- Emergency contact (name, phone, relation)
- Sex at birth, Race, Ethnicity, Gender Identity, Pronoun
- Preferred name, Middle name
- Marital status, Occupation, Referred by
- Insurance (plano, ID, copay, deductible)
- Cartao de pagamento no arquivo
- Patient notes (campo livre)
- Primary Care Physician, Guardian

---

## Arquivos Importantes

| Arquivo | Funcao |
|---------|--------|
| `CLAUDE.md` | Documentacao tecnica completa (arquitetura, DB, rotas, padroes) |
| `docs/requisitos-cliente.md` | Requisitos originais do cliente (6 pilares) |
| `docs/ANALISE_OPTIMANTRA.md` | **Analise detalhada do OptiMantra**: 65 servicos com precos, campos paciente, gap analysis |
| `docs/ANALISE_SISTEMA.md` | Analise geral: site + OptiMantra + mapeamento 6 pilares |
| `docs/DEPLOY.md` | Guia de deploy passo a passo |
| `docs/WHATSAPP.md` | Arquitetura WhatsApp completa (medico + paciente) |
| `docs/PLANO_DE_TESTES.md` | 85 casos de teste organizados |
| `Servidor/` | Espelho do estado de producao |

---

## Números do Projeto

| Métrica | Valor |
|---------|-------|
| Páginas frontend | 20 (7 portal + 13 admin/médico) |
| Componentes React | 25+ |
| Hooks customizados | 8 |
| Contextos React | 3 (Auth, Language, Loading) |
| Migrações SQL | 17 (000-016) |
| Tabelas no banco | 10 |
| RPCs PostgreSQL | 8+ |
| Templates WhatsApp | 28 (14 tipos x 2 idiomas) |
| Tipos de tratamento | 18 ativos + 6 legados |
| Serviços Docker (VPS) | 19 |
| Brand assets (SVGs) | 20+ (logos, ondas, linhas, favicon) |

---

## Mapeamento: Requisitos do Cliente vs Implementado

| Requisito | Status | Notas |
|-----------|--------|-------|
| Follow-ups automáticos | ✅ | Lembretes WhatsApp (24h, 1h) via cron |
| Agendamento com elegibilidade | ✅ | Portal multi-step com regras por tipo |
| Fluxos por tipo de paciente | ✅ | 6 tipos ativos (new, wellness, bhrt, rejuvenation, iv_therapy, vip) |
| Confirmações automatizadas | ✅ | WhatsApp + confirmação "OK/sim/yes" |
| No-show detection | ✅ | Auto 30min após fim + notificação + contador |
| Cancelamento inteligente | ✅ | Aviso <24h, motivo, link reagendamento |
| Retry mensagens falhas | ✅ | Até 3 tentativas + monitoramento admin |
| Agendar consultas (portal) | ✅ | 18 tipos reais do site, 5 categorias |
| Histórico de consultas | ✅ | Completo com detalhes |
| Brand identity | 🔄 | Satoshi, logos, linhas, login pages redesigned |
| Deploy producao (dominio + SSL) | ✅ | portal.essencemedicalclinic.com + Let's Encrypt |
| i18n (PT/EN) | 🔄 | Em progresso (ES removido - nao necessario) |
| Upload de documentos | 🔄 | Em desenvolvimento (Supabase Storage + viewer modal) |
| Perfil completo paciente | ❌ | Endereco, insurance, emergency contact, notes |
| Servicos faltantes + precos | ❌ | 19 tipos novos + campo price/cost |
| Pagamento cartao (Stripe POS) | ❌ | ~$1,800/dia processado no OptiMantra |
| Superbill / Faturamento | ❌ | Recibo por consulta |
| Telehealth | ❌ | Flag In-Office vs Telehealth |
| Modulo exames/labs | ❌ | 30+ exames individuais Labcorp |
| Inventario | ❌ | 73 produtos (suplementos/meds) |
| Analytics/Relatorios | ❌ | Dashboard financeiro |
| Gestao de depositos | ❌ | Precisa Stripe |
| E-commerce (produtos) | ❌ | Stripe + inventario |
| Intake/Consent forms | ❌ | Formularios digitais pre-consulta |
| Chatbot IA WhatsApp | ❌ | Claude API (temos menu interativo, nao IA) |
| AI Scribe (Plaud) | ❌ | Notas audio → SOAP → OptiMantra |
| SMS/Email | ❌ | Twilio + Resend planejados |
| Memberships/assinaturas | ❌ | Planos mensais |
| Nurturing sequences | ❌ | Follow-up 7/30/90 dias pos-consulta |

> **Analise detalhada:** Ver `docs/ANALISE_OPTIMANTRA.md` para servicos, precos e campos completos do OptiMantra

---

*Atualizado: 09/02/2026 (v5 - Deploy producao, Analise OptiMantra, Gap Analysis)*
