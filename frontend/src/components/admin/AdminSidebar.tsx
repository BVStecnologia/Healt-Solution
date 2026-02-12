import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Stethoscope,
  MessageCircle,
  Bell,
  LogOut,
  Shield,
  Clock,
  ChevronDown,
  User,
  AlertTriangle,
  DollarSign,
  Headphones,
  UserCheck,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import { useAuth } from '../../context/AuthContext';
import EssenceLogo from '../ui/EssenceLogo';

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
  background: ${theme.colors.surface};
  border-right: 1px solid ${theme.colors.border};
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 768px) {
    transform: translateX(${props => (props.$open ? '0' : '-100%')});
  }
`;

const Logo = styled.div`
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid ${theme.colors.border};

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 22px;
    font-weight: 800;
    color: ${theme.colors.primary};
    margin: 0;
    letter-spacing: -0.5px;
  }

  .badge {
    font-size: 10px;
    font-weight: 700;
    color: ${theme.colors.textMuted};
    background: ${theme.colors.primaryA10};
    padding: 4px 10px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: 1px solid ${theme.colors.border};
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
  z-index: 10;
`;

const SwitcherButton = styled.button<{ $open?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: ${theme.colors.primaryA10};
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  color: ${theme.colors.text};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.primaryA20};
    border-color: ${theme.colors.primary};
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
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  overflow: hidden;
  z-index: 10;
  opacity: ${props => props.$open ? 1 : 0};
  transform: translateY(${props => props.$open ? '0' : '-8px'});
  pointer-events: ${props => props.$open ? 'auto' : 'none'};
  transition: all 0.2s ease;
  box-shadow: ${theme.shadows.lg};
`;

const SwitcherOption = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: ${props => props.$active ? theme.colors.primaryA10 : 'transparent'};
  border: none;
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: 13px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${props => props.$active ? theme.colors.primaryA20 : theme.colors.surfaceHover};
    color: ${theme.colors.text};
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
    background: ${theme.colors.borderLight};
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
  color: ${theme.colors.textMuted};
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
  color: ${props => (props.$active ? theme.colors.primary : theme.colors.text)};
  background: ${props => (props.$active ? theme.colors.primaryA10 : 'transparent')};
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
    background: ${props => props.$active ? theme.colors.primaryA20 : theme.colors.surfaceHover};
    color: ${theme.colors.primary};
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
  padding: 12px 16px;
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.div<{ $hasImage?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => props.$hasImage ? 'transparent' : `linear-gradient(145deg, ${theme.colors.primary} 0%, #7A4833 100%)`};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  font-family: ${theme.typography.fontFamilyHeading};
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.div`
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${theme.colors.errorA10};
    color: ${theme.colors.error};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// ============================================
// ENVIRONMENT CONFIG
// ============================================
type Environment = 'admin' | 'doctor' | 'patient';

// environments and allNavItems moved inside component to access t()

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
  const { t } = useTranslation();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === 'admin';
  const isProvider = profile?.role === 'provider';

  const environments: { key: Environment; label: string; icon: React.FC<any>; path: string; bgColor: string }[] = [
    { key: 'admin', label: t('role.admin'), icon: Shield, path: '/admin', bgColor: 'rgba(146, 86, 62, 0.45)' },
    { key: 'doctor', label: t('role.doctor'), icon: Stethoscope, path: '/doctor', bgColor: 'rgba(180, 143, 122, 0.45)' },
    { key: 'patient', label: t('role.patient'), icon: User, path: '/?as=patient', bgColor: 'rgba(140, 139, 139, 0.35)' },
  ];

  const allNavItems = [
    { subpath: '', label: t('nav.dashboard'), icon: LayoutDashboard, section: 'principal', envs: ['admin', 'doctor'] as Environment[] },
    { subpath: '/calendar', label: t('nav.calendar'), icon: Calendar, section: 'principal', envs: ['admin', 'doctor'] as Environment[] },
    { subpath: '/appointments', label: t('nav.appointments'), icon: Stethoscope, section: 'principal', envs: ['admin', 'doctor'] as Environment[] },
    { subpath: '/my-schedule', label: t('nav.mySchedule'), icon: Clock, section: 'principal', envs: ['doctor'] as Environment[] },
    { subpath: '/my-schedule', label: t('nav.providerSchedules'), icon: Clock, section: 'gestao', envs: ['admin'] as Environment[] },
    { subpath: '/patients', label: t('nav.patients'), icon: Users, section: 'gestao', envs: ['admin'] as Environment[] },
    { subpath: '/providers', label: t('nav.providers'), icon: UserCog, section: 'gestao', envs: ['admin'] as Environment[] },
    { subpath: '/admins', label: t('nav.admins'), icon: Shield, section: 'gestao', envs: ['admin'] as Environment[] },
    { subpath: '/services', label: t('nav.services'), icon: DollarSign, section: 'gestao', envs: ['admin'] as Environment[] },
    { subpath: '/attendants', label: t('nav.attendants'), icon: UserCheck, section: 'gestao', envs: ['admin'] as Environment[] },
    { subpath: '/notifications', label: t('nav.notifications'), icon: Bell, section: 'config', envs: ['admin'] as Environment[] },
    { subpath: '/notifications', label: t('nav.myReminders'), icon: Bell, section: 'config', envs: ['doctor'] as Environment[] },
    { subpath: '/whatsapp', label: t('nav.whatsapp'), icon: MessageCircle, section: 'config', envs: ['admin'] as Environment[] },
    { subpath: '/failed-messages', label: t('nav.failedMessages'), icon: AlertTriangle, section: 'config', envs: ['admin'] as Environment[] },
    { subpath: '/handoff', label: t('nav.handoff'), icon: Headphones, section: 'config', envs: ['admin'] as Environment[] },
  ];

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
    { key: 'principal', title: t('nav.principal') },
    { key: 'gestao', title: t('nav.management') },
    { key: 'config', title: t('nav.config') },
  ];
  const sections = allSections.filter(section =>
    navItems.some(item => item.section === section.key)
  );

  const currentEnvConfig = environments.find(e => e.key === currentEnv)!;
  const EnvIcon = currentEnvConfig.icon;

  const displayName = profile
    ? (currentEnv === 'doctor' || isProvider)
      ? `${t('common.drPrefix')} ${profile.first_name}`
      : `${profile.first_name} ${profile.last_name}`
    : 'Admin';

  const badgeLabel = currentEnv === 'doctor' ? t('role.doctor') : isProvider ? t('role.doctor') : t('role.adminShort');

  return (
    <Sidebar $open={open}>
      <Logo>
        <EssenceLogo variant="horizontal" size="sm" color="dark" />
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
        <Avatar $hasImage={!!profile?.avatar_url}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} />
          ) : (
            initials
          )}
        </Avatar>
        <UserName>{displayName}</UserName>
        <LogoutButton onClick={handleLogout} title={t('nav.logout')}>
          <LogOut />
        </LogoutButton>
      </UserSection>
    </Sidebar>
  );
};

export default AdminSidebar;
