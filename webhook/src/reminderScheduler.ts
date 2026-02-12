import cron from 'node-cron';
import { getClient } from './scheduleManager';
import { sendReminder, sendNoShowNotification } from './reminderSender';
import { processRetries } from './retrySender';
import { processStaleHandoffs } from './handoffManager';
import { config } from './config';
import { Language } from './types';

interface NotificationRule {
  id: string;
  target_role: 'patient' | 'provider';
  provider_id: string | null;
  minutes_before: number;
  template_name: string;
}

interface AppointmentRow {
  id: string;
  scheduled_at: string;
  type: string;
  patient_id: string;
  provider_id: string;
  patient: {
    first_name: string;
    last_name: string;
    phone: string | null;
    preferred_language: string | null;
  };
  provider: {
    id: string;
    user_id: string;
    provider_profile: {
      first_name: string;
      last_name: string;
      phone: string | null;
      preferred_language: string | null;
    };
  };
}

const CRON_INTERVAL = 5; // minutes

/**
 * Gets the effective rules for a given provider.
 * Provider-specific rules override global rules for the same minutes_before.
 */
function getEffectiveProviderRules(
  globalRules: NotificationRule[],
  providerId: string,
  specificRules: NotificationRule[]
): NotificationRule[] {
  // Provider-specific rules for this provider
  const providerSpecific = specificRules.filter(r => r.provider_id === providerId);

  // Minutes covered by specific rules
  const coveredMinutes = new Set(providerSpecific.map(r => r.minutes_before));

  // Global rules that are NOT overridden
  const applicableGlobal = globalRules.filter(r => !coveredMinutes.has(r.minutes_before));

  return [...providerSpecific, ...applicableGlobal];
}

/**
 * Main processing loop: finds appointments matching active rules and sends reminders.
 */
