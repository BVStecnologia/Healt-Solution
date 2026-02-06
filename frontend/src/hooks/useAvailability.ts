import { useState, useCallback } from 'react';
import { callRPC } from '../lib/supabaseClient';
import type { TimeSlot, AppointmentType } from '../types/database';

interface UseAvailabilityReturn {
  slots: TimeSlot[];
  loading: boolean;
  error: Error | null;
  fetchSlots: (providerId: string, date: string, type: AppointmentType) => Promise<void>;
  clearSlots: () => void;
}

export const useAvailability = (): UseAvailabilityReturn => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSlots = useCallback(async (
    providerId: string,
    date: string,
    type: AppointmentType
  ) => {
    try {
      setLoading(true);
      setError(null);

      const data = await callRPC<any[]>('get_available_slots', {
        p_provider_id: providerId,
        p_date: date,
        p_appointment_type: type,
      });

      const mapped: TimeSlot[] = (data || []).map(slot => ({
        start: slot.start_time || slot.start,
        end: slot.end_time || slot.end,
        available: slot.available,
      }));

      setSlots(mapped);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err as Error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSlots = useCallback(() => {
    setSlots([]);
    setError(null);
  }, []);

  return {
    slots,
    loading,
    error,
    fetchSlots,
    clearSlots,
  };
};

export default useAvailability;
