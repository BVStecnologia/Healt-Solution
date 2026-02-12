# Essence Medical Clinic - Projeto

**Cliente:** Shapeup Health Solutions (Essence Medical Clinic)
**Contrato:** Upwork - Workflow Automation Expert for Wellness Clinic
**Inicio:** 04/02/2026
**Stack:** React 18 + TypeScript + Supabase Self-hosted + Evolution API + Docker

---

## Status Atual (12/02/2026)

| # | Modulo | Status |
|---|--------|--------|
| 1 | Infraestrutura Docker (19 servicos) | ✅ Completo |
| 2 | Database Schema (31 migracoes, 000-030) | ✅ Completo |
| 3 | Portal do Paciente (8 paginas) | ✅ Completo |
| 4 | Painel Admin + Portal Medico (16 paginas) | ✅ Completo |
| 5 | WhatsApp - Notificacoes Bilingues (28 templates) | ✅ Completo |
| 6 | WhatsApp - Automation Medico + Paciente | ✅ Completo |
| 7 | Lembretes automaticos (cron + notification_rules) | ✅ Completo |
| 8 | No-show automatico + Cancelamento inteligente | ✅ Completo |
| 9 | Onboarding admin + Setup Checklist | ✅ Completo |
| 10 | Google OAuth (VPS + dominio) | ✅ Completo |
| 11 | Confiabilidade WhatsApp (retry + monitoramento) | ✅ Completo |
| 12 | Tratamentos + Services & Pricing (46 tipos, 6 categorias) | ✅ Completo |
| 13 | Brand Identity (manual WABOO) | 🔄 Em progresso |
| 14 | Deploy producao (dominio + SSL + Nginx) | ✅ Completo |
| 15 | i18n (PT/EN) | 🔄 Em progresso |
| 16 | Analise OptiMantra (gap analysis) | ✅ Completo |
| 17 | Perfil completo paciente (23 campos demograficos) | ✅ Completo |
| 18 | Insurance no perfil (14 campos primary + secondary) | ✅ Completo |
| 19 | Telehealth (In-Office / Telehealth toggle) | ✅ Completo |
| 20 | Upload de documentos (Supabase Storage) | ✅ Completo |
| 21 | Chatbot IA WhatsApp (5 fases) | ✅ Completo |
| 22 | Human Handoff (atendentes + sessoes) | ✅ Completo |

### Gaps Pendentes (baseado na analise OptiMantra)

| # | Feature | Prioridade | Status |
|---|---------|------------|--------|
| 23 | **Pagamento com cartao (Stripe POS)** | 🔴 Alta | Pendente |
| 24 | **Superbill / Faturamento basico** | 🔴 Alta | Pendente |
| 25 | Inventario/Estoque (73 itens) | 🟡 Media | Pendente |
| 26 | Modulo de exames/labs (30+ Labcorp) | 🟡 Media | Pendente |
| 27 | SMS 2-way (Twilio) | 🟡 Media | Pendente |
| 28 | Email notifications (Resend) | 🟡 Media | Pendente |
| 29 | Intake/Consent forms digitais | 🟡 Media | Pendente |
| 30 | Waitlist (lista de espera) | 🟡 Media | Pendente |
| 31 | Analytics / Relatorios financeiros | 🟡 Media | Pendente |
| 32 | E-commerce (produtos/suplementos) | 🟢 Baixa | Pendente |
| 33 | AI Scribe (Plaud → SOAP) | 🟢 Baixa | Pendente |
| 34 | Charting/EMR (SOAP notes) | 🟢 Baixa | Pendente |
| 35 | Memberships/assinaturas | 🟢 Baixa | Pendente |
| 36 | Nurturing sequences (follow-up 7/30/90 dias) | 🟢 Baixa | Pendente |

---

## O Que Foi Entregue

