import { useState, useEffect, useCallback } from 'react';
import { supabase, callRPC } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { Appointment, AppointmentStatus, CreateAppointmentDTO } from '../types/database';

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createAppointment: (data: CreateAppointmentDTO) => Promise<Appointment>;
  cancelAppointment: (id: string, reason: string) => Promise<void>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
}

export const useAppointments = (): UseAppointmentsReturn => {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query com joins para provider e patient
      let query = supabase
        .from('appointments')
        .select(`
          *,
          provider:providers(
            *,
            profile:profiles(*)
          )
        `)
        .order('scheduled_at', { ascending: true });

      // Filtrar baseado no role
      if (profile?.role === 'patient') {
        query = query.eq('patient_id', user.id);
      } else if (profile?.role === 'provider') {
        // Buscar o provider_id do usuário
        const { data: providerData } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (providerData) {
          query = query.eq('provider_id', providerData.id);
        }
      }
      // Admin vê tudo (sem filtro adicional)

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Criar agendamento
  const createAppointment = async (data: CreateAppointmentDTO): Promise<Appointment> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const result = await callRPC<Appointment>('create_appointment', {
        p_patient_id: user.id,
        p_provider_id: data.provider_id,
        p_type: data.type,
        p_scheduled_at: data.scheduled_at,
        p_notes: data.notes || null,
      });

      // Atualizar lista local
      await fetchAppointments();

      return result;
    } catch (err) {
      console.error('Error creating appointment:', err);
      throw err;
    }
  };

  // Cancelar agendamento
  const cancelAppointment = async (id: string, reason: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Atualizar lista local
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === id
            ? { ...apt, status: 'cancelled' as AppointmentStatus, cancellation_reason: reason }
            : apt
        )
      );
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      throw err;
    }
  };

  // Atualizar status
  const updateStatus = async (id: string, status: AppointmentStatus): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      // Atualizar lista local
      setAppointments(prev =>
        prev.map(apt => (apt.id === id ? { ...apt, status } : apt))
      );
    } catch (err) {
      console.error('Error updating appointment status:', err);
      throw err;
    }
  };

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
    createAppointment,
    cancelAppointment,
    updateStatus,
  };
};

export default useAppointments;
