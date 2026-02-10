# CHATBOT.md - WhatsApp Chatbot Essence Medical Clinic

> Documento de arquitetura, implementacao e referencia completa do chatbot WhatsApp.
> Ultima atualizacao: 10/02/2026

---

## Visao Geral

O chatbot WhatsApp da Essence Medical Clinic atende **pacientes** e **medicos** de forma automatica. O usuario e identificado pelo numero de telefone (ja autenticado — sem login necessario) e recebe um menu **dinamico** com apenas as opcoes disponiveis para seu contexto.

**Principios:**
- Toda interacao e por opcoes numeradas (1, 2, 3...) — nunca texto livre (exceto motivo de cancelamento)
- Menu dinamico: so mostra o que o usuario pode fazer AGORA
- `0` = voltar/sair em qualquer nivel
- `menu` = voltar ao menu principal
- `ok/sim/yes` = confirmacao rapida de presenca
- Bilingue: PT e EN baseado na preferencia do usuario
- Cada mensagem tem breadcrumb indicando onde o usuario esta

---

## Identificacao e Contexto

### Como o usuario e identificado

1. Mensagem chega via webhook da Evolution API
2. `userIdentifier.ts` extrai o telefone do JID
3. Busca em `profiles` por `phone` (match flexivel: ultimos 10-11 digitos)
4. Retorna: `userId`, `role`, `firstName`, `language`, `patientType`, `providerId`

### Contexto dinamico (queries ao receber mensagem)

Antes de montar o menu, o sistema consulta o banco para saber O QUE MOSTRAR:

```sql
-- 1. Consultas proximas do paciente (para decidir se mostra opcoes de consulta)
SELECT id, type, status, scheduled_at, provider_name
FROM appointments a
JOIN providers pr ON a.provider_id = pr.id
JOIN profiles p ON pr.user_id = p.id
WHERE a.patient_id = :userId
  AND a.scheduled_at > now()
  AND a.status NOT IN ('cancelled', 'no_show')
ORDER BY a.scheduled_at;

-- 2. Contadores por status
-- pending_count: quantas pendentes (para "Confirmar")
-- confirmable_count: quantas pending + confirmed (para "Cancelar")

-- 3. Tipo do paciente (ja vem do identify) → para elegibilidade

-- 4. Dual-role check: o usuario tambem e provider?
SELECT pr.id FROM providers pr
WHERE pr.user_id = :userId AND pr.is_active = true;
```

### Resultado: `PatientContext`

```typescript
interface PatientContext {
  user: UserInfo;
  appointments: PatientAppointment[];  // proximas consultas
  pendingCount: number;                // status = 'pending'
  cancellableCount: number;            // status IN ('pending', 'confirmed')
  hasConfirmedSoon: boolean;           // consulta confirmada nas proximas 48h
  isAlsoProvider: boolean;             // tem registro em providers?
  providerId?: string;                 // se for tambem provider
}
```

Esse contexto e carregado UMA VEZ quando a mensagem chega (antes de montar o menu).
Armazenado no state para nao fazer queries duplicadas durante o fluxo.

---

## Menus Dinamicos

### Principio: opcoes dinamicas com mapeamento

O menu NAO usa numeros fixos. Cada opcao e montada dinamicamente e o mapeamento e salvo no state:

```typescript
interface MenuOption {
  number: number;     // 1, 2, 3...
  action: string;     // 'appointments' | 'book' | 'services' | 'clinic_info' | ...
  label: string;      // texto exibido
}

// Salvo no state quando o menu e mostrado:
interface MenuState {
  type: 'menu';
  options: MenuOption[];
}
```

Quando o usuario responde "2", o sistema busca `options.find(o => o.number === 2).action` e roteia para o handler correto.

### Beneficio

Se o paciente NAO tem consultas, o menu pula as opcoes de consulta e os numeros se ajustam:
- Com consultas: `1=Consultas, 2=Agendar, 3=Servicos, 4=Info`
- Sem consultas: `1=Agendar, 2=Servicos, 3=Info`

O usuario sempre ve numeros sequenciais comecando do 1.

---

## Arvore Completa de Menus

