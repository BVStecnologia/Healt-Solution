import { Language } from './types';
import { UserInfo } from './userIdentifier';
import { sendMessage } from './whatsappResponder';
import { getSchedule, createBlock, removeBlocks, generateMagicLink } from './scheduleManager';
import { shortenUrl } from './urlShortener';
import { config } from './config';
import {
  getMenuState,
  setMenuState,
  clearMenuState,
  clearAllState,
  resolveMenuOption,
} from './stateManager';
import { MenuOption } from './menuBuilder';
import { logIncoming, logOutgoing } from './messageLogger';
import { extractPhoneFromJid } from './phoneUtils';
import {
  formatScheduleResponse,
  formatBlockResponse,
  formatUnblockResponse,
  formatPatientsResponse,
  appendLink,
  formatDateInputPrompt,
  formatBlockPeriodMenu,
  formatInvalidDate,
} from './providerResponder';

const EXIT_WORDS = ['sair', 'exit', 'voltar', 'back', 'menu'];

/**
 * Main handler for provider/admin WhatsApp messages.
 * Uses numbered menus like the patient handler.
 */
export async function handleProviderMessage(
  instance: string,
  remoteJid: string,
  text: string,
  provider: UserInfo
): Promise<void> {
  const input = text.trim();
  const lower = input.toLowerCase();
  const lang = provider.language;
  const phone = extractPhoneFromJid(remoteJid);

  // Log incoming message
  logIncoming(phone, input, provider.userId, provider.role);

  // Exit words — back to main menu
  if (EXIT_WORDS.includes(lower)) {
    clearAllState(remoteJid);
    await showProviderMainMenu(instance, remoteJid, provider);
    return;
  }

  // Check active menu state
  const menuState = getMenuState(remoteJid);
  if (menuState) {
    const handler = menuState.handler;

    // Main menu selection
    if (handler === 'provider_main') {
      const option = resolveMenuOption(remoteJid, input);
      if (option) {
        clearMenuState(remoteJid);
        await dispatchProviderAction(instance, remoteJid, option.action, provider);
        return;
      }
    }

    // Date input flows
    if (handler === 'provider_date_input') {
      const action = menuState.context?.action as 'schedule' | 'block' | 'unblock';
      const date = parseDate(input, lang);

      if (!date) {
        await sendMessage(instance, remoteJid, formatInvalidDate(lang));
        return;
      }

      clearMenuState(remoteJid);

      if (action === 'schedule') {
        await showScheduleForDate(instance, remoteJid, provider, date);
      } else if (action === 'block') {
        // Ask for period
        setMenuState(remoteJid, 'provider_block_period', buildBlockPeriodMap(), 1, { date });
        await sendMessage(instance, remoteJid, formatBlockPeriodMenu(date, lang));
        logOutgoing(phone, '[block period menu]', provider.userId, provider.role, 'provider_block_period');
      } else if (action === 'unblock') {
        await doUnblock(instance, remoteJid, provider, date);
      }
      return;
    }

    // Block period selection
    if (handler === 'provider_block_period') {
      const date = menuState.context?.date as Date;
      const idx = parseInt(input, 10);

      if (isNaN(idx) || idx < 1 || idx > 3) {
        await sendMessage(instance, remoteJid, lang === 'pt'
          ? '⚠️ Opção inválida. Responda 1, 2 ou 3.'
          : '⚠️ Invalid option. Reply 1, 2 or 3.');
        return;
      }

      clearMenuState(remoteJid);

      let startTime: string | null = null;
      let endTime: string | null = null;

      if (idx === 1) { startTime = '08:00'; endTime = '12:00'; }
      else if (idx === 2) { startTime = '12:00'; endTime = '18:00'; }
      // idx === 3 = full day (null/null)

      await doBlock(instance, remoteJid, provider, date, startTime, endTime);
      return;
    }
  }

  // "0" without sub-menu = show main menu
  if (input === '0') {
    clearAllState(remoteJid);
    await showProviderMainMenu(instance, remoteJid, provider);
    return;
  }

  // No active state — show main menu
  await showProviderMainMenu(instance, remoteJid, provider);
}

// =============================================
// Main Menu
// =============================================

