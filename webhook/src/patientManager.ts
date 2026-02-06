import { getClient } from './scheduleManager';
import { PatientAppointment, TypeOption, ProviderOption, DateOption, TimeSlotOption, Language } from './types';
import { TYPE_LABELS } from './whatsappResponder';

// Appointment type durations (minutes)
const TYPE_DURATIONS: Record<string, number> = {
  initial_consultation: 60,
  follow_up: 30,
  hormone_check: 45,
  lab_review: 20,
  nutrition: 45,
  health_coaching: 30,
  therapy: 50,
  personal_training: 60,
};

// All appointment types
const ALL_TYPES = Object.keys(TYPE_DURATIONS);

/**
 * Gets upcoming (future, non-cancelled) appointments for a patient.
 */
export async function getUpcomingAppointments(patientId: string): Promise<PatientAppointment[]> {
  const client = getClient();
  const now = new Date().toISOString();

  const { data, error } = await client
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      type,
      status,
      duration,
      provider:providers!appointments_provider_id_fkey(
        profile:profiles!providers_user_id_fkey(first_name, last_name)
      )
    `)
    .eq('patient_id', patientId)
    .gte('scheduled_at', now)
    .not('status', 'in', '("cancelled","no_show")')
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('[PatientManager] Error fetching appointments:', error);
    return [];
  }

  return (data || []).map((apt: any) => {
    const providerProfile = apt.provider?.profile;
    const profile = Array.isArray(providerProfile) ? providerProfile[0] : providerProfile;
    return {
      id: apt.id,
      scheduled_at: apt.scheduled_at,
      type: apt.type,
      status: apt.status,
      duration: apt.duration,
      provider_name: profile ? `${profile.first_name} ${profile.last_name}` : 'N/A',
    };
  });
}

/**
 * Gets active providers with their specialties.
 */
export async function getActiveProviders(): Promise<ProviderOption[]> {
  const client = getClient();

  const { data, error } = await client
    .from('providers')
    .select(`
      id,
      specialty,
      profile:profiles!providers_user_id_fkey(first_name, last_name)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[PatientManager] Error fetching providers:', error);
    return [];
  }

  return (data || []).map((p: any) => {
    const profile = Array.isArray(p.profile) ? p.profile[0] : p.profile;
    return {
      id: p.id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : 'N/A',
      specialty: p.specialty || '',
    };
  });
}

/**
 * Gets the next dates with available slots for a provider + appointment type.
 * Returns up to `limit` dates.
 */
export async function getAvailableDates(
  providerId: string,
  appointmentType: string,
  limit: number = 5
): Promise<DateOption[]> {
  const client = getClient();
  const results: DateOption[] = [];

  // Check the next 30 days for available slots
  const today = new Date();
  for (let i = 1; i <= 30 && results.length < limit; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = formatDateISO(date);

    const { data, error } = await client.rpc('get_available_slots', {
      p_provider_id: providerId,
      p_date: dateStr,
      p_appointment_type: appointmentType,
    });

    if (error) {
      console.error(`[PatientManager] Error fetching slots for ${dateStr}:`, error);
      continue;
    }

    const availableSlots = (data || []).filter((s: any) => s.available);
    if (availableSlots.length > 0) {
      results.push({ date, slotCount: availableSlots.length });
    }
  }

  return results;
}

/**
 * Gets available time slots for a specific date + provider + type.
 */
export async function getAvailableTimeSlots(
  providerId: string,
  date: Date,
  appointmentType: string
): Promise<TimeSlotOption[]> {
  const client = getClient();
  const dateStr = formatDateISO(date);

  const { data, error } = await client.rpc('get_available_slots', {
    p_provider_id: providerId,
    p_date: dateStr,
    p_appointment_type: appointmentType,
  });

  if (error) {
    console.error('[PatientManager] Error fetching time slots:', error);
    return [];
  }

  return (data || [])
    .filter((s: any) => s.available)
    .map((s: any) => {
      const dt = new Date(s.start_time);
      const hours = dt.getUTCHours().toString().padStart(2, '0');
      const minutes = dt.getUTCMinutes().toString().padStart(2, '0');
      return {
        time: `${hours}:${minutes}`,
        scheduledAt: s.start_time,
      };
    });
}

