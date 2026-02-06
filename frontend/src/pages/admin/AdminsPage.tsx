import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Shield, Plus, Search, Edit2, Trash2, X, Check, AlertCircle,
  Mail, Phone, Users, UserPlus, ChevronLeft, ChevronRight, Crown
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { theme } from '../../styles/GlobalStyle';
import { supabase } from '../../lib/supabaseClient';
import { Profile } from '../../types/database';

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
  success: '#10B981',
  error: '#EF4444',
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

  &:active {
    transform: translateY(0);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;

  @media (max-width: 900px) {
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
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 200ms;
  animation-fill-mode: both;
`;

const AdminCard = styled.div<{ $index: number }>`
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
  animation-delay: ${props => 250 + props.$index * 50}ms;
  animation-fill-mode: both;

  &:hover {
    border-color: ${luxuryTheme.primary};
    box-shadow: 0 8px 24px ${luxuryTheme.primary}15;
    transform: translateX(4px);
    background: linear-gradient(135deg, ${luxuryTheme.surface} 0%, ${luxuryTheme.cream} 100%);
  }

  @media (max-width: 900px) {
    grid-template-columns: auto 1fr;
    gap: 16px;
  }
`;

const AdminAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
  font-family: 'Cormorant Garamond', serif;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px ${luxuryTheme.primary}40;
  transition: all 0.3s ease;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${luxuryTheme.primary};
    border: 2px solid ${luxuryTheme.surface};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  ${AdminCard}:hover & {
    transform: scale(1.05);
  }
`;

const AdminInfo = styled.div`
  min-width: 0;
`;

const AdminName = styled.div`
  font-family: 'Cormorant Garamond', serif;
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

const AdminBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${luxuryTheme.primary}20;
  color: ${luxuryTheme.primary};
  letter-spacing: 0.5px;
`;

const AdminEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${luxuryTheme.textSecondary};
  font-size: 13px;

  svg {
    flex-shrink: 0;
  }
`;

const AdminPhone = styled.div`
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

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${luxuryTheme.primary}15;
  color: ${luxuryTheme.primary};
  border: 1px solid ${luxuryTheme.primary}25;

  svg {
    width: 12px;
    height: 12px;
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

const AdminActions = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 900px) {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
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
    font-family: 'Cormorant Garamond', serif;
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
  grid-template-columns: 56px 1fr 150px 100px 120px;
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
const ITEMS_PER_PAGE = 8;

// ============================================
// COMPONENT
// ============================================
const AdminsPage: React.FC = () => {
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
      setError('Preencha todos os campos obrigatórios');
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
        setSuccess('Administrador atualizado com sucesso!');
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
          setSuccess('Usuário promovido a administrador!');
        } else {
          setError('Email não encontrado. O usuário precisa se registrar primeiro.');
          setSaving(false);
          return;
        }
      }

      await fetchAdmins();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar administrador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: Profile) => {
    if (!window.confirm(`Remover ${admin.first_name} ${admin.last_name} como administrador?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'patient', updated_at: new Date().toISOString() })
        .eq('id', admin.id);

      if (error) throw error;
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
            <h1>Administradores</h1>
            <p>Gerencie os administradores do sistema</p>
          </div>
          <AddButton onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Adicionar Admin
          </AddButton>
        </Header>

        <StatsGrid>
          <StatCard $delay={0} $accentColor={luxuryTheme.primary}>
            <StatIcon $color={luxuryTheme.primary}>
              <Shield size={24} />
            </StatIcon>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total de Admins</StatLabel>
          </StatCard>

          <StatCard $delay={50} $accentColor={luxuryTheme.primary}>
            <StatIcon $color={luxuryTheme.primary}>
              <Crown size={24} />
            </StatIcon>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Acesso Total</StatLabel>
          </StatCard>

          <StatCard $delay={100} $accentColor={luxuryTheme.success}>
            <StatIcon $color={luxuryTheme.success}>
              <Users size={24} />
            </StatIcon>
            <StatValue>{stats.withPhone}</StatValue>
            <StatLabel>Com Telefone</StatLabel>
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
        </FiltersSection>

        {loading ? (
          <LoadingSkeleton>
            {[0, 1, 2, 3].map(i => (
              <SkeletonCard key={i} $delay={i * 100}>
                <SkeletonElement $width="56px" $height="56px" $round />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SkeletonElement $width="180px" $height="20px" />
                  <SkeletonElement $width="220px" $height="14px" />
                </div>
                <SkeletonElement $width="130px" $height="16px" />
                <SkeletonElement $width="100px" $height="32px" />
                <SkeletonElement $width="100px" $height="36px" />
              </SkeletonCard>
            ))}
          </LoadingSkeleton>
        ) : paginatedAdmins.length === 0 ? (
          <EmptyState>
            <Shield />
            {admins.length === 0 ? (
              <>
                <h3>Nenhum administrador cadastrado</h3>
                <p>Administradores podem gerenciar consultas, pacientes e configuracoes da clinica.<br />
                Adicione outros membros da equipe para ajudar na gestao.</p>
                <EmptyStateCTA onClick={() => setShowModal(true)}>
                  <UserPlus size={16} />
                  Adicionar Admin
                </EmptyStateCTA>
              </>
            ) : (
              <>
                <h3>Nenhum administrador encontrado</h3>
                <p>Tente ajustar os termos da busca</p>
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
                    <AdminName>
                      {admin.first_name} {admin.last_name}
                      <AdminBadge>
                        <Crown size={10} />
                        Admin
                      </AdminBadge>
                    </AdminName>
                    <AdminEmail>
                      <Mail size={12} />
                      {admin.email}
                    </AdminEmail>
                  </AdminInfo>

                  <AdminPhone>
                    <Phone size={14} />
                    {admin.phone || '—'}
                  </AdminPhone>

                  <RoleBadge>
                    <Shield size={12} />
                    Administrador
                  </RoleBadge>

                  <AdminActions>
                    <ActionButton onClick={() => handleOpenModal(admin)}>
                      <Edit2 size={16} />
                      Editar
                    </ActionButton>
                    <ActionButton $variant="danger" onClick={() => handleDelete(admin)}>
                      <Trash2 size={16} />
                    </ActionButton>
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

        {showModal && (
          <ModalOverlay onClick={handleCloseModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>
                  <Shield size={22} />
                  {editingAdmin ? 'Editar Administrador' : 'Adicionar Administrador'}
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
                  <label>Email {!editingAdmin && <span>*</span>}</label>
                  <FormInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingAdmin}
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

export default AdminsPage;
