# WhatsApp Automation - Arquitetura

## Visao Geral

Sistema completo de automacao WhatsApp com chatbot interativo, lembretes automaticos, human handoff, e dual-role routing (paciente + medico).

```
WhatsApp (Usuario) → Evolution API (v2.3.6) → Webhook Server (Node/Express) → Supabase (PostgreSQL)
```

**29 modulos TypeScript** no `webhook/src/`. Custo do WhatsApp: $0 (Evolution API open-source no nosso servidor).

---

## Identificacao de Usuarios

O sistema identifica quem mandou a mensagem buscando o telefone em `profiles`:

```
Mensagem recebida
      |
  Busca phone em profiles
      |
      +-- role = provider → FLUXO MEDICO
      +-- role = patient  → FLUXO PACIENTE
      +-- role = admin    → FLUXO ADMIN (mesmo do medico + extras)
      +-- dual-role       → Ambos os menus (paciente + medico)
      +-- nao encontrado  → Ignorar
```

---

## Fluxo Paciente

### Menu Principal
Paciente envia qualquer mensagem → recebe menu numerado:

| # | Acao | Detalhes |
|---|------|----------|
| 1 | Proximas consultas | Lista consultas futuras com status |
| 2 | Agendar consulta | Fluxo multi-step: servico → medico → data → horario → confirmacao |
| 3 | Cancelar consulta | Seleciona consulta, pede motivo, aviso se <24h |
| 4 | Historico | Ultimas consultas realizadas |
| 5 | Servicos da clinica | Sub-menu com categorias e precos |
| 6 | Info da clinica | Endereco, horarios, telefone |
| 7 | Falar com a clinica | Dispara human handoff |

### Confirmacao Rapida
Paciente responde "ok", "sim", "yes", "confirmo" → sistema busca consulta confirmada <48h e registra presenca (`confirmed_by_patient_at`).

### Agendamento pelo WhatsApp
Fluxo conversacional com estado (`conversationState`):
1. Escolhe categoria de servico (5 categorias)
2. Escolhe servico especifico
3. Escolhe medico (com disponibilidade)
4. Escolhe data (proximos dias disponiveis)
5. Escolhe horario (slots reais da agenda)
6. Confirma → cria appointment no banco

### Cancelamento Inteligente
- Se <24h antes da consulta: aviso de cancelamento tardio (step `confirm_late`)
- Pede motivo obrigatorio
- Link de reagendamento na mensagem

---

## Fluxo Medico

### Menu Principal
| # | Acao | Detalhes |
|---|------|----------|
| 1 | Agenda de hoje | Lista consultas do dia + bloqueios |
| 2 | Agenda de amanha | Idem para dia seguinte |
| 3 | Pacientes | Link direto para lista de pacientes |
| 4 | Todos os comandos | Atalhos + comandos com data |
| 5 | Bloquear hoje | Bloqueia dia inteiro |
| 6 | Liberar hoje | Remove bloqueios |
| 7 | Bloquear amanha | Bloqueia dia seguinte |

### Comandos por Texto
| Comando | Exemplo | Acao |
|---------|---------|------|
| `agenda DD/MM` | `agenda 15/02` | Agenda da data |
| `bloquear DD/MM` | `bloquear 15/02` | Bloquear dia inteiro |
| `bloquear DD/MM manha` | `bloquear 15/02 manha` | Bloquear 08:00-12:00 |
| `bloquear DD/MM HH:MM-HH:MM` | `bloquear 15/02 08:00-12:00` | Horario personalizado |
| `liberar DD/MM` | `liberar 15/02` | Remover bloqueios |

Comandos funcionam em PT e EN.

---

## Notificacoes Automaticas

### Lembretes (cron 5min via node-cron)
| Template | Para quem | Quando |
|----------|-----------|--------|
| `reminder_24h` | Paciente | 24h antes |
| `reminder_1h` | Paciente | 1h antes |
| `provider_reminder_2h` | Medico | 2h antes |
| `provider_reminder_15min` | Medico | 15min antes |
| `reminder_daily_provider` | Medico | Resumo diario |

### Eventos
| Template | Trigger |
|----------|---------|
| `appointment_confirmed` | Admin confirma consulta |
| `appointment_rejected` | Admin rejeita consulta |
| `appointment_cancelled` | Paciente cancela |
| `appointment_cancelled_by_provider` | Medico/admin cancela (com link reagendamento) |
| `appointment_auto_confirmed` | Auto-confirmacao |
| `new_appointment_provider` | Nova consulta agendada |
| `new_appointment_clinic` | Nova consulta (notif clinica) |
| `no_show_patient` | Paciente faltou |
| `no_show_provider` | Medico notificado de falta |

**14 tipos x 2 idiomas = 28 templates.** Idioma baseado em `profiles.preferred_language`.

