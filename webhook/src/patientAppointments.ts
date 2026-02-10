import { Language } from './types';
import { UserInfo } from './userIdentifier';
import { sendMessage } from './whatsappResponder';
import {
  setBookingState,
  setCancelState,
  clearAllState,
  CancelState,
} from './stateManager';
import {
  getUpcomingAppointments,
  confirmAppointment,
  cancelAppointment,
} from './patientManager';
import {
  formatUpcomingAppointments,
  formatSelectAppointment,
  formatConfirmationSuccess,
  formatCancellationSuccess,
  formatAskCancelReason,
  formatNoPendingAppointments,
  formatInvalidOption,
  formatLateCancellationWarning,
} from './patientResponder';

/**
 * Shows upcoming appointments for the patient.
 */
export async function handleViewAppointments(
  instance: string,
  remoteJid: string,
  patient: UserInfo
): Promise<void> {
  const appointments = await getUpcomingAppointments(patient.userId);
  const msg = formatUpcomingAppointments(appointments, patient.language);
  await sendMessage(instance, remoteJid, msg);
}

/**
 * Handles the confirm flow — single or multiple pending appointments.
 */
export async function handleConfirmFlow(
  instance: string,
  remoteJid: string,
  patient: UserInfo
): Promise<void> {
  const lang = patient.language;
  const appointments = await getUpcomingAppointments(patient.userId);
  const pending = appointments.filter(a => a.status === 'pending');

  if (pending.length === 0) {
    const msg = formatNoPendingAppointments('confirm', lang);
    await sendMessage(instance, remoteJid, msg);
    return;
  }

  if (pending.length === 1) {
    const success = await confirmAppointment(pending[0].id);
    const msg = success ? formatConfirmationSuccess(lang) : formatInvalidOption(lang);
    await sendMessage(instance, remoteJid, msg);
    return;
  }

  // Multiple pending — ask which one
  await sendMessage(instance, remoteJid, formatSelectAppointment(pending, 'confirm', lang));
  setBookingState(remoteJid, {
    step: 'select_type',
    appointmentType: '__confirm__',
    typeOptions: pending.map(a => ({ key: a.id, label: a.id, duration: 0 })),
  });
}

/**
 * Initiates the cancel flow — single or multiple cancellable appointments.
 */
export async function handleCancelInit(
  instance: string,
  remoteJid: string,
  patient: UserInfo
): Promise<void> {
  const lang = patient.language;
  const appointments = await getUpcomingAppointments(patient.userId);
  const cancellable = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));

  if (cancellable.length === 0) {
    const msg = formatNoPendingAppointments('cancel', lang);
    await sendMessage(instance, remoteJid, msg);
    return;
  }

  if (cancellable.length === 1) {
    const hoursUntil = (new Date(cancellable[0].scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 24 && hoursUntil > 0) {
      setCancelState(remoteJid, {
        step: 'confirm_late',
        appointmentId: cancellable[0].id,
        appointmentScheduledAt: cancellable[0].scheduled_at,
      });
      await sendMessage(instance, remoteJid, formatLateCancellationWarning(lang));
      return;
    }
    setCancelState(remoteJid, {
      step: 'enter_reason',
      appointmentId: cancellable[0].id,
    });
    await sendMessage(instance, remoteJid, formatAskCancelReason(lang));
    return;
  }

  // Multiple — ask which one
  await sendMessage(instance, remoteJid, formatSelectAppointment(cancellable, 'cancel', lang));
  setCancelState(remoteJid, {
    step: 'select_appointment',
    appointments: cancellable.map((a, i) => ({ id: a.id, label: `${i + 1}`, scheduled_at: a.scheduled_at })),
  });
}

/**
 * Handles each step of the cancel flow.
 */
export async function handleCancelStep(
  instance: string,
  remoteJid: string,
  input: string,
  patient: UserInfo,
  cancel: CancelState
): Promise<void> {
  const lang = patient.language;

  switch (cancel.step) {
    case 'select_appointment': {
      const idx = parseInt(input, 10);
      if (isNaN(idx) || idx < 1 || !cancel.appointments || idx > cancel.appointments.length) {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang));
        return;
      }

      const selected = cancel.appointments[idx - 1];

      // Check for late cancellation (< 24h)
      if (selected.scheduled_at) {
        const hoursUntil = (new Date(selected.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < 24 && hoursUntil > 0) {
          setCancelState(remoteJid, {
            step: 'confirm_late',
            appointmentId: selected.id,
            appointmentScheduledAt: selected.scheduled_at,
          });
          await sendMessage(instance, remoteJid, formatLateCancellationWarning(lang));
          return;
        }
      }

      setCancelState(remoteJid, {
        step: 'enter_reason',
        appointmentId: selected.id,
      });
      await sendMessage(instance, remoteJid, formatAskCancelReason(lang));
      break;
    }

    case 'confirm_late': {
      if (input === '1') {
        setCancelState(remoteJid, {
          step: 'enter_reason',
          appointmentId: cancel.appointmentId!,
        });
        await sendMessage(instance, remoteJid, formatAskCancelReason(lang));
      } else if (input === '2') {
        clearAllState(remoteJid);
        await sendMessage(instance, remoteJid, lang === 'pt'
          ? 'ℹ️ Cancelamento não realizado. Sua consulta está mantida.\n\n_Envie *menu* para voltar_'
          : 'ℹ️ Cancellation not made. Your appointment is still active.\n\n_Send *menu* to go back_');
      } else {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang));
      }
      break;
    }

    case 'enter_reason': {
      const reason = input;
      const success = await cancelAppointment(cancel.appointmentId!, reason);
      clearAllState(remoteJid);

      if (success) {
        await sendMessage(instance, remoteJid, formatCancellationSuccess(lang));
      } else {
        await sendMessage(instance, remoteJid, lang === 'pt'
          ? '⚠️ Não foi possível cancelar a consulta. Tente novamente.'
          : '⚠️ Could not cancel the appointment. Please try again.');
      }
      break;
    }
  }
}
