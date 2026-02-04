# Plano - Painel Administrativo

**Data:** 04/02/2026
**Status:** Planejamento

---

## 1. Visão Geral

Painel administrativo minimalista para gerenciar a clínica ShapeUp Health Solutions.

### Princípios
- **Minimalista** - Apenas o necessário
- **Direto** - Fluxos simples, sem passos extras
- **Fácil de usar** - Interface intuitiva

---

## 2. O Que Já Temos

### Banco de Dados
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Usuários (pacientes, providers, admins) |
| `providers` | Médicos/profissionais |
| `provider_schedules` | Horários de trabalho |
| `appointments` | Consultas agendadas |

### Frontend (Portal Paciente)
- Login/Registro (email + Google)
- Dashboard do paciente
- Agendamento de consultas
- Seletor de idioma (PT/EN)

### Infraestrutura
- Supabase (porta 8000)
- Evolution API (porta 8082)
- PostgreSQL (interno)

---

## 3. Estrutura do Admin

### Rotas
```
/admin
├── /login              → Login separado do admin
├── /dashboard          → Métricas e visão geral
├── /whatsapp           → Instâncias Evolution (QR Code)
├── /admins             → Gerenciar administradores
├── /providers          → Gerenciar médicos
├── /patients           → Visualizar pacientes
└── /appointments       → Todas as consultas (aprovar/rejeitar)
```

---

## 4. Fluxos Principais

### 4.1 Autenticação Admin
```
1. Admin acessa /admin/login
2. Insere email/senha
3. Sistema verifica: profile.role === 'admin'
4. Se sim → redireciona para /admin/dashboard
5. Se não → erro "Acesso negado"
```

**Primeiro Admin:** Criado manualmente no banco (você)

### 4.2 Criar Novo Admin
```
1. Admin logado acessa /admin/admins
2. Clica "Novo Admin"
3. Preenche: email, nome, senha temporária
4. Sistema cria usuário com role='admin'
5. Novo admin recebe email para definir senha
```

### 4.3 Adicionar Médico
```
1. Admin acessa /admin/providers
2. Clica "Novo Médico"
3. Preenche: nome, email, especialidade
4. Define horários de trabalho (grade semanal)
5. Sistema cria profile (role='provider') + provider + schedules
6. Médico recebe email com credenciais
```

### 4.4 Conectar WhatsApp (Evolution)
```
1. Admin acessa /admin/whatsapp
2. Vê lista de instâncias (inicialmente vazia)
3. Clica "Nova Instância"
4. Define nome (ex: "Principal", "Recepção")
5. Sistema cria instância via Evolution API
6. Mostra QR Code
7. Admin escaneia com WhatsApp
8. Status muda para "Conectado" (verde)
```

### 4.5 Fluxo de Agendamento (Paciente → Admin → Médico)
```
PACIENTE:
1. Paciente agenda consulta no portal
2. Status: "pending" (pendente)
3. WhatsApp envia para clínica: "Nova consulta solicitada"

ADMIN/MÉDICO:
4. Admin vê consulta pendente no painel
5. Admin aprova ou rejeita
6. Se aprovado: status → "confirmed"
7. WhatsApp envia para paciente: "Consulta confirmada!"

LEMBRETES AUTOMÁTICOS:
8. 24h antes: lembrete WhatsApp
9. 1h antes: lembrete WhatsApp
```

---

## 5. Telas do Admin

