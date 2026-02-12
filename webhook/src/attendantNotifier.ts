import { getClient } from './scheduleManager';
import { sendMessage } from './whatsappResponder';
import { config } from './config';

interface Attendant {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notify_whatsapp: boolean;
  notify_email: boolean;
}

/**
 * Checks if there are available attendants right now.
 * An attendant is available if:
 * 1. is_active = true
 * 2. Has a schedule for the current day of week
 * 3. Current time is within their schedule window
 */
export async function hasAvailableAttendants(): Promise<boolean> {
  const client = getClient();
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 6=Sat
  const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:00`;

  const { data, error } = await client
    .from('attendant_schedules')
    .select(`
      id,
      attendant:attendants!attendant_schedules_attendant_id_fkey(
        id,
        is_active
      )
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .lte('start_time', currentTime)
    .gte('end_time', currentTime);

  if (error) {
    console.error('[AttendantNotifier] Error checking availability:', error);
    return false;
  }

  if (!data || data.length === 0) return false;

  // Check if at least one attendant is active
  return data.some((schedule: any) => {
    const attendant = Array.isArray(schedule.attendant)
      ? schedule.attendant[0]
      : schedule.attendant;
    return attendant?.is_active === true;
  });
}

/**
 * Notifies all available attendants about a new handoff request.
 * Sends WhatsApp message to each attendant's personal phone.
 */
export async function notifyAttendants(
  patientName: string | null,
  patientPhone: string,
  reason: string,
  instanceName: string
): Promise<void> {
  const client = getClient();
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:00`;

  // Fetch active attendants with schedules for right now
  const { data: schedules, error } = await client
    .from('attendant_schedules')
    .select(`
      attendant:attendants!attendant_schedules_attendant_id_fkey(
        id,
        name,
        phone,
        email,
        notify_whatsapp,
        notify_email,
        is_active
      )
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .lte('start_time', currentTime)
    .gte('end_time', currentTime);

  if (error) {
    console.error('[AttendantNotifier] Error fetching attendants:', error);
    return;
  }

  if (!schedules || schedules.length === 0) return;

  // Deduplicate attendants (may have multiple schedule segments)
  const seen = new Set<string>();
  const attendants: Attendant[] = [];

  for (const schedule of schedules) {
    const att = Array.isArray(schedule.attendant)
      ? schedule.attendant[0]
      : schedule.attendant;

    if (!att || !att.is_active || seen.has(att.id)) continue;
    seen.add(att.id);
    attendants.push(att as Attendant);
  }

  // Clean phone for display
  const displayPhone = patientPhone
    .replace('@s.whatsapp.net', '')
    .replace(/^(\d{1,3})(\d+)$/, '+$1 $2');

  const displayName = patientName || 'Desconhecido';

  for (const attendant of attendants) {
    // WhatsApp notification
    if (attendant.notify_whatsapp && attendant.phone) {
      const jid = attendant.phone.replace(/\D/g, '') + '@s.whatsapp.net';
      const msg = `🔔 *Novo atendimento*

Paciente: ${displayName}
Telefone: ${displayPhone}
Motivo: ${reason}

Responda diretamente ao paciente pelo WhatsApp Web.
Ao finalizar, envie *#fechar* na conversa do paciente.`;

      try {
        await sendMessage(instanceName, jid, msg);
        console.log(`[AttendantNotifier] Notified ${attendant.name} via WhatsApp`);
      } catch (err) {
        console.error(`[AttendantNotifier] Failed to notify ${attendant.name}:`, err);
      }
    }

    // Email notification (future — just log for now)
    if (attendant.notify_email && attendant.email) {
      console.log(`[AttendantNotifier] Email notification pending for ${attendant.name} (${attendant.email})`);
    }
  }
}
