import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Edit2, Check, AlertCircle, Eye,
  Crown, Activity, Phone, Mail, ChevronLeft, ChevronRight, X,
  Sparkles
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { Profile, PatientType } from '../../types/database';

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
  primary: '#92563E',
  primaryLight: '#B8956E',
  primaryDark: '#7A4832',
  gold: '#D4AF37',
  goldLight: '#E8C547',
  cream: '#FDF8F3',
  surface: '#FFFFFF',
  border: '#E8DDD4',
  text: '#3D2E24',
  textSecondary: '#8B7355',
  success: '#059669',
  successLight: '#D1FAE5',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  trt: '#92563E',
  hormone: '#C77D8E',
  vip: '#D4AF37',
  newPatient: '#059669',
  general: '#8B7355',
};

// ============================================
// STYLED COMPONENTS
// ============================================
const PageContainer = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
`;

const Header = styled.div`
  margin-bottom: 32px;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ $delay: number; $accentColor: string }>`
  background: ${luxuryTheme.surface};
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  border: 1px solid ${luxuryTheme.border};
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: ${props => props.$delay}ms;
  animation-fill-mode: both;
  transition: all 0.3s ease;
  cursor: default;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${props => props.$accentColor}, ${props => props.$accentColor}88);
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, ${props => props.$accentColor}08 0%, transparent 70%);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px ${luxuryTheme.primary}15;
    border-color: ${props => props.$accentColor}40;
  }
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${props => props.$color}15, ${props => props.$color}08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: ${props => props.$color};
  transition: all 0.3s ease;

  ${StatCard}:hover & {
    transform: scale(1.1);
    background: linear-gradient(135deg, ${props => props.$color}25, ${props => props.$color}15);
  }
`;

