import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useLocation } from 'react-router-dom';
import {
  Bell, Plus, Trash2, Check, AlertCircle, X, Clock, Edit2,
  Users, Stethoscope, ToggleLeft, ToggleRight, Save, RefreshCw,
  AlertTriangle, ChevronDown
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { theme } from '../../styles/GlobalStyle';
import { supabaseAdmin } from '../../lib/adminService';
import { useCurrentProvider } from '../../hooks/useCurrentProvider';

// ============================================
// TYPES
// ============================================
interface NotificationRule {
  id: string;
  target_role: 'patient' | 'provider';
  provider_id: string | null;
  minutes_before: number;
  template_name: string;
  is_active: boolean;
  created_at: string;
}

interface ProviderOption {
  id: string;
  name: string;
}

interface TemplateOption {
  name: string;
  language: string;
  description: string | null;
}

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

// ============================================
// THEME
// ============================================
const luxuryTheme = {
  primary: '#92563E',
  primaryLight: '#AF8871',
  primarySoft: '#F4E7DE',
  primaryDark: '#7A4832',
  success: '#6B8E6B',
  error: '#C4836A',
  cream: theme.colors.background,
  surface: theme.colors.surface,
  border: theme.colors.border,
  text: theme.colors.text,
  textSecondary: theme.colors.textSecondary,
  successLight: theme.colors.successLight,
  errorLight: theme.colors.errorLight,
};

// ============================================
// STYLED COMPONENTS
// ============================================
const PageContainer = styled.div``;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
  animation: ${fadeInUp} 0.6s ease-out;

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 32px;
    font-weight: 400;
    color: ${luxuryTheme.text};
    margin: 0 0 8px;
    letter-spacing: 0.5px;
  }

  p {
    color: ${luxuryTheme.textSecondary};
    margin: 0;
    font-size: 15px;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight});
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px ${luxuryTheme.primary}40;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${luxuryTheme.primary}50;
  }

  &:active { transform: translateY(0); }
`;

const SectionTitle = styled.h2`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 22px;
  font-weight: 500;
  color: ${luxuryTheme.text};
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${fadeInUp} 0.6s ease-out;

  svg {
    color: ${luxuryTheme.primary};
  }
`;

const RulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 100ms;
  animation-fill-mode: both;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const RuleCard = styled.div<{ $index: number; $active: boolean }>`
  background: ${luxuryTheme.surface};
  border: 1px solid ${props => props.$active ? 'rgba(146, 86, 62, 0.08)' : `${luxuryTheme.error}25`};
  border-radius: 20px;
  padding: 28px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => 150 + props.$index * 80}ms;
  animation-fill-mode: both;
  opacity: ${props => props.$active ? 1 : 0.5};

  &:hover {
    border-color: rgba(146, 86, 62, 0.15);
    box-shadow: 0 12px 40px rgba(146, 86, 62, 0.10);
    transform: translateY(-6px);
    opacity: 1;
  }
