import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/GlobalStyle';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${theme.colors.background};
`;

const Main = styled.main`
  flex: 1;
  margin-left: 270px;
  min-height: 100vh;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Content = styled.div`
  padding: ${theme.spacing.xl};
  padding-right: 80px; /* Espaço para o seletor de idioma fixo */

  @media (max-width: 768px) {
    padding: ${theme.spacing.md};
    padding-right: 60px;
  }
`;

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <Container>
      <AdminSidebar />
      <Main>
        <Content>{children}</Content>
      </Main>
    </Container>
  );
};

export default AdminLayout;
