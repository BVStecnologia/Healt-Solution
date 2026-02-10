import { getClient } from './scheduleManager';

// =============================================
// Message Logger — Logs all chatbot interactions
// to conversation_logs table for debugging
// =============================================

interface LogParams {
  phone: string;
  userId?: string;
  role: string;
  direction: 'in' | 'out';
  messageText: string;
  handler?: string;
  stateStep?: string;
  metadata?: Record<string, any>;
}

/**
 * Logs a message to the conversation_logs table.
 * Non-blocking — errors are caught and logged, never thrown.
 */
async function logMessage(params: LogParams): Promise<void> {
  try {
    const client = getClient();
    const { error } = await client.from('conversation_logs').insert({
      phone: params.phone,
      user_id: params.userId || null,
      role: params.role,
      direction: params.direction,
      message_text: params.messageText.substring(0, 4000), // Truncate very long messages
      handler: params.handler || null,
      state_step: params.stateStep || null,
      metadata: params.metadata || {},
    });

    if (error) {
      console.error('[MessageLogger] Insert error:', error.message);
    }
  } catch (err) {
    console.error('[MessageLogger] Unexpected error:', err);
  }
}

/**
 * Logs an incoming message from a user.
 */
export async function logIncoming(
  phone: string,
  text: string,
  userId?: string,
  role: string = 'unknown',
  handler?: string,
  stateStep?: string
): Promise<void> {
  await logMessage({
    phone,
    userId,
    role,
    direction: 'in',
    messageText: text,
    handler,
    stateStep,
  });
}

/**
 * Logs an outgoing message sent by the bot.
 */
export async function logOutgoing(
  phone: string,
  text: string,
  userId?: string,
  role: string = 'system',
  handler?: string,
  stateStep?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logMessage({
    phone,
    userId,
    role,
    direction: 'out',
    messageText: text,
    handler,
    stateStep,
    metadata,
  });
}
