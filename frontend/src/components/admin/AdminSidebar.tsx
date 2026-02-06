import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
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
  Clock,
  ChevronDown,
  User,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import { useAuth } from '../../context/AuthContext';

const subtleGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(146, 86, 62, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(146, 86, 62, 0.5);
  }
`;

const Sidebar = styled.aside<{ $open: boolean }>`
  width: 270px;
  background:
    linear-gradient(180deg, #2D2420 0%, #3D322B 50%, #4A3C33 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.02;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.1) 80%,
      transparent
    );
  }

  @media (max-width: 768px) {
    transform: translateX(${props => (props.$open ? '0' : '-100%')});
  }
`;

const Logo = styled.div`
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20px;
    right: 20px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.1) 80%,
      transparent
    );
  }

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 22px;
    font-weight: 800;
    color: white;
    margin: 0;
    letter-spacing: -0.5px;
  }

  .badge {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.08);
    padding: 4px 10px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const LogoIcon = styled.div`
  width: 42px;
  height: 42px;
  background: linear-gradient(145deg, ${theme.colors.primary} 0%, #7A4833 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: ${subtleGlow} 3s ease-in-out infinite;

  svg {
    width: 22px;
    height: 22px;
    color: white;
  }
`;

// ============================================
// ENVIRONMENT SWITCHER
// ============================================
const SwitcherWrapper = styled.div`
  padding: 12px 12px 0;
  position: relative;
`;

const SwitcherButton = styled.button<{ $open?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .env-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 16px;
      height: 16px;
      color: white;
    }
  }

  .env-label {
    flex: 1;
    text-align: left;
  }

  .env-chevron {
    transition: transform 0.2s ease;
    transform: rotate(${props => props.$open ? '180deg' : '0deg'});
    opacity: 0.5;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const SwitcherDropdown = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 12px;
  right: 12px;
  background: #3D322B;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  z-index: 10;
  opacity: ${props => props.$open ? 1 : 0};
  transform: translateY(${props => props.$open ? '0' : '-8px'});
  pointer-events: ${props => props.$open ? 'auto' : 'none'};
  transition: all 0.2s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
`;

const SwitcherOption = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: ${props => props.$active ? 'rgba(146, 86, 62, 0.2)' : 'transparent'};
  border: none;
  color: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 13px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${props => props.$active ? 'rgba(146, 86, 62, 0.25)' : 'rgba(255, 255, 255, 0.06)'};
    color: white;
  }

  .env-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

// ============================================
// NAV
// ============================================
const Nav = styled.nav`
  flex: 1;
  padding: 20px 12px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
`;

const NavSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const NavSectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 0 16px;
  margin-bottom: 10px;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 10px;
  color: ${props => (props.$active ? 'white' : 'rgba(255, 255, 255, 0.6)')};
  background: ${props => (props.$active ? 'rgba(146, 86, 62, 0.15)' : 'transparent')};
  font-weight: ${props => (props.$active ? '600' : '500')};
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  margin-bottom: 4px;
  position: relative;

  ${props => props.$active && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      background: linear-gradient(180deg, ${theme.colors.primary}, #7A4833);
      border-radius: 0 3px 3px 0;
    }
  `}

  &:hover {
    background: ${props => props.$active ? 'rgba(146, 86, 62, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    color: white;
    transform: translateX(2px);
  }

  svg {
    width: 20px;
    height: 20px;
    opacity: ${props => (props.$active ? 1 : 0.7)};
    transition: opacity 0.2s ease;
  }

  &:hover svg {
    opacity: 1;
  }
`;

// ============================================
// USER SECTION
// ============================================
const UserSection = styled.div`
  padding: 16px;
  position: relative;
  background: rgba(0, 0, 0, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.1) 80%,
      transparent
    );
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
`;

const Avatar = styled.div<{ $hasImage?: boolean }>`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: ${props => props.$hasImage ? 'transparent' : `linear-gradient(145deg, ${theme.colors.primary} 0%, #7A4833 100%)`};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  font-family: ${theme.typography.fontFamilyHeading};
  letter-spacing: -0.5px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserDetails = styled.div`
  flex: 1;
  overflow: hidden;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ${theme.typography.fontFamilyHeading};
`;

const UserRole = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 500;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ============================================
// ENVIRONMENT CONFIG
// ============================================
type Environment = 'admin' | 'doctor' | 'patient';

const environments: { key: Environment; label: string; icon: React.FC<any>; path: string; bgColor: string }[] = [
  { key: 'admin', label: 'Administrador', icon: Shield, path: '/admin', bgColor: 'rgba(146, 86, 62, 0.4)' },
  { key: 'doctor', label: 'Médico', icon: Stethoscope, path: '/doctor', bgColor: 'rgba(16, 185, 129, 0.3)' },
  { key: 'patient', label: 'Paciente', icon: User, path: '/', bgColor: 'rgba(99, 102, 241, 0.3)' },
];