### 1. Infraestrutura (19 containers Docker)
- **Supabase** (13 containers): PostgreSQL 15, PostgREST, GoTrue Auth, Kong Gateway, Realtime WebSockets, Storage, Imgproxy, Meta, Studio, Functions, Analytics, Vector, Supavisor
- **Evolution API** (3 containers): API v2.3.6 + PostgreSQL + Redis
- **Webhook Server** (1 container): Node.js + Express + cron scheduler (29 modulos TypeScript)
- **Nginx** + Let's Encrypt SSL (portal.essencemedicalclinic.com)
- **Portainer** para gerenciamento visual
- Scripts: migrate.sh, backup.sh, deploy assistido via skill
- VPS Contabo (217.216.81.92, Ubuntu 24.04, 8 cores, 24GB RAM, 400GB SSD)

### 2. Banco de Dados (31 migracoes)
| Migracao | Descricao |
|----------|-----------|
| 000 | Schema migrations (controle de versoes) |
| 001 | Tabelas core: profiles, providers, provider_schedules, appointments + ENUMs + RPCs + RLS + is_admin() |
| 002 | WhatsApp: whatsapp_instances, message_templates, message_logs |
| 003 | RLS policies para admin (CRUD completo) |
| 004 | avatar_url em profiles (Google OAuth) |
| 005 | preferred_language (PT/EN) + templates ingles + indices |
| 006 | Auto-confirmacao de consultas + notificacoes para medicos |
| 007 | provider_blocks (bloqueios de agenda) |
| 008 | Admin pode gerenciar provider_schedules |
| 009 | Multiplos turnos por dia + RPC update_provider_schedules atomico |
| 010 | Tema escuro/claro do paciente (preferred_theme) |
| 011 | Regras de notificacao configuraveis (notification_rules) |
| 012 | No-show automatico + confirmacao de presenca + templates no_show |
| 013 | Auto-create profile (trigger on auth.users para Google OAuth + email) |
| 014 | retry_count e last_retry_at no message_logs (sistema de retry) |
| 015 | Novos ENUMs: appointment_type (16 novos) + patient_type (4 novos) |
| 016 | treatment_types table + fix duracao create_appointment + elegibilidade |
| 017 | Novos ENUMs: high_cortisol, iron_infusions, chelation_therapy + 8 peptides |
| 018 | Dados dos novos tratamentos na tabela treatment_types |
| 019 | RLS para providers verem pacientes |
| 020 | patient_documents + Storage bucket + RLS |
| 021 | Perfil completo paciente (23 campos demograficos) |
| 022 | RLS admin update profiles |
| 023 | Precos nos tratamentos (price_usd, cost_usd, price_at_booking) |
| 024 | RPC create_treatment_type (admin cria servicos) |
| 025 | Novos ENUMs para servicos do OptiMantra |
| 026 | Dados dos novos servicos (17 tipos) |
| 027 | Telehealth (modality + video_link) |
| 028 | Insurance (14 campos: 7 primary + 7 secondary) |
| 029 | Conversation logs (chatbot WhatsApp) |
| 030 | Handoff system (attendants, attendant_schedules, handoff_sessions) |

**Totais:** 15+ tabelas, 4 ENUMs, 10+ RPCs, RLS completo, triggers automaticos

### 3. Portal do Paciente (8 paginas)
- **Login**: Email/senha + Google OAuth (auto-criacao de perfil com idioma do navegador)
- **Registro**: Validacao de senha, criacao de profile tipo "new"
- **Dashboard**: Estatisticas + proximas consultas + CTA agendamento
- **Agendamento multi-step**: Tipo → Elegibilidade → Medico → Data/Hora → Confirmacao
- **Consultas**: Lista com filtros + detalhes + cancelamento com motivo
- **Perfil**: Dados pessoais + avatar + tema preferido
- **Configuracoes**: Idioma + tema + preferencias
- **Documentos**: Upload/download de documentos + viewer modal (Supabase Storage)
- **i18n**: PT/EN com deteccao automatica e persistencia no banco

