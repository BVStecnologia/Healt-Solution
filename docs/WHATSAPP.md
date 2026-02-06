# WhatsApp Automation - Arquitetura Completa

Documento único de referência para toda a automação via WhatsApp.
Cobre ambos os lados: **Médico** (implementado) e **Paciente** (planejado).

---

## Arquitetura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  WhatsApp   │────▶│  Evolution API   │────▶│  Webhook Server │
│  (Usuário)  │◀────│  (v2.3.6)        │     │  (Node/Express) │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                      │
                                              ┌───────▼───────┐
                                              │   Supabase    │
                                              │  (PostgreSQL) │
                                              └───────────────┘
```

**Fluxo:**
1. Usuário manda mensagem no WhatsApp
2. Evolution API recebe e envia webhook para `POST /webhook/messages`
3. Webhook Server identifica o usuário pelo telefone
4. Executa o comando baseado no **role** do usuário
5. Envia resposta via Evolution API `POST /message/sendText`
6. Cada resposta inclui link encurtado para o painel (URL Shortener interno)

---

## Identificação de Usuários

O sistema identifica quem mandou a mensagem buscando o telefone no banco.

```
Mensagem recebida
      │
      ▼
 Busca phone em profiles
      │
      ├─ role = provider → FLUXO MÉDICO
      ├─ role = patient  → FLUXO PACIENTE
      ├─ role = admin    → FLUXO ADMIN (mesmo do médico + extras)
      └─ não encontrado  → IGNORAR (ou msg "número não cadastrado")
```

### Estado Atual
- `identifyProvider()` busca APENAS na tabela `providers`
- Se não é médico → ignora silenciosamente

### Estado Futuro
- `identifyUser()` busca na tabela `profiles` (todos os roles)
- Retorna `{ role, userId, name, email, phone, language, providerId? }`
- Router direciona para handler correto por role

---

## Fluxo Médico (IMPLEMENTADO)

### Menu Principal
Médico envia qualquer mensagem ou "ajuda" → recebe menu numerado:

```
🏥 Essence Medical

1️⃣  Agenda de hoje
2️⃣  Agenda de amanhã
3️⃣  Pacientes
4️⃣  Todos os comandos
5️⃣  Bloquear hoje
6️⃣  Liberar hoje
7️⃣  Bloquear amanhã

Responda com o número ou envie um comando (ex: agenda 15/02)
```

### Comandos por Número
| # | Ação | Detalhes |
|---|------|----------|
| 1 | Agenda hoje | Lista consultas do dia + bloqueios + link painel |
| 2 | Agenda amanhã | Idem para dia seguinte |
| 3 | Pacientes | Link direto para lista de pacientes |
| 4 | Todos os comandos | Atalhos + comandos com data |
| 5 | Bloquear hoje | Bloqueia dia inteiro + mostra conflitos |
| 6 | Liberar hoje | Remove todos bloqueios do dia |
| 7 | Bloquear amanhã | Bloqueia dia inteiro de amanhã |

### Comandos por Texto (datas específicas)
| Comando | Exemplo | Ação |
|---------|---------|------|
| `agenda DD/MM` | `agenda 15/02` | Agenda da data |
| `bloquear DD/MM` | `bloquear 15/02` | Bloquear dia inteiro |
| `bloquear DD/MM manhã` | `bloquear 15/02 manhã` | Bloquear 08:00-12:00 |
| `bloquear DD/MM tarde` | `bloquear 15/02 tarde` | Bloquear 12:00-18:00 |
| `bloquear DD/MM HH:MM-HH:MM` | `bloquear 15/02 08:00-12:00` | Horário personalizado |
| `liberar DD/MM` | `liberar 15/02` | Remover bloqueios da data |
| `pacientes` | — | Link para painel de pacientes |

### Bilíngue
- Comandos funcionam em PT e EN (`schedule`, `block`, `unblock`, etc.)
- Idioma da resposta baseado em `profiles.preferred_language`
- Menu numerado usa idioma do médico automaticamente

### Respostas Incluem
- Dados formatados (agenda, bloqueios, conflitos)
- Link encurtado para o painel (`/go/:code` → magic link auto-login)
- Indicador de "digitando..." antes de responder
- Delay natural (1-3s baseado no tamanho da mensagem)

---

## Fluxo Paciente (PLANEJADO)

### Menu Principal
Paciente envia qualquer mensagem → recebe menu numerado:

```
🏥 Essence Medical

