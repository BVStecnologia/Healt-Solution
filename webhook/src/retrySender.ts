import { getClient } from './scheduleManager';
import { sendMessage } from './whatsappResponder';
import { config } from './config';

const MAX_RETRIES = 3;
const RETRY_DELAY_MINUTES = 5; // Min delay between retries

interface FailedMessage {
  id: string;
  phone_number: string;
  message: string;
  retry_count: number;
}

/**
 * Finds a connected Evolution API instance (same logic as reminderSender).
 */
async function getConnectedInstance(): Promise<string | null> {
  try {
    const response = await fetch(`${config.evolutionApiUrl}/instance/fetchInstances`, {
      headers: { 'apikey': config.evolutionApiKey },
    });

    if (!response.ok) return null;

    const instances = (await response.json()) as any[];

    for (const inst of instances) {
      const name = inst.instance?.instanceName || inst.instanceName || inst.name;
      if (!name) continue;

      const stateRes = await fetch(`${config.evolutionApiUrl}/instance/connectionState/${name}`, {
        headers: { 'apikey': config.evolutionApiKey },
      });

      if (stateRes.ok) {
        const state = await stateRes.json() as any;
        if (state.instance?.state === 'open' || state.state === 'open') {
          return name;
        }
      }
    }
  } catch (err) {
    console.error('[Retry] Error finding connected instance:', err);
  }

  return null;
}

/**
 * Formats a phone number for WhatsApp.
 */
function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

/**
 * Processes failed messages: retries sending up to MAX_RETRIES times.
 * Called from the cron scheduler.
 */
export async function processRetries(): Promise<void> {
  const client = getClient();

  // Fetch failed messages eligible for retry
  const { data: failedMessages, error } = await client
    .from('message_logs')
    .select('id, phone_number, message, retry_count')
    .eq('status', 'failed')
    .lt('retry_count', MAX_RETRIES)
    .order('created_at', { ascending: true })
    .limit(10); // Process max 10 per cycle to avoid overload

  if (error) {
    console.error('[Retry] Error fetching failed messages:', error);
    return;
  }

  if (!failedMessages || failedMessages.length === 0) return;

  // Check WhatsApp connection
  const instanceName = await getConnectedInstance();
  if (!instanceName) {
    console.warn('[Retry] No connected WhatsApp instance, skipping retries');
    return;
  }

  let retried = 0;
  let succeeded = 0;

  for (const msg of failedMessages as FailedMessage[]) {
    try {
      const remoteJid = formatPhoneForWhatsApp(msg.phone_number);
      const success = await sendMessage(instanceName, remoteJid, msg.message);

      const newRetryCount = msg.retry_count + 1;

      if (success) {
        // Update to sent
        await client
          .from('message_logs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            retry_count: newRetryCount,
            last_retry_at: new Date().toISOString(),
            error: null,
          })
          .eq('id', msg.id);

        succeeded++;
      } else {
        // Update retry count
        await client
          .from('message_logs')
          .update({
            retry_count: newRetryCount,
            last_retry_at: new Date().toISOString(),
            error: `Retry ${newRetryCount}/${MAX_RETRIES} failed`,
          })
          .eq('id', msg.id);
      }

      retried++;
    } catch (err) {
      console.error(`[Retry] Error retrying message ${msg.id}:`, err);
    }
  }

  if (retried > 0) {
    console.log(`[Retry] Processed ${retried} message(s): ${succeeded} succeeded, ${retried - succeeded} still failing`);
  }
}
