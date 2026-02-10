import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes, css } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import {
  ArrowLeft,
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
  Star,
  Sparkles,
  Heart,
  Pill,
  ChevronRight,
  X,
  Save,
  Shield,
  Crown,
  Droplets,
  Upload,
  Trash2,
  ClipboardList,
  Stethoscope,
  TrendingUp,
  CalendarCheck,
  AlertTriangle,
  Globe,
  MapPin,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { Profile, Appointment, PatientType, AppointmentStatus } from '../../types/database';
import {
  getTreatmentLabel,
  getPatientTypeLabel,
  getPatientTypeColor,
  getPatientTypeBgColor,
  getPatientTypeIcon,
  ACTIVE_PATIENT_TYPES,
} from '../../constants/treatments';
import i18n from 'i18next';
import { useAdminDocuments } from '../../hooks/admin/useAdminDocuments';
import { DocumentCard } from '../../components/patient/DocumentCard';
import DocumentUploadModal from '../../components/admin/DocumentUploadModal';
import DocumentViewerModal from '../../components/ui/DocumentViewerModal';
import { PatientDocument } from '../../types/documents';

// ============================================
// ANIMATIONS — subtle, refined
// ============================================
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

// ============================================
// LAYOUT
// ============================================
const PageContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  color: ${theme.colors.textSecondary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: ${theme.spacing.lg};

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }

  svg { width: 16px; height: 16px; }
`;

// ============================================
// HEADER — refined, compact
// ============================================
const ProfileHeader = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: 28px 32px;
  margin-bottom: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.card};
  animation: ${fadeIn} 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight});
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const Avatar = styled.div<{ $hasImage?: boolean }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: ${props => props.$hasImage ? 'transparent' : '#E8E4E0'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 20px;
  }
`;

const HeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PatientName = styled.h1`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 28px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0 0 8px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 22px;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const TypeBadge = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: ${theme.borderRadius.full};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.$bg};
  color: ${props => props.$color};

  svg { width: 12px; height: 12px; }
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: ${theme.colors.textSecondary};
  font-size: 13px;

  svg { width: 14px; height: 14px; opacity: 0.6; }
`;

const ContactRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${theme.colors.textSecondary};
  font-size: 13px;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover { color: ${theme.colors.primary}; }
  svg { width: 14px; height: 14px; }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const ActionBtn = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: ${theme.borderRadius.md};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$primary ? css`
    background: ${theme.colors.primary};
    color: white;
    border: none;
    box-shadow: ${theme.shadows.primary};

    &:hover {
      background: ${theme.colors.primaryHover};
      box-shadow: 0 6px 20px rgba(146, 86, 62, 0.35);
    }
  ` : css`
    background: ${theme.colors.surface};
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};

    &:hover {
      border-color: ${theme.colors.primary};
      color: ${theme.colors.primary};
    }
  `}

  svg { width: 16px; height: 16px; }
`;

// ============================================
// STATS ROW
// ============================================
const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ $delay?: number }>`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: 20px 24px;
  box-shadow: ${theme.shadows.sm};
  display: flex;
  align-items: center;
  gap: 16px;
  animation: ${fadeIn} 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  animation-delay: ${props => props.$delay || 0}ms;
  animation-fill-mode: both;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: ${theme.shadows.md};
  }
`;

const StatIcon = styled.div<{ $bg: string; $color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${props => props.$bg};
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg { width: 20px; height: 20px; }
`;

const StatContent = styled.div``;

const StatValue = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 26px;
  font-weight: 600;
  color: ${theme.colors.text};
  line-height: 1;
  margin-bottom: 2px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  font-weight: 500;
`;

// ============================================
// CARDS — clean, no colored borders
// ============================================
const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div<{ $delay?: number }>`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.card};
  overflow: hidden;
  animation: ${fadeIn} 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  animation-delay: ${props => props.$delay || 0}ms;
  animation-fill-mode: both;
  transition: box-shadow 0.25s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid ${theme.colors.borderLight};
`;

const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0;

  svg {
    width: 18px;
    height: 18px;
    color: ${theme.colors.primary};
  }
`;

const CardBody = styled.div`
  padding: 20px 24px;
`;

const CardLink = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: gap 0.2s ease;

  &:hover { gap: 8px; }
  svg { width: 14px; height: 14px; }
`;

// ============================================
// INFO GRID
// ============================================
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div``;

const InfoLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.text};
`;

// ============================================
// APPOINTMENTS
// ============================================
const AppointmentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AppointmentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.surfaceHover};
  }
`;

const StatusDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$color};
  flex-shrink: 0;
`;

const AppointmentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AppointmentTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.text};
  margin-bottom: 2px;
`;

const AppointmentMeta = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.span<{ $bg: string; $color: string }>`
  padding: 3px 10px;
  border-radius: ${theme.borderRadius.full};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: ${props => props.$bg};
  color: ${props => props.$color};
  white-space: nowrap;
`;

// ============================================
// DOCUMENTS
// ============================================
const DocumentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const UploadBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: ${theme.borderRadius.md};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  box-shadow: ${theme.shadows.primary};

  &:hover {
    background: ${theme.colors.primaryHover};
  }

  svg { width: 14px; height: 14px; }
`;

// ============================================
// EMPTY & LOADING STATES
// ============================================
const EmptyState = styled.div`
  text-align: center;
  padding: 32px 16px;
  color: ${theme.colors.textMuted};

  svg {
    width: 40px;
    height: 40px;
    margin-bottom: 8px;
    opacity: 0.3;
    stroke-width: 1.5;
  }

  p {
    margin: 0;
    font-size: 13px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: ${theme.colors.textMuted};
  gap: 12px;
  font-size: 14px;

  svg {
    width: 32px;
    height: 32px;
    color: ${theme.colors.primary};
    opacity: 0.5;
  }
`;