### Regras Configuraveis
- Tabela `notification_rules`: target_role, provider_id (NULL=global), minutes_before, template
- Override: regra especifica do medico substitui global (mesmo minutes_before)
- UI Admin: `/admin/settings?tab=notifications` — CRUD de regras
- UI Medico: `/doctor/notifications` — auto-configuravel

---

## Human Handoff

Paciente pede "ajuda" / "help" / "falar com a clinica" → bot pausa, atendente assume.

### Fluxo
1. Paciente solicita → bot verifica atendentes disponiveis (timezone-aware EST/EDT)
2. Cria sessao em `handoff_sessions` + Set in-memory
3. Notifica atendentes via WhatsApp pessoal
4. Bot pausa para aquele paciente — mensagens repassadas direto
5. Atendente responde via WhatsApp Web da clinica

### Encerramento (4 formas)
- Atendente envia `#fechar` via WhatsApp
- Admin encerra pelo painel (`/admin/handoff`)
- Auto-timeout: 30min sem atividade
- Paciente envia "bot" ou "menu"

### Tabelas
- `attendants` — CRUD de atendentes
- `attendant_schedules` — horarios de disponibilidade
- `handoff_sessions` — sessoes ativas/encerradas

---

## Confiabilidade

| Feature | Detalhes |
|---------|----------|
| Retry automatico | Ate 3 tentativas por mensagem (cron 5min) |
| message_logs | Cada envio registrado com status (sent/failed) |
| wasAlreadySent() | Deduplicacao — ignora `status='failed'` para permitir retry |
| Msgs Falhas | `/admin/failed-messages` — lista com retry manual |
| Admin alertas | Popup quando WhatsApp falha ao confirmar/rejeitar |

---

## Protecoes

| Feature | Detalhes |
|---------|----------|
| Rate limiting | Max 3 msgs/10s por usuario |
| Session timeout | 30min sem atividade → reset do estado |
| Human escape | "ajuda"/"help" sempre disponivel |
| Conversation logging | Tabela `conversation_logs` para historico |
| Bilingue | TODA mensagem em PT e EN (via `lang: Language`) |

---

## Estrutura do Codigo

```
webhook/src/
├── index.ts                # Express server + rotas + Evolution proxy + handoff API
├── config.ts               # URLs e variaveis de ambiente
├── types.ts                # Tipos compartilhados
├── router.ts               # Dual-role routing (paciente + provider)
├── stateManager.ts         # Estado + menu management
├── menuBuilder.ts          # Menu dinamico numerado
├── patientMainMenu.ts      # Menu principal do paciente + handoff trigger
├── patientServices.ts      # Sub-menu de servicos
├── patientClinicInfo.ts    # Sub-menu info da clinica
├── patientAppointments.ts  # Ver/confirmar/cancelar consultas
├── patientBooking.ts       # Fluxo de agendamento
├── patientResponder.ts     # Formatters de mensagem (bilingue)
├── patientManager.ts       # Manager de pacientes
├── providerMainMenu.ts     # Menu do medico
├── providerResponder.ts    # Formatters do medico
├── handoffManager.ts       # Sessoes handoff (Set + DB)
├── attendantNotifier.ts    # Notifica atendentes (timezone-aware)
├── commandParser.ts        # Parser de comandos WhatsApp
├── scheduleManager.ts      # Supabase client (service_role_key)
├── whatsappResponder.ts    # sendMessage() + formatadores
├── reminderScheduler.ts    # Cron job 5min (node-cron)
├── reminderSender.ts       # Templates + dedup + envio
├── retrySender.ts          # Retry de mensagens falhas
├── conversationState.ts    # Estado de conversacao (booking, cancel)
├── rateLimiter.ts          # Rate limiting (3 msgs/10s)
├── messageLogger.ts        # Logging de conversas
├── treatmentCache.ts       # Cache de treatment_types
├── phoneUtils.ts           # Utilitarios de telefone
├── urlShortener.ts         # Encurtador de URLs (/go/:code)
└── userIdentifier.ts       # Identificacao de usuario por telefone
```

---

## Variaveis de Ambiente (webhook/.env)

| Variavel | Valor |
|----------|-------|
| `SUPABASE_URL` | `http://supabase-kong:8000` (interno Docker) |
| `SUPABASE_SERVICE_ROLE_KEY` | do supabase/.env |
| `EVOLUTION_API_URL` | `http://evolution_api:8080` (interno Docker) |
| `EVOLUTION_API_KEY` | do supabase/.env |
| `PANEL_BASE_URL` | `https://portal.essencemedicalclinic.com` |
| `SUPABASE_PUBLIC_URL` | `https://portal.essencemedicalclinic.com` |
| `SHORTENER_BASE_URL` | `https://portal.essencemedicalclinic.com` |
| `WEBHOOK_PORT` | `3002` |

---

*Atualizado: 13/02/2026*
