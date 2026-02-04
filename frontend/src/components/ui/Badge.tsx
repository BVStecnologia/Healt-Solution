import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/GlobalStyle';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'small' | 'medium';
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: theme.colors.border, text: theme.colors.text },
  success: { bg: '#dcfce7', text: '#166534' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  error: { bg: '#fee2e2', text: '#991b1b' },
  info: { bg: '#dbeafe', text: '#1e40af' },
};

const StyledBadge = styled.span<{ $variant: BadgeVariant; $size: 'small' | 'medium' }>`
  display: inline-flex;
  align-items: center;
  padding: ${props => (props.$size === 'small' ? '2px 8px' : '4px 12px')};
  font-size: ${props => (props.$size === 'small' ? '11px' : '12px')};
  font-weight: 500;
  border-radius: ${theme.borderRadius.full};
  background: ${props => variantColors[props.$variant].bg};
  color: ${props => variantColors[props.$variant].text};
`;

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
}) => {
  return (
    <StyledBadge $variant={variant} $size={size}>
      {children}
    </StyledBadge>
  );
};

export default Badge;

// Helper para status de appointment
export const getAppointmentStatusBadge = (status: string): { variant: BadgeVariant; label: string } => {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'warning', label: 'Pendente' },
    confirmed: { variant: 'info', label: 'Confirmado' },
    checked_in: { variant: 'info', label: 'Check-in' },
    in_progress: { variant: 'info', label: 'Em andamento' },
    completed: { variant: 'success', label: 'Concluído' },
    cancelled: { variant: 'error', label: 'Cancelado' },
    no_show: { variant: 'error', label: 'Faltou' },
  };

  return statusMap[status] || { variant: 'default', label: status };
};