`;

const RuleIcon = styled.div<{ $role: string }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${props => props.$role === 'patient'
    ? 'linear-gradient(145deg, #B48F7A, #92563E)'
    : `linear-gradient(145deg, ${luxuryTheme.primary}, #7A4532)`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 4px;
  transition: all 0.3s ease;

  ${RuleCard}:hover & {
    transform: scale(1.06);
    box-shadow: 0 8px 24px rgba(146, 86, 62, 0.20);
  }
`;

const RuleInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
`;

const RuleName = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 15px;
  font-weight: 600;
  color: ${luxuryTheme.text};
`;

const RuleDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${luxuryTheme.textSecondary};
  font-size: 12px;
  flex-wrap: wrap;
  justify-content: center;

  svg { flex-shrink: 0; width: 12px; height: 12px; }
`;

const TimeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(146, 86, 62, 0.08);
  color: ${luxuryTheme.primary};
  margin-top: 4px;

  svg { width: 11px; height: 11px; }
`;

const ProviderBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(180, 143, 122, 0.10);
  color: #7A6355;
  margin-top: 2px;
`;

const RuleActions = styled.div`
  display: flex;
  gap: 6px;
  width: 100%;
  padding-top: 14px;
  border-top: 1px solid rgba(146, 86, 62, 0.06);
  justify-content: center;
  align-items: center;
`;

const IconButton = styled.button<{ $variant?: 'danger' | 'success' | 'muted' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid ${props => {
    if (props.$variant === 'danger') return `${luxuryTheme.error}30`;
    if (props.$variant === 'success') return `${luxuryTheme.primary}30`;
    return luxuryTheme.border;
  }};
  background: ${props => {
    if (props.$variant === 'danger') return `${luxuryTheme.error}10`;
    if (props.$variant === 'success') return `${luxuryTheme.primary}10`;
    return luxuryTheme.surface;
  }};
  color: ${props => {
    if (props.$variant === 'danger') return luxuryTheme.error;
    if (props.$variant === 'success') return luxuryTheme.primary;
    return luxuryTheme.textSecondary;
  }};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 40px;
  background: ${luxuryTheme.surface};
  border: 1px dashed ${luxuryTheme.border};
  border-radius: 16px;
  animation: ${fadeInUp} 0.6s ease-out;
  margin-bottom: 40px;

  svg {
    width: 56px;
    height: 56px;
    color: ${luxuryTheme.primary};
    margin-bottom: 16px;
    animation: ${float} 3s ease-in-out infinite;
  }

  h3 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 22px;
    color: ${luxuryTheme.text};
    margin: 0 0 8px;
  }

  p {
    color: ${luxuryTheme.textSecondary};
    margin: 0;
    line-height: 1.6;
  }
`;

const EmptyStateCTA = styled.button`
  margin-top: 20px;
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, ${luxuryTheme.primary}, #B8784E);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(146, 86, 62, 0.3);
  }

  svg {
    width: 16px;
    height: 16px;
    color: white;
    margin: 0;
    animation: none;
  }
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(61, 46, 36, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: ${fadeInUp} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: ${luxuryTheme.surface};
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow: visible;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  animation: ${fadeInUp} 0.4s ease-out;
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight});
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 20px 20px 0 0;

  h2 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 24px;
    font-weight: 600;
    color: white;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const CloseButton = styled.button`
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: rotate(90deg);
  }
`;

const ModalBody = styled.div`
  padding: 28px;
  overflow: visible;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    font-weight: 500;
    color: ${luxuryTheme.text};
    margin-bottom: 8px;
    font-size: 14px;

    span { color: ${luxuryTheme.error}; }
  }

  small {
    display: block;
    margin-top: 6px;
    color: ${luxuryTheme.textSecondary};
    font-size: 12px;
  }
`;

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const SelectTrigger = styled.button<{ $open?: boolean }>`
  width: 100%;
  padding: 14px 40px 14px 16px;
  background: ${luxuryTheme.cream};
  border: 1px solid ${props => props.$open ? luxuryTheme.primary : luxuryTheme.border};
  border-radius: 10px;
  font-size: 14px;
  font-family: ${theme.typography.fontFamily};
  color: ${luxuryTheme.text};
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;

  ${props => props.$open && css`
    background: ${luxuryTheme.surface};
    box-shadow: 0 0 0 3px ${luxuryTheme.primary}15;
  `}

  &:hover {
    border-color: ${luxuryTheme.primaryLight};
  }

  svg {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%) ${props => props.$open ? 'rotate(180deg)' : 'rotate(0)'};
    transition: transform 0.25s ease;
    color: ${luxuryTheme.primary};
    pointer-events: none;
  }
`;

