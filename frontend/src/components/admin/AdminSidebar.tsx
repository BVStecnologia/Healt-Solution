import React from 'react';
import styled from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Stethoscope,
  MessageCircle,
  LogOut,
  Shield,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import { useAuth } from '../../context/AuthContext';

const Sidebar = styled.aside`
  width: 260px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Logo = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  h1 {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin: 0;
  }

  span {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  background: ${theme.colors.primary};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: ${theme.spacing.md};
  overflow-y: auto;
`;

const NavSection = styled.div`
  margin-bottom: ${theme.spacing.lg};

  &:last-child {
    margin-bottom: 0;
  }
`;

const NavSectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 0 ${theme.spacing.md};
  margin-bottom: ${theme.spacing.sm};
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  color: ${props => (props.$active ? 'white' : 'rgba(255, 255, 255, 0.7)')};
  background: ${props => (props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent')};
  font-weight: ${props => (props.$active ? '500' : '400')};
  font-size: 14px;
  transition: all 0.2s ease;
  margin-bottom: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  svg {
    width: 20px;
    height: 20px;
    opacity: ${props => (props.$active ? 1 : 0.7)};
  }
`;

const UserSection = styled.div`
  padding: ${theme.spacing.md};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
`;

const UserDetails = styled.div`
  flex: 1;
  overflow: hidden;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  width: 100%;
  padding: ${theme.spacing.md};
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, section: 'principal' },
  { path: '/admin/calendar', label: 'Calendário', icon: Calendar, section: 'principal' },
  { path: '/admin/appointments', label: 'Consultas', icon: Stethoscope, section: 'principal' },
  { path: '/admin/patients', label: 'Pacientes', icon: Users, section: 'gestao' },
  { path: '/admin/providers', label: 'Médicos', icon: UserCog, section: 'gestao' },
  { path: '/admin/admins', label: 'Admins', icon: Shield, section: 'gestao' },
  { path: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle, section: 'config' },
];

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : 'AD';

  const sections = [
    { key: 'principal', title: 'Principal' },
    { key: 'gestao', title: 'Gestão' },
    { key: 'config', title: 'Configurações' },
  ];

  return (
    <Sidebar>
      <Logo>
        <LogoIcon>
          <Shield />
        </LogoIcon>
        <div>
          <h1>ShapeUp</h1>
        </div>
        <span>Admin</span>
      </Logo>

      <Nav>
        {sections.map(section => (
          <NavSection key={section.key}>
            <NavSectionTitle>{section.title}</NavSectionTitle>
            {navItems
              .filter(item => item.section === section.key)
              .map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  $active={location.pathname === item.path}
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
          <Avatar>{initials}</Avatar>
          <UserDetails>
            <UserName>
              {profile ? `${profile.first_name} ${profile.last_name}` : 'Admin'}
            </UserName>
            <UserRole>Administrador</UserRole>
          </UserDetails>
        </UserInfo>
        <LogoutButton onClick={handleLogout}>
          <LogOut />
          Sair
        </LogoutButton>
      </UserSection>
    </Sidebar>
  );
};

export default AdminSidebar;