Olá, [Nome]! 👋

1️⃣  Minhas consultas
2️⃣  Confirmar consulta
3️⃣  Cancelar consulta
4️⃣  Agendar consulta
5️⃣  Falar com a clínica

Responda com o número.
```

### Comandos Planejados
| # | Ação | Detalhes |
|---|------|----------|
| 1 | Minhas consultas | Lista próximas consultas (data, hora, médico, status) |
| 2 | Confirmar consulta | Se tem consulta pendente, confirma. Se não, avisa. |
| 3 | Cancelar consulta | Se tem consulta futura, pede confirmação e cancela |
| 4 | Agendar consulta | Fluxo simplificado (tipo → data → horário → confirma) |
| 5 | Falar com clínica | Mensagem informando telefone/email da clínica |

### Fluxo "Minhas Consultas" (opção 1)
```
📋 Suas próximas consultas:

10/02 (Seg) 09:00 — Dr. Pedro Santos
  Retorno · Confirmada ✅

15/02 (Sáb) 14:00 — Dra. Ana Costa
  Av. Hormonal · Pendente ⏳
  → Responda "confirmar" para confirmar

Nenhuma outra consulta agendada.
🔗 Ver no portal: https://app.essencemedicalclinic.com/go/xY9kLm
```

### Fluxo "Agendar Consulta" (opção 4)
Fluxo conversacional multi-step:
```
Passo 1: "Qual tipo de consulta?"
  1️⃣ Retorno
  2️⃣ Avaliação Hormonal
  3️⃣ Revisão de Exames
  4️⃣ Nutrição
  (tipos disponíveis baseados no patient_type e elegibilidade)

Passo 2: "Com qual médico?"
  1️⃣ Dr. Pedro Santos
  2️⃣ Dra. Ana Costa
  (apenas médicos que atendem esse tipo)

Passo 3: "Qual data?"
  1️⃣ 10/02 (Seg) — 3 horários
  2️⃣ 11/02 (Ter) — 5 horários
  3️⃣ 12/02 (Qua) — 2 horários
  (próximos dias com disponibilidade)

Passo 4: "Qual horário?"
  1️⃣ 09:00
  2️⃣ 09:30
  3️⃣ 10:00

Passo 5: Confirmação
  "✅ Consulta agendada!
   12/02 (Qua) 09:30 — Dra. Ana Costa
   Avaliação Hormonal
   🔗 Ver no portal: ..."
```

### Respostas a Lembretes (Automáticos)
Quando o paciente recebe um lembrete (24h ou 1h antes):
```
⏰ Lembrete: Sua consulta é amanhã!
12/02 (Qua) 09:30 — Dra. Ana Costa

Responda:
  "ok" ou "confirmar" → Confirma presença
  "cancelar" → Cancela consulta