const SelectMenu = styled.div<{ $open?: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 20;
  overflow: hidden;
  opacity: ${props => props.$open ? 1 : 0};
  transform: ${props => props.$open ? 'translateY(0)' : 'translateY(-4px)'};
  pointer-events: ${props => props.$open ? 'auto' : 'none'};
  transition: all 0.2s ease;
  max-height: 220px;
  overflow-y: auto;
`;

const SelectOption = styled.button<{ $selected?: boolean }>`
  width: 100%;
  padding: 11px 16px;
  background: ${props => props.$selected ? `${luxuryTheme.primary}08` : 'transparent'};
  border: none;
  font-size: 13px;
  font-family: ${theme.typography.fontFamily};
  color: ${props => props.$selected ? luxuryTheme.primary : luxuryTheme.text};
  font-weight: ${props => props.$selected ? 500 : 400};
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;

  &:hover {
    background: ${luxuryTheme.primary}06;
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  background: ${luxuryTheme.cream};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 10px;
  font-size: 14px;
  color: ${luxuryTheme.text};
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${luxuryTheme.primary};
    background: ${luxuryTheme.surface};
    box-shadow: 0 0 0 3px ${luxuryTheme.primary}15;
  }
`;

const ModalFooter = styled.div`
  padding: 20px 28px;
  border-top: 1px solid ${luxuryTheme.border};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: ${luxuryTheme.cream};
  border-radius: 0 0 20px 20px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.$variant === 'primary' ? css`
    background: linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight});
    color: white;
    border: none;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px ${luxuryTheme.primary}40;
    }
  ` : css`
    background: transparent;
    color: ${luxuryTheme.text};
    border: 1px solid ${luxuryTheme.border};

    &:hover {
      background: ${luxuryTheme.surface};
      border-color: ${luxuryTheme.primaryLight};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Alert = styled.div<{ $variant: 'error' | 'success' }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  background: ${props => props.$variant === 'error' ? luxuryTheme.errorLight : luxuryTheme.successLight};
  color: ${props => props.$variant === 'error' ? luxuryTheme.error : luxuryTheme.success};
  border: 1px solid ${props => props.$variant === 'error' ? `${luxuryTheme.error}30` : `${luxuryTheme.success}30`};

  svg { flex-shrink: 0; margin-top: 2px; }
`;

const InfoBox = styled.div`
  background: ${luxuryTheme.primary}08;
  border: 1px solid ${luxuryTheme.primary}20;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 32px;
  font-size: 14px;
  color: ${luxuryTheme.textSecondary};
  line-height: 1.6;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 50ms;
  animation-fill-mode: both;

  strong { color: ${luxuryTheme.text}; }
`;

// Confirmation Modal Styles
const ConfirmOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(61, 46, 36, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
  animation: ${fadeInUp} 0.2s ease-out;
`;

const ConfirmCard = styled.div`
  background: ${luxuryTheme.surface};
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  animation: ${fadeInUp} 0.35s ease-out;
  text-align: center;
`;

const ConfirmBody = styled.div`
  padding: 36px 32px 28px;
`;

const ConfirmIconCircle = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(196, 131, 106, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: ${luxuryTheme.error};
`;

const ConfirmTitle = styled.h3`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 20px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  margin: 0 0 8px;
`;

const ConfirmText = styled.p`
  font-size: 14px;
  color: ${luxuryTheme.textSecondary};
  margin: 0 0 8px;
  line-height: 1.5;
`;

const ConfirmName = styled.span`
  font-weight: 600;
  color: ${luxuryTheme.text};
`;

const ConfirmFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 0 32px 28px;
`;

const ConfirmBtn = styled.button<{ $danger?: boolean }>`
  flex: 1;
  padding: 13px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;

  ${props => props.$danger ? css`
    background: linear-gradient(135deg, ${luxuryTheme.error}, #A66B55);
    color: white;
    border: none;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(196, 131, 106, 0.4);
    }
  ` : css`
    background: transparent;
    color: ${luxuryTheme.text};
    border: 1px solid ${luxuryTheme.border};

    &:hover {
      background: ${luxuryTheme.cream};
      border-color: ${luxuryTheme.primaryLight};
    }
  `}

  &:active {
    transform: translateY(0);
  }
`;

// ============================================
// HELPERS
// ============================================
function formatMinutes(minutes: number): string {
  if (minutes >= 1440) {
    const h = minutes / 60;
    return h >= 24 ? `${Math.round(h / 24)}d` : `${h}h`;
  }
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${minutes}min`;
}

function formatMinutesLong(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days} dia(s) antes`;
  }
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min antes` : `${h} hora(s) antes`;
  }
  return `${minutes} minutos antes`;
}

