# Notificações WhatsApp

Sistema de notificações via Evolution API.

## Arquivos Criados

| Arquivo | Função |
|---------|--------|
| `supabase/migrations/002_whatsapp_notifications.sql` | Tabelas + templates |
| `frontend/src/lib/whatsappService.ts` | Serviço de envio |
| `frontend/src/hooks/admin/useWhatsAppNotifications.ts` | Hook para páginas |

## Aplicar Migração

```bash
# Conectar no PostgreSQL
docker exec -it supabase-db psql -U postgres -d postgres

# Rodar migração manualmente
\i /docker-entrypoint-initdb.d/002_whatsapp_notifications.sql
```

Ou via Prisma/Supabase CLI conforme setup do projeto.

## Tabelas Criadas

- `whatsapp_instances` - Instâncias Evolution conectadas
- `message_templates` - Templates de mensagem (6 pré-configurados)
- `message_logs` - Histórico de envios

## Templates Disponíveis

| Nome | Quando usar |
|------|-------------|
| `appointment_confirmed` | Consulta confirmada |
| `appointment_rejected` | Consulta rejeitada |
| `appointment_cancelled` | Consulta cancelada |
| `reminder_24h` | 24h antes |
| `reminder_1h` | 1h antes |
| `new_appointment_clinic` | Nova consulta (para admin) |

## Uso no Código

```typescript
import { useWhatsAppNotifications } from '../hooks/admin/useWhatsAppNotifications';

const { sendConfirmation, isConnected } = useWhatsAppNotifications();

// Ao confirmar consulta
await sendConfirmation({
  patientName: 'Maria Silva',
  patientPhone: '11999999999',
  providerName: 'Dr. João',
  appointmentType: 'Consulta Inicial',
  appointmentDate: '10/02/2026',
  appointmentTime: '14:00',
  appointmentId: 'uuid'
});
```

## Debug

Abra o console do navegador. Logs com prefixo `[WhatsApp]`:
- `[WhatsApp] Buscando instância conectada...`
- `[WhatsApp] Enviando mensagem: {...}`
- `[WhatsApp] Mensagem enviada com sucesso!`
- `[WhatsApp ERROR] Erro ao enviar mensagem`

## Fluxo Atual

1. Admin aprova consulta no Dashboard
2. Sistema atualiza status para `confirmed`
3. Se paciente tem telefone + WhatsApp conectado → envia mensagem
4. Log salvo em `message_logs`

## Pendente

- [ ] Edge Function para lembretes automáticos (24h/1h)
- [ ] Webhook para status de entrega
- [ ] Notificação para clínica quando nova consulta
