import express from 'express';
import { config } from './config';
import { EvolutionWebhookPayload } from './types';
import { parseCommand } from './commandParser';
import { getSchedule, createBlock, removeBlocks, generateMagicLink } from './scheduleManager';
import { shortenUrl, resolveCode } from './urlShortener';
import { identifyUser, toProviderInfo } from './userIdentifier';
import { handlePatientMessage } from './patientHandler';
import { startReminderScheduler } from './reminderScheduler';
import {
  sendMessage,
  formatScheduleResponse,
  formatBlockResponse,
  formatUnblockResponse,
  formatHelpResponse,
  formatCommandsResponse,
  formatDateRequiredResponse,
  formatPatientsResponse,
  appendLink,
} from './whatsappResponder';

const app = express();
app.use(express.json({ limit: '5mb' }));

// Log incoming webhook events
app.use((req, _res, next) => {
  const event = req.body?.event || 'N/A';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - event: ${event}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// URL Shortener redirect
app.get('/go/:code', (req, res) => {
  const fullUrl = resolveCode(req.params.code);
  if (fullUrl) {
    console.log(`[Shortener] Redirect: /go/${req.params.code}`);
    return res.redirect(302, fullUrl);
  }
  res.status(404).send('Link expirado ou inválido. Solicite um novo pelo WhatsApp.');
});

/**
 * Generates a magic link, shortens it, and returns the short URL.
 */
async function getShortLink(email: string, redirectPath: string): Promise<string | null> {
  const fullLink = await generateMagicLink(email, redirectPath);
  if (!fullLink) return null;
  return shortenUrl(fullLink);
}

// Webhook endpoint for Evolution API
// Evolution API v2.3+ appends event name to URL when WEBHOOK_BY_EVENTS=true
// e.g. /webhook/messages/messages-upsert, /webhook/messages/chats-update
app.post(`${config.webhookPath}/:eventType?`, async (req, res) => {
  try {
    const payload = req.body as EvolutionWebhookPayload;

    // Only handle message upsert events
    if (payload.event !== 'messages.upsert') {
      return res.sendStatus(200);
    }

    const { data, instance } = payload;

    // Ignore messages from ourselves
    if (data.key.fromMe) {
      return res.sendStatus(200);
    }

    // Extract message text
    const text = data.message?.conversation
      || data.message?.extendedTextMessage?.text
      || '';

    if (!text.trim()) {
      return res.sendStatus(200);
    }

    // Use remoteJidAlt if remoteJid is in LID format (not a phone number)
    const rawJid = data.key.remoteJid;
    const remoteJid = (rawJid.endsWith('@lid') && data.key.remoteJidAlt)
      ? data.key.remoteJidAlt
      : rawJid;

    // Identify user by phone (patient, provider, or admin)
    const user = await identifyUser(remoteJid);
    if (!user) {
      // Unknown number - ignore silently
      return res.sendStatus(200);
    }

    // Route patients to their own handler
    if (user.role === 'patient') {
      console.log(`[Webhook] Patient: ${user.firstName} ${user.lastName} | Message: "${text.trim()}"`);
      await handlePatientMessage(instance, remoteJid, text, user);
      return res.sendStatus(200);
    }

    // Provider/Admin flow (unchanged)
    const provider = toProviderInfo(user);

    // Parse the command
    const command = parseCommand(text);

    // For numbered menu selections, use the provider's language preference
    if (/^\d+$/.test(text.trim())) {
      command.language = provider.language;
    }

    const lang = command.language;

    console.log(`[Webhook] Provider: ${provider.firstName} ${provider.lastName} | Command: ${command.type} | Raw: "${command.raw}"`);

    switch (command.type) {
      case 'schedule': {
        const date = command.date || new Date();
        const { appointments, blocks } = await getSchedule(provider.providerId, date);
        let response = formatScheduleResponse(date, appointments, blocks, lang);
        const link = await getShortLink(provider.email, '/admin/calendar');
        response = appendLink(response, link, lang);
        await sendMessage(instance, remoteJid, response);
        break;
      }

      case 'block': {
        if (!command.date) {
          await sendMessage(instance, remoteJid, formatDateRequiredResponse(lang));
          break;
        }

        const startTime = command.period === 'full_day' ? null : (command.startTime || null);
        const endTime = command.period === 'full_day' ? null : (command.endTime || null);

        const result = await createBlock(
          provider.providerId,
          command.date,
          startTime,
          endTime,
          null
        );

        let response = formatBlockResponse(
          command.date,
          startTime,
          endTime,
          result.conflicts || [],
          lang
        );
        const link = await getShortLink(provider.email, '/admin/calendar');
        response = appendLink(response, link, lang);
        await sendMessage(instance, remoteJid, response);
        break;
      }

      case 'unblock': {
        if (!command.date) {
          await sendMessage(instance, remoteJid, formatDateRequiredResponse(lang));
          break;
        }

        const removedCount = await removeBlocks(provider.providerId, command.date);
        let response = formatUnblockResponse(command.date, removedCount, lang);
        const link = await getShortLink(provider.email, '/admin/calendar');
        response = appendLink(response, link, lang);
        await sendMessage(instance, remoteJid, response);
        break;
      }

      case 'patients': {
        const link = await getShortLink(provider.email, '/admin/patients');
        const response = formatPatientsResponse(link, lang);
        await sendMessage(instance, remoteJid, response);
        break;
      }

      case 'commands': {
        const response = formatCommandsResponse(lang);
        await sendMessage(instance, remoteJid, response);
        break;
      }

      case 'help': {
        const response = formatHelpResponse(lang);
        await sendMessage(instance, remoteJid, response);
        break;
      }

      case 'unknown':
      default: {
        // Unknown command -> send quick menu
        const response = formatHelpResponse(lang);
        await sendMessage(instance, remoteJid, response);
        break;
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Webhook] Error processing message:', error);
    res.sendStatus(200); // Always return 200 to avoid retries
  }
});

// Auto-configure webhook on Evolution API instances
async function setupEvolutionWebhooks(): Promise<void> {
  const webhookUrl = `http://webhook-server:${config.port}${config.webhookPath}`;

  try {
    // Fetch connected instances
    const response = await fetch(`${config.evolutionApiUrl}/instance/fetchInstances`, {
      headers: { 'apikey': config.evolutionApiKey },
    });

    if (!response.ok) {
      console.warn('[Setup] Could not fetch Evolution instances:', response.status);
      return;
    }

    const instances = await response.json() as any[];

    for (const inst of instances) {
      const name = inst.instance?.instanceName || inst.instanceName || inst.name;
      console.log(`[Setup] Found instance: ${name || 'UNKNOWN'}`, JSON.stringify(Object.keys(inst)));
      if (!name) continue;

      try {
        const setResponse = await fetch(`${config.evolutionApiUrl}/webhook/set/${name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.evolutionApiKey,
          },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: webhookUrl,
              webhookByEvents: true,
              events: ['MESSAGES_UPSERT'],
            },
          }),
        });

        if (setResponse.ok) {
          console.log(`[Setup] Webhook configured for instance "${name}"`);
        } else {
          const body = await setResponse.text();
          console.warn(`[Setup] Failed to set webhook for "${name}": ${setResponse.status} - ${body}`);
        }
      } catch (err) {
        console.warn(`[Setup] Error setting webhook for "${name}":`, err);
      }
    }
  } catch (error) {
    console.warn('[Setup] Could not connect to Evolution API (will retry on next startup):', error);
  }
}

// Start server
app.listen(config.port, async () => {
  console.log(`[Webhook Server] Running on port ${config.port}`);
  console.log(`[Webhook Server] Endpoint: ${config.webhookPath}`);
  console.log(`[Webhook Server] Shortener: ${config.shortenerBaseUrl}/go/:code`);

  // Wait a bit for Evolution API to be ready, then configure webhooks
  setTimeout(() => {
    setupEvolutionWebhooks();
  }, 5000);

  // Start reminder scheduler (cron every 5 minutes)
  startReminderScheduler();
});
