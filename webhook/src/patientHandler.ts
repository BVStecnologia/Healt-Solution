import { Language } from './types';
import { UserInfo } from './userIdentifier';
import { sendMessage } from './whatsappResponder';
import {
  getState,
  setBookingState,
  setCancelState,
  BookingState,
  CancelState,
} from './conversationState';
import {
  getMenuState,
  setMenuState,
  clearMenuState,
  clearAllState,
  resolveMenuOption,
} from './stateManager';
import { buildPatientMainMenu } from './menuBuilder';
import { loadPatientContext } from './router';
import { logIncoming, logOutgoing } from './messageLogger';
import { showServicesMenu, handleServicesInput } from './patientServices';
import { showClinicInfoMenu, handleClinicInfoInput } from './patientClinicInfo';
import { extractPhoneFromJid } from './phoneUtils';
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
 * Dynamic menus, services browsing, clinic info, and conversation logging.
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
  const phone = extractPhoneFromJid(remoteJid);

  // Log incoming message (non-blocking)
  logIncoming(phone, input, patient.userId, 'patient');

  // Check for exit words — clear all state and show main menu
  if (EXIT_WORDS.includes(lower)) {
    clearAllState(remoteJid);
    await showMainMenu(instance, remoteJid, patient);
    return;
  }

  // If there's an active booking/cancel flow, route to it first
  const state = getState(remoteJid);
  if (state) {
    if (state.type === 'booking') {
      await handleBookingStep(instance, remoteJid, input, patient, state.data);
    } else if (state.type === 'cancel') {
      await handleCancelStep(instance, remoteJid, input, patient, state.data);
    }
    return;
  }

  // Check sub-menu states (services, clinic info)
  const menuState = getMenuState(remoteJid);
  if (menuState) {
    const handler = menuState.handler;

    // Services flow
    if (['services', 'services_category', 'service_detail'].includes(handler)) {
      const result = await handleServicesInput(instance, remoteJid, input, lang, patient.userId);
      if (result.handled) return;

      // Book specific service from detail view
      if (result.action === 'book_specific' && result.data?.treatmentKey) {
        await startBookingFlowWithType(instance, remoteJid, patient, result.data.treatmentKey);
        return;
      }

      // Return to main menu
      if (result.action === 'main_menu') {
        await showMainMenu(instance, remoteJid, patient);
        return;
      }
    }

    // Clinic info flow
    if (handler === 'clinic_info') {
      const result = await handleClinicInfoInput(instance, remoteJid, input, lang, patient.userId);
      if (result.handled) return;
    }

    // Main menu option mapping
    if (handler === 'main_menu') {
      const option = resolveMenuOption(remoteJid, input);
      if (option) {
        clearMenuState(remoteJid);
        await dispatchMainMenuAction(instance, remoteJid, option.action, patient);
        return;
      }
    }
  }

  // Quick presence confirmation (OK, sim, yes, confirmo)
  if (CONFIRMATION_WORDS.includes(lower)) {
    const nextApt = await getNextConfirmedAppointment(patient.userId);
    if (nextApt) {
      await recordPatientConfirmation(nextApt.id);
      const dt = new Date(nextApt.scheduled_at);
      const dateStr = formatDateShort(dt, lang);
      const hours = dt.getUTCHours().toString().padStart(2, '0');
      const minutes = dt.getUTCMinutes().toString().padStart(2, '0');
      const msg = formatPresenceConfirmation(dateStr, `${hours}:${minutes}`, lang);
      await sendMessage(instance, remoteJid, msg);
      logOutgoing(phone, msg, patient.userId, 'patient', 'quick_confirm');
      return;
    }
    // No upcoming confirmed appointment — fall through to show menu
  }

  // No active state — show dynamic main menu
  await showMainMenu(instance, remoteJid, patient);
}

// =============================================
// Main Menu (Dynamic)
// =============================================

/**
 * Shows the dynamic main menu based on patient context.
 * Only shows options relevant to the patient's current state.
 */
async function showMainMenu(
  instance: string,
  remoteJid: string,
  patient: UserInfo
): Promise<void> {
  const lang = patient.language;
  const phone = extractPhoneFromJid(remoteJid);
  const context = await loadPatientContext(patient.userId);

  const menu = buildPatientMainMenu(patient.firstName, lang, {
    hasUpcoming: context.upcomingCount > 0,
    hasPending: context.pendingCount > 0,
    hasCancellable: context.cancellableCount > 0,
  });

  setMenuState(remoteJid, 'main_menu', menu.optionMap);
  await sendMessage(instance, remoteJid, menu.text);
  logOutgoing(phone, menu.text, patient.userId, 'patient', 'main_menu');
}

/**
 * Dispatches the selected action from the main menu.
 */