// ============================================
// EDIT MODAL
// ============================================
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(57, 57, 57, 0.5);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.lg};
`;

const ModalContainer = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: ${slideIn} 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight});
    z-index: 1;
  }
`;

const ModalHeader = styled.div`
  padding: 24px 24px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${theme.colors.borderLight};
`;

const ModalTitle = styled.h2`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg { width: 20px; height: 20px; color: ${theme.colors.primary}; }
`;

const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
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
  }

  svg { width: 18px; height: 18px; }
`;

const ModalBody = styled.div`
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div<{ $full?: boolean }>`
  ${props => props.$full && css`grid-column: 1 / -1;`}
`;

const FormLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: 14px;
  color: ${theme.colors.text};
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }

  &:disabled {
    background: ${theme.colors.background};
    color: ${theme.colors.textSecondary};
    cursor: not-allowed;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: 14px;
  color: ${theme.colors.text};
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238C8B8B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: 14px;
  color: ${theme.colors.text};
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }
`;

const SectionDivider = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0 4px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${theme.colors.borderLight};
  }

  span {
    font-size: 11px;
    font-weight: 600;
    color: ${theme.colors.primary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 24px 24px;
  display: flex;
  gap: 10px;
  border-top: 1px solid ${theme.colors.borderLight};
`;

const ModalBtn = styled.button<{ $primary?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: ${theme.borderRadius.md};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$primary ? css`
    background: ${theme.colors.primary};
    color: white;
    border: none;
    box-shadow: ${theme.shadows.primary};

    &:hover:not(:disabled) {
      background: ${theme.colors.primaryHover};
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  ` : css`
    background: white;
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.background};
    }
  `}

  svg { width: 16px; height: 16px; }
`;

const SuccessMsg = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: ${theme.colors.successLight};
  border-radius: ${theme.borderRadius.md};
  color: #065F46;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;

  svg { width: 16px; height: 16px; color: ${theme.colors.success}; }
`;

// ============================================
// HELPERS
// ============================================
const ICON_MAP: Record<string, React.ReactNode> = {
  Star: <Star />,
  Activity: <Activity />,
  Heart: <Heart />,
  Sparkles: <Sparkles />,
  User: <User />,
  Crown: <Crown />,
  Droplets: <Droplets />,
};

const renderTypeIcon = (type: PatientType | null): React.ReactNode => {
  const iconName = getPatientTypeIcon(type || 'general');
  return ICON_MAP[iconName] || <User />;
};

const statusColors: Record<string, { dot: string; bg: string; text: string }> = {
  completed:   { dot: '#92563E', bg: 'rgba(146, 86, 62, 0.10)', text: '#92563E' },
  confirmed:   { dot: '#B48F7A', bg: 'rgba(180, 143, 122, 0.12)', text: '#7A6355' },
  pending:     { dot: '#D4A574', bg: 'rgba(212, 165, 116, 0.15)', text: '#A67B5B' },
  cancelled:   { dot: '#C4836A', bg: 'rgba(196, 131, 106, 0.10)', text: '#9A6B55' },
  no_show:     { dot: '#8C8B8B', bg: 'rgba(140, 139, 139, 0.10)', text: '#6B6A6A' },
  checked_in:  { dot: '#7A6355', bg: 'rgba(122, 99, 85, 0.10)', text: '#7A6355' },
  in_progress: { dot: '#7A4532', bg: 'rgba(146, 86, 62, 0.15)', text: '#7A4532' },
};

const getStatusColors = (status: string) => statusColors[status] || statusColors.pending;