const allNavItems = [
  { subpath: '', label: 'Dashboard', icon: LayoutDashboard, section: 'principal', envs: ['admin', 'doctor'] as Environment[] },
  { subpath: '/calendar', label: 'Calendário', icon: Calendar, section: 'principal', envs: ['admin', 'doctor'] as Environment[] },
  { subpath: '/appointments', label: 'Consultas', icon: Stethoscope, section: 'principal', envs: ['admin', 'doctor'] as Environment[] },
  { subpath: '/my-schedule', label: 'Minha Agenda', icon: Clock, section: 'principal', envs: ['doctor'] as Environment[] },
  { subpath: '/my-schedule', label: 'Agenda Médicos', icon: Clock, section: 'gestao', envs: ['admin'] as Environment[] },
  { subpath: '/patients', label: 'Pacientes', icon: Users, section: 'gestao', envs: ['admin'] as Environment[] },
  { subpath: '/providers', label: 'Médicos', icon: UserCog, section: 'gestao', envs: ['admin'] as Environment[] },
  { subpath: '/admins', label: 'Admins', icon: Shield, section: 'gestao', envs: ['admin'] as Environment[] },
  { subpath: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, section: 'config', envs: ['admin'] as Environment[] },
];

// ============================================
// COMPONENT
// ============================================
interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ open = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === 'admin';
  const isProvider = profile?.role === 'provider';

  // Detectar ambiente atual pela URL
  const currentEnv: Environment = location.pathname.startsWith('/doctor')
    ? 'doctor'
    : location.pathname.startsWith('/admin')
      ? 'admin'
      : 'patient';

  const basePath = currentEnv === 'doctor' ? '/doctor' : '/admin';

  // Admin vê todos os ambientes, provider só vê o seu
  const hasMultipleEnvs = isAdmin;

  const handleLogout = async () => {
    await signOut();
    navigate(currentEnv === 'doctor' ? '/doctor/login' : '/admin/login');
  };

  const handleSwitchEnv = (env: Environment) => {
    setSwitcherOpen(false);
    const target = environments.find(e => e.key === env);
    if (target) {
      navigate(target.path);
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : 'AD';

  // Filtrar nav items pelo ambiente atual e gerar paths
  const navItems = allNavItems
    .filter(item => item.envs.includes(currentEnv))
    .map(item => ({ ...item, path: basePath + item.subpath }));

  // Seções visíveis
  const allSections = [
    { key: 'principal', title: 'Principal' },
    { key: 'gestao', title: 'Gestão' },
    { key: 'config', title: 'Configurações' },
  ];
  const sections = allSections.filter(section =>
    navItems.some(item => item.section === section.key)
  );

  const currentEnvConfig = environments.find(e => e.key === currentEnv)!;
  const EnvIcon = currentEnvConfig.icon;

  const displayName = profile
    ? (currentEnv === 'doctor' || isProvider)
      ? `Dr(a). ${profile.first_name}`
      : `${profile.first_name} ${profile.last_name}`
    : 'Admin';

  const roleLabel = currentEnv === 'doctor' ? 'Médico' : isProvider ? 'Médico' : 'Administrador';
  const badgeLabel = currentEnv === 'doctor' ? 'Médico' : isProvider ? 'Médico' : 'Admin';

  const logoIcon = currentEnv === 'doctor' ? <Stethoscope /> : <Shield />;

  return (
    <Sidebar $open={open}>
      <Logo>
        <LogoIcon>
          {logoIcon}
        </LogoIcon>
        <div>
          <h1>Essence</h1>
        </div>
        <span className="badge">{badgeLabel}</span>
      </Logo>

      {/* Environment Switcher - só aparece se tem mais de 1 ambiente */}
      {hasMultipleEnvs && (
        <SwitcherWrapper ref={switcherRef}>
          <SwitcherButton
            onClick={() => setSwitcherOpen(!switcherOpen)}
            $open={switcherOpen}
          >
            <div className="env-icon" style={{ background: currentEnvConfig.bgColor }}>
              <EnvIcon />
            </div>
            <span className="env-label">{currentEnvConfig.label}</span>
            <div className="env-chevron">
              <ChevronDown />
            </div>
          </SwitcherButton>

          <SwitcherDropdown $open={switcherOpen}>
            {environments.map(env => (
              <SwitcherOption
                key={env.key}
                $active={env.key === currentEnv}
                onClick={() => handleSwitchEnv(env.key)}
              >
                <div className="env-icon" style={{ background: env.bgColor }}>
                  <env.icon />
                </div>
                {env.label}
              </SwitcherOption>
            ))}
          </SwitcherDropdown>
        </SwitcherWrapper>
      )}

      <Nav>
        {sections.map(section => (
          <NavSection key={section.key}>
            <NavSectionTitle>{section.title}</NavSectionTitle>
            {navItems
              .filter(item => item.section === section.key)
              .map(item => {
                const isActive = item.subpath === ''
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    $active={isActive}
                    onClick={onClose}
                  >
                    <item.icon />
                    {item.label}
                  </NavLink>
                );
              })}
          </NavSection>
        ))}
      </Nav>

      <UserSection>
        <UserInfo>
          <Avatar $hasImage={!!profile?.avatar_url}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
            ) : (
              initials
            )}
          </Avatar>
          <UserDetails>
            <UserName>{displayName}</UserName>
            <UserRole>{roleLabel}</UserRole>
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