### Nivel 0 — Selecao de Role (so se dual-role)

```
Ola, {nome}! 👋
Voce tem acesso como paciente e medico.

1. 👤 Menu Paciente
2. 🩺 Menu Medico
```

**Condicao:** `isAlsoProvider === true`
**Se so tem 1 role:** pula direto pro menu correspondente.

---

### Nivel 1 — Menu Principal Paciente

As opcoes aparecem APENAS se relevantes:

| Opcao | Acao | Condicao para aparecer |
|-------|------|------------------------|
| 📋 Minhas Consultas ({N}) | `appointments` | `appointments.length > 0` |
| ✅ Confirmar ({N} pendente) | `confirm` | `pendingCount > 0` |
| ❌ Cancelar Consulta | `cancel` | `cancellableCount > 0` |
| 📅 Agendar Consulta | `book` | sempre |
| 💊 Servicos e Precos | `services` | sempre |
| ℹ️ Informacoes da Clinica | `clinic_info` | sempre |

**Exemplo COM consultas:**
```
🏥 *Essence Medical Clinic*
Ola, Sarah! 👋

Voce tem 2 consultas proximas.

1. 📋 Minhas Consultas (2)
2. ✅ Confirmar (1 pendente)
3. ❌ Cancelar Consulta
4. 📅 Agendar Consulta
5. 💊 Servicos e Precos
6. ℹ️ Informacoes da Clinica
0. Sair

_Responda com o numero_
```

**Exemplo SEM consultas:**
```
🏥 *Essence Medical Clinic*
Ola, Sarah! 👋

1. 📅 Agendar Consulta
2. 💊 Servicos e Precos
3. ℹ️ Informacoes da Clinica
0. Sair

_Responda com o numero_
```

---

### Nivel 2a — Minhas Consultas

Mostra lista de consultas com status, depois submenu:

```
📋 *Minhas Consultas*

🟡 *Seg, 12/02 10:00*
   Consulta Inicial · Dra. Rosane
   Aguardando confirmacao

🟢 *Qua, 14/02 14:30*
   BHRT · Dra. Rosane
   Confirmada

1. ✅ Confirmar consulta
2. ❌ Cancelar consulta
3. 🔄 Reagendar consulta
0. ← Voltar
```

**Sub-opcoes dinamicas:**
- "Confirmar" so aparece se tem `pending`
- "Cancelar" so aparece se tem `pending` ou `confirmed`
- "Reagendar" so aparece se tem `pending` ou `confirmed`

---

### Nivel 2b — Agendar Consulta (fluxo multi-step)

```
Passo 1: CATEGORIA
📅 *Agendar > Categoria*

1. 🏥 Geral (6 servicos)
2. 💚 Bem-estar (10)
3. 🧬 Medicina Personalizada (6)
4. ✨ Rejuvenescimento (4)
5. 💉 Terapia IV (12)
6. 🧪 Terapia de Peptideos (8)
0. ← Voltar

Passo 2: SERVICO (dentro da categoria)
📅 *Agendar > Bem-estar*

1. Medicina Funcional (60 min) — $300
2. BHRT (45 min) — $200
3. Hipertrofia Masculina (45 min) — $200
4. Hipertrofia Feminina (45 min) — $200
5. Injecao para Perda de Peso (10 min) — $75
6. Injecao de Testosterona (10 min) — $25
7. Injecao de Nandrolona (10 min) — $30
8. Tirzepatide 2.5mg (5 min) — $300
➡️ 9. Proxima pagina
0. ← Voltar

Passo 3: MEDICO (auto-skip se so tem 1)
📅 *Agendar > Medico*

1. Dra. Rosane Nunes · Clinica Geral
0. ← Voltar

Passo 4: DATA (proximas 5 disponiveis)
📅 *Agendar > Data*

1. Seg, 12/02 — 4 horarios
2. Ter, 13/02 — 6 horarios
3. Qui, 15/02 — 3 horarios
4. Sex, 16/02 — 5 horarios
5. Seg, 19/02 — 7 horarios
0. ← Voltar

Passo 5: HORARIO
📅 *Agendar > Horario*

1. 10:00
2. 10:30
3. 11:00
4. 14:00
5. 14:30
6. 15:00
0. ← Voltar

Passo 6: CONFIRMACAO
📋 *Confirmar agendamento:*

📌 BHRT (45 min)
👨‍⚕️ Dra. Rosane Nunes
📅 Ter, 13/02
🕐 14:00
💰 $200

1. ✅ Confirmar
2. ❌ Cancelar
```

