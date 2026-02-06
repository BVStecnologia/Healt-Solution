import { useState, useEffect, useCallback } from 'react';
import { supabase, callRPC } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { whatsappService } from '../lib/whatsappService';
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

      // Enviar notificação dupla (paciente + médico) via WhatsApp
      // Fire-and-forget: não bloqueia o fluxo se falhar
      try {
        // Buscar dados do provider para notificação
        const { data: providerData } = await supabase
          .from('providers')
          .select('*, profile:profiles(*)')
          .eq('id', data.provider_id)
          .single();

        if (providerData?.profile) {
          const schedDate = new Date(data.scheduled_at);
          const providerProfile = providerData.profile as any;
          const patientName = profile
            ? `${profile.first_name} ${profile.last_name}`
            : '';

          const appointmentTypeNames: Record<string, string> = {
            initial_consultation: 'Consulta Inicial',
            follow_up: 'Retorno',
            hormone_check: 'Avaliação Hormonal',
            lab_review: 'Revisão de Exames',
            nutrition: 'Nutrição',
            health_coaching: 'Health Coaching',
            therapy: 'Terapia',
            personal_training: 'Personal Training',
          };

          whatsappService.notifyBothNewAppointment({
            patientName,
            patientPhone: profile?.phone || '',
            patientId: user.id,
            providerName: `Dr(a). ${providerProfile.first_name} ${providerProfile.last_name}`,
            providerPhone: providerProfile.phone || '',
            providerUserId: providerProfile.id,
            appointmentType: appointmentTypeNames[data.type] || data.type,
            appointmentDate: `${String(schedDate.getUTCDate()).padStart(2, '0')}/${String(schedDate.getUTCMonth() + 1).padStart(2, '0')}/${schedDate.getUTCFullYear()}`,
            appointmentTime: `${String(schedDate.getUTCHours()).padStart(2, '0')}:${String(schedDate.getUTCMinutes()).padStart(2, '0')}`,
            appointmentId: result.id,
          }).then(results => {
            console.log('[Appointments] Notificações enviadas:', results);
          }).catch(err => {
            console.error('[Appointments] Erro ao enviar notificações:', err);
          });
        }
      } catch (notifErr) {
        console.error('[Appointments] Erro ao preparar notificações:', notifErr);
      }

      return result;
    } catch (err) {
      console.error('Error creating appointment:', err);
      throw err;
    }
  };

  // Cancelar agendamento
  const cancelAppointment = async (id: string, reason: string): Promise<void> => {
    try {
      // Buscar dados da consulta antes de cancelar (para notificação)
      const appointment = appointments.find(apt => apt.id === id);

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

      // Notificação cruzada: determinar quem cancelou e notificar a outra parte
      if (appointment) {
        try {
          const schedDate = new Date(appointment.scheduled_at);
          const providerProfile = appointment.provider?.profile;
          const cancelledBy = profile?.role === 'patient' ? 'patient' as const
            : profile?.role === 'provider' ? 'provider' as const
            : 'admin' as const;

          whatsappService.notifyCancellation({
            patientName: appointment.patient
              ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
              : profile?.role === 'patient' ? `${profile.first_name} ${profile.last_name}` : '',
            patientPhone: appointment.patient?.phone || profile?.phone || '',
            patientId: appointment.patient_id,
            providerName: providerProfile
              ? `Dr(a). ${providerProfile.first_name} ${providerProfile.last_name}` : '',
            providerPhone: providerProfile?.phone || '',
            providerUserId: providerProfile?.id,
            appointmentType: appointment.type,
            appointmentDate: `${String(schedDate.getUTCDate()).padStart(2, '0')}/${String(schedDate.getUTCMonth() + 1).padStart(2, '0')}/${schedDate.getUTCFullYear()}`,
            appointmentTime: `${String(schedDate.getUTCHours()).padStart(2, '0')}:${String(schedDate.getUTCMinutes()).padStart(2, '0')}`,
            appointmentId: id,
            reason,
          }, cancelledBy).then(results => {
            console.log('[Appointments] Notificações de cancelamento enviadas:', results);
          }).catch(err => {
            console.error('[Appointments] Erro ao enviar notificações de cancelamento:', err);
          });
        } catch (notifErr) {
          console.error('[Appointments] Erro ao preparar notificação de cancelamento:', notifErr);
        }
      }
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
