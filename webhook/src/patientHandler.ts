import { Language } from './types';
import { UserInfo } from './userIdentifier';
import { sendMessage } from './whatsappResponder';
import { getState, setBookingState, setCancelState, clearState, BookingState, CancelState } from './conversationState';
import {
  getUpcomingAppointments,
  getActiveProviders,
  getAvailableDates,
  getAvailableTimeSlots,
  bookAppointment,
  cancelAppointment,
  confirmAppointment,
  getEligibleTypes,
  getNextConfirmedAppointment,
  recordPatientConfirmation,
} from './patientManager';
import {
  formatPatientMenu,
  formatUpcomingAppointments,
  formatSelectAppointment,
  formatConfirmationSuccess,
  formatCancellationSuccess,
  formatAskCancelReason,
  formatNoPendingAppointments,
  formatSelectTypeStep,
  formatSelectProviderStep,
  formatSelectDateStep,
  formatSelectTimeStep,
  formatBookingConfirmation,
  formatBookingSuccess,
  formatBookingCancelled,
  formatNoAvailableDates,
  formatIneligibleMessage,
  formatClinicContact,
  formatBookingError,
  formatInvalidOption,
  formatLateCancellationWarning,
  formatPresenceConfirmation,
} from './patientResponder';
import { getTypeLabel, formatDateShort } from './whatsappResponder';

const EXIT_WORDS = ['0', 'sair', 'exit', 'voltar', 'back', 'menu'];
const CONFIRMATION_WORDS = ['ok', 'sim', 'yes', 'confirmo', 'confirmed', 'confirmar'];

/**
 * Main handler for patient WhatsApp messages.
 */
export async function handlePatientMessage(
  instance: string,
  remoteJid: string,
  text: string,
  patient: UserInfo
): Promise<void> {
  const input = text.trim();
  const lower = input.toLowerCase();
  const lang = patient.language;

  // Check for exit words - always clear state and show menu
  if (EXIT_WORDS.includes(lower)) {
    clearState(remoteJid);
    await sendMessage(instance, remoteJid, formatPatientMenu(patient.firstName, lang));
    return;
  }

  // If there's an active conversation state, route to it
  const state = getState(remoteJid);
  if (state) {
    if (state.type === 'booking') {
      await handleBookingStep(instance, remoteJid, input, patient, state.data);
    } else if (state.type === 'cancel') {
      await handleCancelStep(instance, remoteJid, input, patient, state.data);
    }
    return;
  }

  // Check for quick presence confirmation (OK, sim, yes, confirmo)
  if (CONFIRMATION_WORDS.includes(lower)) {
    const nextApt = await getNextConfirmedAppointment(patient.userId);
    if (nextApt) {
      await recordPatientConfirmation(nextApt.id);
      const dt = new Date(nextApt.scheduled_at);
      const dateStr = formatDateShort(dt, lang);
      const hours = dt.getUTCHours().toString().padStart(2, '0');
      const minutes = dt.getUTCMinutes().toString().padStart(2, '0');
      await sendMessage(instance, remoteJid,
        formatPresenceConfirmation(dateStr, `${hours}:${minutes}`, lang)
      );
      return;
    }
    // No upcoming confirmed appointment, fall through to menu
  }

  // No active state - handle as menu selection
  await handleMenuSelection(instance, remoteJid, lower, patient);
}

/**
 * Handles the main menu selection.
 */