**Regras de elegibilidade aplicadas:**
- `new` → so ve: initial_consultation, functional_medicine
- `bhrt` sem labs recentes → aviso de labs necessarios
- Demais → todos os servicos ativos da categoria

**Paginacao:** se categoria tem >8 servicos, mostra 8 por pagina + "Proxima pagina"

---

### Nivel 2c — Servicos e Precos (somente visualizacao)

```
💊 *Servicos e Precos*

1. 🏥 Geral (6)
2. 💚 Bem-estar (10)
3. 🧬 Medicina Personalizada (6)
4. ✨ Rejuvenescimento (4)
5. 💉 Terapia IV (12)
6. 🧪 Terapia de Peptideos (8)
0. ← Voltar
```

Ao selecionar categoria:
```
💊 *Terapia IV*

💉 IV Protocols — 60 min — $250
💉 Nutricao IV Personalizada — 60 min — $180
💉 Teste de Nutrientes — 30 min — $70
💉 Terapia NAD+ — 90 min — $350
💉 Injecoes de Vitaminas — 20 min — $30
💉 Infusao de Ferro — 60 min — $180
💉 Terapia de Quelacao — 90 min — $300
💉 Vitamina C Alta Dose — 45 min — $220
➡️ 1. Proxima pagina
0. ← Voltar
```

**Dados vem de:** tabela `treatment_types` (cacheada na memoria, refresh a cada 30min)

---

### Nivel 2d — Informacoes da Clinica

```
ℹ️ *Informacoes da Clinica*

1. 📍 Endereco / Como chegar
2. 🕐 Horarios de Funcionamento
3. 📞 Telefone e Contato
4. 🌐 Site e Redes Sociais
0. ← Voltar
```

**Sub-opcao 1 — Endereco:**
```
📍 *Essence Medical Clinic*

2000 NE 44th ST, Suite 101B
Oakland Park, FL 33308

📎 Google Maps:
https://maps.google.com/?q=2000+NE+44th+ST+Suite+101B+Oakland+Park+FL+33308

0. ← Voltar
```

**Sub-opcao 2 — Horarios:**
```
🕐 *Horarios de Funcionamento*

Mon-Fri: 10:00 AM - 6:00 PM
Sat: 11:00 AM - 3:00 PM (2x ao mes)
Sun: Fechado

0. ← Voltar
```

**Sub-opcao 3 — Contato:**
```
📞 *Contato*

📱 +1 (954) 756-2565
📧 team@essencemedicalclinic.com

0. ← Voltar
```

**Sub-opcao 4 — Site:**
```
🌐 *Online*

🌐 essencemedicalclinic.com
📸 @essencemedicalclinic

0. ← Voltar
```

---

### Nivel 1 — Menu Principal Medico

```
🩺 *Painel Medico*
Ola, Dra. Rosane! 👋

1. 📋 Agenda de Hoje
2. 📅 Agenda de Amanha
3. ✅ Confirmar Consulta
4. ❌ Cancelar Consulta
5. 🔒 Bloquear Horario
6. 🔓 Desbloquear Horario
0. Sair
```

**Opcoes dinamicas (futuro):**
- "Confirmar" so aparece se tem pendentes
- "Desbloquear" so aparece se tem bloqueios ativos

---

## Controle no Banco de Dados

### Tabela: `conversation_logs` (NOVA — migration 029)

