import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock, User, MapPin, FileText } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import { supabase } from '../../lib/supabaseClient';
import { useAppointments } from '../../hooks/useAppointments';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { getAppointmentStatusBadge } from '../../components/ui/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Appointment } from '../../types/database';

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.surface};
  cursor: pointer;
  color: ${theme.colors.text};

  &:hover {
    background: ${theme.colors.border};
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0;
  flex: 1;
`;

const StatusBadge = styled.div`
  margin-left: auto;
`;

const DetailCard = styled(Card)`
  margin-bottom: ${theme.spacing.lg};
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
`;

const TypeLabel = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0;
`;

const DetailContent = styled.div`
  padding: ${theme.spacing.lg};
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} 0;

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.border};
  }
`;

const DetailIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.primaryA10};
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const DetailInfo = styled.div`
  flex: 1;
`;

const DetailLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${theme.spacing.xs};
`;

const DetailValue = styled.div`
  font-size: 15px;
  color: ${theme.colors.text};
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
`;

const CancelledInfo = styled.div`
  background: ${theme.colors.errorA10};
  border: 1px solid ${theme.colors.errorA30};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
`;

const CancelledLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.error};
  font-weight: 500;
  margin-bottom: ${theme.spacing.xs};
`;

const CancelledReason = styled.div`
  font-size: 14px;
  color: ${theme.colors.text};
`;

const appointmentTypeLabels: Record<string, string> = {
  initial_consultation: 'Consulta Inicial',
  follow_up: 'Retorno',
  hormone_check: 'Avaliação Hormonal',
  lab_review: 'Revisão de Exames',
  nutrition: 'Nutrição',
  health_coaching: 'Health Coaching',
  therapy: 'Terapia',
  personal_training: 'Personal Training',
};

const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cancelAppointment } = useAppointments();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            provider:providers(
              *,
              profile:profiles(*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setAppointment(data);
      } catch (error) {
        console.error('Error fetching appointment:', error);
        navigate('/appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!appointment) return;

    // Verificar se é cancelamento tardio (< 24h)
    const scheduledTime = new Date(appointment.scheduled_at).getTime();
    const now = Date.now();
    const hoursUntil = (scheduledTime - now) / (1000 * 60 * 60);

    if (hoursUntil < 24 && hoursUntil > 0) {
      const confirmed = window.confirm(
        'Sua consulta é em menos de 24 horas.\n\n' +
        'Cancelamentos tardios podem estar sujeitos a políticas da clínica.\n\n' +
        'Deseja continuar com o cancelamento?'
      );
      if (!confirmed) return;
    }

    const reason = window.prompt('Por favor, informe o motivo do cancelamento:');
    if (!reason) return;

    try {
      setCancelling(true);
      await cancelAppointment(appointment.id, reason);
      setAppointment(prev => prev ? { ...prev, status: 'cancelled', cancellation_reason: reason } : null);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner fullScreen={false} message="Carregando detalhes..." />
      </Layout>
    );
  }

  if (!appointment) {
    return (
      <Layout>
        <p>Consulta não encontrada</p>
      </Layout>
    );
  }

  const { variant, label } = getAppointmentStatusBadge(appointment.status);
  const scheduledDate = new Date(appointment.scheduled_at);
  const providerName = appointment.provider?.profile
    ? `Dr(a). ${appointment.provider.profile.first_name} ${appointment.provider.profile.last_name}`
    : 'Médico não definido';
  const canCancel = ['pending', 'confirmed'].includes(appointment.status);

  return (
    <Layout>
      <PageHeader>
        <BackButton onClick={() => navigate('/appointments')}>
          <ArrowLeft size={20} />
        </BackButton>
        <Title>Detalhes da Consulta</Title>
        <StatusBadge>
          <Badge variant={variant}>{label}</Badge>
        </StatusBadge>
      </PageHeader>

      <DetailCard>
        <DetailHeader>
          <TypeLabel>
            {appointmentTypeLabels[appointment.type] || appointment.type}
          </TypeLabel>
        </DetailHeader>

        <DetailContent>
          <DetailRow>
            <DetailIcon>
              <Calendar />
            </DetailIcon>
            <DetailInfo>
              <DetailLabel>Data</DetailLabel>
              <DetailValue>
                {format(scheduledDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </DetailValue>
            </DetailInfo>
          </DetailRow>

          <DetailRow>
            <DetailIcon>
              <Clock />
            </DetailIcon>
            <DetailInfo>
              <DetailLabel>Horário</DetailLabel>
              <DetailValue>
                {format(scheduledDate, 'HH:mm')} - Duração: {appointment.duration} minutos
              </DetailValue>
            </DetailInfo>
          </DetailRow>

          <DetailRow>
            <DetailIcon>
              <User />
            </DetailIcon>
            <DetailInfo>
              <DetailLabel>Médico</DetailLabel>
              <DetailValue>{providerName}</DetailValue>
              {appointment.provider?.specialty && (
                <div style={{ fontSize: '13px', color: theme.colors.textSecondary, marginTop: '4px' }}>
                  {appointment.provider.specialty}
                </div>
              )}
            </DetailInfo>
          </DetailRow>

          {appointment.notes && (
            <DetailRow>
              <DetailIcon>
                <FileText />
              </DetailIcon>
              <DetailInfo>
                <DetailLabel>Observações</DetailLabel>
                <DetailValue>{appointment.notes}</DetailValue>
              </DetailInfo>
            </DetailRow>
          )}

          {appointment.status === 'cancelled' && appointment.cancellation_reason && (
            <CancelledInfo>
              <CancelledLabel>Motivo do cancelamento</CancelledLabel>
              <CancelledReason>{appointment.cancellation_reason}</CancelledReason>
            </CancelledInfo>
          )}
        </DetailContent>

        {canCancel && (
          <Actions>
            <Button
              variant="outline"
              onClick={() => navigate('/appointments/new')}
            >
              Reagendar
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              isLoading={cancelling}
            >
              Cancelar Consulta
            </Button>
          </Actions>
        )}
      </DetailCard>
    </Layout>
  );
};

export default AppointmentDetailPage;
