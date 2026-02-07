import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Edit2, Check, AlertCircle,
  Crown, Activity, Phone, Mail, ChevronLeft, ChevronRight, X,
  Sparkles, AlertTriangle, Heart, Droplets
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { theme } from '../../styles/GlobalStyle';
import { supabase } from '../../lib/supabaseClient';
import { Profile, PatientType, PreferredLanguage } from '../../types/database';
import {
  ACTIVE_PATIENT_TYPES,
  getPatientTypeLabel as getPatientTypeLabelFromConstants,
  getPatientTypeColor,
  getPatientTypeIcon
} from '../../constants/treatments';

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
`;

// ============================================
// THEME CONSTANTS
// ============================================
const luxuryTheme = {
  // Accent colors (hex for concatenation/dynamic props)
  primary: '#92563E',
  primaryLight: '#B8956E',
  primaryDark: '#7A4832',
  success: '#059669',
  error: '#DC2626',
  wellness: '#14B8A6',
  vip: '#D4AF37',
  newPatient: '#059669',
  // Theme-responsive colors (CSS variables - adapt to dark mode)
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
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.6s ease-out;

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
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

const NewPatientButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight});
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px ${luxuryTheme.primary}30;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${luxuryTheme.primary}40;
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ $delay: number }>`
  background: ${luxuryTheme.surface};
  border-radius: 14px;
  padding: 20px 22px;
  border: 1px solid ${luxuryTheme.border};
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: ${props => props.$delay}ms;
  animation-fill-mode: both;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 16px;

  &:hover {
    border-color: ${luxuryTheme.primaryLight}60;
  }
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${luxuryTheme.primaryLight};
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const StatContent = styled.div`
  min-width: 0;
`;

const StatValue = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 26px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  line-height: 1;
  margin-bottom: 2px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${luxuryTheme.textSecondary};
  font-weight: 500;
  letter-spacing: 0.2px;
`;

const FiltersSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 200ms;
  animation-fill-mode: both;
`;

const SearchContainer = styled.div`
  flex: 1;
  min-width: 280px;
  position: relative;

  svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: ${luxuryTheme.textSecondary};
    transition: color 0.3s ease;
  }

  &:focus-within svg {
    color: ${luxuryTheme.primary};
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 14px 16px 14px 48px;
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 12px;
  font-size: 14px;
  color: ${luxuryTheme.text};
  transition: all 0.3s ease;
  box-sizing: border-box;

  &::placeholder {
    color: ${luxuryTheme.textSecondary};
  }

  &:focus {
    outline: none;
    border-color: ${luxuryTheme.primary};
    box-shadow: 0 0 0 3px ${luxuryTheme.primary}15;
  }
`;

const FilterSelect = styled.select`
  padding: 14px 40px 14px 16px;
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 12px;
  font-size: 14px;
  color: ${luxuryTheme.text};
  cursor: pointer;
  min-width: 180px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B7355' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${luxuryTheme.primary};
    box-shadow: 0 0 0 3px ${luxuryTheme.primary}15;
  }

  &:hover {
    border-color: ${luxuryTheme.primaryLight};
  }
`;

const PatientsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 300ms;
  animation-fill-mode: both;
`;

const PatientCard = styled.div<{ $index: number }>`
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 16px;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => 350 + props.$index * 50}ms;
  animation-fill-mode: both;
  cursor: pointer;

  &:hover {
    border-color: ${luxuryTheme.primaryLight};
    box-shadow: 0 8px 24px ${luxuryTheme.primary}10;
    transform: translateX(4px);
    background: linear-gradient(135deg, ${luxuryTheme.surface} 0%, ${luxuryTheme.cream} 100%);
  }

  @media (max-width: 900px) {
    grid-template-columns: auto 1fr;
    gap: 16px;
  }
`;

const PatientAvatar = styled.div<{ $hasImage?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$hasImage ? 'transparent' : '#E8E4E0'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textSecondary};
  font-weight: 600;
  font-size: 16px;
  font-family: ${theme.typography.fontFamilyHeading};
  letter-spacing: 0.5px;
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.3s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  ${PatientCard}:hover & {
    transform: scale(1.05);
  }
`;

const PatientInfo = styled.div`
  min-width: 0;
`;

const PatientName = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 20px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PatientEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${luxuryTheme.textSecondary};
  font-size: 13px;

  svg {
    flex-shrink: 0;
  }
`;

const PatientPhone = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${luxuryTheme.textSecondary};
  font-size: 14px;
  min-width: 150px;

  svg {
    color: ${luxuryTheme.primaryLight};
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

const PatientBadge = styled.span<{ $type: PatientType | null }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => `${getPatientTypeColor(props.$type || 'general')}18`};
  color: ${props => getPatientTypeColor(props.$type || 'general')};
  border: 1px solid ${props => `${getPatientTypeColor(props.$type || 'general')}30`};
  transition: all 0.3s ease;

  ${PatientCard}:hover & {
    transform: scale(1.05);
  }

  svg {
    width: 12px;
    height: 12px;
  }

  @media (max-width: 900px) {
    grid-column: 2;
    justify-self: start;
  }
`;

const NoShowBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${luxuryTheme.error}15;
  color: ${luxuryTheme.error};
  border: 1px solid ${luxuryTheme.error}25;
  white-space: nowrap;

  svg {
    width: 11px;
    height: 11px;
  }
`;

const PatientActions = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 900px) {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: ${props => props.$variant === 'primary'
    ? `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})`
    : luxuryTheme.surface};
  color: ${props => props.$variant === 'primary' ? 'white' : luxuryTheme.primary};
  border: 1px solid ${props => props.$variant === 'primary' ? 'transparent' : luxuryTheme.border};
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${luxuryTheme.primary}25;
    ${props => props.$variant !== 'primary' && css`
      background: ${luxuryTheme.cream};
      border-color: ${luxuryTheme.primaryLight};
    `}
  }

  &:active {
    transform: translateY(0);
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 500ms;
  animation-fill-mode: both;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid ${props => props.$active ? luxuryTheme.primary : luxuryTheme.border};
  background: ${props => props.$active
    ? `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})`
    : luxuryTheme.surface};
  color: ${props => props.$active ? 'white' : luxuryTheme.text};
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    border-color: ${luxuryTheme.primary};
    background: ${props => props.$active
      ? `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})`
      : luxuryTheme.cream};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 40px;
  background: ${luxuryTheme.surface};
  border: 1px dashed ${luxuryTheme.border};
  border-radius: 16px;
  animation: ${fadeInUp} 0.6s ease-out;

  svg {
    width: 64px;
    height: 64px;
    color: ${luxuryTheme.primaryLight};
    margin-bottom: 20px;
    animation: ${float} 3s ease-in-out infinite;
  }

  h3 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 24px;
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

const LoadingSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SkeletonCard = styled.div<{ $delay: number }>`
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 16px;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 56px 1fr 150px 100px 100px;
  align-items: center;
  gap: 20px;
  animation: ${pulse} 1.5s ease-in-out infinite;
  animation-delay: ${props => props.$delay}ms;