/**
 * Books an appointment using the create_appointment RPC.
 */
export async function bookAppointment(
  patientId: string,
  providerId: string,
  appointmentType: string,
  scheduledAt: string
): Promise<{ success: boolean; error?: string }> {
  const client = getClient();

  const { data, error } = await client.rpc('create_appointment', {
    p_patient_id: patientId,
    p_provider_id: providerId,
    p_type: appointmentType,
    p_scheduled_at: scheduledAt,
    p_notes: 'Agendado via WhatsApp',
  });

  if (error) {
    console.error('[PatientManager] Error booking appointment:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Cancels an appointment.
 */
export async function cancelAppointment(
  appointmentId: string,
  reason: string
): Promise<boolean> {
  const client = getClient();

  const { error } = await client
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || 'Cancelado via WhatsApp',
    })
    .eq('id', appointmentId);

  if (error) {
    console.error('[PatientManager] Error cancelling appointment:', error);
    return false;
  }

  return true;
}

/**
 * Confirms a pending appointment.
 */
export async function confirmAppointment(appointmentId: string): Promise<boolean> {
  const client = getClient();

  const { error } = await client
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', appointmentId)
    .eq('status', 'pending');

  if (error) {
    console.error('[PatientManager] Error confirming appointment:', error);
    return false;
  }

  return true;
}

/**
 * Gets appointment types the patient is eligible for.
 * Uses check_patient_eligibility RPC for each type.
 */
export async function getEligibleTypes(
  patientId: string,
  patientType: string,
  lang: Language
): Promise<TypeOption[]> {
  const client = getClient();
  const eligible: TypeOption[] = [];

  for (const type of ALL_TYPES) {
    const { data, error } = await client.rpc('check_patient_eligibility', {
      p_patient_id: patientId,
      p_appointment_type: type,
    });

    if (error) {
      console.error(`[PatientManager] Eligibility check error for ${type}:`, error);
      continue;
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data;
    if (result?.eligible) {
      eligible.push({
        key: type,
        label: TYPE_LABELS[type]?.[lang] || type,
        duration: TYPE_DURATIONS[type] || 30,
      });
    }
  }

  return eligible;
}

/**
 * Gets the next upcoming confirmed appointment for a patient within the next 48 hours.
 * Used for quick "OK" confirmation responses.
 */
export async function getNextConfirmedAppointment(patientId: string): Promise<PatientAppointment | null> {
  const client = getClient();
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data, error } = await client
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      type,
      status,
      duration,
      provider:providers!appointments_provider_id_fkey(
        profile:profiles!providers_user_id_fkey(first_name, last_name)
      )
    `)
    .eq('patient_id', patientId)
    .eq('status', 'confirmed')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', in48h.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const apt = data[0] as any;
  const providerProfile = apt.provider?.profile;
  const profile = Array.isArray(providerProfile) ? providerProfile[0] : providerProfile;

  return {
    id: apt.id,
    scheduled_at: apt.scheduled_at,
    type: apt.type,
    status: apt.status,
    duration: apt.duration,
    provider_name: profile ? `${profile.first_name} ${profile.last_name}` : 'N/A',
  };
}

/**
 * Records that a patient confirmed attendance via WhatsApp.
 */
export async function recordPatientConfirmation(appointmentId: string): Promise<boolean> {
  const client = getClient();

  const { error } = await client
    .from('appointments')
    .update({ confirmed_by_patient_at: new Date().toISOString() })
    .eq('id', appointmentId);

  if (error) {
    console.error('[PatientManager] Error recording patient confirmation:', error);
    return false;
  }

  return true;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}