### 4. Painel Administrativo + Portal do Medico (16 paginas)
- **Dashboard**: 4 cards de stats + graficos (Recharts: area, pie, bar) + lista pendentes + status WhatsApp + setup checklist
- **Calendario**: react-big-calendar (mes/semana/dia/agenda) + cores por status + URL params + modal de detalhes + icone camera para telehealth
- **Consultas**: Kanban com colunas por status + confirmar/rejeitar/cancelar + notificacoes WhatsApp + filtro telehealth
- **Pacientes**: Grid com filtros + criacao de paciente pelo admin + badge no-show
- **Ficha Paciente**: 23 campos demograficos + insurance (14 campos) + emergency contact + estatisticas + historico + documentos + badge no-show
- **Medicos**: CRUD + horarios (provider_schedules) + bloqueios de agenda + ativar/desativar
- **Admins**: CRUD completo
- **WhatsApp**: Instancias (criar/QR Code/conectar/desconectar/deletar) + status real-time
- **Notificacoes**: Regras de lembrete configuraveis para pacientes e medicos (CRUD)
- **Agenda Medicos**: Gestao de horarios com multiplos turnos + bloqueios flexiveis
- **Services & Pricing**: Accordion por categoria + edicao de precos/custos + criacao de servico + 46 tipos ativos
- **Msgs Falhas**: Lista de mensagens WhatsApp falhas com retry manual
- **Atendentes**: CRUD de atendentes para handoff humano + horarios de disponibilidade
- **Handoff**: Monitor de sessoes de handoff (ativas/encerradas) + encerramento pelo painel
- **Portal do Medico**: Ambiente separado (/doctor) com dashboard, calendario, consultas, agenda, notificacoes

### 5. WhatsApp - Notificacoes Bilingues (14 tipos x 2 idiomas = 28 templates)

**Templates Paciente (PT/EN):**
- appointment_confirmed, appointment_rejected, appointment_cancelled
- appointment_cancelled_by_provider (com link reagendamento)
- appointment_auto_confirmed
- reminder_24h, reminder_1h
- no_show_patient

**Templates Medico (PT/EN):**
- new_appointment_provider, new_appointment_clinic
- appointment_cancelled_provider
- reminder_daily_provider
- provider_reminder_2h, provider_reminder_15min
- no_show_provider

### 6. WhatsApp - Automation Interativa
- **Menu paciente**: Opcoes 1-5 (proximas consultas, agendar, cancelar, historico, falar com clinica)
- **Confirmacao de presenca**: Paciente responde "OK/sim/yes" ao lembrete → confirma presenca
- **Cancelamento inteligente**: Aviso se <24h, motivo obrigatorio, link reagendamento
- **Estado de conversacao**: Fluxos multi-step com timeout

### 7. Lembretes Automaticos
- Cron job a cada 5 min (node-cron no webhook server)
- Tabela notification_rules com regras configuraveis
- Override: regra do medico substitui global (mesmo minutes_before)
- Deduplicacao via message_logs (nao envia duplicado)
- UI Admin: `/admin/notifications` - CRUD de regras
- UI Medico: `/doctor/notifications` - auto-configuravel

### 8. No-show + Cancelamento Inteligente
- Deteccao automatica: 30min apos fim da consulta → marca no_show
- Contador no_show_count por paciente (trigger automatico)
- Badge vermelho na lista de pacientes
- Notificacao WhatsApp para paciente e medico
- Cancelamento tardio (<24h): aviso ao paciente (frontend + WhatsApp)
- confirmed_by_patient_at: registro de confirmacao de presenca

### 9. Onboarding Admin + Setup Checklist
- Setup Checklist: guia passo-a-passo para configuracao inicial
- Empty States educativos: orientacoes quando listas estao vazias
- Help Tips: dicas contextuais dismissiveis por pagina

### 10. Google OAuth + Seguranca
- Google OAuth na VPS via dominio (portal.essencemedicalclinic.com)
- Auto-create profile: trigger on auth.users (migration 013)
- RLS fix: is_admin() com SECURITY DEFINER (sem recursao)
- Backup pre-deploy: scripts/backup.sh (pg_dump + gzip + rotacao)
- Migracoes seguras: BEGIN/COMMIT + ON_ERROR_STOP + backup automatico

### 11. Confiabilidade WhatsApp (Retry + Monitoramento)
- Webhook `sendMessage()` retorna boolean (sucesso/falha)
- Falhas gravadas em `message_logs` com `status: 'failed'`
- Retry automatico: cron a cada 5min, ate 3 tentativas por mensagem
- Pagina `/admin/failed-messages`: lista mensagens falhas com retry manual
- Admin alertado via popup quando notificacao WhatsApp falha

