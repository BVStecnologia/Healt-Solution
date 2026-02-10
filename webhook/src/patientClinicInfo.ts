import { Language } from './types';
import { sendMessage } from './whatsappResponder';
import { buildMenu, MenuOption } from './menuBuilder';
import { setMenuState, getMenuState, clearMenuState } from './stateManager';
import { logOutgoing } from './messageLogger';
import { extractPhoneFromJid } from './phoneUtils';

// =============================================
// Patient Clinic Info — Hours, address, contact
// =============================================

const CLINIC = {
  name: 'Essence Medical Clinic',
  address: '2000 NE 44th ST, Suite 101B, Fort Lauderdale, FL 33308',
  phone: '+1 (954) 756-2565',
  email: 'team@essencemedicalclinic.com',
  website: 'https://essencemedicalclinic.com',
  instagram: '@essencemedicalclinic',
  hours: {
    weekdays: 'Mon-Fri 10am - 6pm',
    saturday: 'Sat 11am - 3pm (2x/month)',
  },
  provider: 'Dr. Rosane Nunes',
  googleMaps: 'https://maps.google.com/?q=2000+NE+44th+ST+Suite+101B+Fort+Lauderdale+FL+33308',
};

/**
 * Shows the clinic info sub-menu.
 */
export async function showClinicInfoMenu(
  instance: string,
  remoteJid: string,
  lang: Language,
  userId?: string
): Promise<void> {
  const phone = extractPhoneFromJid(remoteJid);

  const options: MenuOption[] = [
    {
      label: lang === 'pt' ? '🕐 Horário de funcionamento' : '🕐 Business hours',
      action: 'clinic_hours',
    },
    {
      label: lang === 'pt' ? '📍 Endereço e como chegar' : '📍 Address & directions',
      action: 'clinic_address',
    },
    {
      label: lang === 'pt' ? '📞 Contato (telefone/email)' : '📞 Contact (phone/email)',
      action: 'clinic_contact',
    },
    {
      label: lang === 'pt' ? '🌐 Site e redes sociais' : '🌐 Website & social media',
      action: 'clinic_website',
    },
  ];

  const header = lang === 'pt'
    ? `ℹ️ *${CLINIC.name}*\n\nEscolha uma opção:`
    : `ℹ️ *${CLINIC.name}*\n\nChoose an option:`;

  const menu = buildMenu(header, options, lang);

  setMenuState(remoteJid, 'clinic_info', menu.optionMap, menu.page);
  await sendMessage(instance, remoteJid, menu.text);
  await logOutgoing(phone, menu.text, userId, 'patient', 'clinic_info', 'menu');
}

/**
 * Handles clinic info sub-menu input.
 * Returns true if handled, false if should fall through.
 */
export async function handleClinicInfoInput(
  instance: string,
  remoteJid: string,
  input: string,
  lang: Language,
  userId?: string
): Promise<{ handled: boolean; action?: string }> {
  const menuState = getMenuState(remoteJid);
  if (!menuState || menuState.handler !== 'clinic_info') {
    return { handled: false };
  }

  const phone = extractPhoneFromJid(remoteJid);
  const idx = parseInt(input, 10);
  if (isNaN(idx) || idx < 1) return { handled: false };

  const option = menuState.optionMap.get(idx);
  if (!option) {
    const msg = lang === 'pt' ? '⚠️ Opção inválida. Tente novamente.' : '⚠️ Invalid option. Please try again.';
    await sendMessage(instance, remoteJid, msg);
    return { handled: true };
  }

  let msg = '';

  switch (option.action) {
    case 'clinic_hours':
      msg = lang === 'pt'
        ? `🕐 *Horário de Funcionamento*\n\n📅 Segunda a Sexta: 10h - 18h\n📅 Sábado: 11h - 15h (2x/mês)\n📅 Domingo: Fechado\n\n_Envie *0* para voltar_`
        : `🕐 *Business Hours*\n\n📅 ${CLINIC.hours.weekdays}\n📅 ${CLINIC.hours.saturday}\n📅 Sunday: Closed\n\n_Send *0* to go back_`;
      break;

    case 'clinic_address':
      msg = lang === 'pt'
        ? `📍 *Endereço*\n\n${CLINIC.address}\n\n🗺️ Google Maps:\n${CLINIC.googleMaps}\n\n_Envie *0* para voltar_`
        : `📍 *Address*\n\n${CLINIC.address}\n\n🗺️ Google Maps:\n${CLINIC.googleMaps}\n\n_Send *0* to go back_`;
      break;

    case 'clinic_contact':
      msg = lang === 'pt'
        ? `📞 *Contato*\n\n📱 Telefone: ${CLINIC.phone}\n📧 Email: ${CLINIC.email}\n👩‍⚕️ Lead Provider: ${CLINIC.provider}\n\n_Envie *0* para voltar_`
        : `📞 *Contact*\n\n📱 Phone: ${CLINIC.phone}\n📧 Email: ${CLINIC.email}\n👩‍⚕️ Lead Provider: ${CLINIC.provider}\n\n_Send *0* to go back_`;
      break;

    case 'clinic_website':
      msg = lang === 'pt'
        ? `🌐 *Site e Redes Sociais*\n\n🌍 Site: ${CLINIC.website}\n📸 Instagram: ${CLINIC.instagram}\n\n_Envie *0* para voltar_`
        : `🌐 *Website & Social Media*\n\n🌍 Website: ${CLINIC.website}\n📸 Instagram: ${CLINIC.instagram}\n\n_Send *0* to go back_`;
      break;

    default:
      return { handled: false };
  }

  clearMenuState(remoteJid);
  await sendMessage(instance, remoteJid, msg);
  await logOutgoing(phone, msg, userId, 'patient', 'clinic_info', option.action);
  return { handled: true };
}
