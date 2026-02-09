import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import {
  Edit3,
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  Activity,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  X,
  Save,
  Camera,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Profile, AppointmentStatus } from '../../types/database';
import { getPatientTypeLabel, getTreatmentLabel } from '../../constants/treatments';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const ProfileHeader = styled.div`
  position: relative;
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xxl};
  padding: ${theme.spacing.xxl};
  margin-bottom: ${theme.spacing.xl};
  box-shadow: ${theme.shadows.card};
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${theme.colors.primary}, #B48F7A, ${theme.colors.primary});
    background-size: 200% 100%;
    animation: ${shimmer} 3s linear infinite;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.xl};
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const AvatarContainer = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const AvatarImage = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, #7A4532);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 42px;
  font-weight: 600;
  color: white;
  box-shadow: 0 8px 32px rgba(146, 86, 62, 0.25);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarUploadOverlay = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${theme.colors.primary};
  color: white;
  border: 3px solid ${theme.colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

const PatientName = styled.h1`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 32px;
  font-weight: 400;
  color: ${theme.colors.text};
  margin: 0 0 ${theme.spacing.sm};
  letter-spacing: 0.5px;
`;

const PatientMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.md};
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: ${theme.borderRadius.full};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: ${theme.colors.primarySoft};
  color: ${theme.colors.primaryHover};
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${theme.colors.textSecondary};
  font-size: 14px;

  svg {
    width: 16px;
    height: 16px;
    color: ${theme.colors.primary};
  }
`;

const ContactRow = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ContactItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${theme.colors.textSecondary};
  font-size: 14px;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${theme.colors.surface};
  color: ${theme.colors.text};
  border: 1px solid ${theme.colors.border};

  &:hover {
    background: ${theme.colors.background};
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ $color: string; $delay?: number }>`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  position: relative;
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: ${props => props.$delay || 0}ms;
  animation-fill-mode: both;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => props.$color};
  }
`;

const StatValue = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 32px;
  font-weight: 400;
  color: ${theme.colors.text};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div<{ $delay?: number; $borderColor?: string }>`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  box-shadow: ${theme.shadows.card};
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: ${props => props.$delay || 0}ms;
  animation-fill-mode: both;
  border-left: 4px solid ${props => props.$borderColor || theme.colors.primary};
`;

const FullWidthCard = styled(Card)`
  grid-column: 1 / -1;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.borderLight};
`;

const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 18px;
  font-weight: 400;
  color: ${theme.colors.text};
  margin: 0;

  svg {
    width: 20px;
    height: 20px;
    color: ${theme.colors.primary};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.lg};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${theme.colors.text};
`;

const AppointmentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const AppointmentItem = styled.div<{ $status: AppointmentStatus }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  border-left: 4px solid ${props => {
    switch (props.$status) {
      case 'completed': return '#92563E';
      case 'confirmed': return '#B48F7A';
      case 'pending': return '#D4A574';
      case 'cancelled': return '#C4836A';
      case 'no_show': return '#8C8B8B';
      default: return theme.colors.border;
    }
  }};
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(4px);
    background: ${theme.colors.surfaceHover};
  }
`;

const AppointmentIcon = styled.div<{ $status: AppointmentStatus }>`
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.$status) {
      case 'completed': return 'rgba(146, 86, 62, 0.1)';
      case 'confirmed': return 'rgba(180, 143, 122, 0.12)';
      case 'pending': return 'rgba(212, 165, 116, 0.12)';
      case 'cancelled': return 'rgba(196, 131, 106, 0.1)';
      default: return theme.colors.background;
    }
  }};

  svg {
    width: 20px;
    height: 20px;
    color: ${props => {
      switch (props.$status) {
        case 'completed': return '#92563E';
        case 'confirmed': return '#B48F7A';
        case 'pending': return '#D4A574';
        case 'cancelled': return '#C4836A';
        default: return theme.colors.textSecondary;
      }
    }};
  }
`;

const AppointmentInfo = styled.div`
  flex: 1;
`;

const AppointmentTitle = styled.div`
  font-weight: 600;
  color: ${theme.colors.text};
  font-size: 14px;
  margin-bottom: 2px;
`;