```

### Elegibilidade
Mesmas regras do portal web:
- Paciente `new` → só `initial_consultation`
- Paciente `trt`/`hormone` → precisa exames + visita recente
- Paciente `general`/`vip` → sem restrições
- Se inelegível → mensagem explicativa + link para portal

---

## Fluxo Admin (FUTURO)

Admin recebe os mesmos comandos do médico MAIS:
- `stats` → Estatísticas rápidas (consultas hoje, pendentes, etc.)
- `aprovar` → Lista consultas pendentes para aprovar
- Notificações de novas consultas agendadas

---

## Notificações Automáticas (Templates Existentes)

### Templates Implementados (migração 002 + 005)
| Slug | Tipo | Descrição |
|------|------|-----------|
| `appointment_confirmed` | Para paciente | Consulta confirmada pela clínica |
| `appointment_rejected` | Para paciente | Consulta rejeitada/cancelada |
| `appointment_cancelled` | Para paciente | Consulta cancelada |
| `reminder_24h` | Para paciente | Lembrete 24h antes |
| `reminder_1h` | Para paciente | Lembrete 1h antes |
| `new_appointment_clinic` | Para médico | Nova consulta agendada |

Cada template existe em **PT** e **EN** (12 total).
Idioma selecionado por `profiles.preferred_language`.

### Lembretes Automáticos (PENDENTE)
- Cron job (Edge Function ou node-cron) que roda a cada hora
- Busca consultas confirmadas nas próximas 24h / 1h
- Envia template correspondente
- Registra em `message_logs`

---

## URL Shortener

### Como Funciona
1. Gera magic link (Supabase Auth admin API)
2. Encurta para `/go/:code` (6 caracteres, base64url)
3. Armazenamento in-memory com TTL de 1 hora
4. Redirect 302 ao acessar

### Formato
```
Desenvolvimento: http://localhost:3002/go/LE_HcQ
Produção:        https://app.essencemedicalclinic.com/go/LE_HcQ
```

### Importante
- Links com domínio real ficam **clicáveis** no WhatsApp (azul + preview)
- Links localhost ficam como texto puro (comportamento normal do WhatsApp)
- Testado e comprovado em 06/02/2026

---

## Estrutura do Código

```
webhook/src/
├── index.ts              # Express server + rotas + handler principal
├── config.ts             # Variáveis de ambiente
├── types.ts              # Tipos TypeScript (payloads, commands, etc.)
├── commandParser.ts      # Parse de mensagens → comandos estruturados
├── scheduleManager.ts    # Queries no Supabase (agenda, bloqueios, magic links)
├── whatsappResponder.ts  # Formatação de respostas + envio de mensagens
├── urlShortener.ts       # Encurtador de URLs in-memory
└── phoneUtils.ts         # Normalização/comparação de telefones
```

### Para Adicionar o Fluxo de Pacientes
1. `identifyProvider()` → renomear para `identifyUser()` (busca em `profiles`)
2. Criar `patientHandler.ts` (handler separado para comandos de paciente)
3. Criar `patientResponder.ts` (formatação de respostas do paciente)
4. Adicionar `patientCommands.ts` (parser de comandos do paciente)
5. `index.ts` → router por role: `if provider → providerHandler, if patient → patientHandler`

### Estado Conversacional (para fluxo multi-step do paciente)
O agendamento via WhatsApp requer estado (qual passo o paciente está):
- Opção simples: Map in-memory `{ jid → { step, data } }` com TTL
- Opção robusta: Tabela `whatsapp_sessions` no banco

---

## Variáveis de Ambiente

| Variável | Dev | Produção |
|----------|-----|----------|
| `SUPABASE_URL` | `http://supabase-kong:8000` | `http://supabase-kong:8000` (interno) |
| `SUPABASE_SERVICE_ROLE_KEY` | do .env | do .env |
| `EVOLUTION_API_URL` | `http://evolution_api:8080` | `http://evolution_api:8080` (interno) |
| `EVOLUTION_API_KEY` | do .env | do .env |
| `PANEL_BASE_URL` | `http://localhost:3000` | `https://app.essencemedicalclinic.com` |
| `SUPABASE_PUBLIC_URL` | `http://localhost:8000` | `https://app.essencemedicalclinic.com` |
| `SHORTENER_BASE_URL` | `http://localhost:3002` | `https://app.essencemedicalclinic.com` |

> Subdomínio pendente confirmação do cliente. Ver `docs/DEPLOY.md`.

---

*Atualizado: 06/02/2026*