const StatValue = styled.div`
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  line-height: 1;
  margin-bottom: 6px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${luxuryTheme.textSecondary};
  font-weight: 500;
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

const PatientAvatar = styled.div<{ $type: PatientType | null }>`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: ${props => {
    switch (props.$type) {
      case 'vip': return `linear-gradient(135deg, ${luxuryTheme.vip}, ${luxuryTheme.goldLight})`;
      case 'trt': return `linear-gradient(135deg, ${luxuryTheme.trt}, ${luxuryTheme.primaryLight})`;
      case 'hormone': return `linear-gradient(135deg, ${luxuryTheme.hormone}, #E8A0B0)`;
      case 'new': return `linear-gradient(135deg, ${luxuryTheme.newPatient}, #10B981)`;
      default: return `linear-gradient(135deg, ${luxuryTheme.general}, ${luxuryTheme.textSecondary})`;
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
  font-family: 'Cormorant Garamond', serif;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px ${props => {
    switch (props.$type) {
      case 'vip': return `${luxuryTheme.vip}40`;
      case 'trt': return `${luxuryTheme.trt}40`;
      case 'hormone': return `${luxuryTheme.hormone}40`;
      case 'new': return `${luxuryTheme.newPatient}40`;
      default: return `${luxuryTheme.general}40`;
    }
  }};
  transition: all 0.3s ease;

  ${PatientCard}:hover & {
    transform: scale(1.05);
  }
`;

const PatientInfo = styled.div`
  min-width: 0;
`;

const PatientName = styled.div`
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: ${props => {
    switch (props.$type) {
      case 'vip': return `${luxuryTheme.vip}18`;
      case 'trt': return `${luxuryTheme.trt}15`;
      case 'hormone': return `${luxuryTheme.hormone}18`;
      case 'new': return `${luxuryTheme.newPatient}15`;
      default: return `${luxuryTheme.general}15`;
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'vip': return luxuryTheme.vip;
      case 'trt': return luxuryTheme.trt;
      case 'hormone': return luxuryTheme.hormone;
      case 'new': return luxuryTheme.newPatient;
      default: return luxuryTheme.general;
    }
  }};
  border: 1px solid ${props => {
    switch (props.$type) {
      case 'vip': return `${luxuryTheme.vip}30`;
      case 'trt': return `${luxuryTheme.trt}25`;
      case 'hormone': return `${luxuryTheme.hormone}30`;
      case 'new': return `${luxuryTheme.newPatient}25`;
      default: return `${luxuryTheme.general}25`;
    }
  }};
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
  border: 1px solid ${props => props.$active ? luxuryTheme.gold : luxuryTheme.border};
  background: ${props => props.$active
    ? `linear-gradient(135deg, ${luxuryTheme.gold}, ${luxuryTheme.goldLight})`
    : luxuryTheme.surface};
  color: ${props => props.$active ? 'white' : luxuryTheme.text};
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    border-color: ${luxuryTheme.gold};
    background: ${props => props.$active
      ? `linear-gradient(135deg, ${luxuryTheme.gold}, ${luxuryTheme.goldLight})`
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
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
    color: ${luxuryTheme.text};
    margin: 0 0 8px;
  }

  p {
    color: ${luxuryTheme.textSecondary};
    margin: 0;
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
const PATIENT_TYPES: { value: PatientType; label: string }[] = [
  { value: 'new', label: 'Novo Paciente' },
  { value: 'general', label: 'Geral' },
  { value: 'trt', label: 'TRT' },
  { value: 'hormone', label: 'Hormonal' },
  { value: 'vip', label: 'VIP' }
];

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
    patient_type: 'new' as PatientType
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
        patient_type: patient.patient_type || 'general'
      });
    } else {
      setEditingPatient(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        patient_type: 'new'
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
      patient_type: 'new'
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
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPatient.id);

        if (error) throw error;
        setSuccess('Paciente atualizado com sucesso!');
      } else {
        if (!formData.email) {
          setError('Email é obrigatório para novos pacientes');
          setSaving(false);
          return;
        }

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

        setError('O paciente precisa se registrar no sistema primeiro.');
        setSaving(false);
        return;
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

  const getPatientTypeLabel = (type: PatientType | null) => {
    const found = PATIENT_TYPES.find(t => t.value === type);
    return found ? found.label : 'Geral';
  };

  const getBadgeIcon = (type: PatientType | null) => {
    switch (type) {
      case 'vip': return <Crown size={12} />;
      case 'trt': return <Activity size={12} />;
      case 'new': return <Sparkles size={12} />;
      default: return null;
    }
  };

  const stats = {
    total: patients.length,
    new: patients.filter(p => p.patient_type === 'new').length,
    trt: patients.filter(p => p.patient_type === 'trt').length,
    vip: patients.filter(p => p.patient_type === 'vip').length
  };

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <h1>Pacientes</h1>
          <p>Gerencie os pacientes cadastrados na clínica</p>
        </Header>

        <StatsGrid>
          <StatCard $delay={0} $accentColor={luxuryTheme.primary}>
            <StatIcon $color={luxuryTheme.primary}>
              <Users size={24} />
            </StatIcon>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total de Pacientes</StatLabel>
          </StatCard>

          <StatCard $delay={50} $accentColor={luxuryTheme.newPatient}>
            <StatIcon $color={luxuryTheme.newPatient}>
              <UserPlus size={24} />
            </StatIcon>
            <StatValue>{stats.new}</StatValue>
            <StatLabel>Novos Pacientes</StatLabel>
          </StatCard>

          <StatCard $delay={100} $accentColor={luxuryTheme.trt}>
            <StatIcon $color={luxuryTheme.trt}>
              <Activity size={24} />
            </StatIcon>
            <StatValue>{stats.trt}</StatValue>
            <StatLabel>Pacientes TRT</StatLabel>
          </StatCard>

          <StatCard $delay={150} $accentColor={luxuryTheme.vip}>
            <StatIcon $color={luxuryTheme.vip}>
              <Crown size={24} />
            </StatIcon>
            <StatValue>{stats.vip}</StatValue>
            <StatLabel>Pacientes VIP</StatLabel>
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
            {PATIENT_TYPES.map(type => (
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
            <h3>Nenhum paciente encontrado</h3>
            <p>Tente ajustar os filtros de busca</p>
          </EmptyState>
        ) : (
          <>
            <PatientsGrid>
              {paginatedPatients.map((patient, index) => (
                <PatientCard key={patient.id} $index={index}>
                  <PatientAvatar $type={patient.patient_type}>
                    {getInitials(patient.first_name, patient.last_name)}
                  </PatientAvatar>

                  <PatientInfo>
                    <PatientName>{patient.first_name} {patient.last_name}</PatientName>
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
                    {getPatientTypeLabel(patient.patient_type)}
                  </PatientBadge>

                  <PatientActions>
                    <ActionButton onClick={() => handleViewPatient(patient)}>
                      <Eye size={16} />
                      Ver
                    </ActionButton>
                    <ActionButton $variant="primary" onClick={() => handleOpenModal(patient)}>
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
                    {PATIENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </FormSelect>
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <Button $variant="secondary" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button $variant="primary" onClick={handleSave} disabled={saving}>
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
