import { getClient } from './scheduleManager';

export interface HandoffSession {
  id: string;
  patient_phone: string;
  patient_id: string | null;
  patient_name: string | null;
  attendant_id: string | null;
  reason: string | null;
  status: string;
  instance_name: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  last_message_at: string;
}

// In-memory set for O(1) lookup
const activeHandoffs = new Set<string>();

/**
 * Checks if a remoteJid is currently in handoff mode.
 * O(1) lookup — called on every incoming message.
 */
export function isInHandoff(remoteJid: string): boolean {
  return activeHandoffs.has(remoteJid);
}

/**
 * Creates a new handoff session.
 * Inserts into DB and adds to in-memory set.
 */
export async function createHandoff(
  remoteJid: string,
  patientId: string | null,
  patientName: string | null,
  instanceName: string,
  reason: string
): Promise<{ id: string; hasAttendants: boolean }> {
  const client = getClient();

  // Check if already in handoff
  if (activeHandoffs.has(remoteJid)) {
    const { data } = await client
      .from('handoff_sessions')
      .select('id')
      .eq('patient_phone', remoteJid)
      .in('status', ['waiting', 'active'])
      .limit(1)
      .single();

    return { id: data?.id || '', hasAttendants: false };
  }

  const { data, error } = await client
    .from('handoff_sessions')
    .insert({
      patient_phone: remoteJid,
      patient_id: patientId,
      patient_name: patientName,
      reason,
      status: 'waiting',
      instance_name: instanceName,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Handoff] Error creating session:', error);
    throw error;
  }

  activeHandoffs.add(remoteJid);
  console.log(`[Handoff] Created session ${data.id} for ${remoteJid} (reason: ${reason})`);

  return { id: data.id, hasAttendants: true };
}

/**
 * Resolves (closes) a handoff session.
 * Updates DB and removes from in-memory set.
 */
export async function resolveHandoff(
  remoteJid: string,
  resolvedBy: string
): Promise<boolean> {
  const client = getClient();

  const { data, error } = await client
    .from('handoff_sessions')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq('patient_phone', remoteJid)
    .in('status', ['waiting', 'active'])
    .select('id');

  if (error) {
    console.error('[Handoff] Error resolving session:', error);
    return false;
  }

  activeHandoffs.delete(remoteJid);

  if (data && data.length > 0) {
    console.log(`[Handoff] Resolved session(s) for ${remoteJid} by ${resolvedBy}`);
    return true;
  }

  return false;
}

/**
 * Updates the last_message_at timestamp for active handoff.
 * Used to track inactivity for auto-close.
 */
export async function updateLastMessage(remoteJid: string): Promise<void> {
  const client = getClient();

  await client
    .from('handoff_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('patient_phone', remoteJid)
    .in('status', ['waiting', 'active']);
}

/**
 * Loads active handoff sessions from DB into in-memory set.
 * Called on server startup to restore state.
 */
export async function loadActiveHandoffs(): Promise<void> {
  const client = getClient();

  const { data, error } = await client
    .from('handoff_sessions')
    .select('patient_phone')
    .in('status', ['waiting', 'active']);

  if (error) {
    console.error('[Handoff] Error loading active sessions:', error);
    return;
  }

  activeHandoffs.clear();
  if (data) {
    for (const session of data) {
      activeHandoffs.add(session.patient_phone);
    }
  }

  console.log(`[Handoff] Loaded ${activeHandoffs.size} active session(s)`);
}

/**
 * Auto-closes stale handoff sessions (no activity for 30+ minutes).
 * Called by the cron job.
 */
export async function processStaleHandoffs(): Promise<number> {
  const client = getClient();
  const STALE_MINUTES = 30;
  const cutoff = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();

  const { data, error } = await client
    .from('handoff_sessions')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: 'auto_timeout',
    })
    .in('status', ['waiting', 'active'])
    .lt('last_message_at', cutoff)
    .select('patient_phone');

  if (error) {
    console.error('[Handoff] Error processing stale sessions:', error);
    return 0;
  }

  if (data && data.length > 0) {
    for (const session of data) {
      activeHandoffs.delete(session.patient_phone);
    }
    console.log(`[Handoff] Auto-closed ${data.length} stale session(s)`);
  }

  // Sync in-memory set with DB (picks up admin panel resolutions)
  await loadActiveHandoffs();

  return data?.length || 0;
}

/**
 * Returns all active/waiting handoff sessions for the admin panel.
 */
export async function getActiveHandoffSessions(): Promise<HandoffSession[]> {
  const client = getClient();

  const { data, error } = await client
    .from('handoff_sessions')
    .select('*')
    .in('status', ['waiting', 'active'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Handoff] Error fetching active sessions:', error);
    return [];
  }

  return (data || []) as HandoffSession[];
}

/**
 * Resolves a handoff session by its ID (for admin panel).
 */
export async function resolveHandoffById(
  sessionId: string,
  resolvedBy: string
): Promise<boolean> {
  const client = getClient();

  const { data, error } = await client
    .from('handoff_sessions')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq('id', sessionId)
    .in('status', ['waiting', 'active'])
    .select('patient_phone');

  if (error) {
    console.error('[Handoff] Error resolving session by ID:', error);
    return false;
  }

  if (data && data.length > 0) {
    activeHandoffs.delete(data[0].patient_phone);
    console.log(`[Handoff] Resolved session ${sessionId} by ${resolvedBy}`);
    return true;
  }

  return false;
}