```sql
CREATE TABLE conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  phone TEXT NOT NULL,
  role TEXT NOT NULL,              -- 'patient' | 'provider' | 'admin'
  direction TEXT NOT NULL,         -- 'in' (usuario) | 'out' (bot)
  message_text TEXT NOT NULL,
  handler TEXT,                    -- 'main_menu' | 'booking' | 'services' | etc.
  state_step TEXT,                 -- 'select_type' | 'select_date' | etc.
  metadata JSONB,                  -- dados extras (opcoes mostradas, erros, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indice para busca rapida por usuario
CREATE INDEX idx_conversation_logs_user ON conversation_logs(user_id, created_at DESC);

-- Indice para busca por telefone
CREATE INDEX idx_conversation_logs_phone ON conversation_logs(phone, created_at DESC);

-- Auto-purge: manter apenas 30 dias (via cron ou pg_cron)
-- DELETE FROM conversation_logs WHERE created_at < now() - interval '30 days';
```

### Como debugar uma conversa

```sql
-- Ver todas as mensagens de um usuario nas ultimas 24h
SELECT direction, message_text, handler, state_step, created_at
FROM conversation_logs
WHERE phone LIKE '%48998384402%'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at;
```

### Dados usados para menu dinamico

| Dado | Fonte | Query |
|------|-------|-------|
| Consultas proximas | `appointments` | `patient_id = ? AND scheduled_at > now() AND status NOT IN (cancelled, no_show)` |
| Contagem por status | Derivado da query acima | `filter(status === 'pending').length` |
| Tipo do paciente | `profiles.patient_type` | Ja vem do `identifyUser()` |
| E tambem provider? | `providers` | `user_id = ? AND is_active = true` |
| Servicos e precos | `treatment_types` | Cache em memoria, refresh 30min |
| Elegibilidade | RPC `check_patient_eligibility` | Por tipo de consulta |
| Consulta confirmada em 48h | `appointments` | `patient_id = ? AND status = 'confirmed' AND scheduled_at BETWEEN now() AND now() + 48h` |

### Cache de treatment_types

```typescript
// treatmentCache.ts
let cache: TreatmentType[] = [];
let lastRefresh = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export async function getTreatments(): Promise<TreatmentType[]> {
  if (Date.now() - lastRefresh > CACHE_TTL || cache.length === 0) {
    const { data } = await supabase
      .from('treatment_types')
      .select('*')
      .eq('is_active', true)
      .order('category, sort_order');
    cache = data || [];
    lastRefresh = Date.now();
  }
  return cache;
}

export function getTreatmentsByCategory(): Map<string, TreatmentType[]> {
  const map = new Map();
  for (const t of cache) {
    if (!map.has(t.category)) map.set(t.category, []);
    map.get(t.category).push(t);
  }
  return map;
}
```

---

## Estrutura de Arquivos

### Atual (16 arquivos)

```
webhook/src/
├── index.ts              # Entry point + Express + routing (220 linhas — mistura tudo)
├── config.ts             # Config
├── types.ts              # Tipos
├── userIdentifier.ts     # Phone → user
├── phoneUtils.ts         # Matching de telefone
├── patientHandler.ts     # GOD FILE: routing + state + booking + cancel (528 linhas)
├── patientManager.ts     # Queries DB do paciente
├── patientResponder.ts   # Formatacao de mensagens (366 linhas)
├── conversationState.ts  # Estado em memoria (TTL 15min)
├── commandParser.ts      # Parser de comandos do medico (texto livre)
├── whatsappResponder.ts  # sendMessage + formatacao do medico
├── scheduleManager.ts    # Supabase client + queries medico
├── reminderScheduler.ts  # Cron 5min
├── reminderSender.ts     # Envio de lembretes
├── retrySender.ts        # Retry de falhas
└── urlShortener.ts       # Links curtos
```

### Proposta (22 arquivos)