async function handleMenuSelection(
  instance: string,
  remoteJid: string,
  input: string,
  patient: UserInfo
): Promise<void> {
  const lang = patient.language;

  switch (input) {
    case '1': {
      // My appointments
      const appointments = await getUpcomingAppointments(patient.userId);
      await sendMessage(instance, remoteJid, formatUpcomingAppointments(appointments, lang));
      break;
    }

    case '2': {
      // Confirm appointment
      const appointments = await getUpcomingAppointments(patient.userId);
      const pending = appointments.filter(a => a.status === 'pending');

      if (pending.length === 0) {
        await sendMessage(instance, remoteJid, formatNoPendingAppointments('confirm', lang));
        break;
      }

      if (pending.length === 1) {
        // Auto-confirm the only pending one
        const success = await confirmAppointment(pending[0].id);
        await sendMessage(instance, remoteJid,
          success ? formatConfirmationSuccess(lang) : formatInvalidOption(lang)
        );
        break;
      }

      // Multiple pending - ask which one
      await sendMessage(instance, remoteJid, formatSelectAppointment(pending, 'confirm', lang));
      // Store temporarily so we handle the response
      setBookingState(remoteJid, {
        step: 'select_type', // reuse step field
        typeOptions: pending.map((a, i) => ({ key: a.id, label: `${i + 1}`, duration: 0 })),
      });
      // Actually use a special marker in state
      clearState(remoteJid);
      // We need a simpler approach: just wait for their number response
      // Use a pseudo-state to track "waiting for confirm selection"
      setBookingState(remoteJid, {
        step: 'select_type',
        appointmentType: '__confirm__',
        typeOptions: pending.map(a => ({ key: a.id, label: a.id, duration: 0 })),
      });
      break;
    }

    case '3': {
      // Cancel appointment
      const appointments = await getUpcomingAppointments(patient.userId);
      const cancellable = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));

      if (cancellable.length === 0) {
        await sendMessage(instance, remoteJid, formatNoPendingAppointments('cancel', lang));
        break;
      }

      if (cancellable.length === 1) {
        // Only one - check for late cancellation
        const hoursUntil = (new Date(cancellable[0].scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < 24 && hoursUntil > 0) {
          setCancelState(remoteJid, {
            step: 'confirm_late',
            appointmentId: cancellable[0].id,
            appointmentScheduledAt: cancellable[0].scheduled_at,
          });
          await sendMessage(instance, remoteJid, formatLateCancellationWarning(lang));
          break;
        }
        setCancelState(remoteJid, {
          step: 'enter_reason',
          appointmentId: cancellable[0].id,
        });
        await sendMessage(instance, remoteJid, formatAskCancelReason(lang));
        break;
      }

      // Multiple - ask which one
      await sendMessage(instance, remoteJid, formatSelectAppointment(cancellable, 'cancel', lang));
      setCancelState(remoteJid, {
        step: 'select_appointment',
        appointments: cancellable.map((a, i) => ({ id: a.id, label: `${i + 1}`, scheduled_at: a.scheduled_at })),
      });
      break;
    }

    case '4': {
      // Book appointment - start booking flow
      await startBookingFlow(instance, remoteJid, patient);
      break;
    }

    case '5': {
      // Contact clinic
      await sendMessage(instance, remoteJid, formatClinicContact(lang));
      break;
    }

    default: {
      // Unknown input - show menu
      await sendMessage(instance, remoteJid, formatPatientMenu(patient.firstName, lang));
      break;
    }
  }
}

/**
 * Starts the booking flow by showing eligible appointment types.
 */
async function startBookingFlow(
  instance: string,
  remoteJid: string,
  patient: UserInfo
): Promise<void> {
  const lang = patient.language;
  const types = await getEligibleTypes(patient.userId, patient.patientType || 'general', lang);

  if (types.length === 0) {
    await sendMessage(instance, remoteJid, formatIneligibleMessage(lang));
    return;
  }

  setBookingState(remoteJid, {
    step: 'select_type',
    typeOptions: types,
  });

  await sendMessage(instance, remoteJid, formatSelectTypeStep(types, lang));
}

/**
 * Handles each step of the booking flow.
 */