const statusKeyMap: Record<string, string> = {
  completed: 'status.completed', confirmed: 'status.confirmed', pending: 'status.pending',
  cancelled: 'status.cancelled', no_show: 'status.noShow', checked_in: 'status.checkedIn',
  in_progress: 'status.inProgress',
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

interface AppointmentWithProvider extends Omit<Appointment, 'provider'> {
  provider?: {
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

const PATIENT_TYPE_OPTIONS: { value: PatientType; label: string }[] = ACTIVE_PATIENT_TYPES.map(t => ({
  value: t.key as PatientType,
  label: t.label,
}));

// ============================================
// COMPONENT
// ============================================
const PatientProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goBack } = useSmartNavigation();

  const getStatusLabel = (status: AppointmentStatus): string => {
    return statusKeyMap[status] ? t(statusKeyMap[status]) : status;
  };

  const getSelectLabel = (field: string, value: string | null | undefined): string => {
    if (!value) return '-';
    const keyMap: Record<string, Record<string, string>> = {
      sex_at_birth: { male: 'patient.sexMale', female: 'patient.sexFemale', intersex: 'patient.sexIntersex', prefer_not: 'patient.sexPreferNot' },
      marital_status: { single: 'patient.maritalSingle', married: 'patient.maritalMarried', divorced: 'patient.maritalDivorced', widowed: 'patient.maritalWidowed', partnership: 'patient.maritalPartnership', separated: 'patient.maritalSeparated' },
      ethnicity: { hispanic: 'patient.ethnicityHispanic', not_hispanic: 'patient.ethnicityNotHispanic', prefer_not: 'patient.ethnicityPreferNot' },
    };
    const key = keyMap[field]?.[value];
    return key ? t(key as any) : value;
  };

  const handleBack = () => goBack('/admin/patients');

  const [patient, setPatient] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, upcoming: 0 });

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '', last_name: '', preferred_name: '', phone: '', alternative_phone: '',
    patient_type: 'general' as PatientType,
    preferred_language: 'pt' as 'pt' | 'en',
    date_of_birth: '', sex_at_birth: '', gender_identity: '', pronoun: '',
    race: '', ethnicity: '', marital_status: '', occupation: '',
    address_line1: '', address_line2: '', city: '', state: '', zip_code: '', country: 'US',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
    referred_by: '', primary_care_physician: '', patient_notes: '',
    insurance_provider: '', insurance_member_id: '', insurance_group_number: '',
    insurance_copay: '', insurance_coinsurance: '', insurance_deductible: '', insurance_payer_id: '',
    sec_insurance_provider: '', sec_insurance_member_id: '', sec_insurance_group_number: '',
    sec_insurance_copay: '', sec_insurance_coinsurance: '', sec_insurance_deductible: '', sec_insurance_payer_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Documents
  const { documents, loading: docsLoading, upload: uploadDoc, remove: removeDoc, getSignedUrl } = useAdminDocuments(id || '');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<PatientDocument | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string>('');

  useEffect(() => {
    if (id) fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          provider:providers!appointments_provider_id_fkey(
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('patient_id', id)
        .order('scheduled_at', { ascending: false });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

      const now = new Date();
      const total = appointmentsData?.length || 0;
      const completed = appointmentsData?.filter(a => a.status === 'completed').length || 0;
      const upcoming = appointmentsData?.filter(a =>
        new Date(a.scheduled_at) > now &&
        !['cancelled', 'no_show', 'completed'].includes(a.status)
      ).length || 0;

      setStats({ total, completed, upcoming });
    } catch (error) {
      console.error('Error fetching patient data:', error);
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

  if (loading) {
    return (
      <AdminLayout>
        <LoadingState>
          <Activity />
          <span>{t('patient.loading')}</span>
        </LoadingState>
      </AdminLayout>
    );
  }

  if (!patient) {
    return (
      <AdminLayout>
        <EmptyState>
          <User />
          <p>{t('patient.notFound')}</p>
        </EmptyState>
      </AdminLayout>
    );
  }

  const initials = `${patient.first_name.charAt(0)}${patient.last_name.charAt(0)}`.toUpperCase();
  const typeColor = getPatientTypeColor(patient.patient_type || 'general');
  const typeBgColor = getPatientTypeBgColor(patient.patient_type || 'general');

  // Handlers
  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm(t('patient.deleteDocumentConfirm'))) return;
    await removeDoc(docId);
  };

  const handleDownloadDocument = async (filePath: string) => {
    const url = await getSignedUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(t('patient.downloadError'));
    }
  };

  const handleViewDocument = async (doc: PatientDocument) => {
    const url = await getSignedUrl(doc.file_url);
    if (url) {
      setViewerUrl(url);
      setViewingDoc(doc);
    } else {
      alert(t('patient.viewError'));
    }
  };

  const openEditModal = () => {
    if (patient) {
      setEditForm({
        first_name: patient.first_name,
        last_name: patient.last_name,
        preferred_name: patient.preferred_name || '',
        phone: patient.phone || '',
        alternative_phone: patient.alternative_phone || '',
        patient_type: patient.patient_type || 'general',
        preferred_language: patient.preferred_language || 'pt',
        date_of_birth: patient.date_of_birth || '',
        sex_at_birth: patient.sex_at_birth || '',
        gender_identity: patient.gender_identity || '',
        pronoun: patient.pronoun || '',
        race: patient.race || '',
        ethnicity: patient.ethnicity || '',
        marital_status: patient.marital_status || '',
        occupation: patient.occupation || '',
        address_line1: patient.address_line1 || '',
        address_line2: patient.address_line2 || '',
        city: patient.city || '',
        state: patient.state || '',
        zip_code: patient.zip_code || '',
        country: patient.country || 'US',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        emergency_contact_relation: patient.emergency_contact_relation || '',
        referred_by: patient.referred_by || '',
        primary_care_physician: patient.primary_care_physician || '',
        patient_notes: patient.patient_notes || '',
        insurance_provider: patient.insurance_provider || '',
        insurance_member_id: patient.insurance_member_id || '',
        insurance_group_number: patient.insurance_group_number || '',
        insurance_copay: patient.insurance_copay != null ? String(patient.insurance_copay) : '',
        insurance_coinsurance: patient.insurance_coinsurance != null ? String(patient.insurance_coinsurance) : '',
        insurance_deductible: patient.insurance_deductible != null ? String(patient.insurance_deductible) : '',
        insurance_payer_id: patient.insurance_payer_id || '',
        sec_insurance_provider: patient.sec_insurance_provider || '',
        sec_insurance_member_id: patient.sec_insurance_member_id || '',
        sec_insurance_group_number: patient.sec_insurance_group_number || '',
        sec_insurance_copay: patient.sec_insurance_copay != null ? String(patient.sec_insurance_copay) : '',
        sec_insurance_coinsurance: patient.sec_insurance_coinsurance != null ? String(patient.sec_insurance_coinsurance) : '',
        sec_insurance_deductible: patient.sec_insurance_deductible != null ? String(patient.sec_insurance_deductible) : '',
        sec_insurance_payer_id: patient.sec_insurance_payer_id || '',
      });
      setSaveSuccess(false);
      setIsEditModalOpen(true);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSaveSuccess(false);
  };

  const handleSavePatient = async () => {
    if (!patient) return;
    setSaving(true);
    try {
      const updateData = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        preferred_name: editForm.preferred_name || null,
        phone: editForm.phone || null,
        alternative_phone: editForm.alternative_phone || null,
        patient_type: editForm.patient_type,
        preferred_language: editForm.preferred_language,
        date_of_birth: editForm.date_of_birth || null,
        sex_at_birth: editForm.sex_at_birth || null,
        gender_identity: editForm.gender_identity || null,
        pronoun: editForm.pronoun || null,
        race: editForm.race || null,
        ethnicity: editForm.ethnicity || null,
        marital_status: editForm.marital_status || null,
        occupation: editForm.occupation || null,
        address_line1: editForm.address_line1 || null,
        address_line2: editForm.address_line2 || null,
        city: editForm.city || null,
        state: editForm.state || null,
        zip_code: editForm.zip_code || null,
        country: editForm.country || null,
        emergency_contact_name: editForm.emergency_contact_name || null,
        emergency_contact_phone: editForm.emergency_contact_phone || null,
        emergency_contact_relation: editForm.emergency_contact_relation || null,
        referred_by: editForm.referred_by || null,
        primary_care_physician: editForm.primary_care_physician || null,
        patient_notes: editForm.patient_notes || null,
        insurance_provider: editForm.insurance_provider || null,
        insurance_member_id: editForm.insurance_member_id || null,
        insurance_group_number: editForm.insurance_group_number || null,
        insurance_copay: editForm.insurance_copay ? parseFloat(editForm.insurance_copay) : null,
        insurance_coinsurance: editForm.insurance_coinsurance ? parseFloat(editForm.insurance_coinsurance) : null,
        insurance_deductible: editForm.insurance_deductible ? parseFloat(editForm.insurance_deductible) : null,
        insurance_payer_id: editForm.insurance_payer_id || null,
        sec_insurance_provider: editForm.sec_insurance_provider || null,
        sec_insurance_member_id: editForm.sec_insurance_member_id || null,
        sec_insurance_group_number: editForm.sec_insurance_group_number || null,
        sec_insurance_copay: editForm.sec_insurance_copay ? parseFloat(editForm.sec_insurance_copay) : null,
        sec_insurance_coinsurance: editForm.sec_insurance_coinsurance ? parseFloat(editForm.sec_insurance_coinsurance) : null,
        sec_insurance_deductible: editForm.sec_insurance_deductible ? parseFloat(editForm.sec_insurance_deductible) : null,
        sec_insurance_payer_id: editForm.sec_insurance_payer_id || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', patient.id);

      if (error) throw error;

      setPatient(prev => prev ? { ...prev, ...updateData } as Profile : null);

      setSaveSuccess(true);
      setTimeout(() => closeEditModal(), 1500);
    } catch (error) {
      console.error('Error saving patient:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <PageContainer>
        <BackButton onClick={handleBack}>
          <ArrowLeft />
          {t('common.back')}
        </BackButton>

        {/* ===== HEADER ===== */}
        <ProfileHeader>
          <HeaderContent>
            <Avatar $hasImage={!!patient.avatar_url}>
              {patient.avatar_url ? (
                <img src={patient.avatar_url} alt={`${patient.first_name} ${patient.last_name}`} />
              ) : (
                initials
              )}
            </Avatar>

            <HeaderInfo>
              <PatientName>{patient.first_name} {patient.last_name}</PatientName>
              <MetaRow>
                <TypeBadge $bg={typeBgColor} $color={typeColor}>
                  {renderTypeIcon(patient.patient_type)}
                  {t('patientType.' + (patient.patient_type === 'iv_therapy' ? 'ivTherapy' : (patient.patient_type || 'general')))}
                </TypeBadge>
                <MetaChip>
                  <Clock />
                  {t('profile.since', { date: formatDate(patient.created_at) })}
                </MetaChip>
                {(patient.no_show_count || 0) > 0 && (
                  <MetaChip style={{ color: '#C4836A' }}>
                    <AlertTriangle style={{ opacity: 1 }} />
                    {patient.no_show_count} falta{(patient.no_show_count || 0) > 1 ? 's' : ''}
                  </MetaChip>
                )}
              </MetaRow>
              <ContactRow>
                <ContactLink href={`mailto:${patient.email}`}>
                  <Mail />
                  {patient.email}
                </ContactLink>
                {patient.phone && (
                  <ContactLink href={`tel:${patient.phone}`}>
                    <Phone />
                    {patient.phone}
                  </ContactLink>
                )}
              </ContactRow>
            </HeaderInfo>

            <HeaderActions>
              <ActionBtn onClick={openEditModal}>
                <Edit3 />
                {t('common.edit')}
              </ActionBtn>
              <ActionBtn $primary onClick={() => navigate(`/admin/calendar?newAppointment=true&patientId=${patient.id}`)}>
                <Calendar />
                {t('calendar.newAppointment')}
              </ActionBtn>
            </HeaderActions>
          </HeaderContent>
        </ProfileHeader>

        {/* ===== STATS ===== */}
        <StatsRow>
          <StatCard $delay={80}>
            <StatIcon $bg={theme.colors.primarySoft} $color={theme.colors.primary}>
              <ClipboardList />
            </StatIcon>
            <StatContent>
              <StatValue>{stats.total}</StatValue>
              <StatLabel>{t('dashboard.totalAppointments')}</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard $delay={160}>
            <StatIcon $bg="rgba(180, 143, 122, 0.15)" $color="#92563E">
              <CheckCircle />
            </StatIcon>
            <StatContent>
              <StatValue>{stats.completed}</StatValue>
              <StatLabel>{t('dashboard.trendCompleted')}</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard $delay={240}>
            <StatIcon $bg="rgba(212, 165, 116, 0.15)" $color="#A67B5B">
              <CalendarCheck />
            </StatIcon>
            <StatContent>
              <StatValue>{stats.upcoming}</StatValue>
              <StatLabel>{t('dashboard.trendScheduled')}</StatLabel>
            </StatContent>
          </StatCard>
        </StatsRow>

        {/* ===== INFO CARDS ===== */}
        <SectionGrid>
          <Card $delay={300}>
            <CardHeader>
              <CardTitle><User /> {t('patient.personalData')}</CardTitle>
            </CardHeader>
            <CardBody>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>{t('patient.fullName')}</InfoLabel>
                  <InfoValue>{patient.first_name} {patient.last_name}{patient.preferred_name ? ` (${patient.preferred_name})` : ''}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.email')}</InfoLabel>
                  <InfoValue>{patient.email}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.phone')}</InfoLabel>
                  <InfoValue>{patient.phone || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.dateOfBirth')}</InfoLabel>
                  <InfoValue>{patient.date_of_birth ? formatDate(patient.date_of_birth) : '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.sexAtBirth')}</InfoLabel>
                  <InfoValue>{getSelectLabel('sex_at_birth', patient.sex_at_birth)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.pronoun')}</InfoLabel>
                  <InfoValue>{patient.pronoun || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.maritalStatus')}</InfoLabel>
                  <InfoValue>{getSelectLabel('marital_status', patient.marital_status)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.occupation')}</InfoLabel>
                  <InfoValue>{patient.occupation || '-'}</InfoValue>
                </InfoItem>
              </InfoGrid>
            </CardBody>
          </Card>

          <Card $delay={380}>
            <CardHeader>
              <CardTitle><Activity /> {t('patient.medicalInfo')}</CardTitle>
            </CardHeader>
            <CardBody>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>{t('patient.patientType')}</InfoLabel>
                  <InfoValue>{t('patientType.' + (patient.patient_type === 'iv_therapy' ? 'ivTherapy' : (patient.patient_type || 'general')))}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.preferredLanguage')}</InfoLabel>
                  <InfoValue>{patient.preferred_language === 'en' ? t('patient.languageEn') : t('patient.languagePt')}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.lastVisit')}</InfoLabel>
                  <InfoValue>{formatDate(patient.last_visit_at)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.labsCompleted')}</InfoLabel>
                  <InfoValue>{formatDate(patient.labs_completed_at)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('status.noShow')}</InfoLabel>
                  <InfoValue style={(patient.no_show_count || 0) > 0 ? { color: '#C4836A', fontWeight: 600 } : undefined}>
                    {patient.no_show_count || 0}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.registeredAt')}</InfoLabel>
                  <InfoValue>{formatDate(patient.created_at)}</InfoValue>
                </InfoItem>
              </InfoGrid>
            </CardBody>
          </Card>
        </SectionGrid>

        <SectionGrid>
          <Card $delay={420}>
            <CardHeader>
              <CardTitle><MapPin /> {t('patient.addressContact')}</CardTitle>
            </CardHeader>
            <CardBody>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>{t('patient.address')}</InfoLabel>
                  <InfoValue>
                    {patient.address_line1
                      ? `${patient.address_line1}${patient.address_line2 ? `, ${patient.address_line2}` : ''}`
                      : '-'}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.city')} / {t('patient.state')}</InfoLabel>
                  <InfoValue>
                    {patient.city || patient.state
                      ? `${patient.city || ''}${patient.city && patient.state ? ', ' : ''}${patient.state || ''} ${patient.zip_code || ''}`
                      : '-'}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.alternativePhone')}</InfoLabel>
                  <InfoValue>{patient.alternative_phone || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.emergencyContact')}</InfoLabel>
                  <InfoValue>
                    {patient.emergency_contact_name
                      ? `${patient.emergency_contact_name}${patient.emergency_contact_relation ? ` (${patient.emergency_contact_relation})` : ''}`
                      : '-'}
                  </InfoValue>
                </InfoItem>
                {patient.emergency_contact_phone && (
                  <InfoItem>
                    <InfoLabel>{t('patient.emergencyContactPhone')}</InfoLabel>
                    <InfoValue>{patient.emergency_contact_phone}</InfoValue>
                  </InfoItem>
                )}
              </InfoGrid>
            </CardBody>
          </Card>

          <Card $delay={460}>
            <CardHeader>
              <CardTitle><BookOpen /> {t('patient.references')}</CardTitle>
            </CardHeader>
            <CardBody>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>{t('patient.referredBy')}</InfoLabel>
                  <InfoValue>{patient.referred_by || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.primaryCarePhysician')}</InfoLabel>
                  <InfoValue>{patient.primary_care_physician || '-'}</InfoValue>
                </InfoItem>
                {patient.patient_notes && (
                  <InfoItem style={{ gridColumn: '1 / -1' }}>
                    <InfoLabel>{t('patient.patientNotes')}</InfoLabel>
                    <InfoValue style={{ whiteSpace: 'pre-wrap' }}>{patient.patient_notes}</InfoValue>
                  </InfoItem>
                )}
              </InfoGrid>
            </CardBody>
          </Card>
        </SectionGrid>

        {/* ===== INSURANCE ===== */}
        <SectionGrid>
          <Card $delay={500}>
            <CardHeader>
              <CardTitle><Shield /> {t('patient.insurancePrimary', 'Primary Insurance')}</CardTitle>
            </CardHeader>
            <CardBody>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceProvider', 'Insurance Provider')}</InfoLabel>
                  <InfoValue>{patient.insurance_provider || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceMemberId', 'Member ID')}</InfoLabel>
                  <InfoValue>{patient.insurance_member_id || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceGroupNumber', 'Group Number')}</InfoLabel>
                  <InfoValue>{patient.insurance_group_number || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceCopay', 'Copay')}</InfoLabel>
                  <InfoValue>{patient.insurance_copay != null ? `$${patient.insurance_copay}` : '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceCoinsurance', 'Co-Insurance')}</InfoLabel>
                  <InfoValue>{patient.insurance_coinsurance != null ? `${patient.insurance_coinsurance}%` : '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceDeductible', 'Deductible')}</InfoLabel>
                  <InfoValue>{patient.insurance_deductible != null ? `$${patient.insurance_deductible}` : '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insurancePayerId', 'Payer ID')}</InfoLabel>
                  <InfoValue>{patient.insurance_payer_id || '-'}</InfoValue>
                </InfoItem>
              </InfoGrid>
            </CardBody>
          </Card>

          <Card $delay={540}>
            <CardHeader>
              <CardTitle><Shield /> {t('patient.insuranceSecondary', 'Secondary Insurance')}</CardTitle>
            </CardHeader>
            <CardBody>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceProvider', 'Insurance Provider')}</InfoLabel>
                  <InfoValue>{patient.sec_insurance_provider || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceMemberId', 'Member ID')}</InfoLabel>
                  <InfoValue>{patient.sec_insurance_member_id || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceGroupNumber', 'Group Number')}</InfoLabel>
                  <InfoValue>{patient.sec_insurance_group_number || '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceCopay', 'Copay')}</InfoLabel>
                  <InfoValue>{patient.sec_insurance_copay != null ? `$${patient.sec_insurance_copay}` : '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceCoinsurance', 'Co-Insurance')}</InfoLabel>
                  <InfoValue>{patient.sec_insurance_coinsurance != null ? `${patient.sec_insurance_coinsurance}%` : '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insuranceDeductible', 'Deductible')}</InfoLabel>
                  <InfoValue>{patient.sec_insurance_deductible != null ? `$${patient.sec_insurance_deductible}` : '-'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t('patient.insurancePayerId', 'Payer ID')}</InfoLabel>
                  <InfoValue>{patient.sec_insurance_payer_id || '-'}</InfoValue>
                </InfoItem>
              </InfoGrid>
            </CardBody>
          </Card>
        </SectionGrid>

        {/* ===== UPCOMING APPOINTMENTS ===== */}
        {upcomingAppointments.length > 0 && (
          <Card $delay={460} style={{ marginBottom: theme.spacing.lg }}>
            <CardHeader>
              <CardTitle><Calendar /> {t('patient.upcomingAppointments')}</CardTitle>
              <CardLink onClick={() => navigate(`/admin/calendar?patientId=${patient.id}`)}>
                Ver todas <ChevronRight />
              </CardLink>
            </CardHeader>
            <CardBody>
              <AppointmentList>
                {upcomingAppointments.map(apt => {
                  const sc = getStatusColors(apt.status);
                  return (
                    <AppointmentItem key={apt.id}>
                      <StatusDot $color={sc.dot} />
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
                      <StatusBadge $bg={sc.bg} $color={sc.text}>
                        {getStatusLabel(apt.status)}
                      </StatusBadge>
                    </AppointmentItem>
                  );
                })}
              </AppointmentList>
            </CardBody>
          </Card>
        )}

        {/* ===== HISTORY ===== */}
        <Card $delay={540} style={{ marginBottom: theme.spacing.lg }}>
          <CardHeader>
            <CardTitle><FileText /> {t('patient.appointmentHistory')}</CardTitle>
            <CardLink onClick={() => navigate(`/admin/appointments?patientId=${patient.id}`)}>
              Ver todas <ChevronRight />
            </CardLink>
          </CardHeader>
          <CardBody>
            {pastAppointments.length > 0 ? (
              <AppointmentList>
                {pastAppointments.map(apt => {
                  const sc = getStatusColors(apt.status);
                  return (
                    <AppointmentItem key={apt.id}>
                      <StatusDot $color={sc.dot} />
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
                      <StatusBadge $bg={sc.bg} $color={sc.text}>
                        {getStatusLabel(apt.status)}
                      </StatusBadge>
                    </AppointmentItem>
                  );
                })}
              </AppointmentList>
            ) : (
              <EmptyState>
                <FileText />
                <p>{t('patient.noHistory')}</p>
              </EmptyState>
            )}
          </CardBody>
        </Card>

        {/* ===== DOCUMENTS ===== */}
        <Card $delay={620} style={{ marginBottom: theme.spacing.lg }}>
          <CardHeader>
            <CardTitle><Upload /> Documentos</CardTitle>
            <UploadBtn onClick={() => setIsUploadModalOpen(true)}>
              <Upload />
              {t('documents.title')}
            </UploadBtn>
          </CardHeader>
          <CardBody>
            {docsLoading ? (
              <EmptyState>
                <Activity />
                <p>{t('patient.loadingDocuments')}</p>
              </EmptyState>
            ) : documents.length > 0 ? (
              <DocumentGrid>
                {documents.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDelete={handleDeleteDocument}
                    onDownload={() => handleDownloadDocument(doc.file_url)}
                    onView={() => handleViewDocument(doc)}
                  />
                ))}
              </DocumentGrid>
            ) : (
              <EmptyState>
                <FileText />
                <p>{t('documents.emptyHint')}</p>
              </EmptyState>
            )}
          </CardBody>
        </Card>
      </PageContainer>

      {/* ===== UPLOAD MODAL ===== */}
      {isUploadModalOpen && (
        <DocumentUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={uploadDoc}
        />
      )}

      {/* ===== DOCUMENT VIEWER MODAL ===== */}
      <DocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => { setViewingDoc(null); setViewerUrl(''); }}
        fileUrl={viewerUrl}
        fileName={viewingDoc?.file_url || ''}
        title={viewingDoc?.title || ''}
      />

      {/* ===== EDIT MODAL ===== */}
      {isEditModalOpen && (
        <ModalOverlay onClick={closeEditModal}>
          <ModalContainer onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle><Edit3 /> {t('patients.editTitle')}</ModalTitle>
              <CloseBtn onClick={closeEditModal}><X /></CloseBtn>
            </ModalHeader>

            <ModalBody>
              {saveSuccess && (
                <SuccessMsg>
                  <CheckCircle />
                  {t('patient.dataSaved')}
                </SuccessMsg>
              )}

              <FormGrid>
                {/* — Section: Personal — */}
                <SectionDivider><span>{t('patient.sectionPersonal')}</span></SectionDivider>
                <FormGroup>
                  <FormLabel>{t('patients.firstName')} *</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.first_name}
                    onChange={e => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patients.lastName')} *</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.last_name}
                    onChange={e => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.preferredName')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.preferred_name}
                    onChange={e => setEditForm(prev => ({ ...prev, preferred_name: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patients.phone')}</FormLabel>
                  <FormInput
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (954) 000-0000"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.alternativePhone')}</FormLabel>
                  <FormInput
                    type="tel"
                    value={editForm.alternative_phone}
                    onChange={e => setEditForm(prev => ({ ...prev, alternative_phone: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.dateOfBirth')}</FormLabel>
                  <FormInput
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={e => setEditForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.sexAtBirth')}</FormLabel>
                  <FormSelect
                    value={editForm.sex_at_birth}
                    onChange={e => setEditForm(prev => ({ ...prev, sex_at_birth: e.target.value }))}
                  >
                    <option value="">—</option>
                    <option value="male">{t('patient.sexMale')}</option>
                    <option value="female">{t('patient.sexFemale')}</option>
                    <option value="intersex">{t('patient.sexIntersex')}</option>
                    <option value="prefer_not">{t('patient.sexPreferNot')}</option>
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.pronoun')}</FormLabel>
                  <FormSelect
                    value={editForm.pronoun}
                    onChange={e => setEditForm(prev => ({ ...prev, pronoun: e.target.value }))}
                  >
                    <option value="">—</option>
                    <option value="he/him">he/him</option>
                    <option value="she/her">she/her</option>
                    <option value="they/them">they/them</option>
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.genderIdentity')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.gender_identity}
                    onChange={e => setEditForm(prev => ({ ...prev, gender_identity: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.race')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.race}
                    onChange={e => setEditForm(prev => ({ ...prev, race: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.ethnicity')}</FormLabel>
                  <FormSelect
                    value={editForm.ethnicity}
                    onChange={e => setEditForm(prev => ({ ...prev, ethnicity: e.target.value }))}
                  >
                    <option value="">—</option>
                    <option value="hispanic">{t('patient.ethnicityHispanic')}</option>
                    <option value="not_hispanic">{t('patient.ethnicityNotHispanic')}</option>
                    <option value="prefer_not">{t('patient.ethnicityPreferNot')}</option>
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.maritalStatus')}</FormLabel>
                  <FormSelect
                    value={editForm.marital_status}
                    onChange={e => setEditForm(prev => ({ ...prev, marital_status: e.target.value }))}
                  >
                    <option value="">—</option>
                    <option value="single">{t('patient.maritalSingle')}</option>
                    <option value="married">{t('patient.maritalMarried')}</option>
                    <option value="divorced">{t('patient.maritalDivorced')}</option>
                    <option value="widowed">{t('patient.maritalWidowed')}</option>
                    <option value="partnership">{t('patient.maritalPartnership')}</option>
                    <option value="separated">{t('patient.maritalSeparated')}</option>
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.occupation')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.occupation}
                    onChange={e => setEditForm(prev => ({ ...prev, occupation: e.target.value }))}
                  />
                </FormGroup>

                {/* — Section: Address — */}
                <SectionDivider><span>{t('patient.sectionAddress')}</span></SectionDivider>
                <FormGroup $full>
                  <FormLabel>{t('patient.addressLine1')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.address_line1}
                    onChange={e => setEditForm(prev => ({ ...prev, address_line1: e.target.value }))}
                    placeholder="2000 NE 44th ST, Suite 101B"
                  />
                </FormGroup>
                <FormGroup $full>
                  <FormLabel>{t('patient.addressLine2')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.address_line2}
                    onChange={e => setEditForm(prev => ({ ...prev, address_line2: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.city')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.city}
                    onChange={e => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.state')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.state}
                    onChange={e => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="FL"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.zipCode')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.zip_code}
                    onChange={e => setEditForm(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="33308"
                  />
                </FormGroup>

                {/* — Section: Emergency Contact — */}
                <SectionDivider><span>{t('patient.sectionEmergency')}</span></SectionDivider>
                <FormGroup>
                  <FormLabel>{t('patient.emergencyContactName')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.emergency_contact_name}
                    onChange={e => setEditForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.emergencyContactPhone')}</FormLabel>
                  <FormInput
                    type="tel"
                    value={editForm.emergency_contact_phone}
                    onChange={e => setEditForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.emergencyContactRelation')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.emergency_contact_relation}
                    onChange={e => setEditForm(prev => ({ ...prev, emergency_contact_relation: e.target.value }))}
                    placeholder="Spouse, Parent, Sibling..."
                  />
                </FormGroup>

                {/* — Section: Admin & References — */}
                <SectionDivider><span>{t('patient.sectionAdmin')}</span></SectionDivider>
                <FormGroup>
                  <FormLabel>{t('patient.patientType')}</FormLabel>
                  <FormSelect
                    value={editForm.patient_type}
                    onChange={e => setEditForm(prev => ({ ...prev, patient_type: e.target.value as PatientType }))}
                  >
                    {PATIENT_TYPE_OPTIONS.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.preferredLanguage')}</FormLabel>
                  <FormSelect
                    value={editForm.preferred_language}
                    onChange={e => setEditForm(prev => ({ ...prev, preferred_language: e.target.value as 'pt' | 'en' }))}
                  >
                    <option value="pt">{t('patient.languagePt')}</option>
                    <option value="en">{t('patient.languageEn')}</option>
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.referredBy')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.referred_by}
                    onChange={e => setEditForm(prev => ({ ...prev, referred_by: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup $full>
                  <FormLabel>{t('patient.primaryCarePhysician')}</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.primary_care_physician}
                    onChange={e => setEditForm(prev => ({ ...prev, primary_care_physician: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup $full>
                  <FormLabel>{t('patient.patientNotes')}</FormLabel>
                  <FormTextarea
                    value={editForm.patient_notes}
                    onChange={e => setEditForm(prev => ({ ...prev, patient_notes: e.target.value }))}
                    placeholder="Internal notes (admin only)..."
                  />
                </FormGroup>

                {/* — Section: Insurance — */}
                <SectionDivider><span>{t('patient.insurancePrimary', 'Primary Insurance')}</span></SectionDivider>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceProvider', 'Insurance Provider')}</FormLabel>
                  <FormInput type="text" value={editForm.insurance_provider} onChange={e => setEditForm(prev => ({ ...prev, insurance_provider: e.target.value }))} placeholder="e.g. OSCAR SILVER SIMPLE" />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceMemberId', 'Member ID')}</FormLabel>
                  <FormInput type="text" value={editForm.insurance_member_id} onChange={e => setEditForm(prev => ({ ...prev, insurance_member_id: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceGroupNumber', 'Group Number')}</FormLabel>
                  <FormInput type="text" value={editForm.insurance_group_number} onChange={e => setEditForm(prev => ({ ...prev, insurance_group_number: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceCopay', 'Copay ($)')}</FormLabel>
                  <FormInput type="number" step="0.01" value={editForm.insurance_copay} onChange={e => setEditForm(prev => ({ ...prev, insurance_copay: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceCoinsurance', 'Co-Insurance (%)')}</FormLabel>
                  <FormInput type="number" step="0.01" value={editForm.insurance_coinsurance} onChange={e => setEditForm(prev => ({ ...prev, insurance_coinsurance: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceDeductible', 'Deductible ($)')}</FormLabel>
                  <FormInput type="number" step="0.01" value={editForm.insurance_deductible} onChange={e => setEditForm(prev => ({ ...prev, insurance_deductible: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insurancePayerId', 'Payer ID')}</FormLabel>
                  <FormInput type="text" value={editForm.insurance_payer_id} onChange={e => setEditForm(prev => ({ ...prev, insurance_payer_id: e.target.value }))} />
                </FormGroup>

                <SectionDivider><span>{t('patient.insuranceSecondary', 'Secondary Insurance')}</span></SectionDivider>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceProvider', 'Insurance Provider')}</FormLabel>
                  <FormInput type="text" value={editForm.sec_insurance_provider} onChange={e => setEditForm(prev => ({ ...prev, sec_insurance_provider: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceMemberId', 'Member ID')}</FormLabel>
                  <FormInput type="text" value={editForm.sec_insurance_member_id} onChange={e => setEditForm(prev => ({ ...prev, sec_insurance_member_id: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceGroupNumber', 'Group Number')}</FormLabel>
                  <FormInput type="text" value={editForm.sec_insurance_group_number} onChange={e => setEditForm(prev => ({ ...prev, sec_insurance_group_number: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceCopay', 'Copay ($)')}</FormLabel>
                  <FormInput type="number" step="0.01" value={editForm.sec_insurance_copay} onChange={e => setEditForm(prev => ({ ...prev, sec_insurance_copay: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceCoinsurance', 'Co-Insurance (%)')}</FormLabel>
                  <FormInput type="number" step="0.01" value={editForm.sec_insurance_coinsurance} onChange={e => setEditForm(prev => ({ ...prev, sec_insurance_coinsurance: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insuranceDeductible', 'Deductible ($)')}</FormLabel>
                  <FormInput type="number" step="0.01" value={editForm.sec_insurance_deductible} onChange={e => setEditForm(prev => ({ ...prev, sec_insurance_deductible: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('patient.insurancePayerId', 'Payer ID')}</FormLabel>
                  <FormInput type="text" value={editForm.sec_insurance_payer_id} onChange={e => setEditForm(prev => ({ ...prev, sec_insurance_payer_id: e.target.value }))} />
                </FormGroup>
              </FormGrid>
            </ModalBody>

            <ModalFooter>
              <ModalBtn onClick={closeEditModal}>{t('common.cancel')}</ModalBtn>
              <ModalBtn
                $primary
                onClick={handleSavePatient}
                disabled={saving || !editForm.first_name || !editForm.last_name}
              >
                {saving ? t('common.saving') : <><Save /> {t('common.save')}</>}
              </ModalBtn>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}
    </AdminLayout>
  );
};

export default PatientProfilePage;
