import { Language } from './types';
import { sendMessage } from './whatsappResponder';
import {
  getCachedTreatmentsByCategory,
  getCategoryLabel,
  CachedTreatment,
} from './treatmentCache';
import { buildMenu, MenuOption } from './menuBuilder';
import { setMenuState, getMenuState, clearMenuState } from './stateManager';
import { logOutgoing } from './messageLogger';
import { extractPhoneFromJid } from './phoneUtils';

// =============================================
// Patient Services — Browse services & prices
// =============================================

/**
 * Shows the services category menu.
 */
export async function showServicesMenu(
  instance: string,
  remoteJid: string,
  lang: Language,
  userId?: string
): Promise<void> {
  const byCategory = await getCachedTreatmentsByCategory();
  const phone = extractPhoneFromJid(remoteJid);

  const options: MenuOption[] = [];
  for (const [category, treatments] of byCategory) {
    const label = getCategoryLabel(category, lang);
    const count = treatments.length;
    options.push({
      label: `${label} (${count})`,
      action: 'services_category',
      data: { category },
    });
  }

  const header = lang === 'pt'
    ? '💉 *Nossos Serviços*\n\nEscolha uma categoria:'
    : '💉 *Our Services*\n\nChoose a category:';

  const menu = buildMenu(header, options, lang);

  setMenuState(remoteJid, 'services', menu.optionMap, menu.page);
  await sendMessage(instance, remoteJid, menu.text);
  await logOutgoing(phone, menu.text, userId, 'patient', 'services', 'categories');
}

/**
 * Shows treatments within a specific category.
 */
export async function showCategoryTreatments(
  instance: string,
  remoteJid: string,
  category: string,
  lang: Language,
  page: number = 1,
  userId?: string
): Promise<void> {
  const byCategory = await getCachedTreatmentsByCategory();
  const treatments = byCategory.get(category) || [];
  const phone = extractPhoneFromJid(remoteJid);
  const categoryLabel = getCategoryLabel(category, lang);

  if (treatments.length === 0) {
    const msg = lang === 'pt'
      ? `ℹ️ Nenhum serviço disponível na categoria *${categoryLabel}*.\n\n_Envie *0* para voltar_`
      : `ℹ️ No services available in *${categoryLabel}* category.\n\n_Send *0* to go back_`;
    await sendMessage(instance, remoteJid, msg);
    await logOutgoing(phone, msg, userId, 'patient', 'services', 'empty_category');
    return;
  }

  const options: MenuOption[] = treatments.map(t => {
    const label = lang === 'pt' ? t.label_pt : t.label_en;
    return {
      label,
      action: 'service_detail',
      data: { key: t.key },
    };
  });

  const header = lang === 'pt'
    ? `💉 *${categoryLabel}*\n\nEscolha um serviço para ver detalhes:`
    : `💉 *${categoryLabel}*\n\nChoose a service for details:`;

  const menu = buildMenu(header, options, lang, page);

  setMenuState(remoteJid, 'services_category', menu.optionMap, menu.page, { category });
  await sendMessage(instance, remoteJid, menu.text);
  await logOutgoing(phone, menu.text, userId, 'patient', 'services', `category:${category}`);
}

/**
 * Shows details for a specific treatment.
 */
