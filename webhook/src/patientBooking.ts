import { Language } from './types';
import { UserInfo } from './userIdentifier';
import { sendMessage } from './whatsappResponder';
import {
  getState,
  setBookingState,
  clearAllState,
  BookingState,
} from './stateManager';
import {
  getActiveProviders,
  getAvailableDates,
  getAvailableTimeSlots,
  bookAppointment,
  getEligibleTypes,
} from './patientManager';
import {
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
} from './patientResponder';
import { getTypeLabel } from './whatsappResponder';

/**
 * Calculates step info (current step number and total steps).
 * Total is 5 if provider selection is needed, 4 otherwise.
 */
function getStepInfo(step: BookingState['step'], hasMultipleProviders: boolean): { current: number; total: number } {
  const total = hasMultipleProviders ? 5 : 4;
  const offset = hasMultipleProviders ? 0 : -1;
  const stepMap: Record<string, number> = {
    select_type: 1,
    select_provider: 2,
    select_date: hasMultipleProviders ? 3 : 2,
    select_time: hasMultipleProviders ? 4 : 3,
    confirm: hasMultipleProviders ? 5 : 4,
  };
  return { current: stepMap[step] || 1, total };
}

/**
 * Starts the booking flow by showing eligible appointment types.
 */
export async function startBookingFlow(
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

  // Check providers count to determine total steps
  const providers = await getActiveProviders();
  const hasMultipleProviders = providers.length > 1;
  const step = getStepInfo('select_type', hasMultipleProviders);

  setBookingState(remoteJid, {
    step: 'select_type',
    typeOptions: types,
  });

  await sendMessage(instance, remoteJid, formatSelectTypeStep(types, lang, step));
}

/**
 * Starts booking flow pre-selecting a specific treatment type.
 * Used when patient selects "Book this service" from service detail.
 */
export async function startBookingFlowWithType(
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

  const hasMultipleProviders = providers.length > 1;

  if (providers.length === 1) {
    // Type pre-selected + single provider = skip to date (total 3 steps: date, time, confirm)
    setBookingState(remoteJid, {
      step: 'select_date',
      appointmentType: treatmentKey,
      providerId: providers[0].id,
      providerName: providers[0].name,
    });
    await showAvailableDates(instance, remoteJid, providers[0].id, treatmentKey, lang, false);
    return;
  }

  // Type pre-selected + multiple providers (total 4 steps: provider, date, time, confirm)
  const step = { current: 1, total: 4 };
  setBookingState(remoteJid, {
    step: 'select_provider',
    appointmentType: treatmentKey,
    providerOptions: providers,
  });
  await sendMessage(instance, remoteJid, formatSelectProviderStep(providers, lang, step));
}

/**
 * Handles each step of the booking flow.
 */
