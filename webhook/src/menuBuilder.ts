import { Language } from './types';

// =============================================
// Menu Builder — Dynamic numbered menus
// with pagination and option mapping
// =============================================

export interface MenuOption {
  label: string;
  action: string;   // identifier: 'appointments', 'confirm', 'book', '__next_page__', etc.
  data?: any;        // optional payload (appointment id, treatment key, etc.)
}

export interface BuiltMenu {
  text: string;
  optionMap: Map<number, MenuOption>;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 8;

/**
 * Builds a numbered menu from a list of options.
 * Automatically adds pagination if options exceed PAGE_SIZE.
 * Returns formatted text + a map of number→action for response handling.
 */
export function buildMenu(
  header: string,
  options: MenuOption[],
  lang: Language,
  page: number = 1
): BuiltMenu {
  const totalPages = Math.ceil(options.length / PAGE_SIZE) || 1;
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageOptions = options.slice(startIdx, startIdx + PAGE_SIZE);

  const optionMap = new Map<number, MenuOption>();
  let text = header + '\n';

  pageOptions.forEach((opt, i) => {
    const num = i + 1;
    optionMap.set(num, opt);
    text += `\n*${num}.* ${opt.label}`;
  });

  // Pagination controls
  let nextNum = pageOptions.length + 1;

  if (safePage < totalPages) {
    const navLabel = lang === 'pt' ? '➡️ Próxima página' : '➡️ Next page';
    optionMap.set(nextNum, { label: navLabel, action: '__next_page__', data: { page: safePage + 1 } });
    text += `\n\n*${nextNum}.* ${navLabel}`;
    nextNum++;
  }

  if (safePage > 1) {
    const navLabel = lang === 'pt' ? '⬅️ Página anterior' : '⬅️ Previous page';
    optionMap.set(nextNum, { label: navLabel, action: '__prev_page__', data: { page: safePage - 1 } });
    text += `\n*${nextNum}.* ${navLabel}`;
    nextNum++;
  }

  // Footer
  if (totalPages > 1) {
    text += `\n\n_${lang === 'pt' ? `Página ${safePage}/${totalPages}` : `Page ${safePage}/${totalPages}`}_`;
  }

  text += `\n_${lang === 'pt' ? 'Responda com o número ou *0* para voltar' : 'Reply with the number or *0* to go back'}_`;

  return { text, optionMap, page: safePage, totalPages };
}

/**
 * Builds the main patient menu dynamically.
 * Only shows options relevant to the patient's current context.
 */
export function buildPatientMainMenu(
  firstName: string,
  lang: Language,
  context: {
    hasUpcoming: boolean;
    hasPending: boolean;
    hasCancellable: boolean;
  }
): BuiltMenu {
  const header = lang === 'pt'
    ? `🏥 *Essence Medical Clinic*\nOlá, ${firstName}! 👋`
    : `🏥 *Essence Medical Clinic*\nHello, ${firstName}! 👋`;

  const options: MenuOption[] = [];

  // Show appointments only if has any
  if (context.hasUpcoming) {
    options.push({
      label: lang === 'pt' ? '📋 Minhas consultas' : '📋 My appointments',
      action: 'appointments',
    });
  }

  // Only if has pending appointments
  if (context.hasPending) {
    options.push({
      label: lang === 'pt' ? '✅ Confirmar consulta' : '✅ Confirm appointment',
      action: 'confirm',
    });
  }

  // Only if has cancellable appointments
  if (context.hasCancellable) {
    options.push({
      label: lang === 'pt' ? '❌ Cancelar consulta' : '❌ Cancel appointment',
      action: 'cancel',
    });
  }

  // Always available
  options.push({
    label: lang === 'pt' ? '📅 Agendar consulta' : '📅 Book appointment',
    action: 'book',
  });

  options.push({
    label: lang === 'pt' ? '💉 Nossos serviços' : '💉 Our services',
    action: 'services',
  });

  options.push({
    label: lang === 'pt' ? 'ℹ️ Informações da clínica' : 'ℹ️ Clinic info',
    action: 'clinic_info',
  });

  // Build option map
  const optionMap = new Map<number, MenuOption>();
  let text = header + '\n';

  options.forEach((opt, i) => {
    const num = i + 1;
    optionMap.set(num, opt);
    text += `\n*${num}.* ${opt.label}`;
  });

  text += `\n\n_${lang === 'pt' ? 'Responda com o número da opção' : 'Reply with the option number'}_`;

  return { text, optionMap, page: 1, totalPages: 1 };
}
