import { Language, ScheduleEntry, ConflictInfo } from './types';
import { formatDateShort, getTypeLabel, STATUS_EMOJI } from './whatsappResponder';

/**
 * Formats the schedule response for a provider.
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

    msg += `\n${appointments.length} consulta(s)\n\n_Envie *0* para voltar ao menu_`;
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

  msg += `\n${appointments.length} appointment(s)\n\n_Send *0* to go back to menu_`;
  return msg;
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

  let period: string;
  if (!startTime) {
    period = lang === 'pt' ? 'Dia inteiro' : 'Full day';
  } else if (startTime === '08:00' && endTime === '12:00') {
    period = lang === 'pt' ? 'Manhã' : 'Morning';
  } else if (startTime === '12:00' && endTime === '18:00') {
    period = lang === 'pt' ? 'Tarde' : 'Afternoon';
  } else {
    period = `${startTime}–${endTime}`;
  }

  let msg = `✅ *${lang === 'pt' ? 'Bloqueio criado' : 'Block created'}*\n\n${dateStr} · ${period}`;

  if (conflicts.length > 0) {
    msg += `\n\n⚠️ *${conflicts.length} ${lang === 'pt' ? 'consulta(s) neste período' : 'appointment(s) in this period'}:*\n`;
    for (const c of conflicts) {
      const time = new Date(c.scheduled_at);
      const h = time.getUTCHours().toString().padStart(2, '0');
      const m = time.getUTCMinutes().toString().padStart(2, '0');
      msg += `  ${h}:${m}  ${c.patient_name} · ${getTypeLabel(c.type, lang)}\n`;
    }
  }

  msg += `\n\n_${lang === 'pt' ? 'Envie *0* para voltar ao menu' : 'Send *0* to go back to menu'}_`;
  return msg;
}

/**
 * Formats the unblock response.
 */
export function formatUnblockResponse(date: Date, removedCount: number, lang: Language): string {
  const dateStr = formatDateShort(date, lang);

  if (lang === 'pt') {
    if (removedCount === 0) return `ℹ️ Nenhum bloqueio em ${dateStr}.\n\n_Envie *0* para voltar ao menu_`;
    return `🔓 *${removedCount} bloqueio(s) removido(s)*\n\n${dateStr}\n\n_Envie *0* para voltar ao menu_`;
  }
  if (removedCount === 0) return `ℹ️ No blocks found for ${dateStr}.\n\n_Send *0* to go back to menu_`;
  return `🔓 *${removedCount} block(s) removed*\n\n${dateStr}\n\n_Send *0* to go back to menu_`;
}

/**
 * Formats the patients link response.
 */
export function formatPatientsResponse(link: string | null, lang: Language): string {
  if (lang === 'pt') {
    if (!link) return '⚠️ Não foi possível gerar o link. Acesse o painel manualmente.\n\n_Envie *0* para voltar ao menu_';
    return `👥 *Seus pacientes*\n\nVeja a lista completa, histórico e fichas.\n\n🔗 Abrir\n${link}\n\n_Envie *0* para voltar ao menu_`;
  }
  if (!link) return '⚠️ Could not generate the link. Please access the panel manually.\n\n_Send *0* to go back to menu_';
  return `👥 *Your patients*\n\nSee full list, history and records.\n\n🔗 Open\n${link}\n\n_Send *0* to go back to menu_`;
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
 * Formats date input prompt.
 */
export function formatDateInputPrompt(action: 'schedule' | 'block' | 'unblock', lang: Language): string {
  const examples = lang === 'pt' ? 'Ex: *15/02*' : 'Ex: *02/15*';

  if (lang === 'pt') {
    switch (action) {
      case 'schedule': return `📅 Qual data deseja consultar?\n\n${examples}\n\n_Envie *0* para voltar_`;
      case 'block': return `🔒 Qual data deseja bloquear?\n\n${examples}\n\n_Envie *0* para voltar_`;
      case 'unblock': return `🔓 Qual data deseja liberar?\n\n${examples}\n\n_Envie *0* para voltar_`;
    }
  }

  switch (action) {
    case 'schedule': return `📅 Which date to check?\n\n${examples}\n\n_Send *0* to go back_`;
    case 'block': return `🔒 Which date to block?\n\n${examples}\n\n_Send *0* to go back_`;
    case 'unblock': return `🔓 Which date to unblock?\n\n${examples}\n\n_Send *0* to go back_`;
  }
}

/**
 * Formats the block period selection menu.
 */
export function formatBlockPeriodMenu(date: Date, lang: Language): string {
  const dateStr = formatDateShort(date, lang);

  if (lang === 'pt') {
    return `🔒 *Bloquear ${dateStr}*\n\nQual período?\n\n*1.* 🌅 Manhã (08:00–12:00)\n*2.* 🌇 Tarde (12:00–18:00)\n*3.* 📅 Dia inteiro\n\n_Envie *0* para voltar_`;
  }

  return `🔒 *Block ${dateStr}*\n\nWhich period?\n\n*1.* 🌅 Morning (08:00–12:00)\n*2.* 🌇 Afternoon (12:00–18:00)\n*3.* 📅 Full day\n\n_Send *0* to go back_`;
}

/**
 * Formats an invalid date error.
 */
export function formatInvalidDate(lang: Language): string {
  const example = lang === 'pt' ? 'Ex: *15/02*' : 'Ex: *02/15*';
  return lang === 'pt'
    ? `⚠️ Data inválida. Use o formato DD/MM.\n${example}`
    : `⚠️ Invalid date. Use MM/DD format.\n${example}`;
}
