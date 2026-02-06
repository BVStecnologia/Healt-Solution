import express from 'express';
import { config } from './config';
import { EvolutionWebhookPayload } from './types';
import { parseCommand } from './commandParser';
import { identifyProvider, getSchedule, createBlock, removeBlocks, generateMagicLink } from './scheduleManager';
import {
  sendMessage,
  formatScheduleResponse,
  formatBlockResponse,
  formatUnblockResponse,
  formatHelpResponse,
  formatDateRequiredResponse,
  formatPatientsResponse,
  appendLink,
} from './whatsappResponder';

const app = express();
app.use(express.json());

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

// Webhook endpoint for Evolution API
app.post(config.webhookPath, async (req, res) => {
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

    // Identify provider by phone
    const provider = await identifyProvider(remoteJid);
    if (!provider) {
      // Not a provider - ignore silently
      return res.sendStatus(200);
    }

    // Parse the command
    const command = parseCommand(text);
    const lang = command.language;

    console.log(`[Webhook] Provider: ${provider.firstName} ${provider.lastName} | Command: ${command.type} | Raw: "${command.raw}"`);

    switch (command.type) {
      case 'schedule': {
        const date = command.date || new Date();
        const { appointments, blocks } = await getSchedule(provider.providerId, date);
        let response = formatScheduleResponse(date, appointments, blocks, lang);
        const link = await generateMagicLink(provider.email, '/admin/calendar');
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
        const link = await generateMagicLink(provider.email, '/admin/calendar');
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
        const link = await generateMagicLink(provider.email, '/admin/calendar');
        response = appendLink(response, link, lang);
        await sendMessage(instance, remoteJid, response);
        break;
      }

      case 'patients': {
        const link = await generateMagicLink(provider.email, '/admin/patients');
        const response = formatPatientsResponse(link, lang);
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
        // Unknown command -> send help
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

  // Wait a bit for Evolution API to be ready, then configure webhooks
  setTimeout(() => {
    setupEvolutionWebhooks();
  }, 5000);
});
