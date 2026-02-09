import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Calendar, Clock, User, MoreVertical } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import Card from '../ui/Card';
import Badge, { getAppointmentStatusBadge } from '../ui/Badge';
import type { Appointment } from '../../types/database';
import { getTreatmentLabel } from '../../constants/treatments';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
  onCancel?: () => void;
}

const CardWrapper = styled(Card)`
  margin-bottom: ${theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.md};
`;

const TypeLabel = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${theme.colors.textSecondary};
  font-weight: 500;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};
  color: ${theme.colors.text};
  font-size: 14px;

  svg {
    color: ${theme.colors.textSecondary};
    width: 16px;
    height: 16px;
  }
`;

const ProviderName = styled.span`
  font-weight: 500;
`;

const DateTime = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
`;

const Actions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const ActionButton = styled.button<{ $variant?: 'danger' }>`
  flex: 1;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${props => props.$variant === 'danger' ? theme.colors.error : theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${props => props.$variant === 'danger' ? theme.colors.error : theme.colors.text};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$variant === 'danger' ? theme.colors.errorA10 : theme.colors.border};
  }
`;


const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onClick,
  onCancel,
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? ptBR : enUS;
  const { variant, label } = getAppointmentStatusBadge(appointment.status);
  const scheduledDate = new Date(appointment.scheduled_at);
  const providerName = appointment.provider?.profile
    ? `${t('common.drPrefix')} ${appointment.provider.profile.first_name} ${appointment.provider.profile.last_name}`
    : t('appointments.card.providerUnknown');

  const canCancel = ['pending', 'confirmed'].includes(appointment.status);

  return (
    <CardWrapper padding="medium" hoverable onClick={onClick}>
      <Header>
        <div>
          <TypeLabel>
            {getTreatmentLabel(appointment.type, i18n.language as 'pt' | 'en')}
          </TypeLabel>
        </div>
        <Badge variant={variant}>{label}</Badge>
      </Header>

      <InfoRow>
        <User />
        <ProviderName>{providerName}</ProviderName>
      </InfoRow>

      <DateTime>
        <InfoRow>
          <Calendar />
          {format(scheduledDate, "EEEE, d MMMM", { locale: dateLocale })}
        </InfoRow>
        <InfoRow>
          <Clock />
          {format(scheduledDate, 'HH:mm')} ({appointment.duration} min)
        </InfoRow>
      </DateTime>

      {appointment.notes && (
        <InfoRow style={{ marginTop: theme.spacing.sm, color: theme.colors.textSecondary }}>
          {appointment.notes}
        </InfoRow>
      )}

      {(onClick || (canCancel && onCancel)) && (
        <Actions onClick={e => e.stopPropagation()}>
          {onClick && (
            <ActionButton onClick={onClick}>
              {t('appointments.card.viewDetails')}
            </ActionButton>
          )}
          {canCancel && onCancel && (
            <ActionButton $variant="danger" onClick={onCancel}>
              {t('appointments.card.cancel')}
            </ActionButton>
          )}
        </Actions>
      )}
    </CardWrapper>
  );
};

export default AppointmentCard;
