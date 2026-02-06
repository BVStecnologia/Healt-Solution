import { Language, PatientAppointment, TypeOption, ProviderOption, DateOption, TimeSlotOption } from './types';
import { TYPE_LABELS, STATUS_EMOJI, WEEKDAY_SHORT, formatDateShort, getTypeLabel } from './whatsappResponder';

// ==================
// Main Menu
// ==================

export function formatPatientMenu(firstName: string, lang: Language): string {
  if (lang === 'pt') {
    return `🏥 *Essence Medical*
Olá, ${firstName}! 👋

1️⃣  Minhas consultas
2️⃣  Confirmar consulta
3️⃣  Cancelar consulta
4️⃣  Agendar consulta
5️⃣  Falar com a clínica

_Responda com o número da opção_`;
  }

  return `🏥 *Essence Medical*
Hello, ${firstName}! 👋

1️⃣  My appointments
2️⃣  Confirm appointment
3️⃣  Cancel appointment
4️⃣  Book appointment
5️⃣  Contact clinic

_Reply with the option number_`;
}

// ==================
// Appointments List
// ==================

export function formatUpcomingAppointments(appointments: PatientAppointment[], lang: Language): string {
  if (appointments.length === 0) {
    return lang === 'pt'
      ? '📋 Você não tem consultas agendadas.\n\nEnvie *4* para agendar uma nova consulta.'
      : '📋 You have no upcoming appointments.\n\nSend *4* to book a new appointment.';
  }

  const header = lang === 'pt' ? '📋 *Suas consultas:*\n' : '📋 *Your appointments:*\n';
  let msg = header;

  for (const apt of appointments) {
    const dt = new Date(apt.scheduled_at);
    const dateStr = formatDateShort(dt, lang);
    const hours = dt.getUTCHours().toString().padStart(2, '0');
    const minutes = dt.getUTCMinutes().toString().padStart(2, '0');
    const emoji = STATUS_EMOJI[apt.status] || '📌';
    const typeName = getTypeLabel(apt.type, lang);
    const statusLabel = formatStatus(apt.status, lang);

    msg += `\n${emoji} *${dateStr} ${hours}:${minutes}*\n`;
    msg += `   ${typeName} · Dr(a). ${apt.provider_name}\n`;
    msg += `   ${statusLabel}\n`;
  }

  const footer = lang === 'pt'
    ? '\n_Envie *menu* para voltar_'
    : '\n_Send *menu* to go back_';

  return msg + footer;
}

function formatStatus(status: string, lang: Language): string {
  const map: Record<string, Record<Language, string>> = {
    pending: { pt: 'Aguardando confirmação', en: 'Pending confirmation' },
    confirmed: { pt: 'Confirmada', en: 'Confirmed' },
    checked_in: { pt: 'Check-in feito', en: 'Checked in' },
    in_progress: { pt: 'Em andamento', en: 'In progress' },
  };
  return map[status]?.[lang] || status;
}

// ==================
// Select Appointment (for confirm/cancel)
// ==================

export function formatSelectAppointment(
  appointments: PatientAppointment[],
  action: 'confirm' | 'cancel',
  lang: Language
): string {
  const header = action === 'confirm'
    ? (lang === 'pt' ? '✅ *Qual consulta deseja confirmar?*\n' : '✅ *Which appointment to confirm?*\n')
    : (lang === 'pt' ? '❌ *Qual consulta deseja cancelar?*\n' : '❌ *Which appointment to cancel?*\n');

  let msg = header;

  appointments.forEach((apt, i) => {
    const dt = new Date(apt.scheduled_at);
    const dateStr = formatDateShort(dt, lang);
    const hours = dt.getUTCHours().toString().padStart(2, '0');
    const minutes = dt.getUTCMinutes().toString().padStart(2, '0');
    const typeName = getTypeLabel(apt.type, lang);

    msg += `\n*${i + 1}.* ${dateStr} ${hours}:${minutes}\n`;
    msg += `   ${typeName} · Dr(a). ${apt.provider_name}\n`;
  });

  const footer = lang === 'pt'
    ? '\n_Responda com o número ou *0* para voltar_'
    : '\n_Reply with the number or *0* to go back_';

  return msg + footer;
}

