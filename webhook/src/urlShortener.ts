import crypto from 'crypto';
import { config } from './config';

// In-memory store: code -> full URL
// Magic links expire anyway, so in-memory is fine
const store = new Map<string, string>();

function generateCode(): string {
  return crypto.randomBytes(4).toString('base64url').slice(0, 6);
}

/**
 * Creates a short URL for a full magic link.
 * Auto-expires after 1 hour.
 */
export function shortenUrl(fullUrl: string): string {
  const code = generateCode();
  store.set(code, fullUrl);

  // Auto-expire after 1 hour
  setTimeout(() => store.delete(code), 3600000);

  return `${config.shortenerBaseUrl}/go/${code}`;
}

/**
 * Resolves a short code to the full URL.
 * Returns null if expired or not found.
 */
export function resolveCode(code: string): string | null {
  return store.get(code) || null;
}
