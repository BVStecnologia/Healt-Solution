import { config } from './config';
import { getClient } from './scheduleManager';
import { sendMessage, getTypeLabel, formatDateShort } from './whatsappResponder';
import { Language } from './types';

interface AppointmentForReminder {
  id: string;
  scheduled_at: string;
  type: string;
  patient_id: string;
  provider_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string | null;
  patient_language: Language;
  provider_first_name: string;
  provider_last_name: string;
  provider_phone: string | null;
  provider_language: Language;
}

interface NotificationRule {
  id: string;
  target_role: 'patient' | 'provider';
  provider_id: string | null;
  minutes_before: number;
  template_name: string;
}

let cachedInstanceName: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

/**
 * Finds a connected Evolution API instance to send messages through.
 * Caches result for 1 minute to avoid excessive API calls.
 */
async function getConnectedInstance(): Promise<string | null> {
  const now = Date.now();
  if (cachedInstanceName && now - cacheTimestamp < CACHE_TTL) {
    return cachedInstanceName;
  }

  try {
    const response = await fetch(`${config.evolutionApiUrl}/instance/fetchInstances`, {
      headers: { 'apikey': config.evolutionApiKey },
    });

    if (!response.ok) return null;

    const instances = (await response.json()) as any[];

    for (const inst of instances) {
      const name = inst.instance?.instanceName || inst.instanceName || inst.name;
      if (!name) continue;

      // Check connection state
      const stateRes = await fetch(`${config.evolutionApiUrl}/instance/connectionState/${name}`, {
        headers: { 'apikey': config.evolutionApiKey },
      });

      if (stateRes.ok) {
        const state = await stateRes.json() as any;
        if (state.instance?.state === 'open' || state.state === 'open') {
          cachedInstanceName = name;
          cacheTimestamp = now;
          return name;
        }
      }
    }
  } catch (err) {
    console.error('[Reminder] Error finding connected instance:', err);
  }

  cachedInstanceName = null;
  return null;
}

/**
 * Fetches a message template from the database by name and language.
 * Falls back to Portuguese if the requested language is not found.
 */
async function getTemplate(name: string, language: Language): Promise<string | null> {
  const client = getClient();

  const { data, error } = await client
    .from('message_templates')
    .select('content')
    .eq('name', name)
    .eq('language', language)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    // Fallback to Portuguese
    if (language !== 'pt') {
      const { data: fallback } = await client
        .from('message_templates')
        .select('content')
        .eq('name', name)
        .eq('language', 'pt')
        .eq('is_active', true)
        .single();

      return fallback?.content || null;
    }
    return null;
  }

  return data.content;
}

/**
 * Replaces {variable} placeholders in a template with actual values.
 */