const AppointmentMeta = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $status: AppointmentStatus }>`
  padding: 4px 10px;
  border-radius: ${theme.borderRadius.full};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    switch (props.$status) {
      case 'completed': return 'rgba(146, 86, 62, 0.1)';
      case 'confirmed': return 'rgba(180, 143, 122, 0.1)';
      case 'pending': return 'rgba(212, 165, 116, 0.12)';
      case 'cancelled': return 'rgba(196, 131, 106, 0.1)';
      default: return theme.colors.background;
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'completed': return '#92563E';
      case 'confirmed': return '#B48F7A';
      case 'pending': return '#A67B5B';
      case 'cancelled': return '#C4836A';
      default: return theme.colors.textSecondary;
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl};
  color: ${theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${theme.spacing.md};
    opacity: 0.4;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${theme.colors.overlay};
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.lg};
`;

const ModalContainer = styled.div`
  background: ${theme.colors.surface};
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  box-shadow: ${theme.shadows.xl};
  overflow: hidden;
  animation: ${slideIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight}, ${theme.colors.primary});
    background-size: 200% 100%;
    animation: ${shimmer} 3s linear infinite;
  }
`;

const ModalHeader = styled.div`
  padding: 28px 28px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${theme.colors.borderLight};
`;

const ModalTitle = styled.h2`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 22px;
  font-weight: 400;
  color: ${theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;

  svg {
    width: 24px;
    height: 24px;
    color: ${theme.colors.primary};
  }
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${theme.colors.background};
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.primarySoft};
    color: ${theme.colors.primary};
    transform: rotate(90deg);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalBody = styled.div`
  padding: 24px 28px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  ${props => props.$fullWidth && css`grid-column: 1 / -1;`}
`;

const FormLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  color: ${theme.colors.text};
  background: ${theme.colors.surface};
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primaryA40};
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }

  &:disabled {
    background: ${theme.colors.background};
    color: ${theme.colors.textSecondary};
    cursor: not-allowed;
  }
`;

const ModalFooter = styled.div`
  padding: 20px 28px 28px;
  display: flex;
  gap: 12px;
  border-top: 1px solid ${theme.colors.borderLight};
`;

const ModalButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  ${props => props.$variant === 'primary' ? css`
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover});
    color: white;
    border: none;
    box-shadow: ${theme.shadows.primary};

    &:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  ` : css`
    background: ${theme.colors.surface};
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.background};
    }
  `}

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: ${theme.colors.successLight};
  border: 1px solid ${theme.colors.successA30};
  border-radius: 12px;
  color: #065F46;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;

  svg {
    width: 18px;
    height: 18px;
    color: #059669;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: ${theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${theme.spacing.md};
    animation: ${pulse} 1.5s ease-in-out infinite;
    color: ${theme.colors.primary};
  }