async function handleBookingStep(
  instance: string,
  remoteJid: string,
  input: string,
  patient: UserInfo,
  state: BookingState
): Promise<void> {
  const lang = patient.language;

  // Special case: confirm selection (option 2 from menu)
  if (state.appointmentType === '__confirm__') {
    const idx = parseInt(input, 10);
    if (isNaN(idx) || idx < 1 || !state.typeOptions || idx > state.typeOptions.length) {
      await sendMessage(instance, remoteJid, formatInvalidOption(lang));
      return;
    }
    const aptId = state.typeOptions[idx - 1].key;
    const success = await confirmAppointment(aptId);
    clearState(remoteJid);
    await sendMessage(instance, remoteJid,
      success ? formatConfirmationSuccess(lang) : formatInvalidOption(lang)
    );
    return;
  }

  switch (state.step) {
    case 'select_type': {
      const idx = parseInt(input, 10);
      if (isNaN(idx) || idx < 1 || !state.typeOptions || idx > state.typeOptions.length) {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang));
        return;
      }

      const selectedType = state.typeOptions[idx - 1];
      const providers = await getActiveProviders();

      if (providers.length === 0) {
        clearState(remoteJid);
        await sendMessage(instance, remoteJid, lang === 'pt'
          ? '⚠️ Nenhum médico disponível no momento.'
          : '⚠️ No providers available at the moment.');
        return;
      }

      if (providers.length === 1) {
        // Skip provider selection
        setBookingState(remoteJid, {
          step: 'select_date',
          appointmentType: selectedType.key,
          providerId: providers[0].id,
          providerName: providers[0].name,
        });
        await showAvailableDates(instance, remoteJid, providers[0].id, selectedType.key, lang);
        return;
      }

      setBookingState(remoteJid, {
        step: 'select_provider',
        appointmentType: selectedType.key,
        providerOptions: providers,
      });
      await sendMessage(instance, remoteJid, formatSelectProviderStep(providers, lang));
      break;
    }

    case 'select_provider': {
      const idx = parseInt(input, 10);
      if (isNaN(idx) || idx < 1 || !state.providerOptions || idx > state.providerOptions.length) {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang));
        return;
      }

      const provider = state.providerOptions[idx - 1];
      setBookingState(remoteJid, {
        step: 'select_date',
        appointmentType: state.appointmentType!,
        providerId: provider.id,
        providerName: provider.name,
      });
      await showAvailableDates(instance, remoteJid, provider.id, state.appointmentType!, lang);
      break;
    }

    case 'select_date': {
      const idx = parseInt(input, 10);
      if (isNaN(idx) || idx < 1 || !state.dateOptions || idx > state.dateOptions.length) {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang));
        return;
      }

      const selectedDate = state.dateOptions[idx - 1];
      const slots = await getAvailableTimeSlots(
        state.providerId!,
        selectedDate.date,
        state.appointmentType!
      );

      if (slots.length === 0) {
        await sendMessage(instance, remoteJid, lang === 'pt'
          ? '⚠️ Nenhum horário disponível nesta data. Escolha outra.'
          : '⚠️ No slots available on this date. Choose another.');
        return;
      }

      setBookingState(remoteJid, {
        step: 'select_time',
        appointmentType: state.appointmentType!,
        providerId: state.providerId!,
        providerName: state.providerName!,
        date: selectedDate.date,
        timeOptions: slots,
      });
      await sendMessage(instance, remoteJid, formatSelectTimeStep(slots, lang));
      break;
    }

    case 'select_time': {
      const idx = parseInt(input, 10);
      if (isNaN(idx) || idx < 1 || !state.timeOptions || idx > state.timeOptions.length) {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang));
        return;
      }

      const slot = state.timeOptions[idx - 1];
      const typeName = getTypeLabel(state.appointmentType!, lang);

      setBookingState(remoteJid, {
        step: 'confirm',
        appointmentType: state.appointmentType!,
        providerId: state.providerId!,
        providerName: state.providerName!,
        date: state.date!,
        selectedSlot: slot.scheduledAt,
        timeOptions: state.timeOptions,
      });

      await sendMessage(instance, remoteJid,
        formatBookingConfirmation(typeName, state.providerName!, state.date!, slot.time, lang)
      );
      break;
    }

    case 'confirm': {
      if (input === '1') {
        // Confirm booking
        const result = await bookAppointment(
          patient.userId,
          state.providerId!,
          state.appointmentType!,
          state.selectedSlot!
        );

        clearState(remoteJid);

        if (result.success) {
          const typeName = getTypeLabel(state.appointmentType!, lang);
          const dt = new Date(state.selectedSlot!);
          const hours = dt.getUTCHours().toString().padStart(2, '0');
          const minutes = dt.getUTCMinutes().toString().padStart(2, '0');
          await sendMessage(instance, remoteJid,
            formatBookingSuccess(typeName, state.providerName!, state.date!, `${hours}:${minutes}`, lang)
          );
        } else {
          await sendMessage(instance, remoteJid, formatBookingError(lang));
        }
      } else if (input === '2') {
        // Cancel booking
        clearState(remoteJid);
        await sendMessage(instance, remoteJid, formatBookingCancelled(lang));
      } else {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang));
      }
      break;
    }
  }
}

/**
 * Shows available dates for the selected provider + type.
 */
async function showAvailableDates(
  instance: string,
  remoteJid: string,
  providerId: string,
  appointmentType: string,
  lang: Language
): Promise<void> {
  const dates = await getAvailableDates(providerId, appointmentType, 5);

  if (dates.length === 0) {
    clearState(remoteJid);
    await sendMessage(instance, remoteJid, formatNoAvailableDates(lang));
    return;
  }

  // Update state with date options
  const currentState = getState(remoteJid);
  if (currentState?.type === 'booking') {
    setBookingState(remoteJid, {
      ...currentState.data,
      step: 'select_date',
      dateOptions: dates,
    });
  }

  await sendMessage(instance, remoteJid, formatSelectDateStep(dates, lang));
}

/**
 * Handles steps of the cancellation flow.
 */
async function handleCancelStep(
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
        // User confirmed late cancellation, proceed to reason
        setCancelState(remoteJid, {
          step: 'enter_reason',
          appointmentId: cancel.appointmentId!,
        });
        await sendMessage(instance, remoteJid, formatAskCancelReason(lang));
      } else if (input === '2') {
        // User decided not to cancel
        clearState(remoteJid);
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
      clearState(remoteJid);

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
