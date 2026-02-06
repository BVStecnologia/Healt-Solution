import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useLocation } from 'react-router-dom';
import {
  Bell, Plus, Trash2, Check, AlertCircle, X, Clock, Edit2,
  Users, Stethoscope, ToggleLeft, ToggleRight, Save, RefreshCw
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
  success: '#10B981',
  error: '#EF4444',
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
const PageContainer = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
  animation: ${fadeInUp} 0.6s ease-out;

  h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px;
    font-weight: 600;
    color: ${luxuryTheme.text};
    margin: 0 0 8px;
    letter-spacing: -0.5px;
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
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 600;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 100ms;
  animation-fill-mode: both;
`;

const RuleCard = styled.div<{ $index: number; $active: boolean }>`
  background: ${luxuryTheme.surface};
  border: 1px solid ${props => props.$active ? luxuryTheme.border : `${luxuryTheme.error}30`};
  border-radius: 16px;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => 150 + props.$index * 50}ms;
  animation-fill-mode: both;
  opacity: ${props => props.$active ? 1 : 0.6};

  &:hover {
    border-color: ${luxuryTheme.primary};
    box-shadow: 0 8px 24px ${luxuryTheme.primary}15;
    transform: translateX(4px);
    opacity: 1;
  }

  @media (max-width: 900px) {
    grid-template-columns: auto 1fr auto;
    gap: 16px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const RuleIcon = styled.div<{ $role: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$role === 'patient'
    ? 'linear-gradient(135deg, #6366F1, #818CF8)'
    : `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px ${props => props.$role === 'patient' ? '#6366F140' : `${luxuryTheme.primary}40`};
`;

const RuleInfo = styled.div`
  min-width: 0;
`;

const RuleName = styled.div`
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  margin-bottom: 4px;
`;

const RuleDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${luxuryTheme.textSecondary};
  font-size: 13px;
  flex-wrap: wrap;

  svg { flex-shrink: 0; }
`;

const TimeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  background: ${luxuryTheme.primary}12;
  color: ${luxuryTheme.primary};
  border: 1px solid ${luxuryTheme.primary}25;
  white-space: nowrap;

  svg { width: 14px; height: 14px; }

  @media (max-width: 900px) { display: none; }
`;

const ProviderBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 600;
  background: ${luxuryTheme.success}12;
  color: ${luxuryTheme.success};
  border: 1px solid ${luxuryTheme.success}25;
  white-space: nowrap;

  @media (max-width: 900px) { display: none; }
`;

const RuleActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 600px) {
    justify-content: flex-end;
  }
`;

const IconButton = styled.button<{ $variant?: 'danger' | 'success' | 'muted' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid ${props => {
    if (props.$variant === 'danger') return `${luxuryTheme.error}30`;
    if (props.$variant === 'success') return `${luxuryTheme.success}30`;
    return luxuryTheme.border;
  }};
  background: ${props => {
    if (props.$variant === 'danger') return `${luxuryTheme.error}10`;
    if (props.$variant === 'success') return `${luxuryTheme.success}10`;
    return luxuryTheme.surface;
  }};
  color: ${props => {
    if (props.$variant === 'danger') return luxuryTheme.error;
    if (props.$variant === 'success') return luxuryTheme.success;
    return luxuryTheme.textSecondary;
  }};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
    font-family: 'Cormorant Garamond', serif;
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
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  animation: ${fadeInUp} 0.4s ease-out;
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight});
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    font-family: 'Cormorant Garamond', serif;
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
  max-height: calc(90vh - 180px);
  overflow-y: auto;
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

const FormSelect = styled.select`
  width: 100%;
  padding: 14px 16px;
  background: ${luxuryTheme.cream};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 10px;
  font-size: 14px;
  color: ${luxuryTheme.text};
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${luxuryTheme.primary};
    background: ${luxuryTheme.surface};
    box-shadow: 0 0 0 3px ${luxuryTheme.primary}15;
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

  const handleDelete = async (rule: NotificationRule) => {
    if (!window.confirm(`Excluir regra "${rule.template_name}" (${formatMinutesLong(rule.minutes_before)})?`)) return;

    try {
      const { error } = await supabaseAdmin
        .from('notification_rules')
        .delete()
        .eq('id', rule.id);

      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== rule.id));
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
        {rule.target_role === 'patient' ? <Users size={22} /> : <Stethoscope size={22} />}
      </RuleIcon>
      <RuleInfo>
        <RuleName>{rule.template_name.replace(/_/g, ' ')}</RuleName>
        <RuleDetail>
          <Clock size={14} />
          {formatMinutesLong(rule.minutes_before)}
          {!isDoctorView && rule.target_role === 'provider' && (
            <>
              <span style={{ margin: '0 4px' }}>·</span>
              {rule.provider_id ? (
                <><Stethoscope size={14} />{getProviderName(rule.provider_id)}</>
              ) : (
                <span>Global (todos os medicos)</span>
              )}
            </>
          )}
        </RuleDetail>
      </RuleInfo>
      <TimeBadge>
        <Clock size={14} />
        {formatMinutes(rule.minutes_before)}
      </TimeBadge>
      {!isDoctorView && rule.target_role === 'provider' && (
        <ProviderBadge>
          {rule.provider_id ? getProviderName(rule.provider_id) : 'Global'}
        </ProviderBadge>
      )}
      {canEdit ? (
        <RuleActions>
          <IconButton onClick={() => handleOpenModal(rule)} title="Editar">
            <Edit2 size={16} />
          </IconButton>
          <IconButton
            $variant={rule.is_active ? 'success' : 'muted'}
            onClick={() => handleToggle(rule)}
            title={rule.is_active ? 'Desativar' : 'Ativar'}
          >
            {rule.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </IconButton>
          <IconButton $variant="danger" onClick={() => handleDelete(rule)} title="Excluir">
            <Trash2 size={16} />
          </IconButton>
        </RuleActions>
      ) : (
        <RuleActions>
          <TimeBadge style={{ background: 'transparent', border: 'none', color: luxuryTheme.textSecondary }}>
            Padrao da clinica
          </TimeBadge>
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
          </>
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
                    <FormSelect
                      value={formData.target_role}
                      onChange={(e) => setFormData({ ...formData, target_role: e.target.value as any })}
                    >
                      <option value="patient">Paciente</option>
                      <option value="provider">Medico</option>
                    </FormSelect>
                  </FormGroup>
                )}

                {!isDoctorView && formData.target_role === 'provider' && (
                  <FormGroup>
                    <label>Medico especifico</label>
                    <FormSelect
                      value={formData.provider_id}
                      onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                    >
                      <option value="">Global (todos os medicos)</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </FormSelect>
                    <small>Regras especificas de um medico substituem as regras globais</small>
                  </FormGroup>
                )}

                <FormGroup>
                  <label>Tempo antes da consulta <span>*</span></label>
                  <FormSelect
                    value={formData.use_preset ? formData.minutes_before : 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val === 0) {
                        setFormData({ ...formData, use_preset: false, custom_minutes: '' });
                      } else {
                        setFormData({ ...formData, use_preset: true, minutes_before: val });
                      }
                    }}
                  >
                    {MINUTES_PRESETS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </FormSelect>
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
                  <FormSelect
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  >
                    {TEMPLATE_OPTIONS
                      .filter(t => isDoctorView
                        ? t.value.includes('provider')
                        : !isDoctorView && formData.target_role === 'patient'
                          ? !t.value.includes('provider')
                          : true
                      )
                      .map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                  </FormSelect>
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
