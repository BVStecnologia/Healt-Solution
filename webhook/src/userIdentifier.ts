import { getClient } from './scheduleManager';
import { ProviderInfo, Language } from './types';
import { extractPhoneFromJid, phonesMatch } from './phoneUtils';

export interface UserInfo {
  userId: string;
  role: 'patient' | 'provider' | 'admin';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: Language;
  providerId?: string;
  patientType?: string;
}

/**
 * Identifies any user (patient, provider, or admin) by their phone number.
 * Checks profiles table and enriches with provider info if applicable.
 */
export async function identifyUser(remoteJid: string): Promise<UserInfo | null> {
  const phone = extractPhoneFromJid(remoteJid);
  const client = getClient();

  // Fetch all profiles with phone numbers
  const { data: profiles, error } = await client
    .from('profiles')
    .select('id, email, role, first_name, last_name, phone, patient_type, preferred_language')
    .not('phone', 'is', null);

  if (error || !profiles) {
    console.error('[UserIdentifier] Error fetching profiles:', error);
    return null;
  }

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
      user.patientType = profile.patient_type || 'general';
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

    return user;
  }

  return null;
}

/**
 * Converts a UserInfo to the legacy ProviderInfo format for backwards compatibility.
 */
export function toProviderInfo(user: UserInfo): ProviderInfo {
  return {
    providerId: user.providerId || '',
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    language: user.language,
  };
}
