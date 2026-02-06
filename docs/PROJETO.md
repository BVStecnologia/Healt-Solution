# Essence Medical Clinic - Projeto

**Cliente:** Shapeup Health Solutions (Essence Medical Clinic)
**Contrato:** Upwork - Workflow Automation Expert for Wellness Clinic
**Início:** 04/02/2026
**Stack:** React 18 + TypeScript + Supabase Self-hosted + Evolution API + Docker

---

## Status Atual

| # | Módulo | Status | Upwork To-do |
|---|--------|--------|--------------|
| 1 | Infraestrutura Docker (16 serviços) | ✅ Completo | ✅ Completed |
| 2 | Database Schema (10 migrações) | ✅ Completo | ✅ Completed |
| 3 | Portal do Paciente | ✅ Completo | ✅ Completed |
| 4 | Painel Admin + Portal Médico (10 páginas) | ✅ Completo | ✅ Completed |
| 5 | WhatsApp - Notificações Bilíngues | ✅ Completo | ✅ Completed |
| 6 | WhatsApp - Automation via Médico | ✅ Completo | ⬜ Active |
| 6b | WhatsApp - Automation via Paciente | 📋 Planejado | - |
| 7 | Frontend - Expansão | 📋 Planejado | ⬜ Active |
| 8 | IA/Chatbot WhatsApp | ❌ Pendente | - |
| 9 | E-commerce (produtos) | ❌ Pendente | - |
| 10 | Integrações externas (OptiMantra) | ❌ Pendente | - |

---

## O Que Foi Entregue

### 1. Infraestrutura (16 containers Docker)
- **Supabase** (13 containers): PostgreSQL 15, PostgREST, GoTrue Auth, Kong Gateway, Realtime WebSockets, Storage, Studio, Edge Functions, Analytics, Meta, Imgproxy, Supavisor
- **Evolution API** (3 containers): API v2.3.6 + PostgreSQL + Redis
- **Webhook Server**: Node.js para receber eventos da Evolution API
- Scripts: migrate.sh, deploy.sh, setup.sh, deploy-update.sh, snapshot-versions.sh
- VPS Contabo configurada e rodando (217.216.81.92)
- Portainer para gerenciamento visual

### 2. Banco de Dados (10 migrações)
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

**Totais:** 8+ tabelas, 4 ENUMs, 8+ RPCs, RLS completo, triggers automáticos

### 3. Portal do Paciente (5 páginas)
- **Login**: Email/senha + Google OAuth (auto-criação de perfil com idioma do navegador)
- **Registro**: Validação de senha, criação de profile tipo "new"
- **Dashboard**: Estatísticas + próximas consultas + CTA agendamento
- **Agendamento multi-step**: Tipo → Elegibilidade → Médico → Data/Hora → Confirmação
- **Consultas**: Lista com filtros + detalhes + cancelamento com motivo
- **i18n**: PT/EN com detecção automática e persistência no banco

### 4. Painel Administrativo + Portal do Médico (10 páginas)
- **Dashboard**: 4 cards de stats + gráficos (Recharts: area, pie, bar) + lista pendentes + status WhatsApp
- **Calendário**: react-big-calendar (mês/semana/dia/agenda) + cores por status + URL params + modal de detalhes
- **Consultas**: Kanban com colunas por status + confirmar/rejeitar/cancelar + notificações WhatsApp
- **Pacientes**: Grid com filtros + criação de paciente pelo admin (preservação de sessão) + ficha completa
- **Ficha Paciente**: Avatar colorido + dados pessoais/médicos + estatísticas + histórico + próximas consultas
- **Médicos**: CRUD + horários (provider_schedules) + bloqueios de agenda (provider_blocks) + ativar/desativar
- **Admins**: CRUD completo
- **WhatsApp**: Instâncias (criar/QR Code/conectar/desconectar/deletar) + histórico mensagens + status real-time
- **Agenda Médicos**: Gestão de horários com múltiplos turnos por dia (manhã + tarde com pausa almoço) + bloqueios flexíveis (férias, reuniões, horários personalizados)
- **Portal do Médico**: Ambiente separado (/doctor) com dashboard, calendário e consultas — médico acessa apenas seus dados

### 5. WhatsApp - Notificações Bilíngues
- 12 templates de mensagem (6 tipos x 2 idiomas PT/EN):
  - appointment_confirmed, appointment_rejected, appointment_cancelled
  - reminder_24h, reminder_1h, new_appointment_clinic
- Notificações automáticas ao confirmar/rejeitar/cancelar
- Notificações cruzadas (paciente + médico)
- Idioma baseado na preferência do paciente (profiles.preferred_language)
- Logging completo em message_logs com status tracking
- Status da conexão em tempo real (polling 10s)

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

| # | Feature | Prioridade |
|---|---------|------------|
| 1 | WhatsApp Automation - Agenda via médico | 🔴 Alta |
| 2 | Lembretes automáticos (cron 24h/1h) | 🔴 Alta |
| 3 | Upload de documentos/exames | 🟡 Média |
| 4 | Relatórios e analytics | 🟡 Média |
| 5 | Chatbot IA WhatsApp | 🟡 Média |
| 6 | Notificações push | 🟢 Baixa |
| 7 | E-commerce (produtos/suplementos) | 🟢 Baixa |
| 8 | Sistema de pagamentos/depósitos | 🟢 Baixa |
| 9 | Integração OptiMantra (EMR) | 🟢 Baixa |
| 10 | Memberships/assinaturas | 🟢 Baixa |
| 11 | Testes automatizados + CI/CD | 🟢 Baixa |

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
| Páginas frontend | 16 (5 portal + 10 admin + 1 login admin) |
| Componentes React | 18+ |
| Hooks customizados | 7 |
| Migrações SQL | 10 |
| Tabelas no banco | 7+ |
| RPCs PostgreSQL | 8+ |
| Templates WhatsApp | 12 (6 tipos x 2 idiomas) |
| Serviços Docker | 16 |
| Commits Git | 30+ |

---

*Atualizado: 06/02/2026*
