import React, { ReactNode, useState } from 'react';
import styled from 'styled-components';
import { Menu } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminSidebar from './AdminSidebar';
import EssenceLogo from '../ui/EssenceLogo';

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
  padding-right: 80px;
  overflow-x: hidden;
  max-width: 1200px;

  @media (max-width: 768px) {
    padding: ${theme.spacing.md};
    padding-right: 60px;
  }
`;

const MobileHeader = styled.header`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: ${theme.colors.surface};
    border-bottom: 1px solid ${theme.colors.border};
    position: sticky;
    top: 0;
    z-index: 50;
  }
`;

const MobileMenuButton = styled.button`
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.text};
  transition: background 0.2s;

  &:hover {
    background: ${theme.colors.surfaceHover};
  }

  svg {
    width: 22px;
    height: 22px;
  }
`;

const MobileTitle = styled.h1`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 18px;
  color: ${theme.colors.primary};
  margin: 0;
  font-weight: 800;
`;

const Overlay = styled.div<{ $open: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: ${props => (props.$open ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
`;

const MobileThemeToggle = styled.button`
  margin-left: auto;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textSecondary};
  transition: all 0.2s;

  &:hover {
    background: ${theme.colors.surfaceHover};
    color: ${theme.colors.text};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Container>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Overlay $open={sidebarOpen} onClick={() => setSidebarOpen(false)} />
      <Main>
        <MobileHeader>
          <MobileMenuButton onClick={() => setSidebarOpen(true)}>
            <Menu />
          </MobileMenuButton>
          <EssenceLogo variant="horizontal" size="xs" color="dark" />
        </MobileHeader>
        <Content>{children}</Content>
      </Main>
    </Container>
  );
};

export default AdminLayout;
