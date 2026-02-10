import { getClient } from './scheduleManager';
import { UserInfo, identifyUser } from './userIdentifier';
import { Language } from './types';
import { sendMessage } from './whatsappResponder';
import { logIncoming, logOutgoing } from './messageLogger';
import { buildMenu, MenuOption } from './menuBuilder';
import { setMenuState, getMenuState, clearAllState } from './stateManager';
import { extractPhoneFromJid, phonesMatch } from './phoneUtils';

// =============================================
// Router — Main message router with
// dual-role support and PatientContext
// =============================================

export interface PatientContext {
  upcomingCount: number;
  pendingCount: number;
  cancellableCount: number;
  isAlsoProvider: boolean;
  providerId?: string;
  patientType: string;
}

/**
 * Identifies ALL roles associated with a phone number.
 * A person may have both a patient profile and a provider/admin profile.
 * Returns all matching profiles.
 */
export async function identifyAllRoles(remoteJid: string): Promise<UserInfo[]> {
  const phone = extractPhoneFromJid(remoteJid);
  const client = getClient();

  const { data: profiles, error } = await client
    .from('profiles')
    .select('id, email, role, first_name, last_name, phone, patient_type, preferred_language')
    .not('phone', 'is', null);

  if (error || !profiles) {
    console.error('[Router] Error fetching profiles:', error);
    return [];
  }

  const matches: UserInfo[] = [];

  for (const profile of profiles) {
    if (!profile.phone) continue;
    if (!phonesMatch(phone, profile.phone)) continue;

    const user: UserInfo = {
      userId: profile.id,
      role: profile.role,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      language: profile.preferred_language === 'en' ? 'en' : 'pt',
    };

    if (profile.role === 'patient') {
      user.patientType = profile.patient_type || 'new';
    }

    // If provider or admin, look up provider record
    if (profile.role === 'provider' || profile.role === 'admin') {
      const { data: providerRow } = await client
        .from('providers')
        .select('id')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .single();

      if (providerRow) {
        user.providerId = providerRow.id;
      }
    }

    matches.push(user);
  }

  return matches;
}

/**
 * Loads context about a patient's current state.
 * Used to build dynamic menus.
 */
export async function loadPatientContext(userId: string): Promise<PatientContext> {
  const client = getClient();
  const now = new Date().toISOString();

  // Fetch upcoming appointments in one query
  const { data: appointments } = await client
    .from('appointments')
    .select('id, status')
    .eq('patient_id', userId)
    .gte('scheduled_at', now)
    .not('status', 'in', '("cancelled","no_show")');

  const apts = appointments || [];

  // Check if also a provider
  const { data: provider } = await client
    .from('providers')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  // Get patient type
  const { data: profile } = await client
    .from('profiles')
    .select('patient_type')
    .eq('id', userId)
    .single();

  return {
    upcomingCount: apts.length,
    pendingCount: apts.filter(a => a.status === 'pending').length,
    cancellableCount: apts.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
    isAlsoProvider: !!provider,
    providerId: provider?.id,
    patientType: profile?.patient_type || 'new',
  };
}

// =============================================
// Role Selection State
// =============================================

// Track which role was selected for dual-role users
const selectedRoles = new Map<string, 'patient' | 'provider'>();
const ROLE_TTL = 60 * 60 * 1000; // 1 hour
const roleTimestamps = new Map<string, number>();

export function getSelectedRole(jid: string): 'patient' | 'provider' | undefined {
  const timestamp = roleTimestamps.get(jid);
  if (timestamp && Date.now() - timestamp > ROLE_TTL) {
    selectedRoles.delete(jid);
    roleTimestamps.delete(jid);
    return undefined;
  }
  return selectedRoles.get(jid);
}

export function setSelectedRole(jid: string, role: 'patient' | 'provider'): void {
  selectedRoles.set(jid, role);
  roleTimestamps.set(jid, Date.now());
}

export function clearSelectedRole(jid: string): void {
  selectedRoles.delete(jid);
  roleTimestamps.delete(jid);
}

/**
 * Shows the role selection menu for dual-role users.
 */
export async function showRoleSelectionMenu(
  instance: string,
  remoteJid: string,
  firstName: string,
  lang: Language
): Promise<void> {
  const phone = extractPhoneFromJid(remoteJid);

  const options: MenuOption[] = [
    {
      label: lang === 'pt' ? '🏥 Menu do Paciente' : '🏥 Patient Menu',
      action: 'role_patient',
    },
    {
      label: lang === 'pt' ? '👨‍⚕️ Menu do Médico' : '👨‍⚕️ Provider Menu',
      action: 'role_provider',
    },
  ];

  const header = lang === 'pt'
    ? `🏥 *Essence Medical Clinic*\nOlá, ${firstName}! 👋\n\nVocê tem acesso como paciente e médico.\nQual área deseja acessar?`
    : `🏥 *Essence Medical Clinic*\nHello, ${firstName}! 👋\n\nYou have both patient and provider access.\nWhich area would you like to access?`;

  const optionMap = new Map<number, MenuOption>();
  let text = header + '\n';

  options.forEach((opt, i) => {
    const num = i + 1;
    optionMap.set(num, opt);
    text += `\n*${num}.* ${opt.label}`;
  });

  text += `\n\n_${lang === 'pt' ? 'Responda com o número' : 'Reply with the number'}_`;

  setMenuState(remoteJid, 'role_selection', optionMap);
  await sendMessage(instance, remoteJid, text);
  await logOutgoing(phone, text, undefined, 'system', 'router', 'role_selection');
}

/**
 * Handles role selection input.
 * Returns the selected role or null if not a role selection.
 */
export function handleRoleSelection(
  remoteJid: string,
  input: string
): { role: 'patient' | 'provider' } | null {
  const menuState = getMenuState(remoteJid);
  if (!menuState || menuState.handler !== 'role_selection') return null;

  const idx = parseInt(input, 10);
  if (isNaN(idx) || idx < 1) return null;

  const option = menuState.optionMap.get(idx);
  if (!option) return null;

  if (option.action === 'role_patient') {
    setSelectedRole(remoteJid, 'patient');
    return { role: 'patient' };
  }

  if (option.action === 'role_provider') {
    setSelectedRole(remoteJid, 'provider');
    return { role: 'provider' };
  }

  return null;
}