### 5.1 Dashboard
```
┌─────────────────────────────────────────────────────┐
│  ShapeUp Admin                        [Nome] [Sair] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │   12    │  │    3    │  │    5    │             │
│  │Pacientes│  │ Médicos │  │Pendentes│             │
│  └─────────┘  └─────────┘  └─────────┘             │
│                                                     │
│  WhatsApp: 🟢 Conectado (11 9999-9999)             │
│                                                     │
│  ┌─ Consultas Pendentes ──────────────────────────┐│
│  │ Maria Silva - Dr. João - 05/02 14:00  [✓] [✗] ││
│  │ Pedro Santos - Dra. Ana - 05/02 15:30 [✓] [✗] ││
│  └────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 5.2 WhatsApp
```
┌─────────────────────────────────────────────────────┐
│  Instâncias WhatsApp                [+ Nova]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ Principal ────────────────────────────────────┐│
│  │ Status: 🟢 Conectado                           ││
│  │ Número: +55 11 99999-9999                      ││
│  │ Desde: 04/02/2026 10:30                        ││
│  │                              [Desconectar]     ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  ┌─ Recepção ─────────────────────────────────────┐│
│  │ Status: 🔴 Desconectado                        ││
│  │                                                ││
│  │        ┌────────────┐                          ││
│  │        │ [QR CODE]  │                          ││
│  │        │            │                          ││
│  │        └────────────┘                          ││
│  │        Escaneie para conectar                  ││
│  └────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 5.3 Médicos
```
┌─────────────────────────────────────────────────────┐
│  Médicos                            [+ Novo]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Nome              Especialidade    Status          │
│  ─────────────────────────────────────────────────  │
│  Dr. João Silva    Endocrinologia   🟢 Ativo  [✏️] │
│  Dra. Ana Costa    Nutrição         🟢 Ativo  [✏️] │
│  Dr. Pedro Lima    Clínico Geral    🔴 Inativo[✏️] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.4 Consultas Pendentes
```
┌─────────────────────────────────────────────────────┐
│  Consultas                    [Todas] [Pendentes]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🟡 PENDENTE - Aguardando confirmação               │
│  ┌────────────────────────────────────────────────┐│
│  │ Maria Silva                                    ││
│  │ Consulta Inicial com Dr. João                  ││
│  │ 05/02/2026 às 14:00                            ││
│  │                                                ││
│  │ [✓ Confirmar]  [✗ Rejeitar]  [📞 Ligar]       ││
│  └────────────────────────────────────────────────┘│
│                                                     │
│  🟡 PENDENTE - Aguardando confirmação               │
│  ┌────────────────────────────────────────────────┐│
│  │ Pedro Santos                                   ││
│  │ Retorno com Dra. Ana                           ││
│  │ 05/02/2026 às 15:30                            ││
│  │                                                ││
│  │ [✓ Confirmar]  [✗ Rejeitar]  [📞 Ligar]       ││
│  └────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 6. Notificações WhatsApp

### Templates de Mensagem

| Evento | Mensagem (PT) |
|--------|---------------|
| Nova consulta (para clínica) | "📋 Nova consulta solicitada!\n\nPaciente: {nome}\nMédico: {medico}\nData: {data}\nHora: {hora}\n\nAcesse o painel para confirmar." |
| Consulta confirmada (para paciente) | "✅ Consulta confirmada!\n\n{nome}, sua consulta foi confirmada:\n\nMédico: {medico}\nData: {data}\nHora: {hora}\nLocal: {endereco}\n\nAté lá!" |
| Consulta rejeitada (para paciente) | "❌ Consulta não disponível\n\n{nome}, infelizmente o horário solicitado não está disponível.\n\nMotivo: {motivo}\n\nPor favor, agende outro horário pelo portal." |
| Lembrete 24h | "⏰ Lembrete de consulta!\n\n{nome}, sua consulta é amanhã:\n\nMédico: {medico}\nData: {data}\nHora: {hora}\n\nConfirme sua presença respondendo OK." |
| Lembrete 1h | "🔔 Sua consulta é em 1 hora!\n\nMédico: {medico}\nHora: {hora}\nLocal: {endereco}" |

---

## 7. Banco de Dados - Alterações Necessárias

