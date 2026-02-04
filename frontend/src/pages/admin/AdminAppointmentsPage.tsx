import React from 'react';
import styled from 'styled-components';
import { Stethoscope, Calendar, Clock, User, MoreVertical } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.xl};

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 28px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0 0 ${theme.spacing.xs};
  }

  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
  }
`;

const ComingSoon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.sm};
  text-align: center;

  svg {
    width: 64px;
    height: 64px;
    color: ${theme.colors.primary};
    opacity: 0.5;
    margin-bottom: ${theme.spacing.lg};
  }

  h2 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 24px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0 0 ${theme.spacing.sm};
  }

  p {
    color: ${theme.colors.textSecondary};
    max-width: 400px;
    line-height: 1.6;
  }
`;

const AdminAppointmentsPage: React.FC = () => {
  return (
    <AdminLayout>
      <Header>
        <div>
          <h1>Consultas</h1>
          <p>Gerencie todas as consultas do sistema</p>
        </div>
      </Header>

      <ComingSoon>
        <Stethoscope />
        <h2>Em Desenvolvimento</h2>
        <p>
          A página de gerenciamento de consultas está sendo desenvolvida.
          Em breve você poderá visualizar, filtrar e gerenciar todas as consultas.
        </p>
      </ComingSoon>
    </AdminLayout>
  );
};

export default AdminAppointmentsPage;
