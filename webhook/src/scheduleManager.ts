import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { ProviderInfo, BlockResult, ScheduleEntry } from './types';
import { extractPhoneFromJid, phonesMatch } from './phoneUtils';

let supabase: SupabaseClient;

export function getClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  }
  return supabase;
}

/**
 * Identifies a provider by their phone number.
 * Returns provider info or null if not found.
 */
export async function identifyProvider(remoteJid: string): Promise<ProviderInfo | null> {
  const phone = extractPhoneFromJid(remoteJid);
  const client = getClient();

  // Fetch all providers with their profiles
  const { data: providers, error } = await client
    .from('providers')
    .select(`
      id,
      user_id,
      profile:profiles!providers_user_id_fkey(
        first_name,
        last_name,
        email,
        phone,
        preferred_language
      )
    `)
    .eq('is_active', true);

  if (error || !providers) {
    console.error('Error fetching providers:', error);
    return null;
  }

  for (const provider of providers) {
    const profile = Array.isArray(provider.profile) ? provider.profile[0] : provider.profile;
    if (!profile?.phone) continue;

    if (phonesMatch(phone, profile.phone)) {
      return {
        providerId: provider.id,
        userId: provider.user_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        language: profile.preferred_language === 'en' ? 'en' : 'pt',
      };
    }
  }

  return null;
}

/**
 * Gets the schedule (appointments) for a provider on a given date.
 */
export async function getSchedule(providerId: string, date: Date): Promise<{
  appointments: ScheduleEntry[];
  blocks: { start_time: string | null; end_time: string | null; reason: string | null }[];
}> {
  const client = getClient();
  const dateStr = formatDateISO(date);

  // Fetch appointments for the day
  const { data: appointments, error: aptErr } = await client
    .from('appointments')
    .select(`
      scheduled_at,
      type,
      status,
      duration,
      patient:profiles!appointments_patient_id_fkey(first_name, last_name)
    `)
    .eq('provider_id', providerId)
    .gte('scheduled_at', `${dateStr}T00:00:00`)
    .lt('scheduled_at', `${dateStr}T23:59:59`)
    .not('status', 'in', '("cancelled","no_show")')
    .order('scheduled_at', { ascending: true });

  if (aptErr) {
    console.error('Error fetching appointments:', aptErr);
  }

  // Fetch blocks for the day
  const { data: blocks, error: blockErr } = await client
    .from('provider_blocks')
    .select('start_time, end_time, reason')
    .eq('provider_id', providerId)
    .eq('block_date', dateStr);

  if (blockErr) {
    console.error('Error fetching blocks:', blockErr);
  }

  const entries: ScheduleEntry[] = (appointments || []).map((apt: any) => {
    const scheduledDate = new Date(apt.scheduled_at);
    const hours = scheduledDate.getUTCHours().toString().padStart(2, '0');
    const minutes = scheduledDate.getUTCMinutes().toString().padStart(2, '0');

    return {
      time: `${hours}:${minutes}`,
      patientName: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'N/A',
      type: apt.type,
      status: apt.status,
    };
  });

  return {
    appointments: entries,
    blocks: blocks || [],
  };
}

/**
 * Creates a block for a provider.
 */
export async function createBlock(
  providerId: string,
  date: Date,
  startTime: string | null,
  endTime: string | null,
  reason: string | null
): Promise<BlockResult> {
  const client = getClient();
  const dateStr = formatDateISO(date);

  const { data, error } = await client.rpc('create_provider_block', {
    p_provider_id: providerId,
    p_block_date: dateStr,
    p_start_time: startTime,
    p_end_time: endTime,
    p_reason: reason,
    p_created_via: 'whatsapp',
  });

  if (error) {
    console.error('Error creating block:', error);
    throw new Error(error.message);
  }

  return data as BlockResult;
}

/**
 * Removes all blocks for a provider on a given date.
 */
export async function removeBlocks(providerId: string, date: Date): Promise<number> {
  const client = getClient();
  const dateStr = formatDateISO(date);

  // First get the blocks to count
  const { data: blocks, error: fetchErr } = await client
    .from('provider_blocks')
    .select('id')
    .eq('provider_id', providerId)
    .eq('block_date', dateStr);

  if (fetchErr) {
    console.error('Error fetching blocks:', fetchErr);
    throw new Error(fetchErr.message);
  }

  if (!blocks || blocks.length === 0) {
    return 0;
  }

  // Delete all blocks for this date
  const { error: deleteErr } = await client
    .from('provider_blocks')
    .delete()
    .eq('provider_id', providerId)
    .eq('block_date', dateStr);

  if (deleteErr) {
    console.error('Error deleting blocks:', deleteErr);
    throw new Error(deleteErr.message);
  }

  return blocks.length;
}

/**
 * Generates a magic link for the provider to access the admin panel.
 * Uses Supabase Admin API to create an auth link without sending email.
 * Replaces internal Supabase URL with the public one so the link works on the doctor's phone.
 */
export async function generateMagicLink(email: string, redirectPath: string): Promise<string | null> {
  const client = getClient();

  try {
    const { data, error } = await client.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${config.panelBaseUrl}${redirectPath}`,
      },
    });

    if (error) {
      console.error('Error generating magic link:', error);
      return null;
    }

    let link = data?.properties?.action_link || null;

    // Replace internal Supabase URL with public URL so doctors can open it
    if (link && config.supabasePublicUrl !== config.supabaseUrl) {
      link = link.replace(config.supabaseUrl, config.supabasePublicUrl);
    }

    return link;
  } catch (err) {
    console.error('Error generating magic link:', err);
    return null;
  }
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}
