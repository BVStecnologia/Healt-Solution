import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes, css } from 'styled-components';
import {
  Shield, Plus, Search, Edit2, Trash2, X, Check, AlertCircle,
  Mail, Phone, Users, UserPlus, ChevronLeft, ChevronRight, Crown,
  AlertTriangle
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { theme } from '../../styles/GlobalStyle';
import { supabase } from '../../lib/supabaseClient';
import { Profile } from '../../types/database';
import { useAuth } from '../../context/AuthContext';

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
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
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
// THEME - Paleta Terracota (consistente com design principal)
// ============================================
const luxuryTheme = {
  // Accent colors (hex for concatenation/dynamic props)
  primary: '#92563E',
  primaryLight: '#AF8871',
  primarySoft: '#F4E7DE',
  primaryDark: '#7A4832',
  success: '#6B8E6B',
  error: '#C4836A',
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

  &:active {
    transform: translateY(0);
  }
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.5s ease-out;
`;

const StatPill = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: ${luxuryTheme.surface};
  border: 1px solid rgba(146, 86, 62, 0.08);
  border-radius: 40px;

  svg {
    width: 16px;
    height: 16px;
    color: ${luxuryTheme.primary};
    opacity: 0.6;
  }
`;

const StatValue = styled.span`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 20px;
  font-weight: 600;
  color: ${luxuryTheme.text};
`;

const StatLabel = styled.span`
  font-size: 13px;
  color: ${luxuryTheme.textSecondary};
  font-weight: 400;
`;

const FiltersSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 150ms;
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

const AdminsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 200ms;
  animation-fill-mode: both;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const AdminCard = styled.div<{ $index: number }>`
  background: ${luxuryTheme.surface};
  border: 1px solid rgba(146, 86, 62, 0.08);
  border-radius: 20px;
  padding: 28px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => 200 + props.$index * 80}ms;
  animation-fill-mode: both;

  &:hover {
    border-color: rgba(146, 86, 62, 0.15);
    box-shadow: 0 12px 40px rgba(146, 86, 62, 0.10);
    transform: translateY(-6px);
  }
`;

const AdminAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(145deg, ${luxuryTheme.primary}, #7A4532);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
  font-size: 24px;
  font-family: ${theme.typography.fontFamilyHeading};
  letter-spacing: 1px;
  margin-bottom: 12px;
  position: relative;
  transition: all 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${luxuryTheme.primary};
    border: 3px solid ${luxuryTheme.surface};
  }

  ${AdminCard}:hover & {
    transform: scale(1.06);
    box-shadow: 0 8px 24px rgba(146, 86, 62, 0.20);
  }
`;

const AdminInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 8px;
  width: 100%;
`;

const AdminName = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 17px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const AdminEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${luxuryTheme.textSecondary};
  font-size: 12px;

  svg {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
  }
`;

const AdminBadge = styled.span`
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
  margin-bottom: 12px;

  svg {
    width: 11px;
    height: 11px;
  }
`;

const AdminActions = styled.div`
  display: flex;
  gap: 6px;
  width: 100%;
  padding-top: 14px;
  border-top: 1px solid rgba(146, 86, 62, 0.06);
  justify-content: center;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: ${props => {
    if (props.$variant === 'primary') return `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})`;
    if (props.$variant === 'danger') return `${luxuryTheme.error}15`;
    return luxuryTheme.surface;
  }};
  color: ${props => {
    if (props.$variant === 'primary') return 'white';
    if (props.$variant === 'danger') return luxuryTheme.error;
    return luxuryTheme.primary;
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'primary') return 'transparent';
    if (props.$variant === 'danger') return `${luxuryTheme.error}30`;
    return luxuryTheme.border;
  }};
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => {
      if (props.$variant === 'primary') return `${luxuryTheme.primary}40`;
      if (props.$variant === 'danger') return `${luxuryTheme.error}30`;
      return `${luxuryTheme.primary}20`;
    }};
    ${props => props.$variant !== 'primary' && props.$variant !== 'danger' && css`
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
  animation-delay: 400ms;
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
    color: ${luxuryTheme.primary};
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1000px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const SkeletonCard = styled.div<{ $delay: number }>`
  background: ${luxuryTheme.surface};
  border: 1px solid rgba(146, 86, 62, 0.08);
  border-radius: 20px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
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
// CONSTANTS
// ============================================
const ITEMS_PER_PAGE = 8;

// ============================================
// COMPONENT
// ============================================
const AdminsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmRemoveAdmin, setConfirmRemoveAdmin] = useState<Profile | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('first_name');

      if (error) throw error;
      setAdmins(data || []);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (admin?: Profile) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        phone: admin.phone || ''
      });
    } else {
      setEditingAdmin(null);
      setFormData({ email: '', first_name: '', last_name: '', phone: '' });
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormData({ email: '', first_name: '', last_name: '', phone: '' });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!formData.email || !formData.first_name || !formData.last_name) {
      setError(t('admins.errorRequired'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingAdmin) {
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAdmin.id);

        if (error) throw error;
        setSuccess(t('admins.successUpdate'));
      } else {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('email', formData.email)
          .single();

        if (existingUser) {
          const { error } = await supabase
            .from('profiles')
            .update({
              role: 'admin',
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);

          if (error) throw error;
          setSuccess(t('admins.successPromote'));
        } else {
          setError(t('admins.errorNotFound'));
          setSaving(false);
          return;
        }
      }

      await fetchAdmins();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('admins.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (admin: Profile) => {
    if (admin.id === user?.id) return;
    setConfirmRemoveAdmin(admin);
  };

  const confirmRemove = async () => {
    if (!confirmRemoveAdmin) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'patient', updated_at: new Date().toISOString() })
        .eq('id', confirmRemoveAdmin.id);

      if (error) throw error;
      setConfirmRemoveAdmin(null);
      await fetchAdmins();
    } catch (err) {
      console.error('Error removing admin:', err);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.first_name.toLowerCase().includes(search.toLowerCase()) ||
    admin.last_name.toLowerCase().includes(search.toLowerCase()) ||
    admin.email.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Stats
  const stats = {
    total: admins.length,
    withPhone: admins.filter(a => a.phone).length,
  };

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>{t('admins.title')}</h1>
            <p>{t('admins.description')}</p>
          </div>
          <AddButton onClick={() => handleOpenModal()}>
            <Plus size={18} />
            {t('admins.addButton')}
          </AddButton>
        </Header>

        <StatsRow>
          <StatPill>
            <Shield />
            <StatValue>{stats.total}</StatValue>
            <StatLabel>{t('admins.title')}</StatLabel>
          </StatPill>
          <StatPill>
            <Phone />
            <StatValue>{stats.withPhone}</StatValue>
            <StatLabel>{t('patients.phone')}</StatLabel>
          </StatPill>
        </StatsRow>

        <FiltersSection>
          <SearchContainer>
            <Search size={18} />
            <SearchInput
              type="text"
              placeholder={t('patients.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchContainer>
        </FiltersSection>

        {loading ? (
          <LoadingSkeleton>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <SkeletonCard key={i} $delay={i * 100}>
                <SkeletonElement $width="80px" $height="80px" $round />
                <SkeletonElement $width="140px" $height="18px" />
                <SkeletonElement $width="100px" $height="12px" />
                <SkeletonElement $width="110px" $height="28px" />
              </SkeletonCard>
            ))}
          </LoadingSkeleton>
        ) : paginatedAdmins.length === 0 ? (
          <EmptyState>
            <Shield />
            {admins.length === 0 ? (
              <>
                <h3>{t('appointments.emptyDefault')}</h3>
                <p>{t('admins.description')}</p>
                <EmptyStateCTA onClick={() => setShowModal(true)}>
                  <UserPlus size={16} />
                  {t('admins.addButton')}
                </EmptyStateCTA>
              </>
            ) : (
              <>
                <h3>{t('appointments.emptyDefault')}</h3>
                <p>{t('common.tryAdjustSearch')}</p>
              </>
            )}
          </EmptyState>
        ) : (
          <>
            <AdminsGrid>
              {paginatedAdmins.map((admin, index) => (
                <AdminCard key={admin.id} $index={index}>
                  <AdminAvatar>
                    {getInitials(admin.first_name, admin.last_name)}
                  </AdminAvatar>

                  <AdminInfo>
                    <AdminName>{admin.first_name} {admin.last_name}</AdminName>
                    <AdminEmail>
                      <Mail size={12} />
                      {admin.email}
                    </AdminEmail>
                  </AdminInfo>

                  <AdminBadge>
                    <Crown size={11} />
                    {t('admins.role')}
                  </AdminBadge>

                  <AdminActions>
                    <ActionButton onClick={() => handleOpenModal(admin)} title={t('common.edit')}>
                      <Edit2 size={16} />
                    </ActionButton>
                    {admin.id !== user?.id && (
                      <ActionButton $variant="danger" onClick={() => handleDelete(admin)} title={t('common.remove')}>
                        <Trash2 size={16} />
                      </ActionButton>
                    )}
                  </AdminActions>
                </AdminCard>
              ))}
            </AdminsGrid>

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

        {/* Modal de Confirmação de Remoção */}
        {confirmRemoveAdmin && (
          <ConfirmOverlay onClick={() => setConfirmRemoveAdmin(null)}>
            <ConfirmCard onClick={(e) => e.stopPropagation()}>
              <ConfirmBody>
                <ConfirmIconCircle>
                  <AlertTriangle size={28} />
                </ConfirmIconCircle>
                <ConfirmTitle>{t('admins.removeTitle')}</ConfirmTitle>
                <ConfirmText>
                  Tem certeza que deseja remover <ConfirmName>{confirmRemoveAdmin.first_name} {confirmRemoveAdmin.last_name}</ConfirmName> como administrador?
                </ConfirmText>
                <ConfirmText style={{ fontSize: 13, opacity: 0.7 }}>
                  O usuário será rebaixado para paciente e perderá acesso ao painel administrativo.
                </ConfirmText>
              </ConfirmBody>
              <ConfirmFooter>
                <ConfirmBtn onClick={() => setConfirmRemoveAdmin(null)}>
                  {t('common.cancel')}
                </ConfirmBtn>
                <ConfirmBtn $danger onClick={confirmRemove}>
                  {t('common.remove')}
                </ConfirmBtn>
              </ConfirmFooter>
            </ConfirmCard>
          </ConfirmOverlay>
        )}

        {showModal && (
          <ModalOverlay onClick={handleCloseModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>
                  <Shield size={22} />
                  {editingAdmin ? t('admins.editTitle') : t('admins.addTitle')}
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
                  <label>{t('patients.email')} {!editingAdmin && <span>*</span>}</label>
                  <FormInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingAdmin}
                    placeholder={t('common.emailPlaceholder')}
                  />
                </FormGroup>

                <FormGroup>
                  <label>{t('patients.firstName')} <span>*</span></label>
                  <FormInput
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder={t('patients.firstName')}
                  />
                </FormGroup>

                <FormGroup>
                  <label>{t('patients.lastName')} <span>*</span></label>
                  <FormInput
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder={t('patients.lastName')}
                  />
                </FormGroup>

                <FormGroup>
                  <label>{t('patients.phone')}</label>
                  <FormInput
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('common.phonePlaceholder')}
                  />
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <Button $variant="secondary" onClick={handleCloseModal}>
                  {t('common.cancel')}
                </Button>
                <Button $variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default AdminsPage;