`;

const SkeletonElement = styled.div<{ $width?: string; $height?: string; $round?: boolean }>`
  width: ${props => props.$width || '100%'};
  height: ${props => props.$height || '16px'};
  background: linear-gradient(90deg, ${luxuryTheme.cream} 25%, ${luxuryTheme.border} 50%, ${luxuryTheme.cream} 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: ${props => props.$round ? '14px' : '6px'};
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  width: 36px;
  height: 36px;
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

    span {
      color: ${luxuryTheme.error};
    }
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

  &::placeholder {
    color: ${luxuryTheme.textSecondary};
  }

  &:focus {
    outline: none;
    border-color: ${luxuryTheme.primary};
    background: ${luxuryTheme.surface};
    box-shadow: 0 0 0 3px ${luxuryTheme.primary}15;
  }

  &:disabled {
    background: ${luxuryTheme.border};
    cursor: not-allowed;
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
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  background: ${props => props.$variant === 'error' ? luxuryTheme.errorLight : luxuryTheme.successLight};
  color: ${props => props.$variant === 'error' ? luxuryTheme.error : luxuryTheme.success};
  border: 1px solid ${props => props.$variant === 'error' ? `${luxuryTheme.error}30` : `${luxuryTheme.success}30`};
`;

// ============================================
// CONSTANTS
// ============================================
const PATIENT_TYPE_OPTIONS = ACTIVE_PATIENT_TYPES.map(t => ({ value: t.key as PatientType, label: t.label }));

const ITEMS_PER_PAGE = 8;

// ============================================
// COMPONENT
// ============================================
const PatientsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    patient_type: 'new' as PatientType,
    preferred_language: 'pt' as PreferredLanguage
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const editPatientId = searchParams.get('edit');
    if (editPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === editPatientId);
      if (patient) {
        handleOpenModal(patient);
        searchParams.delete('edit');
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, patients, setSearchParams]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (patient?: Profile) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        email: patient.email,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone || '',
        password: '',
        patient_type: patient.patient_type || 'general',
        preferred_language: patient.preferred_language || 'pt'
      });
    } else {
      setEditingPatient(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        patient_type: 'new',
        preferred_language: 'pt'
      });
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      patient_type: 'new',
      preferred_language: 'pt'
    });
    setError('');
    setSuccess('');
  };

  const handleViewPatient = (patient: Profile) => {
    navigate(`/admin/patients/${patient.id}`, { state: { from: '/admin/patients' } });
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingPatient) {
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            patient_type: formData.patient_type,
            preferred_language: formData.preferred_language,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPatient.id);

        if (error) throw error;
        setSuccess('Paciente atualizado com sucesso!');
      } else {
        // Validações para novo paciente
        if (!formData.email) {
          setError('Email é obrigatório');
          setSaving(false);
          return;
        }

        if (!formData.password || formData.password.length < 6) {
          setError('Senha é obrigatória (mínimo 6 caracteres)');
          setSaving(false);
          return;
        }

        if (!formData.preferred_language) {
          setError('Idioma preferido é obrigatório');
          setSaving(false);
          return;
        }

        // Verificar se email já existe
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email)
          .single();

        if (existingUser) {
          setError('Este email já está cadastrado.');
          setSaving(false);
          return;
        }

        // Salvar sessão atual do admin antes de criar novo usuário
        const { data: currentSession } = await supabase.auth.getSession();
        const adminSession = currentSession?.session;

        // Criar usuário via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              preferred_language: formData.preferred_language,
            },
          },
        });

        if (authError) {
          // Restaurar sessão do admin se houve erro
          if (adminSession) {
            await supabase.auth.setSession(adminSession);
          }
          setError(authError.message);
          setSaving(false);
          return;
        }

        if (authData.user) {
          // Criar perfil do paciente
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: formData.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone || null,
              role: 'patient',
              patient_type: formData.patient_type,
              preferred_language: formData.preferred_language,
            });

          // Restaurar sessão do admin após criar o paciente
          if (adminSession) {
            await supabase.auth.setSession(adminSession);
          }

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
            setError('Usuário criado, mas erro ao criar perfil. Contate o suporte.');
            setSaving(false);
            return;
          }

          setSuccess('Paciente cadastrado com sucesso! Um email de confirmação foi enviado.');
        } else {
          // Restaurar sessão do admin se não criou usuário
          if (adminSession) {
            await supabase.auth.setSession(adminSession);
          }
        }
      }

      await fetchPatients();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar paciente');
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch =
      patient.first_name.toLowerCase().includes(search.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(search.toLowerCase()) ||
      patient.email.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || patient.patient_type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getLabel = (type: PatientType | null) => {
    return getPatientTypeLabelFromConstants(type || 'general');
  };

  const getBadgeIcon = (type: PatientType | null) => {
    const iconName = getPatientTypeIcon(type || 'general');
    switch (iconName) {
      case 'Crown': return <Crown size={12} />;
      case 'Activity': return <Activity size={12} />;
      case 'Sparkles': return <Sparkles size={12} />;
      case 'Heart': return <Heart size={12} />;
      case 'Droplets': return <Droplets size={12} />;
      default: return null;
    }
  };

  const stats = {
    total: patients.length,
    new: patients.filter(p => p.patient_type === 'new').length,
    wellness: patients.filter(p => p.patient_type === 'wellness').length,
    vip: patients.filter(p => p.patient_type === 'vip').length
  };

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>Pacientes</h1>
            <p>Gerencie os pacientes cadastrados na clínica</p>
          </div>
          <NewPatientButton onClick={() => handleOpenModal()}>
            <UserPlus size={18} />
            Novo Paciente
          </NewPatientButton>
        </Header>

        <StatsGrid>
          <StatCard $delay={0}>
            <StatIcon><Users size={20} /></StatIcon>
            <StatContent>
              <StatValue>{stats.total}</StatValue>
              <StatLabel>Total de Pacientes</StatLabel>
            </StatContent>
          </StatCard>

          <StatCard $delay={50}>
            <StatIcon><UserPlus size={20} /></StatIcon>
            <StatContent>
              <StatValue>{stats.new}</StatValue>
              <StatLabel>Novos Pacientes</StatLabel>
            </StatContent>
          </StatCard>

          <StatCard $delay={100}>
            <StatIcon><Activity size={20} /></StatIcon>
            <StatContent>
              <StatValue>{stats.wellness}</StatValue>
              <StatLabel>Bem-estar</StatLabel>
            </StatContent>
          </StatCard>

          <StatCard $delay={150}>
            <StatIcon><Crown size={20} /></StatIcon>
            <StatContent>
              <StatValue>{stats.vip}</StatValue>
              <StatLabel>Pacientes VIP</StatLabel>
            </StatContent>
          </StatCard>
        </StatsGrid>

        <FiltersSection>
          <SearchContainer>
            <Search size={18} />
            <SearchInput
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchContainer>
          <FilterSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Todos os tipos</option>
            {PATIENT_TYPE_OPTIONS.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </FilterSelect>
        </FiltersSection>

        {loading ? (
          <LoadingSkeleton>
            {[0, 1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} $delay={i * 100}>
                <SkeletonElement $width="56px" $height="56px" $round />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SkeletonElement $width="180px" $height="20px" />
                  <SkeletonElement $width="220px" $height="14px" />
                </div>
                <SkeletonElement $width="130px" $height="16px" />
                <SkeletonElement $width="80px" $height="32px" />
                <SkeletonElement $width="90px" $height="36px" />
              </SkeletonCard>
            ))}
          </LoadingSkeleton>
        ) : paginatedPatients.length === 0 ? (
          <EmptyState>
            <Users />
            {patients.length === 0 ? (
              <>
                <h3>Nenhum paciente cadastrado</h3>
                <p>Pacientes aparecem aqui após se registrarem pelo portal ou serem cadastrados manualmente.<br />
                Você pode criar o primeiro paciente agora.</p>
                <EmptyStateCTA onClick={() => setShowModal(true)}>
                  <UserPlus size={16} />
                  Cadastrar Paciente
                </EmptyStateCTA>
              </>
            ) : (
              <>
                <h3>Nenhum paciente encontrado</h3>
                <p>Tente ajustar os filtros de busca</p>
              </>
            )}
          </EmptyState>
        ) : (
          <>
            <PatientsGrid>
              {paginatedPatients.map((patient, index) => (
                <PatientCard key={patient.id} $index={index} onClick={() => handleViewPatient(patient)}>
                  <PatientAvatar $hasImage={!!patient.avatar_url}>
                    {patient.avatar_url ? (
                      <img src={patient.avatar_url} alt={`${patient.first_name} ${patient.last_name}`} />
                    ) : (
                      getInitials(patient.first_name, patient.last_name)
                    )}
                  </PatientAvatar>

                  <PatientInfo>
                    <PatientName>
                      {patient.first_name} {patient.last_name}
                      {(patient.no_show_count || 0) > 0 && (
                        <NoShowBadge title={`${patient.no_show_count} falta(s)`}>
                          <AlertTriangle />
                          {patient.no_show_count}
                        </NoShowBadge>
                      )}
                    </PatientName>
                    <PatientEmail>
                      <Mail size={12} />
                      {patient.email}
                    </PatientEmail>
                  </PatientInfo>

                  <PatientPhone>
                    <Phone size={14} />
                    {patient.phone || '—'}
                  </PatientPhone>

                  <PatientBadge $type={patient.patient_type}>
                    {getBadgeIcon(patient.patient_type)}
                    {getLabel(patient.patient_type)}
                  </PatientBadge>

                  <PatientActions>
                    <ActionButton $variant="primary" onClick={(e) => { e.stopPropagation(); handleOpenModal(patient); }}>
                      <Edit2 size={16} />
                      Editar
                    </ActionButton>
                  </PatientActions>
                </PatientCard>
              ))}
            </PatientsGrid>

            {totalPages > 1 && (
              <Pagination>
                <PageButton
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </PageButton>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PageButton
                    key={page}
                    $active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PageButton>
                ))}

                <PageButton
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={18} />
                </PageButton>
              </Pagination>
            )}
          </>
        )}

        {showModal && (
          <ModalOverlay onClick={handleCloseModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>
                  <Users size={22} />
                  {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
                </h2>
                <CloseButton onClick={handleCloseModal}>
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

                <FormGroup>
                  <label>Email {!editingPatient && <span>*</span>}</label>
                  <FormInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingPatient}
                    placeholder="email@exemplo.com"
                  />
                </FormGroup>

                {!editingPatient && (
                  <FormGroup>
                    <label>Senha <span>*</span></label>
                    <FormInput
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </FormGroup>
                )}

                <FormGroup>
                  <label>Nome <span>*</span></label>
                  <FormInput
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Nome"
                  />
                </FormGroup>

                <FormGroup>
                  <label>Sobrenome <span>*</span></label>
                  <FormInput
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Sobrenome"
                  />
                </FormGroup>

                <FormGroup>
                  <label>Telefone</label>
                  <FormInput
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </FormGroup>

                <FormGroup>
                  <label>Tipo de Paciente</label>
                  <FormSelect
                    value={formData.patient_type}
                    onChange={(e) => setFormData({ ...formData, patient_type: e.target.value as PatientType })}
                  >
                    {PATIENT_TYPE_OPTIONS.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </FormSelect>
                </FormGroup>

                <FormGroup>
                  <label>Idioma Preferido <span>*</span></label>
                  <FormSelect
                    value={formData.preferred_language}
                    onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value as PreferredLanguage })}
                  >
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                  </FormSelect>
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <Button $variant="secondary" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button
                  $variant="primary"
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !formData.first_name.trim() ||
                    !formData.last_name.trim() ||
                    !formData.preferred_language ||
                    (!editingPatient && (!formData.email.trim() || formData.password.length < 6))
                  }
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default PatientsPage;
