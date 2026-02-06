import React, { ReactNode, useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  Menu,
  User,
  Settings,
} from 'lucide-react';
import { theme } from '../styles/GlobalStyle';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${theme.colors.background};
`;

const Sidebar = styled.aside<{ $open: boolean }>`
  width: 260px;
  background: ${theme.colors.surface};
  border-right: 1px solid ${theme.colors.border};
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    transform: translateX(${props => (props.$open ? '0' : '-100%')});
  }
`;

const Logo = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};

  h1 {
    font-size: 20px;
    font-weight: 700;
    color: ${theme.colors.primary};
    margin: 0;
  }

  span {
    font-size: 12px;
    color: ${theme.colors.textSecondary};
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: ${theme.spacing.md};
  overflow-y: auto;
`;

const NavSection = styled.div`
  &:not(:first-child) {
    margin-top: ${theme.spacing.md};
    padding-top: ${theme.spacing.md};
    border-top: 1px solid ${theme.colors.borderLight};
  }
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${theme.colors.textMuted};
  padding: 0 ${theme.spacing.md};
  margin-bottom: ${theme.spacing.sm};
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  color: ${props => (props.$active ? theme.colors.primary : theme.colors.text)};
  background: ${props => (props.$active ? theme.colors.primaryA10 : 'transparent')};
  font-weight: ${props => (props.$active ? '500' : '400')};
  transition: all 0.2s ease;
  margin-bottom: ${theme.spacing.xs};

  &:hover {
    background: ${props => (props.$active ? theme.colors.primaryA10 : theme.colors.surfaceHover)};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const UserSection = styled.div`
  padding: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.sm};
`;

const AvatarCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
`;

const UserDetails = styled.div`
  flex: 1;
  overflow: hidden;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserEmail = styled.div`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  width: 100%;
  padding: ${theme.spacing.md};
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.error};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.errorA10};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Main = styled.main`
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Header = styled.header`
  display: none;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.surface};
  border-bottom: 1px solid ${theme.colors.border};
  position: sticky;
  top: 0;
  z-index: 50;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const MobileMenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.text};
  cursor: pointer;

  svg {
    width: 24px;
    height: 24px;
  }
`;

const MobileTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.primary};
  margin: 0;
`;

const Content = styled.div`
  padding: ${theme.spacing.xxl} ${theme.spacing.lg} ${theme.spacing.lg};

  @media (max-width: 768px) {
    padding: ${theme.spacing.xl} ${theme.spacing.md} ${theme.spacing.md};
  }
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
    background: ${theme.colors.overlay};
    z-index: 99;
  }
`;

interface NavItem {
  path: string;
  label: string;
  icon: React.FC;
}

interface NavSectionConfig {
  label: string;
  items: NavItem[];
}

const navSections: NavSectionConfig[] = [
  {
    label: 'Principal',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/appointments', label: 'Consultas', icon: Calendar },
    ],
  },
  {
    label: 'Minha Conta',
    items: [
      { path: '/profile', label: 'Meu Perfil', icon: User },
      { path: '/settings', label: 'Configurações', icon: Settings },
    ],
  },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : 'U';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <Container>
      <Overlay $open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <Sidebar $open={sidebarOpen}>
        <Logo>
          <h1>Essence</h1>
          <span>Portal do Paciente</span>
        </Logo>

        <Nav>
          {navSections.map((section, idx) => (
            <NavSection key={idx}>
              <SectionLabel>{section.label}</SectionLabel>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  $active={isActive(item.path)}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon />
                  {item.label}
                </NavLink>
              ))}
            </NavSection>
          ))}
        </Nav>

        <UserSection>
          <UserInfo>
            <AvatarCircle>{initials}</AvatarCircle>
            <UserDetails>
              <UserName>
                {profile ? `${profile.first_name} ${profile.last_name}` : 'Usuário'}
              </UserName>
              <UserEmail>{profile?.email}</UserEmail>
            </UserDetails>
            <UserActions>
              <ThemeToggle />
            </UserActions>
          </UserInfo>
          <LogoutButton onClick={handleLogout}>
            <LogOut />
            Sair
          </LogoutButton>
        </UserSection>
      </Sidebar>

      <Main>
        <Header>
          <MobileMenuButton onClick={() => setSidebarOpen(true)}>
            <Menu />
          </MobileMenuButton>
          <MobileTitle>Essence</MobileTitle>
          <ThemeToggle />
        </Header>

        <Content>{children}</Content>
      </Main>
    </Container>
  );
};

export default Layout;