async function processReminders(): Promise<void> {
  const client = getClient();

  // 1. Fetch all active notification rules
  const { data: rules, error: rulesErr } = await client
    .from('notification_rules')
    .select('id, target_role, provider_id, minutes_before, template_name')
    .eq('is_active', true);

  if (rulesErr || !rules || rules.length === 0) {
    if (rulesErr) console.error('[Reminder] Error fetching rules:', rulesErr);
    return;
  }

  // Separate rules by type
  const patientGlobalRules = rules.filter(r => r.target_role === 'patient' && !r.provider_id) as NotificationRule[];
  const providerGlobalRules = rules.filter(r => r.target_role === 'provider' && !r.provider_id) as NotificationRule[];
  const providerSpecificRules = rules.filter(r => r.target_role === 'provider' && r.provider_id) as NotificationRule[];

  // Collect all unique minutes_before values to query appointments efficiently
  const allMinutesBefore = [...new Set(rules.map(r => r.minutes_before))];

  const now = new Date();
  let totalSent = 0;

  for (const minutesBefore of allMinutesBefore) {
    // Calculate the time window: appointments scheduled around (now + minutesBefore)
    // Window is +/- half the cron interval to ensure we catch every appointment exactly once
    const halfWindow = CRON_INTERVAL / 2;
    const windowStart = new Date(now.getTime() + (minutesBefore - halfWindow) * 60_000);
    const windowEnd = new Date(now.getTime() + (minutesBefore + halfWindow) * 60_000);

    // 2. Fetch confirmed appointments in this window
    const { data: appointments, error: aptErr } = await client
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        type,
        patient_id,
        provider_id,
        patient:profiles!appointments_patient_id_fkey(
          first_name,
          last_name,
          phone,
          preferred_language
        ),
        provider:providers!appointments_provider_id_fkey(
          id,
          user_id,
          provider_profile:profiles!providers_user_id_fkey(
            first_name,
            last_name,
            phone,
            preferred_language
          )
        )
      `)
      .eq('status', 'confirmed')
      .gte('scheduled_at', windowStart.toISOString())
      .lt('scheduled_at', windowEnd.toISOString());

    if (aptErr) {
      console.error(`[Reminder] Error fetching appointments (${minutesBefore}min):`, aptErr);
      continue;
    }

    if (!appointments || appointments.length === 0) continue;

    // 3. Process each appointment
    for (const apt of appointments) {
      const patient = Array.isArray(apt.patient) ? apt.patient[0] : apt.patient;
      const provider = Array.isArray(apt.provider) ? apt.provider[0] : apt.provider;

      if (!patient || !provider) continue;

      const providerProfile = Array.isArray(provider.provider_profile)
        ? provider.provider_profile[0]
        : provider.provider_profile;

      if (!providerProfile) continue;

      const appointmentData = {
        id: apt.id,
        scheduled_at: apt.scheduled_at,
        type: apt.type,
        patient_id: apt.patient_id,
        provider_id: apt.provider_id,
        patient_first_name: patient.first_name,
        patient_last_name: patient.last_name,
        patient_phone: patient.phone,
        patient_language: (patient.preferred_language === 'en' ? 'en' : 'pt') as Language,
        provider_first_name: providerProfile.first_name,
        provider_last_name: providerProfile.last_name,
        provider_phone: providerProfile.phone,
        provider_language: (providerProfile.preferred_language === 'en' ? 'en' : 'pt') as Language,
      };

      // Patient rules for this minutes_before
      const patientRulesForMinutes = patientGlobalRules.filter(r => r.minutes_before === minutesBefore);
      for (const rule of patientRulesForMinutes) {
        try {
          const sent = await sendReminder(appointmentData, rule);
          if (sent) totalSent++;
        } catch (err) {
          console.error(`[Reminder] Error sending patient reminder:`, err);
        }
      }

      // Provider rules for this minutes_before (with override logic)
      const effectiveProviderRules = getEffectiveProviderRules(
        providerGlobalRules,
        apt.provider_id,
        providerSpecificRules
      );
      const providerRulesForMinutes = effectiveProviderRules.filter(r => r.minutes_before === minutesBefore);

      for (const rule of providerRulesForMinutes) {
        try {
          const sent = await sendReminder(appointmentData, rule);
          if (sent) totalSent++;
        } catch (err) {
          console.error(`[Reminder] Error sending provider reminder:`, err);
        }
      }
    }
  }

  if (totalSent > 0) {
    console.log(`[Reminder] Processed: ${totalSent} reminder(s) sent`);
  }
}

/**
 * Detects and processes no-shows: appointments that are confirmed/checked_in
 * but whose scheduled time + duration + grace period has passed.
 */
async function processNoShows(): Promise<void> {
  const client = getClient();
  const GRACE_MINUTES = 30; // 30 min after scheduled end

  // Find appointments that should have ended by now (scheduled_at + duration + grace)
  // Status must be confirmed or checked_in (not yet marked as completed or no_show)
  const { data: appointments, error } = await client
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      duration,
      type,
      patient_id,
      provider_id,
      patient:profiles!appointments_patient_id_fkey(
        first_name,
        last_name,
        phone,
        preferred_language
      ),
      provider:providers!appointments_provider_id_fkey(
        id,
        user_id,
        provider_profile:profiles!providers_user_id_fkey(
          first_name,
          last_name,
          phone,
          preferred_language
        )
      )
    `)
    .in('status', ['confirmed', 'checked_in']);

  if (error) {
    console.error('[NoShow] Error fetching appointments:', error);
    return;
  }

  if (!appointments || appointments.length === 0) return;

  const now = Date.now();
  let markedCount = 0;

  for (const apt of appointments) {
    const scheduledAt = new Date(apt.scheduled_at).getTime();
    const endTime = scheduledAt + (apt.duration || 30) * 60_000;
    const graceEnd = endTime + GRACE_MINUTES * 60_000;

    // Only mark as no_show if we're past the grace period
    if (now < graceEnd) continue;

    // Mark as no_show
    const { error: updateErr } = await client
      .from('appointments')
      .update({ status: 'no_show' })
      .eq('id', apt.id);

    if (updateErr) {
      console.error(`[NoShow] Error marking appointment ${apt.id}:`, updateErr);
      continue;
    }

    markedCount++;

    // Prepare notification data
    const patient = Array.isArray(apt.patient) ? apt.patient[0] : apt.patient;
    const provider = Array.isArray(apt.provider) ? apt.provider[0] : apt.provider;
    if (!patient || !provider) continue;

    const providerProfile = Array.isArray(provider.provider_profile)
      ? provider.provider_profile[0]
      : provider.provider_profile;
    if (!providerProfile) continue;

    const scheduledDate = new Date(apt.scheduled_at);
    const link = `${config.panelBaseUrl}/appointments/new`;

    try {
      await sendNoShowNotification({
        appointmentId: apt.id,
        scheduledAt: apt.scheduled_at,
        type: apt.type,
        patientId: apt.patient_id,
        providerId: apt.provider_id,
        patientFirstName: patient.first_name,
        patientLastName: patient.last_name,
        patientPhone: patient.phone,
        patientLanguage: (patient.preferred_language === 'en' ? 'en' : 'pt') as Language,
        providerFirstName: providerProfile.first_name,
        providerLastName: providerProfile.last_name,
        providerPhone: providerProfile.phone,
        providerLanguage: (providerProfile.preferred_language === 'en' ? 'en' : 'pt') as Language,
        link,
      });
    } catch (err) {
      console.error(`[NoShow] Error sending notification for ${apt.id}:`, err);
    }
  }

  if (markedCount > 0) {
    console.log(`[NoShow] Marked ${markedCount} appointment(s) as no-show`);
  }
}

/**
 * Starts the reminder scheduler cron job (every 5 minutes).
 */
export function startReminderScheduler(): void {
  // Run every 5 minutes
  cron.schedule(`*/${CRON_INTERVAL} * * * *`, async () => {
    try {
      await processReminders();
      await processNoShows();
      await processRetries();
      await processStaleHandoffs();
    } catch (err) {
      console.error('[Reminder] Scheduler error:', err);
    }
  });

  console.log(`[Reminder] Scheduler started (every ${CRON_INTERVAL} minutes)`);

  // Run once immediately on startup (after a short delay)
  setTimeout(async () => {
    try {
      console.log('[Reminder] Running initial check...');
      await processReminders();
      await processNoShows();
      await processRetries();
      await processStaleHandoffs();
    } catch (err) {
      console.error('[Reminder] Initial check error:', err);
    }
  }, 10_000);
}
