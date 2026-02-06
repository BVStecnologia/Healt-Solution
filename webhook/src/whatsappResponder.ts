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
export async function sendMessage(instanceName: string, remoteJid: string, text: string): Promise<boolean> {
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
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// Appointment type labels (short) - bilingual
export const TYPE_LABELS: Record<string, Record<Language, string>> = {
  // Active types
  initial_consultation: { pt: 'Consulta Inicial', en: 'Initial Consultation' },
  follow_up: { pt: 'Retorno', en: 'Follow-up' },
  functional_medicine: { pt: 'Medicina Funcional', en: 'Functional Medicine' },
  bhrt: { pt: 'BHRT', en: 'BHRT' },
  male_hypertrophy: { pt: 'Hipertrofia Masc.', en: 'Male Hypertrophy' },
  female_hypertrophy: { pt: 'Hipertrofia Fem.', en: 'Female Hypertrophy' },
  insulin_resistance: { pt: 'Resist. Insulina', en: 'Insulin Resistance' },
  chronic_inflammation: { pt: 'Inflam. Crônica', en: 'Chronic Inflammation' },
  thyroid_support: { pt: 'Tireoide', en: 'Thyroid Support' },
  morpheus8: { pt: 'Morpheus8', en: 'Morpheus8' },
  botulinum_toxin: { pt: 'Botox', en: 'Botulinum Toxin' },
  fillers: { pt: 'Preenchimento', en: 'Fillers' },
  skin_boosters: { pt: 'Skin Boosters', en: 'Skin Boosters' },
  iv_protocols: { pt: 'Protocolos IV', en: 'IV Protocols' },
  customized_iv_nutrition: { pt: 'IV Nutrição', en: 'IV Nutrition' },
  nutrient_testing: { pt: 'Teste Nutrientes', en: 'Nutrient Testing' },
  nad_therapy: { pt: 'NAD+', en: 'NAD+ Therapy' },
  vitamin_injections: { pt: 'Vitaminas', en: 'Vitamin Injections' },
  // Legacy types (for existing records)
  hormone_check: { pt: 'Av. Hormonal', en: 'Hormone Check' },
  lab_review: { pt: 'Rev. Exames', en: 'Lab Review' },
  nutrition: { pt: 'Nutrição', en: 'Nutrition' },
  health_coaching: { pt: 'Coaching', en: 'Coaching' },
  therapy: { pt: 'Terapia', en: 'Therapy' },
  personal_training: { pt: 'Personal', en: 'Personal Training' },
};

export const STATUS_EMOJI: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  checked_in: '📋',
  in_progress: '🔄',
  completed: '✔️',
};

export const WEEKDAY_SHORT: Record<Language, string[]> = {
  pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export function formatDateShort(date: Date, lang: Language): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const weekday = WEEKDAY_SHORT[lang][date.getDay()];

  if (lang === 'pt') return `${d}/${m} (${weekday})`;
  return `${m}/${d} (${weekday})`;
}

export function getTypeLabel(type: string, lang: Language): string {
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
 * Formats the quick numbered menu (sent for "ajuda", "help", or unknown messages).
 */
export function formatHelpResponse(lang: Language): string {
  if (lang === 'pt') {
    return `🏥 *Essence Medical*

1️⃣  Agenda de hoje
2️⃣  Agenda de amanhã
3️⃣  Pacientes
4️⃣  Todos os comandos
5️⃣  Bloquear hoje
6️⃣  Liberar hoje
7️⃣  Bloquear amanhã

_Responda com o número ou envie um comando (ex: agenda 15/02)_`;
  }

  return `🏥 *Essence Medical*

1️⃣  Today's schedule
2️⃣  Tomorrow's schedule
3️⃣  Patients
4️⃣  All commands
5️⃣  Block today
6️⃣  Unblock today
7️⃣  Block tomorrow

_Reply with the number or type a command (e.g. schedule 02/15)_`;
}

/**
 * Formats the full commands list (sent for option "4" or "comandos").
 */
export function formatCommandsResponse(lang: Language): string {
  if (lang === 'pt') {
    return `📖 *Todos os comandos*

*Atalhos rápidos:*
1️⃣  Agenda de hoje
2️⃣  Agenda de amanhã
3️⃣  Pacientes
5️⃣  Bloquear hoje
6️⃣  Liberar hoje
7️⃣  Bloquear amanhã

*Para datas específicas:*
📋  agenda _DD/MM_
🔒  bloquear _DD/MM_
🔒  bloquear _DD/MM_ manhã / tarde
🔒  bloquear _DD/MM_ _HH:MM-HH:MM_
🔓  liberar _DD/MM_`;
  }

  return `📖 *All commands*

*Quick shortcuts:*
1️⃣  Today's schedule
2️⃣  Tomorrow's schedule
3️⃣  Patients
5️⃣  Block today
6️⃣  Unblock today
7️⃣  Block tomorrow

*For specific dates:*
📋  schedule _MM/DD_
🔒  block _MM/DD_
🔒  block _MM/DD_ morning / afternoon
🔒  block _MM/DD_ _HH:MM-HH:MM_
🔓  unblock _MM/DD_`;
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
