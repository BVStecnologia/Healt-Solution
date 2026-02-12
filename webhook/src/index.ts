import express, { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { EvolutionWebhookPayload } from './types';
import { resolveCode } from './urlShortener';
import { handlePatientMessage } from './patientMainMenu';
import { handleProviderMessage } from './providerMainMenu';
import { startReminderScheduler } from './reminderScheduler';
import { refreshCache } from './treatmentCache';
import { logIncoming } from './messageLogger';
import {
  identifyAllRoles,
  showRoleSelectionMenu,
  handleRoleSelection,
  getSelectedRole,
  clearSelectedRole,
} from './router';
import { clearAllState } from './stateManager';
import { extractPhoneFromJid } from './phoneUtils';
import { checkRateLimit, formatRateLimitWarning } from './rateLimiter';
import { sendMessage } from './whatsappResponder';
import {
  isInHandoff,
  updateLastMessage,
  resolveHandoff,
  loadActiveHandoffs,
  getActiveHandoffSessions,
  resolveHandoffById,
} from './handoffManager';
import { formatHandoffResolved } from './patientResponder';
import { getClient } from './scheduleManager';

// ========================================
// GLOBAL ERROR HANDLERS
// ========================================
process.on('uncaughtException', (error: Error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1); // Let Docker restart cleanly
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

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

// Webhook endpoint for Evolution API
// Evolution API v2.3+ appends event name to URL when WEBHOOK_BY_EVENTS=true
app.post(`${config.webhookPath}/:eventType?`, async (req, res) => {
  try {
    // Webhook authentication (skip if no secret configured)
    if (config.webhookSecret) {
      const apikey = req.headers['apikey'] as string;
      if (apikey !== config.webhookSecret) {
        console.warn(`[Webhook] Unauthorized request — invalid or missing apikey header`);
        return res.sendStatus(401);
      }
    }

    const payload = req.body as EvolutionWebhookPayload;

    // Only handle message upsert events
    if (payload.event !== 'messages.upsert') {
      return res.sendStatus(200);
    }

    const { data, instance } = payload;

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
    // HANDOFF: fromMe keyword detection (#fechar/#close)
    // ========================================
    if (data.key.fromMe) {
      if ((lower === '#fechar' || lower === '#close') && isInHandoff(remoteJid)) {
        await resolveHandoff(remoteJid, 'attendant_keyword');
        await sendMessage(instance, remoteJid, formatHandoffResolved('pt'));
        console.log(`[Webhook] Handoff resolved by attendant keyword for ${remoteJid}`);
      }
      return res.sendStatus(200);
    }

    // ========================================
    // RATE LIMITING
    // ========================================
    const rateResult = checkRateLimit(phone);
    if (rateResult === 'blocked') {
      return res.sendStatus(200);
    }
    if (rateResult === 'warn') {
      // Send bilingual warning — we don't know lang yet, send both
      await sendMessage(instance, remoteJid, formatRateLimitWarning('pt'));
      return res.sendStatus(200);
    }

    // ========================================
    // HANDOFF GUARD: if patient is in handoff, bot stays silent
    // Exception: "bot"/"menu" words let patient exit handoff
    // ========================================
    if (isInHandoff(remoteJid)) {
      const BOT_WORDS = ['bot', 'menu'];
      if (BOT_WORDS.includes(lower)) {
        // Patient wants to return to bot — resolve handoff and show menu
        await resolveHandoff(remoteJid, 'patient_return');
        clearAllState(remoteJid);
        // Fall through to normal processing (will show main menu)
      } else {
        // Bot stays silent — attendant handles via WhatsApp Web
        await updateLastMessage(remoteJid);
        return res.sendStatus(200);
      }
    }

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
          await handleProviderMessage(instance, remoteJid, 'menu', providerProfile);
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
    } else {
      // Provider/Admin flow — now uses numbered menus
      console.log(`[Webhook] Provider: ${activeUser.firstName} ${activeUser.lastName} | Message: "${input}"`);
      await handleProviderMessage(instance, remoteJid, text, activeUser);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Webhook] Error processing message:', error);
    res.sendStatus(200); // Always return 200 to avoid retries
  }
});

// ========================================
// API AUTH MIDDLEWARE (protects /api/* routes)
// Validates Supabase JWT from Authorization header
// ========================================
app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const token = authHeader.substring(7);
    const client = getClient();
    const { data: { user }, error } = await client.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify user is admin or provider
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'provider'].includes(profile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  } catch (err) {
    console.error('[API Auth] Error validating token:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
});

// ========================================
// HANDOFF API ROUTES
// ========================================

// List active handoff sessions
app.get('/api/handoff/active', async (_req, res) => {
  try {
    const sessions = await getActiveHandoffSessions();
    res.json(sessions);
  } catch (error) {
    console.error('[API] Error fetching handoff sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Resolve a handoff session by ID (admin action)
app.post('/api/handoff/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const resolved = await resolveHandoffById(id, 'admin_panel');
    if (resolved) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Session not found or already resolved' });
    }
  } catch (error) {
    console.error('[API] Error resolving handoff session:', error);
    res.status(500).json({ error: 'Failed to resolve session' });
  }
});

// ========================================
// EVOLUTION API PROXY (keeps API key server-side)
// ========================================
app.all('/api/evolution/*', async (req, res) => {
  try {
    // Strip the /api/evolution prefix to get the Evolution API path
    const evolutionPath = req.path.replace('/api/evolution', '');
    const targetUrl = `${config.evolutionApiUrl}${evolutionPath}`;

    const headers: Record<string, string> = {
      'apikey': config.evolutionApiKey,
    };
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    res.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.send(data);
  } catch (error) {
    console.error('[Evolution Proxy] Error:', error);
    res.status(502).json({ error: 'Evolution API unavailable' });
  }
});

// ========================================
// EXPRESS ERROR MIDDLEWARE (must be last)
// ========================================
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Express] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, async () => {
  console.log(`[Webhook Server] Running on port ${config.port}`);
  console.log(`[Webhook Server] Endpoint: ${config.webhookPath}`);
  console.log(`[Webhook Server] Shortener: ${config.shortenerBaseUrl}/go/:code`);

  // Initialize treatment cache
  console.log('[Webhook Server] Loading treatment cache...');
  await refreshCache();

  // Load active handoff sessions into memory
  console.log('[Webhook Server] Loading active handoff sessions...');
  await loadActiveHandoffs();

  // Start reminder scheduler (cron every 5 minutes)
  startReminderScheduler();
});