async function dispatchMainMenuAction(
  instance: string,
  remoteJid: string,
  action: string,
  patient: UserInfo
): Promise<void> {
  const lang = patient.language;
  const phone = extractPhoneFromJid(remoteJid);

  switch (action) {
    case 'appointments': {
      const appointments = await getUpcomingAppointments(patient.userId);
      const msg = formatUpcomingAppointments(appointments, lang);
      await sendMessage(instance, remoteJid, msg);
      logOutgoing(phone, msg, patient.userId, 'patient', 'appointments');
      break;
    }

    case 'confirm': {
      const appointments = await getUpcomingAppointments(patient.userId);
      const pending = appointments.filter(a => a.status === 'pending');

      if (pending.length === 0) {
        const msg = formatNoPendingAppointments('confirm', lang);
        await sendMessage(instance, remoteJid, msg);
        break;
      }

      if (pending.length === 1) {
        const success = await confirmAppointment(pending[0].id);
        const msg = success ? formatConfirmationSuccess(lang) : formatInvalidOption(lang);
        await sendMessage(instance, remoteJid, msg);
        break;
      }

      // Multiple pending — ask which one
      await sendMessage(instance, remoteJid, formatSelectAppointment(pending, 'confirm', lang));
      setBookingState(remoteJid, {
        step: 'select_type',
        appointmentType: '__confirm__',
        typeOptions: pending.map(a => ({ key: a.id, label: a.id, duration: 0 })),
      });
      break;
    }

    case 'cancel': {
      const appointments = await getUpcomingAppointments(patient.userId);
      const cancellable = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));

      if (cancellable.length === 0) {
        const msg = formatNoPendingAppointments('cancel', lang);
        await sendMessage(instance, remoteJid, msg);
        break;
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
          break;
        }
        setCancelState(remoteJid, {
          step: 'enter_reason',
          appointmentId: cancellable[0].id,
        });
        await sendMessage(instance, remoteJid, formatAskCancelReason(lang));
        break;
      }

      // Multiple — ask which one
      await sendMessage(instance, remoteJid, formatSelectAppointment(cancellable, 'cancel', lang));
      setCancelState(remoteJid, {
        step: 'select_appointment',
        appointments: cancellable.map((a, i) => ({ id: a.id, label: `${i + 1}`, scheduled_at: a.scheduled_at })),
      });
      break;
    }

    case 'book': {
      await startBookingFlow(instance, remoteJid, patient);
      break;
    }

    case 'services': {
      await showServicesMenu(instance, remoteJid, lang, patient.userId);
      break;
    }

    case 'clinic_info': {
      await showClinicInfoMenu(instance, remoteJid, lang, patient.userId);
      break;
    }

    default: {
      await showMainMenu(instance, remoteJid, patient);
      break;
    }
  }
}

// =============================================
// Booking Flow
// =============================================

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
 * Starts booking flow pre-selecting a specific treatment type.
 * Used when patient selects "Book this service" from service detail.
 */
async function startBookingFlowWithType(
  instance: string,
  remoteJid: string,
  patient: UserInfo,
  treatmentKey: string
): Promise<void> {
  const lang = patient.language;
  const providers = await getActiveProviders();

  if (providers.length === 0) {
    await sendMessage(instance, remoteJid, lang === 'pt'
      ? '⚠️ Nenhum médico disponível no momento.'
      : '⚠️ No providers available at the moment.');
    return;
  }

  if (providers.length === 1) {
    // Skip provider selection
    setBookingState(remoteJid, {
      step: 'select_date',
      appointmentType: treatmentKey,
      providerId: providers[0].id,
      providerName: providers[0].name,
    });
    await showAvailableDates(instance, remoteJid, providers[0].id, treatmentKey, lang);
    return;
  }

  setBookingState(remoteJid, {
    step: 'select_provider',
    appointmentType: treatmentKey,
    providerOptions: providers,
  });
  await sendMessage(instance, remoteJid, formatSelectProviderStep(providers, lang));
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
    clearAllState(remoteJid);
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
        clearAllState(remoteJid);
        await sendMessage(instance, remoteJid, lang === 'pt'
          ? '⚠️ Nenhum médico disponível no momento.'
          : '⚠️ No providers available at the moment.');
        return;
      }

      if (providers.length === 1) {
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
        const result = await bookAppointment(
          patient.userId,
          state.providerId!,
          state.appointmentType!,
          state.selectedSlot!
        );

        clearAllState(remoteJid);

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
        clearAllState(remoteJid);
        await sendMessage(instance, remoteJid, formatBookingCancelled(lang));
      } else {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang));
      }
      break;
    }
  }
}

// =============================================
// Available Dates Helper
// =============================================

async function showAvailableDates(
  instance: string,
  remoteJid: string,
  providerId: string,
  appointmentType: string,
  lang: Language
): Promise<void> {
  const dates = await getAvailableDates(providerId, appointmentType, 5);

  if (dates.length === 0) {
    clearAllState(remoteJid);
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

// =============================================
// Cancel Flow
// =============================================

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