```
webhook/src/
├── index.ts                  # Entry point (slim, <40 linhas)
├── config.ts                 # Config (inalterado)
├── types.ts                  # Tipos expandidos
│
│── CORE ────────────────────────
├── router.ts                 # NOVO: roteador principal
│                             #   - identifica usuario
│                             #   - carrega PatientContext
│                             #   - detecta dual-role
│                             #   - roteia para handler correto
├── stateManager.ts           # RENOMEADO de conversationState.ts
│                             #   - adiciona MenuState
│                             #   - mapeamento de opcoes dinamicas
├── messageLogger.ts          # NOVO: grava conversation_logs
├── menuBuilder.ts            # NOVO: constroi menus numerados
│                             #   - paginacao automatica (>8 itens)
│                             #   - breadcrumbs
│                             #   - mapeamento opcao→acao
├── treatmentCache.ts         # NOVO: cache de treatment_types
│
│── PATIENT HANDLERS ────────────
├── patientMainMenu.ts        # Menu principal dinamico
├── patientAppointments.ts    # Ver / confirmar / cancelar / reagendar
├── patientBooking.ts         # Fluxo de agendamento (6 steps)
├── patientServices.ts        # NOVO: servicos e precos por categoria
├── patientClinicInfo.ts      # NOVO: horarios, endereco, contato
├── patientManager.ts         # Queries DB (inalterado)
│
│── PROVIDER HANDLERS ───────────
├── providerMainMenu.ts       # NOVO: menu por numeros (substitui commandParser)
├── providerSchedule.ts       # EXTRAIDO: agenda, bloqueios
│
│── SHARED ──────────────────────
├── userIdentifier.ts         # Phone matching (expandido: dual-role)
├── whatsappSender.ts         # RENOMEADO de whatsappResponder.ts
├── scheduleManager.ts        # Supabase client (inalterado)
├── phoneUtils.ts             # Phone matching (inalterado)
├── urlShortener.ts           # Links curtos (inalterado)
│
│── AUTOMATION (inalterado) ─────
├── reminderScheduler.ts      # Cron 5min
├── reminderSender.ts         # Lembretes
└── retrySender.ts            # Retry
```

### Regras de organizacao

- **1 handler = 1 feature**: cada handler gerencia seu proprio fluxo
- **Handler recebe `PatientContext`**: nunca faz query direta, usa o contexto carregado pelo router
- **Handler retorna mensagem**: nao chama `sendMessage` direto — o router envia
- **Formatacao co-localizada**: cada handler formata suas proprias mensagens (nao centraliza)
- **State tipado**: cada handler define seus proprios tipos de state

---

## Implementacao — Fases

### Fase 1: Foundation (sem quebrar nada)

**Arquivos novos:**
- `router.ts` — roteador com dual-role + PatientContext
- `stateManager.ts` — renomear + expandir conversationState.ts
- `messageLogger.ts` — gravar conversation_logs
- `menuBuilder.ts` — menus dinamicos com paginacao
- `treatmentCache.ts` — cache de treatment_types

**Migration:**
- `029_conversation_logs.sql` — tabela + indices

**Testes:**
- Numero de teste (+554831971656) consegue receber menu dinamico
- Log de conversa aparece no banco
- Se tambem for provider, ve selecao de role

### Fase 2: Features novas

**Arquivos novos:**
- `patientServices.ts` — servicos e precos por categoria
- `patientClinicInfo.ts` — horarios, endereco, contato, site

**Integrar ao menu:**
- Opcoes "Servicos e Precos" e "Informacoes" aparecem no menu principal

### Fase 3: Refatorar existente

**Splittar `patientHandler.ts`:**
- `patientMainMenu.ts` — routing do menu principal
- `patientAppointments.ts` — ver/confirmar/cancelar
- `patientBooking.ts` — fluxo de agendamento (agora com categorias)

**Splittar provider flow:**
- `providerMainMenu.ts` — menu por numeros
- `providerSchedule.ts` — agenda e bloqueios
- Remover `commandParser.ts` (obsoleto)

### Fase 4: Polish

- Breadcrumbs em todas as mensagens
- Reagendamento (cancel + auto-start booking)
- Precos no fluxo de agendamento (step 6 mostra valor)
- Confirmacao rapida melhorada (mostra detalhes da consulta)

---

## Servicos Disponiveis (46 ativos)

### General (6)
| Servico | Duracao | Preco |
|---------|---------|-------|
| Initial Consultation | 60 min | $100 |
| Follow-up | 30 min | $125 |
| InBody Composition | 10 min | $50 |
| Calorimetry | 15 min | $70 |
| Nutritionist Consult | 60 min | $120 |
| Mid-Level Consultation | 45 min | $200 |

