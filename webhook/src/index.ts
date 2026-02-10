import express from 'express';
import { config } from './config';
import { EvolutionWebhookPayload } from './types';
import { parseCommand } from './commandParser';
import { getSchedule, createBlock, removeBlocks, generateMagicLink } from './scheduleManager';
import { shortenUrl, resolveCode } from './urlShortener';
import { toProviderInfo } from './userIdentifier';
import { handlePatientMessage } from './patientHandler';
import { startReminderScheduler } from './reminderScheduler';
import { refreshCache } from './treatmentCache';
import { logIncoming, logOutgoing } from './messageLogger';
import {
  identifyAllRoles,
  showRoleSelectionMenu,
  handleRoleSelection,
  getSelectedRole,
  clearSelectedRole,
} from './router';
import { clearAllState } from './stateManager';
import { extractPhoneFromJid } from './phoneUtils';
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

    const phone = extractPhoneFromJid(remoteJid);
    const input = text.trim();
    const lower = input.toLowerCase();

    // ========================================
    // DUAL-ROLE ROUTING
    // ========================================

    // Check if user wants to switch roles (typed "trocar", "switch", "mudar")
    const SWITCH_WORDS = ['trocar', 'switch', 'mudar', 'change'];
    if (SWITCH_WORDS.includes(lower)) {
      clearSelectedRole(remoteJid);
      clearAllState(remoteJid);
      // Fall through to re-identify and show role menu if dual-role
    }

    // Check for pending role selection
    const roleResult = handleRoleSelection(remoteJid, input);
    if (roleResult) {
      const roles = await identifyAllRoles(remoteJid);
      if (roleResult.role === 'patient') {
        const patientProfile = roles.find(u => u.role === 'patient');
        if (patientProfile) {
          console.log(`[Webhook] Dual-role → Patient: ${patientProfile.firstName} ${patientProfile.lastName}`);
          await handlePatientMessage(instance, remoteJid, 'menu', patientProfile);
          return res.sendStatus(200);
        }
      } else {
        const providerProfile = roles.find(u => u.role === 'provider' || u.role === 'admin');
        if (providerProfile) {
          console.log(`[Webhook] Dual-role → Provider: ${providerProfile.firstName} ${providerProfile.lastName}`);
          const response = formatHelpResponse(providerProfile.language);
          await sendMessage(instance, remoteJid, response);
          return res.sendStatus(200);
        }
      }
    }

    // Identify all roles for this phone number
    const allRoles = await identifyAllRoles(remoteJid);

    if (allRoles.length === 0) {
      // Unknown number — ignore silently
      return res.sendStatus(200);
    }

    // Check if dual-role (both patient and provider/admin)
    const hasPatient = allRoles.some(u => u.role === 'patient');
    const hasProvider = allRoles.some(u => u.role === 'provider' || u.role === 'admin');
    const isDualRole = hasPatient && hasProvider;

    let activeUser: typeof allRoles[0];

    if (isDualRole) {
      // Check if role was already selected
      const selectedRole = getSelectedRole(remoteJid);

      if (!selectedRole) {
        // First message from dual-role user — ask which menu
        const firstName = allRoles[0].firstName;
        const lang = allRoles[0].language;
        await showRoleSelectionMenu(instance, remoteJid, firstName, lang);
        logIncoming(phone, input, allRoles[0].userId, 'dual');
        return res.sendStatus(200);
      }

      // Use the selected role
      if (selectedRole === 'patient') {
        activeUser = allRoles.find(u => u.role === 'patient')!;
      } else {
        activeUser = allRoles.find(u => u.role === 'provider' || u.role === 'admin')!;
      }
    } else {
      // Single role — use the first (and only) match
      activeUser = allRoles[0];
    }

    // Route to appropriate handler
    if (activeUser.role === 'patient') {
      console.log(`[Webhook] Patient: ${activeUser.firstName} ${activeUser.lastName} | Message: "${input}"`);
      await handlePatientMessage(instance, remoteJid, text, activeUser);
      return res.sendStatus(200);
    }

    // Provider/Admin flow (unchanged)
    const provider = toProviderInfo(activeUser);
    const command = parseCommand(text);

    // For numbered menu selections, use the provider's language preference
    if (/^\d+$/.test(input)) {
      command.language = provider.language;
    }

    const lang = command.language;

    console.log(`[Webhook] Provider: ${provider.firstName} ${provider.lastName} | Command: ${command.type} | Raw: "${command.raw}"`);
    logIncoming(phone, input, activeUser.userId, activeUser.role);

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

// Start server
app.listen(config.port, async () => {
  console.log(`[Webhook Server] Running on port ${config.port}`);
  console.log(`[Webhook Server] Endpoint: ${config.webhookPath}`);
  console.log(`[Webhook Server] Shortener: ${config.shortenerBaseUrl}/go/:code`);

  // Initialize treatment cache
  console.log('[Webhook Server] Loading treatment cache...');
  await refreshCache();

  // Start reminder scheduler (cron every 5 minutes)
  startReminderScheduler();
});