### Nova Tabela: `whatsapp_instances`
```sql
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- "Principal", "Recepção"
  instance_name TEXT NOT NULL UNIQUE,    -- nome na Evolution API
  phone_number TEXT,                     -- número conectado
  status TEXT DEFAULT 'disconnected',    -- connected, disconnected, qr_code
  qr_code TEXT,                          -- base64 do QR
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Nova Tabela: `message_templates`
```sql
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- "confirmation", "reminder_24h"
  language TEXT DEFAULT 'pt',
  content TEXT NOT NULL,
  variables TEXT[],                      -- ["nome", "medico", "data"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Nova Tabela: `message_logs`
```sql
CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES whatsapp_instances(id),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES profiles(id),
  template_id UUID REFERENCES message_templates(id),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',         -- pending, sent, delivered, read, failed
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Alteração: `appointments`
```sql
ALTER TABLE appointments
ADD COLUMN confirmed_by UUID REFERENCES profiles(id),
ADD COLUMN confirmed_at TIMESTAMPTZ,
ADD COLUMN rejection_reason TEXT;
```

---

## 8. API Evolution - Endpoints Utilizados

| Ação | Método | Endpoint |
|------|--------|----------|
| Criar instância | POST | `/instance/create` |
| Obter QR Code | GET | `/instance/qrcode/{instance}` |
| Status conexão | GET | `/instance/connectionState/{instance}` |
| Desconectar | DELETE | `/instance/logout/{instance}` |
| Enviar texto | POST | `/message/sendText/{instance}` |
| Webhook status | - | Configurado para receber updates |

---

## 9. Implementação - Ordem

### Fase 1: Base Admin (2h)
- [ ] Rota /admin com layout próprio
- [ ] Login admin (verificar role)
- [ ] Criar primeiro admin no banco
- [ ] Dashboard básico (métricas)

### Fase 2: WhatsApp (3h)
- [ ] Tabela whatsapp_instances
- [ ] Tela de instâncias
- [ ] Criar instância (Evolution API)
- [ ] Mostrar QR Code
- [ ] Webhook para atualizar status
- [ ] Desconectar instância

### Fase 3: Gestão (2h)
- [ ] CRUD de admins
- [ ] CRUD de médicos
- [ ] Lista de pacientes (view only)

### Fase 4: Consultas (2h)
- [ ] Lista de consultas pendentes
- [ ] Aprovar/rejeitar consulta
- [ ] Atualizar status

### Fase 5: Notificações (2h)
- [ ] Tabelas templates e logs
- [ ] Enviar mensagem ao confirmar
- [ ] Enviar mensagem ao rejeitar
- [ ] Cron para lembretes (24h, 1h)

**Total estimado: 11 horas**

---

## 10. Arquivos a Criar

```
frontend/src/
├── pages/
│   └── admin/
│       ├── LoginAdmin.tsx
│       ├── AdminDashboard.tsx
│       ├── WhatsAppPage.tsx
│       ├── AdminsPage.tsx
│       ├── ProvidersPage.tsx
│       ├── PatientsPage.tsx
│       └── AppointmentsAdminPage.tsx
├── components/
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── AdminSidebar.tsx
│       ├── QRCodeDisplay.tsx
│       ├── InstanceCard.tsx
│       ├── AppointmentCard.tsx
│       └── StatsCard.tsx
├── hooks/
│   └── admin/
│       ├── useWhatsAppInstances.ts
│       ├── useAdmins.ts
│       └── usePendingAppointments.ts
└── lib/
    └── evolutionApi.ts
```

---

## 11. Decisões Técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Layout admin | Separado do portal | Contextos diferentes |
| Auth admin | Mesmo Supabase, role diferente | Simplicidade |
| Evolution API | Chamadas diretas do frontend | MVP rápido |
| QR Code | Polling a cada 3s | Simples, funciona |
| Notificações | Edge Function + Cron | Supabase nativo |

---

## 12. Próximos Passos

Após seu OK:
1. Criar tabelas novas no banco
2. Criar primeiro admin (seu usuário)
3. Implementar layout admin
4. Implementar conexão WhatsApp
5. Implementar gestão de consultas

---

**Aguardando aprovação para iniciar implementação.**