### 12. Tratamentos + Services & Pricing (46 tipos, 6 categorias)
- Source of truth: `frontend/src/constants/treatments.ts`
- 46 tipos ativos (18 originais + 17 OptiMantra + 11 extras) em 6 categorias
- Categorias: General, Well-being, Personalized, Rejuvenation, IV Therapy, Injections
- Tabela `treatment_types` no DB com duracao, preco e custo por tipo
- RPC `create_appointment` busca duracao da tabela
- Pagina admin Services & Pricing: accordion, edicao, criacao de servico
- Precos exibidos nos cards de agendamento do paciente

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
- PatientsPage + PatientProfilePage: redesenhadas na paleta da marca

### 14. Deploy Producao
- Dominio: portal.essencemedicalclinic.com
- SSL: Let's Encrypt (certbot auto-renew)
- Nginx: SPA + proxy Supabase + proxy Evolution API
- DNS: GoDaddy (portal → 217.216.81.92)

### 15. Perfil Completo do Paciente
- 23 campos demograficos (migration 021): endereco, emergency contact, sex_at_birth, race, ethnicity, gender_identity, pronoun, preferred_name, middle_name, marital_status, occupation, referred_by, patient_notes, primary_care_physician, guardian
- Insurance (migration 028): 14 campos — primary (plan, id, group, copay, coinsurance_pct, deductible, payer) + secondary (mesmos 7)
- Exibicao e edicao no PatientProfilePage

### 16. Telehealth
- Toggle In-Office / Telehealth no agendamento (migration 027: modality + video_link)
- Badge no card de consulta
- Icone camera no calendario
- Filtro no kanban de consultas

### 17. Upload de Documentos
- Tabela patient_documents (migration 020)
- Supabase Storage bucket
- PatientDocumentsPage: upload, download, viewer modal
- RLS: paciente ve seus docs, admin ve todos

### 18. Chatbot IA WhatsApp (5 fases)
- **Fase 1**: Menu dinamico, identificacao de papel (paciente/provider/dual), logging em conversation_logs
- **Fase 2**: Agendamento completo pelo WhatsApp (selecao de servico → provider → data → horario → confirmacao)
- **Fase 3**: Refatoracao (patientHandler split em 7 modulos), menus provider, sub-menus (servicos, info clinica, consultas, cancelamento)
- **Fase 4**: Rate limiting (3 msgs/10s), step indicators UX, human escape ("ajuda"/"help"), session timeout (30min)
- **Fase 5**: Human handoff real — bot pausa, atendente assume via WhatsApp Web
- **29 arquivos TypeScript** no webhook/src/
- **Conversation logs**: tabela no DB para historico de interacoes

### 19. Human Handoff (Atendimento Humano)
- 3 tabelas: attendants, attendant_schedules, handoff_sessions (migration 030)
- handoffManager.ts: Set<string> in-memory + DB para O(1) lookup
- attendantNotifier.ts: notifica atendentes disponiveis via WhatsApp pessoal
- Fluxo: paciente pede "ajuda" → bot verifica atendentes → cria sessao → notifica → bot pausa
- 4 formas de encerrar: #fechar (atendente), painel admin, auto-timeout 30min, paciente envia "bot"
- Frontend admin: AttendantsPage (CRUD + horarios) + HandoffSessionsPage (monitor + encerrar)
- i18n completo (PT/EN) em ambas as paginas

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

---

## Numeros do Projeto

| Metrica | Valor |
|---------|-------|
| Paginas frontend | 24 (8 portal + 16 admin/medico) |
| Componentes React | 22 |
| Hooks customizados | 8 |
| Contextos React | 3 (Auth, Language, Loading) |
| Migracoes SQL | 31 (000-030) |
| Tabelas no banco | 15+ |
| RPCs PostgreSQL | 10+ |
| Templates WhatsApp | 28 (14 tipos x 2 idiomas) |
| Tipos de tratamento | 46 ativos + 6 legados |
| Servicos Docker (VPS) | 19 |
| Webhook modules (TypeScript) | 29 |
| Brand assets (SVGs) | 20+ (logos, ondas, linhas, favicon) |