### Well-being (10)
| Servico | Duracao | Preco |
|---------|---------|-------|
| Functional Medicine | 60 min | $300 |
| BHRT | 45 min | $200 |
| Male Hypertrophy | 45 min | $200 |
| Female Hypertrophy | 45 min | $200 |
| Weight Loss Injection | 10 min | $75 |
| Testosterone Injection | 10 min | $25 |
| Nandrolone Injection | 10 min | $30 |
| Tirzepatide 2.5mg | 5 min | $300 |
| Tirzepatide 5mg | 5 min | $350 |
| Tirzepatide 7.5mg | 5 min | $375 |

### Personalized Medicine (6)
| Servico | Duracao | Preco |
|---------|---------|-------|
| Insulin Resistance | 45 min | $200 |
| Chronic Inflammation | 45 min | $200 |
| Thyroid Support | 45 min | $200 |
| High Cortisol | 45 min | $200 |
| Male Pellet Insertion | 30 min | $850 |
| Female Pellet Insertion | 30 min | $450 |

### Rejuvenation (4)
| Servico | Duracao | Preco |
|---------|---------|-------|
| Morpheus8 | 60 min | $1,000 |
| Botulinum Toxin | 30 min | $600 |
| Fillers | 45 min | Variable |
| Skin Boosters | 30 min | $150 |

### IV Therapy (12)
| Servico | Duracao | Preco |
|---------|---------|-------|
| IV Protocols | 60 min | $250 |
| Customized IV Nutrition | 60 min | $180 |
| Nutrient Testing | 30 min | $70 |
| NAD+ Therapy | 90 min | $350 |
| Vitamin Injections | 20 min | $30 |
| Iron Infusions | 60 min | $180 |
| Chelation Therapy | 90 min | $300 |
| High Dose Vitamin C | 45 min | $220 |
| Inflammation IV | 60 min | $220 |
| Metabolic IV | 60 min | $220 |
| Homocysteine IV | 60 min | $220 |
| Insulin Resistance IV | 60 min | $220 |

### Peptide Therapy (8)
| Servico | Duracao | Preco |
|---------|---------|-------|
| BPC-157 | 30 min | Variable |
| Thymosin Alpha-1 | 30 min | Variable |
| CJC-1295/Ipamorelin | 30 min | Variable |
| PT-141 | 30 min | Variable |
| Selank | 30 min | Variable |
| KPV | 30 min | Variable |
| Dihexa | 30 min | Variable |
| MOTS-c | 30 min | Variable |

---

## Informacoes da Clinica (hardcoded)

```typescript
// Fonte: frontend/src/constants/treatments.ts → CLINIC_INFO
const CLINIC = {
  name: 'Essence Medical Clinic',
  address: '2000 NE 44th ST, Suite 101B',
  city: 'Oakland Park',
  state: 'FL',
  zip: '33308',
  phone: '+1 (954) 756-2565',
  email: 'team@essencemedicalclinic.com',
  website: 'essencemedicalclinic.com',
  instagram: '@essencemedicalclinic',
  hours: {
    weekdays: 'Mon-Fri: 10:00 AM - 6:00 PM',
    saturday: 'Sat: 11:00 AM - 3:00 PM (2x/month)',
    sunday: 'Sun: Closed',
  },
  googleMaps: 'https://maps.google.com/?q=2000+NE+44th+ST+Suite+101B+Oakland+Park+FL+33308',
};
```

---

## Debug e Monitoramento

### Logs de conversa (conversation_logs)

```sql
-- Todas as conversas de um numero nas ultimas 24h
SELECT direction, message_text, handler, state_step,
       to_char(created_at, 'HH24:MI:SS') as hora
FROM conversation_logs
WHERE phone LIKE '%8384402%'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at;

-- Contagem de interacoes por handler (ultimos 7 dias)
SELECT handler, count(*) as total
FROM conversation_logs
WHERE direction = 'in'
  AND created_at > now() - interval '7 days'
GROUP BY handler
ORDER BY total DESC;

-- Conversas que terminaram em erro
SELECT user_id, phone, message_text, metadata->>'error' as error, created_at
FROM conversation_logs
WHERE metadata->>'error' IS NOT NULL
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### Docker logs

```bash
# Ver logs do webhook em tempo real
ssh clinica-vps "docker logs -f webhook-server --tail 50"

