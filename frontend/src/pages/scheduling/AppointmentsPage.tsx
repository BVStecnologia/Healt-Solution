import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Plus, Filter } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import { useAppointments } from '../../hooks/useAppointments';
import Layout from '../../components/Layout';
import Button from '../../components/ui/Button';
import AppointmentList from '../../components/scheduling/AppointmentList';
import type { Appointment, AppointmentStatus } from '../../types/database';

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};

  @media (max-width: 480px) {
    flex-direction: column;
    gap: ${theme.spacing.md};
    align-items: stretch;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0;
`;

const Filters = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.lg};
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${props => props.$active ? theme.colors.primary : theme.colors.border};
  border-radius: ${theme.borderRadius.full};
  background: ${props => props.$active ? theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? 'white' : theme.colors.text};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

const CancelModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.lg};
`;

const ModalContent = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 400px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0 0 ${theme.spacing.md};
`;

const ModalText = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 14px;
  margin: 0 0 ${theme.spacing.lg};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: 14px;
  color: ${theme.colors.text};
  resize: vertical;
  min-height: 100px;
  margin-bottom: ${theme.spacing.lg};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  justify-content: flex-end;
`;

type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { appointments, loading, cancelAppointment } = useAppointments();
  const { t } = useTranslation();

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: t('appointments.patientFilterAll') },
    { value: 'upcoming', label: t('appointments.patientFilterUpcoming') },
    { value: 'completed', label: t('appointments.patientFilterCompleted') },
    { value: 'cancelled', label: t('appointments.patientFilterCancelled') },
  ];
  const [filter, setFilter] = useState<FilterType>('all');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Filtrar appointments
  const filteredAppointments = appointments.filter(appointment => {
    const isUpcoming =
      ['pending', 'confirmed'].includes(appointment.status) &&
      new Date(appointment.scheduled_at) >= new Date();

    switch (filter) {
      case 'upcoming':
        return isUpcoming;
      case 'completed':
        return appointment.status === 'completed';
      case 'cancelled':
        return appointment.status === 'cancelled';
      default:
        return true;
    }
  });

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment || !cancelReason.trim()) return;

    try {
      setCancelling(true);
      await cancelAppointment(selectedAppointment.id, cancelReason);
      setCancelModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Layout>
      <PageHeader>
        <Title>{t('appointments.patientTitle')}</Title>
        <Button onClick={() => navigate('/appointments/new')}>
          <Plus size={18} />
          {t('dashboard.newAppointment')}
        </Button>
      </PageHeader>

      <Filters>
        {filterOptions.map(option => (
          <FilterButton
            key={option.value}
            $active={filter === option.value}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </FilterButton>
        ))}
      </Filters>

      <AppointmentList
        appointments={filteredAppointments}
        loading={loading}
        emptyMessage={
          filter === 'all'
            ? t('appointments.patientEmptyAll')
            : filter === 'upcoming'
              ? t('appointments.patientEmptyUpcoming')
              : filter === 'completed'
                ? t('appointments.patientEmptyCompleted')
                : t('appointments.patientEmptyCancelled')
        }
        onAppointmentClick={appointment => navigate(`/appointments/${appointment.id}`)}
        onCancelClick={handleCancelClick}
      />

      {/* Modal de Cancelamento */}
      {cancelModalOpen && (
        <CancelModal onClick={() => setCancelModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>{t('appointments.cancelTitle')}</ModalTitle>
            <ModalText>
              {t('appointments.cancelConfirmText')}
            </ModalText>
            <TextArea
              placeholder={t('appointments.cancelReasonPlaceholder')}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <ModalActions>
              <Button
                variant="ghost"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
              >
                {t('common.back')}
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim() || cancelling}
                isLoading={cancelling}
              >
                {t('appointments.cancelConfirmButton')}
              </Button>
            </ModalActions>
          </ModalContent>
        </CancelModal>
      )}
    </Layout>
  );
};

export default AppointmentsPage;