const TEMPLATE_OPTIONS = [
  { value: 'reminder_24h', label: 'Lembrete 24h (paciente)' },
  { value: 'reminder_1h', label: 'Lembrete 1h (paciente)' },
  { value: 'provider_reminder_2h', label: 'Lembrete 2h (medico)' },
  { value: 'provider_reminder_15min', label: 'Lembrete 15min (medico)' },
  { value: 'reminder_daily_provider', label: 'Resumo diario (medico)' },
];

const MINUTES_PRESETS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 360, label: '6 horas' },
  { value: 720, label: '12 horas' },
  { value: 1440, label: '24 horas (1 dia)' },
  { value: 2880, label: '48 horas (2 dias)' },
  { value: 0, label: 'Personalizado...' },
];

// ============================================
// COMPONENT
// ============================================
const NotificationRulesPage: React.FC = () => {
  const location = useLocation();
  const { providerId, isAdmin, isProvider } = useCurrentProvider();
  const isDoctorView = location.pathname.startsWith('/doctor');

  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteRule, setConfirmDeleteRule] = useState<NotificationRule | null>(null);
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const selectRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Click-outside handler for custom selects
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openSelect) {
        const ref = selectRefs.current[openSelect];
        if (ref && !ref.contains(e.target as Node)) {
          setOpenSelect(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSelect]);

  const [formData, setFormData] = useState({
    target_role: 'provider' as 'patient' | 'provider',
    provider_id: '',
    minutes_before: 60,
    custom_minutes: '',
    template_name: 'provider_reminder_2h',
    use_preset: true,
  });

  useEffect(() => {
    fetchData();
  }, [providerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Doctor view: only their own provider rules + global provider rules
      let rulesQuery = supabaseAdmin
        .from('notification_rules')
        .select('*')
        .order('target_role')
        .order('minutes_before', { ascending: false });

      if (isDoctorView && providerId) {
        rulesQuery = rulesQuery
          .eq('target_role', 'provider')
          .or(`provider_id.eq.${providerId},provider_id.is.null`);
      }

      const [rulesRes, providersRes] = await Promise.all([
        rulesQuery,
        supabaseAdmin
          .from('providers')
          .select('id, user_id, profile:profiles!providers_user_id_fkey(first_name, last_name)')
          .eq('is_active', true),
      ]);

      if (rulesRes.error) throw rulesRes.error;
      setRules(rulesRes.data || []);

      if (!providersRes.error && providersRes.data) {
        setProviders(providersRes.data.map((p: any) => {
          const profile = Array.isArray(p.profile) ? p.profile[0] : p.profile;
          return {
            id: p.id,
            name: profile ? `Dr(a). ${profile.first_name} ${profile.last_name}` : 'Desconhecido',
          };
        }));
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (rule: NotificationRule) => {
    try {
      const { error } = await supabaseAdmin
        .from('notification_rules')
        .update({ is_active: !rule.is_active, updated_at: new Date().toISOString() })
        .eq('id', rule.id);

      if (error) throw error;
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    } catch (err: any) {
      console.error('Error toggling rule:', err);
    }
  };

  const handleDelete = (rule: NotificationRule) => {
    setConfirmDeleteRule(rule);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteRule) return;

    try {
      const { error } = await supabaseAdmin
        .from('notification_rules')
        .delete()
        .eq('id', confirmDeleteRule.id);

      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== confirmDeleteRule.id));
      setConfirmDeleteRule(null);
    } catch (err: any) {
      console.error('Error deleting rule:', err);
    }
  };

  const handleOpenModal = (rule?: NotificationRule) => {
    if (rule) {
      setEditingRule(rule);
      const isPreset = MINUTES_PRESETS.some(p => p.value === rule.minutes_before);
      setFormData({
        target_role: rule.target_role,
        provider_id: rule.provider_id || '',
        minutes_before: isPreset ? rule.minutes_before : 0,
        custom_minutes: isPreset ? '' : String(rule.minutes_before),
        template_name: rule.template_name,
        use_preset: isPreset,
      });
    } else {
      setEditingRule(null);
      setFormData({
        target_role: isDoctorView ? 'provider' : 'patient',
        provider_id: isDoctorView && providerId ? providerId : '',
        minutes_before: isDoctorView ? 120 : 60,
        custom_minutes: '',
        template_name: isDoctorView ? 'provider_reminder_2h' : 'reminder_1h',
        use_preset: true,
      });
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSave = async () => {
    const minutes = formData.use_preset
      ? formData.minutes_before
      : parseInt(formData.custom_minutes, 10);

    if (!minutes || minutes <= 0) {
      setError('Informe um tempo valido');
      return;
    }

    if (!formData.template_name) {
      setError('Selecione um template');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingRule) {
        // Update existing
        const { data, error } = await supabaseAdmin
          .from('notification_rules')
          .update({
            target_role: formData.target_role,
            provider_id: isDoctorView && providerId ? providerId : (formData.provider_id || null),
            minutes_before: minutes,
            template_name: formData.template_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRule.id)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            setError('Ja existe uma regra com esse mesmo destinatario, medico e tempo.');
          } else {
            throw error;
          }
          return;
        }

        setRules(prev => prev.map(r => r.id === editingRule.id ? data : r));
        setSuccess('Regra atualizada com sucesso!');
      } else {
        // Create new
        const { data, error } = await supabaseAdmin
          .from('notification_rules')
          .insert({
            target_role: formData.target_role,
            provider_id: isDoctorView && providerId ? providerId : (formData.provider_id || null),
            minutes_before: minutes,
            template_name: formData.template_name,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            setError('Ja existe uma regra com esse mesmo destinatario, medico e tempo.');
          } else {
            throw error;
          }
          return;
        }

        setRules(prev => [...prev, data]);
        setSuccess('Regra criada com sucesso!');
      }
      setTimeout(() => setShowModal(false), 1000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar regra');
    } finally {
      setSaving(false);
    }
  };

  const getProviderName = (providerId: string | null): string => {
    if (!providerId) return 'Global (todos)';
    return providers.find(p => p.id === providerId)?.name || 'Desconhecido';
  };

  const patientRules = rules.filter(r => r.target_role === 'patient');
  const providerRules = rules.filter(r => r.target_role === 'provider');
  const globalProviderRules = providerRules.filter(r => !r.provider_id);
  const myProviderRules = providerRules.filter(r => r.provider_id);

  // Helper to render a rule card
  const renderRuleCard = (rule: NotificationRule, index: number, canEdit: boolean) => (
    <RuleCard key={rule.id} $index={index} $active={rule.is_active}>
      <RuleIcon $role={rule.target_role}>
        {rule.target_role === 'patient' ? <Users size={24} /> : <Stethoscope size={24} />}
      </RuleIcon>
      <RuleInfo>
        <RuleName>{rule.template_name.replace(/_/g, ' ')}</RuleName>
        <RuleDetail>
          <Clock size={12} />
          {formatMinutesLong(rule.minutes_before)}
        </RuleDetail>
      </RuleInfo>
      <TimeBadge>
        <Clock size={11} />
        {formatMinutes(rule.minutes_before)}
      </TimeBadge>
      {!isDoctorView && rule.target_role === 'provider' && (
        <ProviderBadge>
          {rule.provider_id ? getProviderName(rule.provider_id) : 'Global (todos)'}
        </ProviderBadge>
      )}
      {canEdit ? (
        <RuleActions>
          <IconButton onClick={() => handleOpenModal(rule)} title="Editar">
            <Edit2 size={15} />
          </IconButton>
          <IconButton
            $variant={rule.is_active ? 'success' : 'muted'}
            onClick={() => handleToggle(rule)}
            title={rule.is_active ? 'Desativar' : 'Ativar'}
          >
            {rule.is_active ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
          </IconButton>
          <IconButton $variant="danger" onClick={() => handleDelete(rule)} title="Excluir">
            <Trash2 size={15} />
          </IconButton>
        </RuleActions>
      ) : (
        <RuleActions>
          <ProviderBadge style={{ marginTop: 0 }}>Padrao da clinica</ProviderBadge>
        </RuleActions>
      )}
    </RuleCard>
  );

  const pageTitle = isDoctorView ? 'Meus Lembretes' : 'Notificacoes';
  const pageSubtitle = isDoctorView
    ? 'Configure quando deseja receber lembretes de consulta via WhatsApp'
    : 'Configure os lembretes automaticos de consulta via WhatsApp';

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
          <AddButton onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Nova Regra
          </AddButton>
        </Header>

        <InfoBox>
          {isDoctorView ? (
            <>
              <strong>Como funciona:</strong> Crie regras para receber lembretes via WhatsApp antes das suas consultas.
              Cada lembrete e enviado apenas uma vez (sem duplicatas).
            </>
          ) : (
            <>
              <strong>Como funciona:</strong> O sistema verifica a cada 5 minutos se ha consultas confirmadas
              que se encaixam nas regras abaixo. Cada lembrete e enviado apenas uma vez (sem duplicatas).
            </>
          )}
        </InfoBox>

        {/* ===== ADMIN VIEW: Patient + Provider rules ===== */}
        {!isDoctorView && (
          <>
            <SectionTitle>
              <Users size={22} />
              Lembretes para Pacientes
            </SectionTitle>

            {patientRules.length === 0 ? (
              <EmptyState>
                <Bell />
                <h3>Nenhuma regra de paciente</h3>
                <p>Defina quando o paciente recebe um lembrete por WhatsApp antes da consulta.<br />
                Ex: 24 horas antes, 1 hora antes.</p>
                <EmptyStateCTA onClick={() => handleOpenModal()}>
                  <Plus size={16} />
                  Criar Regra
                </EmptyStateCTA>
              </EmptyState>
            ) : (
              <RulesGrid>
                {patientRules.map((rule, index) => renderRuleCard(rule, index, true))}
              </RulesGrid>
            )}

            <SectionTitle>
              <Stethoscope size={22} />
              Lembretes para Medicos
            </SectionTitle>

            {providerRules.length === 0 ? (
              <EmptyState>
                <Bell />
                <h3>Nenhuma regra de medico</h3>
                <p>Envie lembretes por WhatsApp aos medicos antes de cada consulta.<br />
                Cada medico pode personalizar seus proprios lembretes no painel.</p>
                <EmptyStateCTA onClick={() => handleOpenModal()}>
                  <Plus size={16} />
                  Criar Regra
                </EmptyStateCTA>
              </EmptyState>
            ) : (
              <RulesGrid>
                {providerRules.map((rule, index) => renderRuleCard(rule, index, true))}
              </RulesGrid>
            )}
          </>
        )}

        {/* ===== DOCTOR VIEW: Only their own rules (editable) ===== */}
        {isDoctorView && (
          <>
            <SectionTitle>
              <Bell size={22} />
              Meus Lembretes
            </SectionTitle>

            {myProviderRules.length === 0 ? (
              <EmptyState>
                <Bell />
                <h3>Nenhum lembrete configurado</h3>
                <p>Receba avisos por WhatsApp antes das suas consultas.<br />
                Escolha quanto tempo antes deseja ser lembrado (ex: 2 horas, 15 minutos).</p>
                <EmptyStateCTA onClick={() => handleOpenModal()}>
                  <Plus size={16} />
                  Criar Lembrete
                </EmptyStateCTA>
              </EmptyState>
            ) : (
              <RulesGrid>
                {myProviderRules.map((rule, index) => renderRuleCard(rule, index, true))}
              </RulesGrid>
            )}

            {globalProviderRules.length > 0 && (
              <>
                <SectionTitle style={{ marginTop: 32, opacity: 0.7 }}>
                  <Users size={22} />
                  Lembretes Padrao da Clinica
                </SectionTitle>
                <p style={{ fontSize: 13, color: luxuryTheme.textSecondary, margin: '-16px 0 20px', opacity: 0.6 }}>
                  Regras configuradas pela administracao — aplicam-se a todos os medicos
                </p>
                <RulesGrid>
                  {globalProviderRules.map((rule, index) => renderRuleCard(rule, index, false))}
                </RulesGrid>
              </>
            )}
          </>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {confirmDeleteRule && (
          <ConfirmOverlay onClick={() => setConfirmDeleteRule(null)}>
            <ConfirmCard onClick={(e) => e.stopPropagation()}>
              <ConfirmBody>
                <ConfirmIconCircle>
                  <AlertTriangle size={28} />
                </ConfirmIconCircle>
                <ConfirmTitle>Excluir Regra</ConfirmTitle>
                <ConfirmText>
                  Tem certeza que deseja excluir a regra <ConfirmName>{confirmDeleteRule.template_name.replace(/_/g, ' ')}</ConfirmName>?
                </ConfirmText>
                <ConfirmText style={{ fontSize: 13, opacity: 0.7 }}>
                  O lembrete de {formatMinutesLong(confirmDeleteRule.minutes_before)} nao sera mais enviado.
                </ConfirmText>
              </ConfirmBody>
              <ConfirmFooter>
                <ConfirmBtn onClick={() => setConfirmDeleteRule(null)}>
                  Cancelar
                </ConfirmBtn>
                <ConfirmBtn $danger onClick={confirmDelete}>
                  Excluir
                </ConfirmBtn>
              </ConfirmFooter>
            </ConfirmCard>
          </ConfirmOverlay>
        )}

        {/* Modal Nova Regra */}
        {showModal && (
          <ModalOverlay onClick={() => setShowModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>
                  <Bell size={22} />
                  {editingRule ? 'Editar Regra' : 'Nova Regra'}
                </h2>
                <CloseButton onClick={() => setShowModal(false)}>
                  <X size={18} />
                </CloseButton>
              </ModalHeader>

              <ModalBody>
                {error && (
                  <Alert $variant="error">
                    <AlertCircle size={18} />
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert $variant="success">
                    <Check size={18} />
                    {success}
                  </Alert>
                )}

                {!isDoctorView && (
                  <FormGroup>
                    <label>Destinatario <span>*</span></label>
                    <SelectWrapper ref={el => { selectRefs.current['target_role'] = el; }}>
                      <SelectTrigger
                        type="button"
                        $open={openSelect === 'target_role'}
                        onClick={() => setOpenSelect(openSelect === 'target_role' ? null : 'target_role')}
                      >
                        {formData.target_role === 'patient' ? 'Paciente' : 'Medico'}
                        <ChevronDown size={16} />
                      </SelectTrigger>
                      <SelectMenu $open={openSelect === 'target_role'}>
                        {[{ value: 'patient', label: 'Paciente' }, { value: 'provider', label: 'Medico' }].map(opt => (
                          <SelectOption
                            key={opt.value}
                            type="button"
                            $selected={formData.target_role === opt.value}
                            onClick={() => {
                              setFormData({ ...formData, target_role: opt.value as any });
                              setOpenSelect(null);
                            }}
                          >
                            {opt.label}
                          </SelectOption>
                        ))}
                      </SelectMenu>
                    </SelectWrapper>
                  </FormGroup>
                )}

                {!isDoctorView && formData.target_role === 'provider' && (
                  <FormGroup>
                    <label>Medico especifico</label>
                    <SelectWrapper ref={el => { selectRefs.current['provider_id'] = el; }}>
                      <SelectTrigger
                        type="button"
                        $open={openSelect === 'provider_id'}
                        onClick={() => setOpenSelect(openSelect === 'provider_id' ? null : 'provider_id')}
                      >
                        {formData.provider_id
                          ? providers.find(p => p.id === formData.provider_id)?.name || 'Selecionar'
                          : 'Global (todos os medicos)'}
                        <ChevronDown size={16} />
                      </SelectTrigger>
                      <SelectMenu $open={openSelect === 'provider_id'}>
                        <SelectOption
                          type="button"
                          $selected={!formData.provider_id}
                          onClick={() => {
                            setFormData({ ...formData, provider_id: '' });
                            setOpenSelect(null);
                          }}
                        >
                          Global (todos os medicos)
                        </SelectOption>
                        {providers.map(p => (
                          <SelectOption
                            key={p.id}
                            type="button"
                            $selected={formData.provider_id === p.id}
                            onClick={() => {
                              setFormData({ ...formData, provider_id: p.id });
                              setOpenSelect(null);
                            }}
                          >
                            {p.name}
                          </SelectOption>
                        ))}
                      </SelectMenu>
                    </SelectWrapper>
                    <small>Regras especificas de um medico substituem as regras globais</small>
                  </FormGroup>
                )}

                <FormGroup>
                  <label>Tempo antes da consulta <span>*</span></label>
                  <SelectWrapper ref={el => { selectRefs.current['minutes'] = el; }}>
                    <SelectTrigger
                      type="button"
                      $open={openSelect === 'minutes'}
                      onClick={() => setOpenSelect(openSelect === 'minutes' ? null : 'minutes')}
                    >
                      {formData.use_preset
                        ? MINUTES_PRESETS.find(p => p.value === formData.minutes_before)?.label || 'Selecionar'
                        : 'Personalizado...'}
                      <ChevronDown size={16} />
                    </SelectTrigger>
                    <SelectMenu $open={openSelect === 'minutes'}>
                      {MINUTES_PRESETS.map(p => (
                        <SelectOption
                          key={p.value}
                          type="button"
                          $selected={formData.use_preset && formData.minutes_before === p.value}
                          onClick={() => {
                            if (p.value === 0) {
                              setFormData({ ...formData, use_preset: false, custom_minutes: '' });
                            } else {
                              setFormData({ ...formData, use_preset: true, minutes_before: p.value });
                            }
                            setOpenSelect(null);
                          }}
                        >
                          {p.label}
                        </SelectOption>
                      ))}
                    </SelectMenu>
                  </SelectWrapper>
                </FormGroup>

                {!formData.use_preset && (
                  <FormGroup>
                    <label>Minutos antes <span>*</span></label>
                    <FormInput
                      type="number"
                      min="1"
                      value={formData.custom_minutes}
                      onChange={(e) => setFormData({ ...formData, custom_minutes: e.target.value })}
                      placeholder="Ex: 90 (1h30)"
                    />
                  </FormGroup>
                )}

                <FormGroup>
                  <label>Template da mensagem <span>*</span></label>
                  <SelectWrapper ref={el => { selectRefs.current['template'] = el; }}>
                    <SelectTrigger
                      type="button"
                      $open={openSelect === 'template'}
                      onClick={() => setOpenSelect(openSelect === 'template' ? null : 'template')}
                    >
                      {TEMPLATE_OPTIONS.find(t => t.value === formData.template_name)?.label || 'Selecionar'}
                      <ChevronDown size={16} />
                    </SelectTrigger>
                    <SelectMenu $open={openSelect === 'template'}>
                      {TEMPLATE_OPTIONS
                        .filter(t => isDoctorView
                          ? t.value.includes('provider')
                          : !isDoctorView && formData.target_role === 'patient'
                            ? !t.value.includes('provider')
                            : true
                        )
                        .map(t => (
                          <SelectOption
                            key={t.value}
                            type="button"
                            $selected={formData.template_name === t.value}
                            onClick={() => {
                              setFormData({ ...formData, template_name: t.value });
                              setOpenSelect(null);
                            }}
                          >
                            {t.label}
                          </SelectOption>
                        ))}
                    </SelectMenu>
                  </SelectWrapper>
                  <small>O template determina o conteudo da mensagem enviada</small>
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <Button $variant="secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button $variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : editingRule ? 'Salvar' : 'Criar Regra'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default NotificationRulesPage;
