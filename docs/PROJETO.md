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
| 12 | Upload de documentos/exames | ❌ Pendente | - |
| 13 | IA/Chatbot WhatsApp | ❌ Pendente | - |
| 14 | E-commerce (produtos) | ❌ Pendente | - |
| 15 | Integrações externas (OptiMantra) | ❌ Pendente | - |

---

## O Que Foi Entregue

### 1. Infraestrutura (13 containers Docker)
- **Supabase** (9 containers): PostgreSQL 15, PostgREST, GoTrue Auth, Kong Gateway, Realtime WebSockets, Storage, Imgproxy, Meta, Studio
- **Evolution API** (3 containers): API v2.3.6 + PostgreSQL + Redis
- **Webhook Server**: Node.js com cron scheduler para lembretes + WhatsApp interativo
- Scripts: migrate.sh, deploy.sh, setup.sh, deploy-update.sh, snapshot-versions.sh
- VPS Contabo configurada e rodando (217.216.81.92)
- Portainer para gerenciamento visual

### 2. Banco de Dados (15 migrações)
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

**Totais:** 9 tabelas, 4 ENUMs, 8+ RPCs, RLS completo, triggers automáticos

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

---

## URLs de Produção

| Serviço | URL |
|---------|-----|
| Frontend | http://217.216.81.92:3000 |
| Supabase API | http://217.216.81.92:8000 |
| Supabase Studio | http://217.216.81.92:3001 |
| Evolution API | http://217.216.81.92:8082 |
| Portainer | http://217.216.81.92:9000 |

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

## Pendente (Fase 2+)

| # | Feature | Prioridade | Depende de |
|---|---------|------------|------------|
| 1 | ~~Google OAuth na VPS~~ | ✅ Feito | nip.io (217-216-81-92.nip.io) |
| 2 | Upload de documentos/exames | 🔴 Alta | Nada (Supabase Storage pronto) |
| 3 | Relatórios e analytics | 🟡 Média | Nada |
| 4 | Chatbot IA WhatsApp | 🟡 Média | Escolha de provider IA (Claude/OpenAI) |
| 5 | Notificações push | 🟢 Baixa | Nada |
| 6 | E-commerce (produtos/suplementos) | 🟢 Baixa | Provider de pagamento |
| 7 | Sistema de pagamentos/depósitos | 🟢 Baixa | Provider de pagamento (Stripe/Square) |
| 8 | Integração OptiMantra (EMR) | 🟢 Baixa | API/credenciais do cliente |
| 9 | AI Scribe (Plaud) | 🟢 Baixa | Info do cliente |
| 10 | Memberships/assinaturas | 🟢 Baixa | E-commerce + pagamentos |
| 11 | Testes automatizados + CI/CD | 🟢 Baixa | Nada |
| 12 | Domínio + SSL (HTTPS) | 🟡 Média | Cliente compra domínio |

---

## Arquivos Importantes

| Arquivo | Função |
|---------|--------|
| `CLAUDE.md` | Documentação técnica completa (arquitetura, DB, rotas, padrões) |
| `docs/requisitos-cliente.md` | Requisitos originais do cliente |
| `docs/DEPLOY.md` | Guia de deploy passo a passo |
| `docs/WHATSAPP.md` | Arquitetura WhatsApp completa (médico + paciente) |
| `docs/PLANO_DE_TESTES.md` | 85 casos de teste organizados |
| `Servidor/` | Espelho do estado de produção |

---

## Números do Projeto

| Métrica | Valor |
|---------|-------|
| Páginas frontend | 20 (7 portal + 13 admin/médico) |
| Componentes React | 19 |
| Hooks customizados | 6 |
| Contextos React | 3 (Auth, Language, Theme) |
| Migrações SQL | 15 (000-014) |
| Tabelas no banco | 9 |
| RPCs PostgreSQL | 8+ |
| Templates WhatsApp | 28 (14 tipos x 2 idiomas) |
| Serviços Docker | 13 |
| Commits Git | 49 |

---

## Mapeamento: Requisitos do Cliente vs Implementado

| Requisito | Status | Notas |
|-----------|--------|-------|
| Follow-ups automáticos | ✅ | Lembretes WhatsApp configuráveis |
| Agendamento com elegibilidade | ✅ | Portal multi-step com regras por tipo |
| Fluxos por tipo de paciente | ✅ | 5 tipos (new, trt, hormone, general, vip) |
| Confirmações automatizadas | ✅ | WhatsApp + confirmação "OK" |
| Gestão de depósitos | ❌ | Precisa de provider de pagamento |
| Agendar consultas (portal) | ✅ | Completo |
| Histórico de consultas | ✅ | Completo |
| Serviços adicionais | ✅ | Tipos de consulta (nutrição, coaching, etc.) |
| Regras TRT/Hormônios | ✅ | Elegibilidade com exames + visita 6 meses |
| Recomendações personalizadas | ❌ | Fase 2 |
| E-commerce (produtos) | ❌ | Fase 2 |
| Prescrições | ❌ | Fase 2 |
| Vendas/Upsells inteligentes | ❌ | Fase 2 |
| AI Scribe / Prontuário | ❌ | Aguardando info do cliente |
| Chatbot IA | ❌ | Fase 2 (temos menu WhatsApp, não IA) |
| Integração OptiMantra | ❌ | Aguardando API do cliente |

---

*Atualizado: 06/02/2026 (v2 - Confiabilidade WhatsApp)*