export function formatConfirmationSuccess(lang: Language): string {
  return lang === 'pt'
    ? '✅ Consulta confirmada com sucesso!\n\n_Envie *menu* para voltar_'
    : '✅ Appointment confirmed successfully!\n\n_Send *menu* to go back_';
}

export function formatCancellationSuccess(lang: Language): string {
  return lang === 'pt'
    ? '✅ Consulta cancelada com sucesso.\n\nEnvie *4* para agendar uma nova consulta.\n_Ou envie *menu* para voltar_'
    : '✅ Appointment cancelled successfully.\n\nSend *4* to book a new appointment.\n_Or send *menu* to go back_';
}

export function formatAskCancelReason(lang: Language): string {
  return lang === 'pt'
    ? '📝 Por favor, informe o motivo do cancelamento:\n\n_Ou envie *0* para voltar_'
    : '📝 Please provide the cancellation reason:\n\n_Or send *0* to go back_';
}

export function formatNoPendingAppointments(action: 'confirm' | 'cancel', lang: Language): string {
  if (action === 'confirm') {
    return lang === 'pt'
      ? 'ℹ️ Você não tem consultas pendentes para confirmar.'
      : 'ℹ️ You have no pending appointments to confirm.';
  }
  return lang === 'pt'
    ? 'ℹ️ Você não tem consultas para cancelar.'
    : 'ℹ️ You have no appointments to cancel.';
}

// ==================
// Booking Flow
// ==================

export function formatSelectTypeStep(types: TypeOption[], lang: Language): string {
  const header = lang === 'pt'
    ? '📋 *Qual tipo de consulta?*\n'
    : '📋 *What type of appointment?*\n';

  let msg = header;
  types.forEach((t, i) => {
    const durLabel = lang === 'pt' ? `${t.duration} min` : `${t.duration} min`;
    msg += `\n*${i + 1}.* ${t.label} (${durLabel})`;
  });

  const footer = lang === 'pt'
    ? '\n\n_Responda com o número ou *0* para cancelar_'
    : '\n\n_Reply with the number or *0* to cancel_';

  return msg + footer;
}

export function formatSelectProviderStep(providers: ProviderOption[], lang: Language): string {
  const header = lang === 'pt'
    ? '👨‍⚕️ *Escolha o médico:*\n'
    : '👨‍⚕️ *Choose a provider:*\n';

  let msg = header;
  providers.forEach((p, i) => {
    msg += `\n*${i + 1}.* Dr(a). ${p.name}`;
    if (p.specialty) msg += ` · ${p.specialty}`;
  });

  const footer = lang === 'pt'
    ? '\n\n_Responda com o número ou *0* para cancelar_'
    : '\n\n_Reply with the number or *0* to cancel_';

  return msg + footer;
}

export function formatSelectDateStep(dates: DateOption[], lang: Language): string {
  const header = lang === 'pt'
    ? '📅 *Escolha a data:*\n'
    : '📅 *Choose a date:*\n';

  let msg = header;
  dates.forEach((d, i) => {
    const dateStr = formatDateShort(d.date, lang);
    const slotsLabel = lang === 'pt'
      ? `${d.slotCount} horário(s)`
      : `${d.slotCount} slot(s)`;
    msg += `\n*${i + 1}.* ${dateStr} — ${slotsLabel}`;
  });

  const footer = lang === 'pt'
    ? '\n\n_Responda com o número ou *0* para cancelar_'
    : '\n\n_Reply with the number or *0* to cancel_';

  return msg + footer;
}

export function formatSelectTimeStep(slots: TimeSlotOption[], lang: Language): string {
  const header = lang === 'pt'
    ? '🕐 *Escolha o horário:*\n'
    : '🕐 *Choose a time:*\n';

  let msg = header;
  slots.forEach((s, i) => {
    msg += `\n*${i + 1}.* ${s.time}`;
  });

  const footer = lang === 'pt'
    ? '\n\n_Responda com o número ou *0* para cancelar_'
    : '\n\n_Reply with the number or *0* to cancel_';

  return msg + footer;
}