export async function handleBookingStep(
  instance: string,
  remoteJid: string,
  input: string,
  patient: UserInfo,
  state: BookingState
): Promise<void> {
  const lang = patient.language;

  // Special case: confirm selection (option 2 from menu)
  if (state.appointmentType === '__confirm__') {
    const { confirmAppointment } = await import('./patientManager');
    const idx = parseInt(input, 10);
    const maxOpts = state.typeOptions?.length || 0;
    if (isNaN(idx) || idx < 1 || !state.typeOptions || idx > maxOpts) {
      await sendMessage(instance, remoteJid, formatInvalidOption(lang, maxOpts || undefined));
      return;
    }
    const aptId = state.typeOptions[idx - 1].key;
    const success = await confirmAppointment(aptId);
    clearAllState(remoteJid);
    const { formatConfirmationSuccess } = await import('./patientResponder');
    await sendMessage(instance, remoteJid,
      success ? formatConfirmationSuccess(lang) : formatInvalidOption(lang)
    );
    return;
  }

  // Determine if we have multiple providers for step calculation
  const hasMultipleProviders = !!state.providerOptions && state.providerOptions.length > 1;

  switch (state.step) {
    case 'select_type': {
      const maxOpts = state.typeOptions?.length || 0;
      const idx = parseInt(input, 10);
      if (isNaN(idx) || idx < 1 || !state.typeOptions || idx > maxOpts) {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang, maxOpts || undefined));
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

      const multipleProviders = providers.length > 1;

      if (providers.length === 1) {
        setBookingState(remoteJid, {
          step: 'select_date',
          appointmentType: selectedType.key,
          duration: selectedType.duration,
          providerId: providers[0].id,
          providerName: providers[0].name,
        });
        await showAvailableDates(instance, remoteJid, providers[0].id, selectedType.key, lang, false);
        return;
      }

      const step = getStepInfo('select_provider', multipleProviders);
      setBookingState(remoteJid, {
        step: 'select_provider',
        appointmentType: selectedType.key,
        duration: selectedType.duration,
        providerOptions: providers,
      });
      await sendMessage(instance, remoteJid, formatSelectProviderStep(providers, lang, step));
      break;
    }

    case 'select_provider': {
      const maxOpts = state.providerOptions?.length || 0;
      const idx = parseInt(input, 10);
      if (isNaN(idx) || idx < 1 || !state.providerOptions || idx > maxOpts) {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang, maxOpts || undefined));
        return;
      }

      const provider = state.providerOptions[idx - 1];
      setBookingState(remoteJid, {
        step: 'select_date',
        appointmentType: state.appointmentType!,
        duration: state.duration,
        providerId: provider.id,
        providerName: provider.name,
        providerOptions: state.providerOptions,
      });
      await showAvailableDates(instance, remoteJid, provider.id, state.appointmentType!, lang, true);
      break;
    }

    case 'select_date': {
      const maxOpts = state.dateOptions?.length || 0;
      const idx = parseInt(input, 10);
      if (isNaN(idx) || idx < 1 || !state.dateOptions || idx > maxOpts) {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang, maxOpts || undefined));
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

      const step = getStepInfo('select_time', hasMultipleProviders);
      setBookingState(remoteJid, {
        step: 'select_time',
        appointmentType: state.appointmentType!,
        duration: state.duration,
        providerId: state.providerId!,
        providerName: state.providerName!,
        date: selectedDate.date,
        timeOptions: slots,
        providerOptions: state.providerOptions,
      });
      await sendMessage(instance, remoteJid, formatSelectTimeStep(slots, lang, step));
      break;
    }

    case 'select_time': {
      const maxOpts = state.timeOptions?.length || 0;
      const idx = parseInt(input, 10);
      if (isNaN(idx) || idx < 1 || !state.timeOptions || idx > maxOpts) {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang, maxOpts || undefined));
        return;
      }

      const slot = state.timeOptions[idx - 1];
      const typeName = getTypeLabel(state.appointmentType!, lang);
      const step = getStepInfo('confirm', hasMultipleProviders);

      setBookingState(remoteJid, {
        step: 'confirm',
        appointmentType: state.appointmentType!,
        duration: state.duration,
        providerId: state.providerId!,
        providerName: state.providerName!,
        date: state.date!,
        selectedSlot: slot.scheduledAt,
        timeOptions: state.timeOptions,
        providerOptions: state.providerOptions,
      });

      await sendMessage(instance, remoteJid,
        formatBookingConfirmation(typeName, state.providerName!, state.date!, slot.time, lang, state.duration, step)
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
            formatBookingSuccess(typeName, state.providerName!, state.date!, `${hours}:${minutes}`, lang, state.duration)
          );
        } else {
          await sendMessage(instance, remoteJid, formatBookingError(lang));
        }
      } else if (input === '2') {
        clearAllState(remoteJid);
        await sendMessage(instance, remoteJid, formatBookingCancelled(lang));
      } else {
        await sendMessage(instance, remoteJid, formatInvalidOption(lang, 2));
      }
      break;
    }
  }
}

/**
 * Shows available dates for the selected provider and type.
 */
async function showAvailableDates(
  instance: string,
  remoteJid: string,
  providerId: string,
  appointmentType: string,
  lang: Language,
  hasMultipleProviders: boolean = false
): Promise<void> {
  const dates = await getAvailableDates(providerId, appointmentType, 5);

  if (dates.length === 0) {
    clearAllState(remoteJid);
    await sendMessage(instance, remoteJid, formatNoAvailableDates(lang));
    return;
  }

  const currentState = getState(remoteJid);
  if (currentState?.type === 'booking') {
    setBookingState(remoteJid, {
      ...currentState.data,
      step: 'select_date',
      dateOptions: dates,
    });
  }

  const step = getStepInfo('select_date', hasMultipleProviders);
  await sendMessage(instance, remoteJid, formatSelectDateStep(dates, lang, step));
}