async function showProviderMainMenu(
  instance: string,
  remoteJid: string,
  provider: UserInfo
): Promise<void> {
  const lang = provider.language;
  const phone = extractPhoneFromJid(remoteJid);
  const name = provider.firstName;

  const options: MenuOption[] = lang === 'pt' ? [
    { label: '📋 Agenda de hoje', action: 'schedule_today' },
    { label: '📋 Agenda de amanhã', action: 'schedule_tomorrow' },
    { label: '📅 Agenda por data', action: 'schedule_date' },
    { label: '🔒 Bloquear horário', action: 'block' },
    { label: '🔓 Liberar horário', action: 'unblock' },
    { label: '👥 Meus pacientes', action: 'patients' },
  ] : [
    { label: '📋 Today\'s schedule', action: 'schedule_today' },
    { label: '📋 Tomorrow\'s schedule', action: 'schedule_tomorrow' },
    { label: '📅 Schedule by date', action: 'schedule_date' },
    { label: '🔒 Block time', action: 'block' },
    { label: '🔓 Unblock time', action: 'unblock' },
    { label: '👥 My patients', action: 'patients' },
  ];

  const optionMap = new Map<number, MenuOption>();
  const header = lang === 'pt'
    ? `🩺 *Painel Médico*\nOlá, Dr(a). ${name}! 👋`
    : `🩺 *Provider Panel*\nHello, Dr. ${name}! 👋`;

  let text = header + '\n';
  options.forEach((opt, i) => {
    const num = i + 1;
    optionMap.set(num, opt);
    text += `\n*${num}.* ${opt.label}`;
  });

  text += `\n\n_${lang === 'pt' ? 'Responda com o número da opção' : 'Reply with the option number'}_`;
  text += `\n_${lang === 'pt' ? 'Envie *trocar* para mudar de perfil' : 'Send *switch* to change profile'}_`;

  setMenuState(remoteJid, 'provider_main', optionMap);
  await sendMessage(instance, remoteJid, text);
  logOutgoing(phone, text, provider.userId, provider.role, 'provider_main_menu');
}

// =============================================
// Action Dispatcher
// =============================================

async function dispatchProviderAction(
  instance: string,
  remoteJid: string,
  action: string,
  provider: UserInfo
): Promise<void> {
  const lang = provider.language;
  const phone = extractPhoneFromJid(remoteJid);

  switch (action) {
    case 'schedule_today': {
      await showScheduleForDate(instance, remoteJid, provider, new Date());
      break;
    }

    case 'schedule_tomorrow': {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await showScheduleForDate(instance, remoteJid, provider, tomorrow);
      break;
    }

    case 'schedule_date': {
      setMenuState(remoteJid, 'provider_date_input', new Map(), 1, { action: 'schedule' });
      const msg = formatDateInputPrompt('schedule', lang);
      await sendMessage(instance, remoteJid, msg);
      logOutgoing(phone, msg, provider.userId, provider.role, 'provider_date_input');
      break;
    }

    case 'block': {
      setMenuState(remoteJid, 'provider_date_input', new Map(), 1, { action: 'block' });
      const msg = formatDateInputPrompt('block', lang);
      await sendMessage(instance, remoteJid, msg);
      logOutgoing(phone, msg, provider.userId, provider.role, 'provider_date_input');
      break;
    }

    case 'unblock': {
      setMenuState(remoteJid, 'provider_date_input', new Map(), 1, { action: 'unblock' });
      const msg = formatDateInputPrompt('unblock', lang);
      await sendMessage(instance, remoteJid, msg);
      logOutgoing(phone, msg, provider.userId, provider.role, 'provider_date_input');
      break;
    }

    case 'patients': {
      const link = await getShortLink(provider.email, '/admin/patients');
      const msg = formatPatientsResponse(link, lang);
      await sendMessage(instance, remoteJid, msg);
      logOutgoing(phone, msg, provider.userId, provider.role, 'patients');
      break;
    }

    default: {
      await showProviderMainMenu(instance, remoteJid, provider);
      break;
    }
  }
}

// =============================================
// Schedule, Block, Unblock actions
// =============================================