`;

// Helpers

const getStatusIcon = (status: AppointmentStatus) => {
  switch (status) {
    case 'completed': return <CheckCircle />;
    case 'confirmed': return <Calendar />;
    case 'pending': return <Clock />;
    case 'cancelled': return <XCircle />;
    case 'no_show': return <AlertCircle />;
    default: return <Calendar />;
  }
};

// getStatusLabel moved inside component to access t()


const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface AppointmentWithProvider {
  id: string;
  type: string;
  status: AppointmentStatus;
  scheduled_at: string;
  duration: number;
  notes: string | null;
  provider?: {
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const getStatusLabel = (status: AppointmentStatus): string => {
    const statusMap: Record<string, string> = {
      completed: t('status.completed'),
      confirmed: t('status.confirmed'),
      pending: t('status.pending'),
      cancelled: t('status.cancelled'),
      no_show: t('status.noShow'),
      checked_in: t('status.checkedIn'),
      in_progress: t('status.inProgress'),
    };
    return statusMap[status] || status;
  };

  const [appointments, setAppointments] = useState<AppointmentWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, upcoming: 0 });

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchAppointments();
    }
  }, [profile]);

  const fetchAppointments = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, type, status, scheduled_at, duration, notes,
          provider:providers!appointments_provider_id_fkey(
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('patient_id', profile.id)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      // Normalize Supabase nested relations (arrays → single objects)
      const normalized = (data || []).map((a: any) => ({
        ...a,
        provider: Array.isArray(a.provider) ? a.provider[0] : a.provider,
      })).map((a: any) => ({
        ...a,
        provider: a.provider ? {
          ...a.provider,
          profile: Array.isArray(a.provider.profile) ? a.provider.profile[0] : a.provider.profile,
        } : undefined,
      }));
      setAppointments(normalized);

      const now = new Date();
      const total = data?.length || 0;
      const completed = data?.filter(a => a.status === 'completed').length || 0;
      const upcoming = data?.filter(a =>
        new Date(a.scheduled_at) > now &&
        !['cancelled', 'no_show', 'completed'].includes(a.status)
      ).length || 0;
      setStats({ total, completed, upcoming });
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingAppointments = appointments.filter(a =>
    new Date(a.scheduled_at) > new Date() &&
    !['cancelled', 'no_show', 'completed'].includes(a.status)
  ).slice(0, 5);

  const pastAppointments = appointments.filter(a =>
    new Date(a.scheduled_at) <= new Date() ||
    ['cancelled', 'no_show', 'completed'].includes(a.status)
  ).slice(0, 10);

  const openEditModal = () => {
    if (profile) {
      setEditForm({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone || '',
      });
      setSaveSuccess(false);
      setIsEditModalOpen(true);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(closeEditModal, 1500);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(t('profile.avatarTooLarge'));
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${profile.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert(t('profile.avatarUploadError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!profile) {
    return (
      <Layout>
        <LoadingState>
          <Activity />
          <p>{t('profile.loading')}</p>
        </LoadingState>
      </Layout>
    );
  }

  const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();

  return (
    <Layout>
      <PageContainer>
        <ProfileHeader>
          <HeaderContent>
            <AvatarContainer>
              <AvatarImage>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.first_name} />
                ) : (
                  initials
                )}
              </AvatarImage>
              <AvatarUploadOverlay
                onClick={() => fileInputRef.current?.click()}
                title={t('profile.changePhoto')}
              >
                <Camera />
              </AvatarUploadOverlay>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
            </AvatarContainer>

            <HeaderInfo>
              <PatientName>{profile.first_name} {profile.last_name}</PatientName>

              <PatientMeta>
                <TypeBadge>
                  <Sparkles size={14} />
                  {t('patientType.' + (profile.patient_type === 'iv_therapy' ? 'ivTherapy' : (profile.patient_type || 'new')))}
                </TypeBadge>
                <MetaItem>
                  <Clock />
                  {t('profile.since', { date: formatDate(profile.created_at) })}
                </MetaItem>
              </PatientMeta>

              <ContactRow>
                <ContactItem>
                  <Mail />
                  {profile.email}
                </ContactItem>
                {profile.phone && (
                  <ContactItem>
                    <Phone />
                    {profile.phone}
                  </ContactItem>
                )}
              </ContactRow>
            </HeaderInfo>

            <HeaderActions>
              <ActionButton onClick={openEditModal}>
                <Edit3 />
                {t('common.edit')}
              </ActionButton>
            </HeaderActions>
          </HeaderContent>
        </ProfileHeader>

        <StatsRow>
          <StatCard $color="#92563E" $delay={100}>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>{t('profile.totalAppointments')}</StatLabel>
          </StatCard>
          <StatCard $color="#B48F7A" $delay={200}>
            <StatValue>{stats.completed}</StatValue>
            <StatLabel>{t('profile.completedAppointments')}</StatLabel>
          </StatCard>
          <StatCard $color="#C4836A" $delay={300}>
            <StatValue>{stats.upcoming}</StatValue>
            <StatLabel>{t('profile.upcomingAppointments')}</StatLabel>
          </StatCard>
        </StatsRow>

        <Grid>
          <Card $delay={400} $borderColor="#92563E">
            <CardHeader>
              <CardTitle>
                <User />
                {t('profile.personalData')}
              </CardTitle>
            </CardHeader>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>{t('profile.fullName')}</InfoLabel>
                <InfoValue>{profile.first_name} {profile.last_name}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>{t('profile.email')}</InfoLabel>
                <InfoValue>{profile.email}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>{t('profile.phone')}</InfoLabel>
                <InfoValue>{profile.phone || '-'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>{t('profile.preferredLanguage')}</InfoLabel>
                <InfoValue>{profile.preferred_language === 'en' ? 'English' : 'Português'}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </Card>

          <Card $delay={500} $borderColor="#B48F7A">
            <CardHeader>
              <CardTitle>
                <Activity />
                {t('profile.medicalInfo')}
              </CardTitle>
            </CardHeader>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>{t('profile.patientType')}</InfoLabel>
                <InfoValue>{t('patientType.' + (profile.patient_type === 'iv_therapy' ? 'ivTherapy' : (profile.patient_type || 'new')))}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>{t('profile.lastVisit')}</InfoLabel>
                <InfoValue>{formatDate(profile.last_visit_at)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>{t('profile.labsCompleted')}</InfoLabel>
                <InfoValue>{formatDate(profile.labs_completed_at)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>{t('profile.registeredAt')}</InfoLabel>
                <InfoValue>{formatDate(profile.created_at)}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </Card>

          {upcomingAppointments.length > 0 && (
            <FullWidthCard $delay={600} $borderColor="#C4836A">
              <CardHeader>
                <CardTitle>
                  <Calendar />
                  {t('profile.upcomingTitle')}
                </CardTitle>
              </CardHeader>
              <AppointmentList>
                {upcomingAppointments.map(apt => (
                  <AppointmentItem key={apt.id} $status={apt.status}>
                    <AppointmentIcon $status={apt.status}>
                      {getStatusIcon(apt.status)}
                    </AppointmentIcon>
                    <AppointmentInfo>
                      <AppointmentTitle>{getTreatmentLabel(apt.type, i18n.language as 'pt' | 'en')}</AppointmentTitle>
                      <AppointmentMeta>
                        <span>{formatDateTime(apt.scheduled_at)}</span>
                        <span>·</span>
                        <span>
                          {apt.provider?.profile
                            ? `${t('common.drPrefix')} ${apt.provider.profile.first_name} ${apt.provider.profile.last_name}`
                            : 'N/A'}
                        </span>
                      </AppointmentMeta>
                    </AppointmentInfo>
                    <StatusBadge $status={apt.status}>
                      {getStatusLabel(apt.status)}
                    </StatusBadge>
                  </AppointmentItem>
                ))}
              </AppointmentList>
            </FullWidthCard>
          )}

          <FullWidthCard $delay={700} $borderColor="#D4A574">
            <CardHeader>
              <CardTitle>
                <FileText />
                {t('profile.historyTitle')}
              </CardTitle>
            </CardHeader>
            {pastAppointments.length > 0 ? (
              <AppointmentList>
                {pastAppointments.map(apt => (
                  <AppointmentItem key={apt.id} $status={apt.status}>
                    <AppointmentIcon $status={apt.status}>
                      {getStatusIcon(apt.status)}
                    </AppointmentIcon>
                    <AppointmentInfo>
                      <AppointmentTitle>{getTreatmentLabel(apt.type, i18n.language as 'pt' | 'en')}</AppointmentTitle>
                      <AppointmentMeta>
                        <span>{formatDateTime(apt.scheduled_at)}</span>
                        <span>·</span>
                        <span>
                          {apt.provider?.profile
                            ? `${t('common.drPrefix')} ${apt.provider.profile.first_name} ${apt.provider.profile.last_name}`
                            : 'N/A'}
                        </span>
                      </AppointmentMeta>
                    </AppointmentInfo>
                    <StatusBadge $status={apt.status}>
                      {getStatusLabel(apt.status)}
                    </StatusBadge>
                  </AppointmentItem>
                ))}
              </AppointmentList>
            ) : (
              <EmptyState>
                <FileText />
                <p>{t('profile.noHistory')}</p>
              </EmptyState>
            )}
          </FullWidthCard>
        </Grid>
      </PageContainer>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <ModalOverlay onClick={closeEditModal}>
          <ModalContainer onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Edit3 />
                {t('profile.editTitle')}
              </ModalTitle>
              <CloseButton onClick={closeEditModal}>
                <X />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              {saveSuccess && (
                <SuccessMessage>
                  <CheckCircle />
                  {t('profile.dataSaved')}
                </SuccessMessage>
              )}

              <FormGrid>
                <FormGroup>
                  <FormLabel>{t('profile.firstName')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.first_name}
                    onChange={e => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder={t('profile.firstName')}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>{t('profile.lastName')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.last_name}
                    onChange={e => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder={t('profile.lastName')}
                  />
                </FormGroup>

                <FormGroup $fullWidth>
                  <FormLabel>{t('profile.email')}</FormLabel>
                  <FormInput
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    placeholder={t('profile.emailReadonly')}
                  />
                </FormGroup>

                <FormGroup $fullWidth>
                  <FormLabel>{t('profile.phone')}</FormLabel>
                  <FormInput
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={t('profile.phonePlaceholder')}
                  />
                </FormGroup>
              </FormGrid>
            </ModalBody>

            <ModalFooter>
              <ModalButton $variant="secondary" onClick={closeEditModal}>
                {t('common.cancel')}
              </ModalButton>
              <ModalButton
                $variant="primary"
                onClick={handleSave}
                disabled={saving || !editForm.first_name || !editForm.last_name}
              >
                {saving ? (
                  <>{t('common.saving')}</>
                ) : (
                  <>
                    <Save />
                    {t('common.save')}
                  </>
                )}
              </ModalButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}
    </Layout>
  );
};

export default ProfilePage;