export async function showServiceDetail(
  instance: string,
  remoteJid: string,
  treatmentKey: string,
  lang: Language,
  userId?: string
): Promise<void> {
  const byCategory = await getCachedTreatmentsByCategory();
  const phone = extractPhoneFromJid(remoteJid);
  let treatment: CachedTreatment | undefined;
  let treatmentCategory = '';

  for (const [cat, treatments] of byCategory) {
    const found = treatments.find(t => t.key === treatmentKey);
    if (found) {
      treatment = found;
      treatmentCategory = cat;
      break;
    }
  }

  if (!treatment) {
    const msg = lang === 'pt'
      ? '⚠️ Serviço não encontrado.\n\n_Envie *0* para voltar_'
      : '⚠️ Service not found.\n\n_Send *0* to go back_';
    await sendMessage(instance, remoteJid, msg);
    return;
  }

  const label = lang === 'pt' ? treatment.label_pt : treatment.label_en;
  const categoryLabel = getCategoryLabel(treatmentCategory, lang);
  const description = lang === 'pt' ? treatment.description_pt : treatment.description_en;
  const durLabel = lang === 'pt' ? 'Duração' : 'Duration';

  let msg = `💉 *${label}*\n`;
  msg += `📁 ${categoryLabel}\n`;
  msg += `⏱️ ${durLabel}: ${treatment.duration_minutes} min\n`;

  if (treatment.price !== null && treatment.price !== undefined) {
    msg += `💰 $${treatment.price.toFixed(0)}\n`;
  }

  if (description) {
    msg += `\n${description}\n`;
  }

  // Options after viewing detail
  const options: MenuOption[] = [
    {
      label: lang === 'pt' ? '📅 Agendar este serviço' : '📅 Book this service',
      action: 'book_specific',
      data: { treatmentKey },
    },
    {
      label: lang === 'pt' ? '⬅️ Voltar à categoria' : '⬅️ Back to category',
      action: 'services_category',
      data: { category: treatmentCategory },
    },
    {
      label: lang === 'pt' ? '🏠 Menu principal' : '🏠 Main menu',
      action: 'main_menu',
    },
  ];

  const optionMap = new Map<number, MenuOption>();
  options.forEach((opt, i) => {
    const num = i + 1;
    optionMap.set(num, opt);
    msg += `\n*${num}.* ${opt.label}`;
  });

  msg += `\n\n_${lang === 'pt' ? 'Responda com o número' : 'Reply with the number'}_`;

  setMenuState(remoteJid, 'service_detail', optionMap, 1, { treatmentKey, category: treatmentCategory });
  await sendMessage(instance, remoteJid, msg);
  await logOutgoing(phone, msg, userId, 'patient', 'services', `detail:${treatmentKey}`);
}

/**
 * Handles user input within the services flow.
 * Returns true if handled, false if should fall through.
 */
export async function handleServicesInput(
  instance: string,
  remoteJid: string,
  input: string,
  lang: Language,
  userId?: string
): Promise<{ handled: boolean; action?: string; data?: any }> {
  const menuState = getMenuState(remoteJid);
  if (!menuState) return { handled: false };

  const handler = menuState.handler;
  if (!['services', 'services_category', 'service_detail'].includes(handler)) {
    return { handled: false };
  }

  // Handle "0" = go back one level
  if (input === '0') {
    if (handler === 'services_category') {
      // Back to categories
      await showServicesMenu(instance, remoteJid, lang, userId);
      return { handled: true };
    }
    if (handler === 'service_detail' && menuState.context?.category) {
      // Back to category treatments
      await showCategoryTreatments(instance, remoteJid, menuState.context.category, lang, 1, userId);
      return { handled: true };
    }
    // services (top level) → go to main menu
    clearMenuState(remoteJid);
    return { handled: false, action: 'main_menu' };
  }

  const idx = parseInt(input, 10);
  if (isNaN(idx) || idx < 1) {
    return { handled: false };
  }

  const option = menuState.optionMap.get(idx);
  if (!option) {
    const msg = lang === 'pt' ? '⚠️ Opção inválida. Tente novamente.' : '⚠️ Invalid option. Please try again.';
    await sendMessage(instance, remoteJid, msg);
    return { handled: true };
  }

  // Handle pagination
  if (option.action === '__next_page__' || option.action === '__prev_page__') {
    const newPage = option.data?.page || 1;
    if (handler === 'services_category' && menuState.context?.category) {
      await showCategoryTreatments(instance, remoteJid, menuState.context.category, lang, newPage, userId);
    }
    return { handled: true };
  }

  // Handle category selection
  if (option.action === 'services_category') {
    await showCategoryTreatments(instance, remoteJid, option.data.category, lang, 1, userId);
    return { handled: true };
  }

  // Handle service detail
  if (option.action === 'service_detail') {
    await showServiceDetail(instance, remoteJid, option.data.key, lang, userId);
    return { handled: true };
  }

  // Handle booking from detail view
  if (option.action === 'book_specific') {
    clearMenuState(remoteJid);
    return { handled: false, action: 'book_specific', data: option.data };
  }

  // Handle main menu
  if (option.action === 'main_menu') {
    clearMenuState(remoteJid);
    return { handled: false, action: 'main_menu' };
  }

  return { handled: false };
}