async function showScheduleForDate(
  instance: string,
  remoteJid: string,
  provider: UserInfo,
  date: Date
): Promise<void> {
  const lang = provider.language;
  const phone = extractPhoneFromJid(remoteJid);

  if (!provider.providerId) {
    await sendMessage(instance, remoteJid, lang === 'pt'
      ? '⚠️ Seu perfil não está vinculado a um médico ativo.'
      : '⚠️ Your profile is not linked to an active provider.');
    return;
  }

  const { appointments, blocks } = await getSchedule(provider.providerId, date);
  let response = formatScheduleResponse(date, appointments, blocks, lang);
  const link = await getShortLink(provider.email, '/admin/calendar');
  response = appendLink(response, link, lang);
  await sendMessage(instance, remoteJid, response);
  logOutgoing(phone, response, provider.userId, provider.role, 'schedule');
}

async function doBlock(
  instance: string,
  remoteJid: string,
  provider: UserInfo,
  date: Date,
  startTime: string | null,
  endTime: string | null
): Promise<void> {
  const lang = provider.language;
  const phone = extractPhoneFromJid(remoteJid);

  if (!provider.providerId) {
    await sendMessage(instance, remoteJid, lang === 'pt'
      ? '⚠️ Seu perfil não está vinculado a um médico ativo.'
      : '⚠️ Your profile is not linked to an active provider.');
    return;
  }

  try {
    const result = await createBlock(provider.providerId, date, startTime, endTime, null);
    let response = formatBlockResponse(date, startTime, endTime, result.conflicts || [], lang);
    const link = await getShortLink(provider.email, '/admin/calendar');
    response = appendLink(response, link, lang);
    await sendMessage(instance, remoteJid, response);
    logOutgoing(phone, response, provider.userId, provider.role, 'block');
  } catch (err) {
    await sendMessage(instance, remoteJid, lang === 'pt'
      ? '⚠️ Erro ao criar bloqueio. Tente novamente.'
      : '⚠️ Error creating block. Please try again.');
  }
}

async function doUnblock(
  instance: string,
  remoteJid: string,
  provider: UserInfo,
  date: Date
): Promise<void> {
  const lang = provider.language;
  const phone = extractPhoneFromJid(remoteJid);

  if (!provider.providerId) {
    await sendMessage(instance, remoteJid, lang === 'pt'
      ? '⚠️ Seu perfil não está vinculado a um médico ativo.'
      : '⚠️ Your profile is not linked to an active provider.');
    return;
  }

  try {
    const removedCount = await removeBlocks(provider.providerId, date);
    let response = formatUnblockResponse(date, removedCount, lang);
    const link = await getShortLink(provider.email, '/admin/calendar');
    response = appendLink(response, link, lang);
    await sendMessage(instance, remoteJid, response);
    logOutgoing(phone, response, provider.userId, provider.role, 'unblock');
  } catch (err) {
    await sendMessage(instance, remoteJid, lang === 'pt'
      ? '⚠️ Erro ao liberar horários. Tente novamente.'
      : '⚠️ Error unblocking. Please try again.');
  }
}

// =============================================
// Helpers
// =============================================

/**
 * Generates a magic link, shortens it, and returns the short URL.
 */
async function getShortLink(email: string, redirectPath: string): Promise<string | null> {
  const fullLink = await generateMagicLink(email, redirectPath);
  if (!fullLink) return null;
  return shortenUrl(fullLink);
}

/**
 * Builds option map for block period menu.
 */
function buildBlockPeriodMap(): Map<number, MenuOption> {
  const map = new Map<number, MenuOption>();
  map.set(1, { label: 'Manhã', action: 'morning' });
  map.set(2, { label: 'Tarde', action: 'afternoon' });
  map.set(3, { label: 'Dia inteiro', action: 'full_day' });
  return map;
}

/**
 * Parses a date string in DD/MM (pt) or MM/DD (en) format.
 */
function parseDate(dateStr: string, lang: Language): Date | undefined {
  const parts = dateStr.split('/');
  if (parts.length !== 2) return undefined;

  const [a, b] = parts.map(Number);
  if (isNaN(a) || isNaN(b)) return undefined;

  const now = new Date();
  const year = now.getFullYear();

  let day: number, month: number;
  if (lang === 'pt') {
    day = a;
    month = b;
  } else {
    month = a;
    day = b;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;

  const date = new Date(year, month - 1, day);

  // If date is in the past, assume next year
  if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    date.setFullYear(year + 1);
  }

  return date;
}
