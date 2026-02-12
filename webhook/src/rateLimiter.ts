// =============================================
// Rate Limiter — In-memory sliding window
// Prevents abuse by limiting messages per phone
// =============================================

const MAX_MESSAGES = 20;
const WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

const windows = new Map<string, number[]>();
const warned = new Set<string>();

export type RateLimitResult = 'allowed' | 'warn' | 'blocked';

/**
 * Checks if a phone number is within rate limits.
 * - 'allowed': under limit
 * - 'warn': first time exceeding (send warning message)
 * - 'blocked': already warned, silently drop
 */
export function checkRateLimit(phone: string): RateLimitResult {
  const now = Date.now();
  const timestamps = windows.get(phone) || [];

  // Remove entries outside the sliding window
  const recent = timestamps.filter(t => now - t < WINDOW_MS);
  recent.push(now);
  windows.set(phone, recent);

  if (recent.length <= MAX_MESSAGES) {
    // Under limit — clear warned flag if it was set
    warned.delete(phone);
    return 'allowed';
  }

  if (!warned.has(phone)) {
    warned.add(phone);
    return 'warn';
  }

  return 'blocked';
}

/**
 * Formats a rate limit warning message.
 */
export function formatRateLimitWarning(lang: 'pt' | 'en'): string {
  return lang === 'pt'
    ? '⚠️ Muitas mensagens em pouco tempo. Aguarde um momento antes de tentar novamente.'
    : '⚠️ Too many messages in a short time. Please wait a moment before trying again.';
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, timestamps] of windows.entries()) {
    const recent = timestamps.filter(t => now - t < WINDOW_MS);
    if (recent.length === 0) {
      windows.delete(phone);
      warned.delete(phone);
    } else {
      windows.set(phone, recent);
    }
  }
}, CLEANUP_INTERVAL);
