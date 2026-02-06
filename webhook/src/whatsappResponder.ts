import { config } from './config';
import { Language, ScheduleEntry, ConflictInfo } from './types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends "typing..." presence indicator via Evolution API.
 */
async function sendTypingPresence(instanceName: string, remoteJid: string): Promise<void> {
  const number = remoteJid.replace('@s.whatsapp.net', '');
  try {
    await fetch(`${config.evolutionApiUrl}/chat/updatePresence/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.evolutionApiKey,
      },
      body: JSON.stringify({ number, presence: 'composing' }),
    });
  } catch {
    // Ignore - typing indicator is best-effort
  }
}

/**
 * Sends a WhatsApp message via Evolution API.
 * Shows "typing..." indicator and adds a natural delay before sending.
 */
export async function sendMessage(instanceName: string, remoteJid: string, text: string): Promise<void> {
  const url = `${config.evolutionApiUrl}/message/sendText/${instanceName}`;

  try {
    // Show "typing..." indicator
    await sendTypingPresence(instanceName, remoteJid);

    // Natural delay: 1-3s based on message length
    const delay = Math.min(1000 + text.length * 8, 3000);
    await sleep(delay);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.evolutionApiKey,
      },
      body: JSON.stringify({
        number: remoteJid.replace('@s.whatsapp.net', ''),
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Error sending message: ${response.status} - ${body}`);
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

// Appointment type labels (short)
const TYPE_LABELS: Record<string, Record<Language, string>> = {
  initial_consultation: { pt: 'Consulta Inicial', en: 'Initial Consultation' },
  follow_up: { pt: 'Retorno', en: 'Follow-up' },
  hormone_check: { pt: 'Av. Hormonal', en: 'Hormone Check' },
  lab_review: { pt: 'Rev. Exames', en: 'Lab Review' },
  nutrition: { pt: 'Nutrição', en: 'Nutrition' },
  health_coaching: { pt: 'Coaching', en: 'Coaching' },
  therapy: { pt: 'Terapia', en: 'Therapy' },
  personal_training: { pt: 'Personal', en: 'Personal Training' },
};

const STATUS_EMOJI: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  checked_in: '📋',
  in_progress: '🔄',
  completed: '✔️',
};

const WEEKDAY_SHORT: Record<Language, string[]> = {
  pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

function formatDateShort(date: Date, lang: Language): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const weekday = WEEKDAY_SHORT[lang][date.getDay()];

  if (lang === 'pt') return `${d}/${m} (${weekday})`;
  return `${m}/${d} (${weekday})`;
}

function getTypeLabel(type: string, lang: Language): string {
  return TYPE_LABELS[type]?.[lang] || type;
}

/**
 * Formats the schedule response.
 */
export function formatScheduleResponse(
  date: Date,
  appointments: ScheduleEntry[],
  blocks: { start_time: string | null; end_time: string | null; reason: string | null }[],
  lang: Language
): string {
  const dateStr = formatDateShort(date, lang);

  if (lang === 'pt') {
    let msg = `📋 *Agenda ${dateStr}*\n`;

    if (appointments.length === 0) {
      msg += '\nNenhuma consulta agendada.';
    } else {
      msg += '\n';
      for (const apt of appointments) {
        const emoji = STATUS_EMOJI[apt.status] || '📌';
        msg += `${apt.time}  ${apt.patientName} · ${getTypeLabel(apt.type, 'pt')} ${emoji}\n`;
      }
    }

    if (blocks.length > 0) {
      msg += '\n🔒 *Bloqueios:*\n';
      for (const block of blocks) {
        if (!block.start_time) {
          msg += `  Dia inteiro${block.reason ? ` — ${block.reason}` : ''}\n`;
        } else {
          msg += `  ${block.start_time}–${block.end_time}${block.reason ? ` — ${block.reason}` : ''}\n`;
        }
      }
    }

    msg += `\n${appointments.length} consulta(s)`;
    return msg;
  }

  // English
  let msg = `📋 *Schedule ${dateStr}*\n`;

  if (appointments.length === 0) {
    msg += '\nNo appointments scheduled.';
  } else {
    msg += '\n';
    for (const apt of appointments) {
      const emoji = STATUS_EMOJI[apt.status] || '📌';
      msg += `${apt.time}  ${apt.patientName} · ${getTypeLabel(apt.type, 'en')} ${emoji}\n`;
    }
  }

  if (blocks.length > 0) {
    msg += '\n🔒 *Blocks:*\n';
    for (const block of blocks) {
      if (!block.start_time) {
        msg += `  Full day${block.reason ? ` — ${block.reason}` : ''}\n`;
      } else {
        msg += `  ${block.start_time}–${block.end_time}${block.reason ? ` — ${block.reason}` : ''}\n`;
      }
    }
  }

  msg += `\n${appointments.length} appointment(s)`;
  return msg;
}

/**
 * Appends a clickable link to a message.
 */
export function appendLink(message: string, link: string | null, lang: Language): string {
  if (!link) return message;
  const label = lang === 'pt' ? '🔗 Abrir no painel' : '🔗 Open panel';
  return `${message}\n\n${label}\n${link}`;
}

/**
 * Formats the patients response.
 */
export function formatPatientsResponse(link: string | null, lang: Language): string {
  if (lang === 'pt') {
    if (!link) return '⚠️ Não foi possível gerar o link. Acesse o painel manualmente.';
    return `👥 *Seus pacientes*\n\nVeja a lista completa, histórico e fichas.\n\n🔗 Abrir\n${link}`;
  }
  if (!link) return '⚠️ Could not generate the link. Please access the panel manually.';
  return `👥 *Your patients*\n\nSee full list, history and records.\n\n🔗 Open\n${link}`;
}

/**
 * Formats the block creation response.
 */
export function formatBlockResponse(
  date: Date,
  startTime: string | null,
  endTime: string | null,
  conflicts: ConflictInfo[],
  lang: Language
): string {
  const dateStr = formatDateShort(date, lang);

  if (lang === 'pt') {
    let period: string;
    if (!startTime) {
      period = 'Dia inteiro';
    } else if (startTime === '08:00' && endTime === '12:00') {
      period = 'Manhã';
    } else if (startTime === '12:00' && endTime === '18:00') {
      period = 'Tarde';
    } else {
      period = `${startTime}–${endTime}`;
    }

    let msg = `✅ *Bloqueio criado*\n\n${dateStr} · ${period}`;

    if (conflicts.length > 0) {
      msg += `\n\n⚠️ *${conflicts.length} consulta(s) neste período:*\n`;
      for (const c of conflicts) {
        const time = new Date(c.scheduled_at);
        const h = time.getUTCHours().toString().padStart(2, '0');
        const m = time.getUTCMinutes().toString().padStart(2, '0');
        msg += `  ${h}:${m}  ${c.patient_name} · ${getTypeLabel(c.type, 'pt')}\n`;
      }
    }

    return msg;
  }

  // English
  let period: string;
  if (!startTime) {
    period = 'Full day';
  } else if (startTime === '08:00' && endTime === '12:00') {
    period = 'Morning';
  } else if (startTime === '12:00' && endTime === '18:00') {
    period = 'Afternoon';
  } else {
    period = `${startTime}–${endTime}`;
  }

  let msg = `✅ *Block created*\n\n${dateStr} · ${period}`;

  if (conflicts.length > 0) {
    msg += `\n\n⚠️ *${conflicts.length} appointment(s) in this period:*\n`;
    for (const c of conflicts) {
      const time = new Date(c.scheduled_at);
      const h = time.getUTCHours().toString().padStart(2, '0');
      const m = time.getUTCMinutes().toString().padStart(2, '0');
      msg += `  ${h}:${m}  ${c.patient_name} · ${getTypeLabel(c.type, 'en')}\n`;
    }
  }

  return msg;
}

/**
 * Formats the unblock response.
 */
export function formatUnblockResponse(date: Date, removedCount: number, lang: Language): string {
  const dateStr = formatDateShort(date, lang);

  if (lang === 'pt') {
    if (removedCount === 0) return `ℹ️ Nenhum bloqueio em ${dateStr}.`;
    return `🔓 *${removedCount} bloqueio(s) removido(s)*\n\n${dateStr}`;
  }
  if (removedCount === 0) return `ℹ️ No blocks found for ${dateStr}.`;
  return `🔓 *${removedCount} block(s) removed*\n\n${dateStr}`;
}

/**
 * Formats the help response.
 */
export function formatHelpResponse(lang: Language): string {
  if (lang === 'pt') {
    return `📖 *Comandos*

agenda — Agenda de hoje
agenda 15/02 — Agenda da data
bloquear 15/02 — Bloquear dia
bloquear 15/02 manhã — Bloquear manhã
bloquear 15/02 tarde — Bloquear tarde
bloquear 15/02 08:00-12:00 — Horário
liberar 15/02 — Remover bloqueio
pacientes — Painel de pacientes
ajuda — Este menu

_Cada resposta inclui um link seguro para o painel._`;
  }

  return `📖 *Commands*

schedule — Today's schedule
schedule 02/15 — Schedule for date
block 02/15 — Block full day
block 02/15 morning — Block morning
block 02/15 afternoon — Block afternoon
block 02/15 08:00-12:00 — Time range
unblock 02/15 — Remove block
patients — Patient panel
help — This menu

_Each response includes a secure link to the panel._`;
}

/**
 * Formats a date-required error response.
 */
export function formatDateRequiredResponse(lang: Language): string {
  if (lang === 'pt') {
    return '⚠️ Informe a data. Ex: *bloquear 15/02*';
  }
  return '⚠️ Please provide a date. Ex: *block 02/15*';
}