# Filtrar por paciente
ssh clinica-vps "docker logs webhook-server 2>&1 | grep 'Patient:'"
```

---

## Como Adicionar Nova Feature

### 1. Criar handler

```typescript
// patientNovaFeature.ts
import { PatientContext } from './types';
import { Language } from './types';

export function shouldShow(ctx: PatientContext): boolean {
  // Retorna true se essa opcao deve aparecer no menu
  return true; // ou condicao especifica
}

export function menuLabel(lang: Language): string {
  return lang === 'pt' ? '🆕 Nova Feature' : '🆕 New Feature';
}

export async function handle(
  ctx: PatientContext,
  input: string
): Promise<string> {
  // Logica da feature
  // Retorna a mensagem para enviar ao usuario
  return 'Resultado da feature';
}
```

### 2. Registrar no menu principal

```typescript
// patientMainMenu.ts
import * as novaFeature from './patientNovaFeature';

// Na funcao buildMenu():
if (novaFeature.shouldShow(ctx)) {
  options.push({
    number: nextNumber++,
    action: 'nova_feature',
    label: novaFeature.menuLabel(lang),
  });
}

// No switch de routing:
case 'nova_feature':
  return novaFeature.handle(ctx, input);
```

### 3. Pronto

A feature aparece automaticamente no menu (so quando relevante) e funciona.

---

## Testes

### Numero de teste

| Numero | Role | Cadastrado como |
|--------|------|-----------------|
| +554831971656 | patient | Paciente Teste (DB) |

**Para testar dual-role:** adicionar esse mesmo numero como provider no DB.

### Cenarios de teste

| # | Cenario | Resultado esperado |
|---|---------|-------------------|
| 1 | Paciente sem consultas envia qualquer msg | Menu com 3 opcoes (Agendar, Servicos, Info) |
| 2 | Paciente com 1 consulta pendente | Menu com 6 opcoes (inclui Consultas, Confirmar, Cancelar) |
| 3 | Paciente envia "ok" com consulta confirmada em 48h | Confirmacao rapida de presenca |
| 4 | Paciente envia "ok" sem consulta confirmada | Menu principal |
| 5 | Dual-role envia qualquer msg | Selecao: Menu Paciente ou Menu Medico |
| 6 | Paciente pede servicos | Lista 6 categorias |
| 7 | Paciente seleciona categoria IV Therapy | Lista 12 servicos com precos (paginado) |
| 8 | Paciente agenda consulta | Fluxo 6 steps com preco no final |
| 9 | Paciente cancela com <24h | Aviso de cancelamento tardio |
| 10 | Paciente pede info da clinica | Submenu com endereco, horarios, contato, site |
| 11 | Numero desconhecido envia msg | Ignorado (sem resposta) |
| 12 | "0" em qualquer nivel | Volta ao nivel anterior |
| 13 | "menu" em qualquer nivel | Volta ao menu principal |
| 14 | Opcao invalida | "Opcao invalida. Tente novamente." |
| 15 | State expira (15min) | Proximo msg mostra menu principal |

---

## Resumo de Decisoes

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Estado de conversa | In-memory (Map, TTL 15min) | Efemero por natureza. DB logging para debug |
| Full-text search | Nao | 46 itens — navegacao por categoria e melhor UX |
| Menu numeros fixos vs dinamicos | Dinamicos com mapeamento | So mostra opcoes relevantes |
| Paginacao | 8 itens por pagina | Mensagem WhatsApp legivel |
| Refactoring | Incremental (4 fases) | Nao quebrar o que funciona |
| Cache de servicos | In-memory, refresh 30min | Evita query a cada mensagem |
| Formatacao | Co-localizada no handler | Cada feature controla seus textos |
| Provider menu | Numeros (como paciente) | Consistencia, menos erro |
| Logging | Tabela conversation_logs (30 dias) | Debug + analytics |

---

*Documento criado em 10/02/2026. Referencia para implementacao do chatbot WhatsApp.*
