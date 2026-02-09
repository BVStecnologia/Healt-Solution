import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AppointmentCard from './AppointmentCard';
import LoadingSpinner from '../LoadingSpinner';
import type { Appointment } from '../../types/database';

interface AppointmentListProps {
  appointments: Appointment[];
  loading?: boolean;
  emptyMessage?: string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onCancelClick?: (appointment: Appointment) => void;
}

const Container = styled.div`
  width: 100%;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xxl};
  text-align: center;
  color: ${theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${theme.spacing.md};
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: ${theme.spacing.lg} 0 ${theme.spacing.md};

  &:first-child {
    margin-top: 0;
  }
`;

const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  loading = false,
  emptyMessage,
  onAppointmentClick,
  onCancelClick,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return <LoadingSpinner message={t('appointments.loadingList')} />;
  }

  if (appointments.length === 0) {
    return (
      <EmptyState>
        <Calendar />
        <p>{emptyMessage || t('appointments.emptyDefault')}</p>
      </EmptyState>
    );
  }

  // Separar por status
  const upcoming = appointments.filter(a =>
    ['pending', 'confirmed'].includes(a.status) &&
    new Date(a.scheduled_at) >= new Date()
  );

  const past = appointments.filter(a =>
    ['completed', 'cancelled', 'no_show'].includes(a.status) ||
    new Date(a.scheduled_at) < new Date()
  );

  return (
    <Container>
      {upcoming.length > 0 && (
        <>
          <SectionTitle>{t('patient.upcomingAppointments')}</SectionTitle>
          {upcoming.map(appointment => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onClick={onAppointmentClick ? () => onAppointmentClick(appointment) : undefined}
              onCancel={onCancelClick ? () => onCancelClick(appointment) : undefined}
            />
          ))}
        </>
      )}

      {past.length > 0 && (
        <>
          <SectionTitle>{t('profile.historyTitle')}</SectionTitle>
          {past.map(appointment => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onClick={onAppointmentClick ? () => onAppointmentClick(appointment) : undefined}
            />
          ))}
        </>
      )}
    </Container>
  );
};

export default AppointmentList;