function applyVariables(content: string, vars: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Checks if a reminder was already successfully sent for this appointment + template + role.
 * Uses message_logs to prevent duplicate sends. Failed messages are NOT counted (allow retry).
 */
async function wasAlreadySent(
  appointmentId: string,
  templateName: string,
  phone: string
): Promise<boolean> {
  const client = getClient();

  const { count, error } = await client
    .from('message_logs')
    .select('id', { count: 'exact', head: true })
    .eq('appointment_id', appointmentId)
    .eq('template_name', templateName)
    .eq('phone_number', phone)
    .in('status', ['sent', 'delivered', 'read']);

  if (error) {
    console.error('[Reminder] Error checking duplicates:', error);
    return true; // Err on the side of not sending
  }

  return (count || 0) > 0;
}

/**
 * Logs a message to message_logs with the actual send status.
 */
async function logMessage(
  appointmentId: string,
  patientId: string,
  templateName: string,
  phone: string,
  message: string,
  language: Language,
  status: 'sent' | 'failed' = 'sent',
  errorText?: string
): Promise<void> {
  const client = getClient();

  const record: Record<string, any> = {
    appointment_id: appointmentId,
    patient_id: patientId,
    template_name: templateName,
    phone_number: phone,
    message,
    status,
    language,
  };

  if (status === 'sent') {
    record.sent_at = new Date().toISOString();
  } else if (errorText) {
    record.error = errorText;
  }

  const { error } = await client
    .from('message_logs')
    .insert(record);

  if (error) {
    console.error('[Reminder] Error logging message:', error);
  }
}

/**
 * Formats a phone number for WhatsApp (adds country code if needed, appends @s.whatsapp.net).
 */
function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

/**
 * Sends a reminder for a specific appointment + rule combination.
 */
export async function sendReminder(
  appointment: AppointmentForReminder,
  rule: NotificationRule
): Promise<boolean> {
  const isPatient = rule.target_role === 'patient';

  // Determine recipient
  const phone = isPatient ? appointment.patient_phone : appointment.provider_phone;
  const language = isPatient ? appointment.patient_language : appointment.provider_language;

  if (!phone) {
    console.warn(`[Reminder] No phone for ${rule.target_role} (appointment ${appointment.id})`);
    return false;
  }

  // Check if already sent
  const alreadySent = await wasAlreadySent(appointment.id, rule.template_name, phone);
  if (alreadySent) {
    return false; // Skip silently
  }

  // Get template
  const templateContent = await getTemplate(rule.template_name, language);
  if (!templateContent) {
    console.warn(`[Reminder] Template not found: ${rule.template_name} (${language})`);
    return false;
  }

  // Prepare variables
  const scheduledDate = new Date(appointment.scheduled_at);
  const hours = scheduledDate.getUTCHours().toString().padStart(2, '0');
  const minutes = scheduledDate.getUTCMinutes().toString().padStart(2, '0');

  const vars: Record<string, string> = {
    nome: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
    paciente: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
    medico: `${appointment.provider_first_name} ${appointment.provider_last_name}`,
    tipo: getTypeLabel(appointment.type, language),
    data: formatDateShort(scheduledDate, language),
    hora: `${hours}:${minutes}`,
  };

  const message = applyVariables(templateContent, vars);

  // Get connected WhatsApp instance
  const instanceName = await getConnectedInstance();
  if (!instanceName) {
    console.warn('[Reminder] No connected WhatsApp instance, skipping');
    return false;
  }

  // Send
  const remoteJid = formatPhoneForWhatsApp(phone);
  const success = await sendMessage(instanceName, remoteJid, message);

  // Log with actual status
  await logMessage(
    appointment.id,
    appointment.patient_id,
    rule.template_name,
    phone,
    message,
    language,
    success ? 'sent' : 'failed',
    success ? undefined : 'Evolution API send failed'
  );

  const recipientName = isPatient
    ? `${appointment.patient_first_name} ${appointment.patient_last_name}`
    : `Dr. ${appointment.provider_first_name} ${appointment.provider_last_name}`;

  if (success) {
    console.log(`[Reminder] Sent "${rule.template_name}" to ${recipientName} (${phone})`);
  } else {
    console.error(`[Reminder] FAILED "${rule.template_name}" to ${recipientName} (${phone})`);
  }

  return success;
}

// ============================================
// No-Show Notifications
// ============================================

interface NoShowData {
  appointmentId: string;
  scheduledAt: string;
  type: string;
  patientId: string;
  providerId: string;
  patientFirstName: string;
  patientLastName: string;
  patientPhone: string | null;
  patientLanguage: Language;
  providerFirstName: string;
  providerLastName: string;
  providerPhone: string | null;
  providerLanguage: Language;
  link: string;
}

/**
 * Sends no-show notifications to both patient and provider.
 */
export async function sendNoShowNotification(data: NoShowData): Promise<void> {
  const instanceName = await getConnectedInstance();
  if (!instanceName) {
    console.warn('[NoShow] No connected WhatsApp instance, skipping notifications');
    return;
  }

  const scheduledDate = new Date(data.scheduledAt);
  const hours = scheduledDate.getUTCHours().toString().padStart(2, '0');
  const minutes = scheduledDate.getUTCMinutes().toString().padStart(2, '0');

  // --- Notify Patient ---
  if (data.patientPhone) {
    const alreadySentPatient = await wasAlreadySent(data.appointmentId, 'no_show_patient', data.patientPhone);
    if (!alreadySentPatient) {
      const template = await getTemplate('no_show_patient', data.patientLanguage);
      if (template) {
        const message = applyVariables(template, {
          nome: `${data.patientFirstName} ${data.patientLastName}`,
          medico: `${data.providerFirstName} ${data.providerLastName}`,
          data: formatDateShort(scheduledDate, data.patientLanguage),
          hora: `${hours}:${minutes}`,
          link: data.link,
        });

        const remoteJid = formatPhoneForWhatsApp(data.patientPhone);
        const success = await sendMessage(instanceName, remoteJid, message);
        await logMessage(data.appointmentId, data.patientId, 'no_show_patient', data.patientPhone, message, data.patientLanguage, success ? 'sent' : 'failed', success ? undefined : 'Evolution API send failed');
        if (success) {
          console.log(`[NoShow] Notified patient ${data.patientFirstName} (${data.patientPhone})`);
        } else {
          console.error(`[NoShow] FAILED to notify patient ${data.patientFirstName} (${data.patientPhone})`);
        }
      }
    }
  }

  // --- Notify Provider ---
  if (data.providerPhone) {
    const alreadySentProvider = await wasAlreadySent(data.appointmentId, 'no_show_provider', data.providerPhone);
    if (!alreadySentProvider) {
      const template = await getTemplate('no_show_provider', data.providerLanguage);
      if (template) {
        const message = applyVariables(template, {
          medico: `${data.providerFirstName} ${data.providerLastName}`,
          paciente: `${data.patientFirstName} ${data.patientLastName}`,
          tipo: getTypeLabel(data.type, data.providerLanguage),
          data: formatDateShort(scheduledDate, data.providerLanguage),
          hora: `${hours}:${minutes}`,
        });

        const remoteJid = formatPhoneForWhatsApp(data.providerPhone);
        const success = await sendMessage(instanceName, remoteJid, message);
        await logMessage(data.appointmentId, data.patientId, 'no_show_provider', data.providerPhone, message, data.providerLanguage, success ? 'sent' : 'failed', success ? undefined : 'Evolution API send failed');
        if (success) {
          console.log(`[NoShow] Notified provider Dr. ${data.providerFirstName} (${data.providerPhone})`);
        } else {
          console.error(`[NoShow] FAILED to notify provider Dr. ${data.providerFirstName} (${data.providerPhone})`);
        }
      }
    }
  }
}
