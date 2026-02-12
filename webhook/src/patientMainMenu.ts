import { UserInfo } from './userIdentifier';
import { sendMessage } from './whatsappResponder';
import { getState, getMenuState, setMenuState, clearMenuState, clearAllState, resolveMenuOption, wasAnyStateExpired } from './stateManager';
import { buildPatientMainMenu } from './menuBuilder';
import { loadPatientContext } from './router';
import { logIncoming, logOutgoing } from './messageLogger';
import { showServicesMenu, handleServicesInput } from './patientServices';
import { showClinicInfoMenu, handleClinicInfoInput } from './patientClinicInfo';
import { extractPhoneFromJid } from './phoneUtils';
import { getNextConfirmedAppointment, recordPatientConfirmation } from './patientManager';
import { formatPresenceConfirmation, formatClinicContact, formatSessionExpired } from './patientResponder';
import { formatDateShort } from './whatsappResponder';
import { startBookingFlow, startBookingFlowWithType, handleBookingStep } from './patientBooking';
import { handleViewAppointments, handleConfirmFlow, handleCancelInit, handleCancelStep } from './patientAppointments';

const EXIT_WORDS = ['sair', 'exit', 'voltar', 'back', 'menu'];
const CONFIRMATION_WORDS = ['ok', 'sim', 'yes', 'confirmo', 'confirmed', 'confirmar'];
const HUMAN_WORDS = ['atendente', 'recepção', 'recepcao', 'human', 'humano', 'ajuda', 'help', 'pessoa'];

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

  // Check for human/help words — clear state and show clinic contact
  if (HUMAN_WORDS.includes(lower)) {
    clearAllState(remoteJid);
    const msg = formatClinicContact(lang);
    await sendMessage(instance, remoteJid, msg);
    logOutgoing(phone, msg, patient.userId, 'patient', 'human_escape');
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

  // "0" without active sub-menu = show main menu
  if (input === '0') {
    clearAllState(remoteJid);
    await showMainMenu(instance, remoteJid, patient);
    return;
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

  // Check if a state recently expired (timeout notification)
  if (wasAnyStateExpired(remoteJid)) {
    const expiredMsg = formatSessionExpired(lang);
    await sendMessage(instance, remoteJid, expiredMsg);
    logOutgoing(phone, expiredMsg, patient.userId, 'patient', 'session_expired');
  }

  // No active state — show dynamic main menu
  await showMainMenu(instance, remoteJid, patient);
}

/**
 * Shows the dynamic main menu based on patient context.
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
  switch (action) {
    case 'appointments':
      await handleViewAppointments(instance, remoteJid, patient);
      break;

    case 'confirm':
      await handleConfirmFlow(instance, remoteJid, patient);
      break;

    case 'cancel':
      await handleCancelInit(instance, remoteJid, patient);
      break;

    case 'book':
      await startBookingFlow(instance, remoteJid, patient);
      break;

    case 'services':
      await showServicesMenu(instance, remoteJid, patient.language, patient.userId);
      break;

    case 'clinic_info':
      await showClinicInfoMenu(instance, remoteJid, patient.language, patient.userId);
      break;

    default:
      await showMainMenu(instance, remoteJid, patient);
      break;
  }
}