export function formatBookingConfirmation(
  typeName: string,
  providerName: string,
  date: Date,
  time: string,
  lang: Language
): string {
  const dateStr = formatDateShort(date, lang);

  if (lang === 'pt') {
    return `📋 *Confirmar agendamento:*

📌 ${typeName}
👨‍⚕️ Dr(a). ${providerName}
📅 ${dateStr}
🕐 ${time}

*1.* ✅ Confirmar
*2.* ❌ Cancelar`;
  }

  return `📋 *Confirm booking:*

📌 ${typeName}
👨‍⚕️ Dr. ${providerName}
📅 ${dateStr}
🕐 ${time}

*1.* ✅ Confirm
*2.* ❌ Cancel`;
}

export function formatBookingSuccess(
  typeName: string,
  providerName: string,
  date: Date,
  time: string,
  lang: Language
): string {
  const dateStr = formatDateShort(date, lang);

  if (lang === 'pt') {
    return `🎉 *Consulta agendada!*

📌 ${typeName}
👨‍⚕️ Dr(a). ${providerName}
📅 ${dateStr}
🕐 ${time}

_Aguarde a confirmação da clínica._
_Envie *menu* para voltar_`;
  }

  return `🎉 *Appointment booked!*

📌 ${typeName}
👨‍⚕️ Dr. ${providerName}
📅 ${dateStr}
🕐 ${time}

_Awaiting clinic confirmation._
_Send *menu* to go back_`;
}

export function formatBookingCancelled(lang: Language): string {
  return lang === 'pt'
    ? 'ℹ️ Agendamento cancelado.\n\n_Envie *menu* para voltar_'
    : 'ℹ️ Booking cancelled.\n\n_Send *menu* to go back_';
}

export function formatNoAvailableDates(lang: Language): string {
  return lang === 'pt'
    ? '😔 Não encontramos datas disponíveis nos próximos 30 dias para este médico.\n\n_Envie *menu* para voltar_'
    : '😔 No available dates found in the next 30 days for this provider.\n\n_Send *menu* to go back_';
}

export function formatIneligibleMessage(lang: Language): string {
  return lang === 'pt'
    ? '⚠️ Você não tem tipos de consulta disponíveis no momento.\nIsso pode ser porque exames ou visitas recentes são necessários.\n\nEnvie *5* para falar com a clínica.'
    : '⚠️ No appointment types are available for you right now.\nThis may be because recent labs or visits are required.\n\nSend *5* to contact the clinic.';
}

export function formatClinicContact(lang: Language): string {
  return lang === 'pt'
    ? `📞 *Falar com a clínica*

Para atendimento personalizado, entre em contato:
📧 contact@essencemedicalclinic.com

_Envie *menu* para voltar_`
    : `📞 *Contact clinic*

For personalized assistance, get in touch:
📧 contact@essencemedicalclinic.com

_Send *menu* to go back_`;
}

export function formatBookingError(lang: Language): string {
  return lang === 'pt'
    ? '⚠️ Não foi possível agendar a consulta. O horário pode não estar mais disponível.\n\nTente novamente enviando *4*.'
    : '⚠️ Could not book the appointment. The slot may no longer be available.\n\nTry again by sending *4*.';
}

export function formatPresenceConfirmation(dateStr: string, time: string, lang: Language): string {
  if (lang === 'pt') {
    return `✅ *Presença confirmada!*

Sua consulta em *${dateStr}* às *${time}* está confirmada.

Até lá! 😊

_Envie *menu* para voltar_`;
  }

  return `✅ *Attendance confirmed!*

Your appointment on *${dateStr}* at *${time}* is confirmed.

See you then! 😊

_Send *menu* to go back_`;
}

export function formatLateCancellationWarning(lang: Language): string {
  if (lang === 'pt') {
    return `⚠️ *Atenção: Cancelamento tardio*

Sua consulta é em menos de 24 horas. Cancelamentos tardios podem estar sujeitos a políticas da clínica.

*1.* ✅ Continuar cancelamento
*2.* ❌ Manter consulta`;
  }

  return `⚠️ *Warning: Late cancellation*

Your appointment is in less than 24 hours. Late cancellations may be subject to clinic policies.

*1.* ✅ Continue cancellation
*2.* ❌ Keep appointment`;
}

export function formatInvalidOption(lang: Language): string {
  return lang === 'pt'
    ? '⚠️ Opção inválida. Tente novamente.'
    : '⚠️ Invalid option. Please try again.';
}