---

## Mapeamento: Requisitos do Cliente vs Implementado

| Requisito | Status | Notas |
|-----------|--------|-------|
| Follow-ups automaticos | ✅ | Lembretes WhatsApp (24h, 1h) via cron |
| Agendamento com elegibilidade | ✅ | Portal multi-step + WhatsApp chatbot |
| Fluxos por tipo de paciente | ✅ | 6 tipos ativos (new, wellness, bhrt, rejuvenation, iv_therapy, vip) |
| Confirmacoes automatizadas | ✅ | WhatsApp + confirmacao "OK/sim/yes" |
| No-show detection | ✅ | Auto 30min apos fim + notificacao + contador |
| Cancelamento inteligente | ✅ | Aviso <24h, motivo, link reagendamento |
| Retry mensagens falhas | ✅ | Ate 3 tentativas + monitoramento admin |
| Agendar consultas (portal) | ✅ | 46 tipos, 6 categorias, precos |
| Agendar consultas (WhatsApp) | ✅ | Chatbot fase 2 — fluxo completo |
| Historico de consultas | ✅ | Completo com detalhes |
| Brand identity | 🔄 | Satoshi, logos, linhas, login pages redesigned |
| Deploy producao (dominio + SSL) | ✅ | portal.essencemedicalclinic.com + Let's Encrypt |
| i18n (PT/EN) | 🔄 | Handoff/Attendants OK, muitas paginas admin ainda hardcoded PT |
| Upload de documentos | ✅ | Supabase Storage + viewer modal |
| Perfil completo paciente | ✅ | 23 campos demograficos + emergency contact |
| Insurance no perfil | ✅ | 14 campos (primary + secondary) |
| Servicos + precos | ✅ | 46 ativos, precos/custos, admin CRUD |
| Telehealth | ✅ | Toggle In-Office/Telehealth + badge + camera + filtro |
| Chatbot IA WhatsApp | ✅ | 5 fases completas (menu, booking, info, rate limit, handoff) |
| Handoff humano | ✅ | Atendentes + sessoes + notificacao + auto-timeout |
| Pagamento cartao (Stripe POS) | ❌ | ~$1,800/dia processado no OptiMantra |
| Superbill / Faturamento | ❌ | Recibo por consulta |
| Modulo exames/labs | ❌ | 30+ exames Labcorp |
| Inventario | ❌ | 73 produtos (suplementos/meds) |
| Analytics/Relatorios | ❌ | Dashboard financeiro |
| SMS/Email | ❌ | Twilio + Resend planejados |
| Intake/Consent forms | ❌ | Formularios digitais pre-consulta |
| Memberships/assinaturas | ❌ | Planos mensais |

> **Cobertura atual: ~85%** — Core completo. Falta: financeiro (Stripe + superbill), inventario, labs

> **Analise detalhada:** Ver `docs/ANALISE_OPTIMANTRA.md` para servicos, precos e campos completos do OptiMantra

---

## Arquivos Importantes

| Arquivo | Funcao |
|---------|--------|
| `CLAUDE.md` | Documentacao tecnica completa (arquitetura, DB, rotas, padroes) |
| `docs/PROJETO.md` | Este arquivo — status do projeto |
| `docs/requisitos-cliente.md` | Requisitos originais do cliente (6 pilares) |
| `docs/ANALISE_OPTIMANTRA.md` | Analise detalhada do OptiMantra: 65 servicos, campos paciente, gap analysis |
| `docs/ANALISE_SISTEMA.md` | Analise geral: site + OptiMantra + mapeamento 6 pilares |
| `docs/DEPLOY.md` | Guia de deploy passo a passo |
| `docs/WHATSAPP.md` | Arquitetura WhatsApp completa (medico + paciente) |
| `docs/PLANO_DE_TESTES.md` | 85 casos de teste organizados |
| `Servidor/` | Espelho do estado de producao |

---

*Atualizado: 12/02/2026 (v6 - Chatbot 5 fases, Handoff, Services & Pricing, Perfil completo, Insurance, Telehealth, Documentos)*
