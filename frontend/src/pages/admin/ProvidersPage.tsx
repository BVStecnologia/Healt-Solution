import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Stethoscope, Plus, Search, Edit2, Trash2, Check, AlertCircle,
  Calendar, Clock, X, UserCog, Phone, Mail, Activity, Users,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { theme } from '../../styles/GlobalStyle';
import { supabase } from '../../lib/supabaseClient';
import { createProvider, getProfileByEmail, promoteToProvider, supabaseAdmin } from '../../lib/adminService';
import { Profile, Provider } from '../../types/database';

// ============================================
// TYPES
// ============================================
interface ProviderWithProfile extends Provider {
  profile: Profile;
}

interface ScheduleItem {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

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

const ProvidersGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 300ms;
  animation-fill-mode: both;
`;

const ProviderCard = styled.div<{ $index: number }>`
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
    border-color: ${luxuryTheme.primary};
    box-shadow: 0 8px 24px ${luxuryTheme.primary}15;
    transform: translateX(4px);
    background: linear-gradient(135deg, ${luxuryTheme.surface} 0%, ${luxuryTheme.cream} 100%);
  }

  @media (max-width: 1000px) {
    grid-template-columns: auto 1fr;
    gap: 16px;
  }
`;

const ProviderAvatar = styled.div<{ $active: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: ${props => props.$active
    ? `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})`
    : `linear-gradient(135deg, ${luxuryTheme.textSecondary}, #A0A0A0)`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
  font-family: 'Cormorant Garamond', serif;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px ${props => props.$active ? `${luxuryTheme.primary}40` : 'rgba(0,0,0,0.15)'};
  transition: all 0.3s ease;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${props => props.$active ? luxuryTheme.success : luxuryTheme.error};
    border: 2px solid ${luxuryTheme.surface};
  }

  ${ProviderCard}:hover & {
    transform: scale(1.05);
  }
`;

const ProviderInfo = styled.div`
  min-width: 0;
`;

const ProviderName = styled.div`
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProviderEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${luxuryTheme.textSecondary};
  font-size: 13px;

  svg {
    flex-shrink: 0;
  }
`;

const ProviderSpecialty = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;

  @media (max-width: 1000px) {
    grid-column: 2;
  }
`;

const SpecialtyBadge = styled.span`
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
  transition: all 0.3s ease;

  svg {
    width: 12px;
    height: 12px;
  }

  ${ProviderCard}:hover & {
    transform: scale(1.05);
  }
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$active ? luxuryTheme.successLight : luxuryTheme.errorLight};
  color: ${props => props.$active ? luxuryTheme.success : luxuryTheme.error};
  border: 1px solid ${props => props.$active ? `${luxuryTheme.success}25` : `${luxuryTheme.error}25`};

  @media (max-width: 1000px) {
    display: none;
  }
`;

const ProviderActions = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 1000px) {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'info' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  background: ${props => {
    if (props.$variant === 'primary') return `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})`;
    if (props.$variant === 'info') return `${luxuryTheme.primary}15`;
    if (props.$variant === 'danger') return `${luxuryTheme.error}15`;
    return luxuryTheme.surface;
  }};
  color: ${props => {
    if (props.$variant === 'primary') return 'white';
    if (props.$variant === 'info') return luxuryTheme.primary;
    if (props.$variant === 'danger') return luxuryTheme.error;
    return luxuryTheme.primary;
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'primary') return 'transparent';
    if (props.$variant === 'info') return `${luxuryTheme.primary}30`;
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
      if (props.$variant === 'info') return `${luxuryTheme.primary}30`;
      if (props.$variant === 'danger') return `${luxuryTheme.error}30`;
      return `${luxuryTheme.primary}20`;
    }};
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
  max-width: 600px;
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

  p {
    color: rgba(255, 255, 255, 0.8);
    margin: 4px 0 0;
    font-size: 14px;
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

  small {
    display: block;
    margin-top: 6px;
    color: ${luxuryTheme.textSecondary};
    font-size: 12px;
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

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  background: ${luxuryTheme.cream};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 10px;
  font-size: 14px;
  color: ${luxuryTheme.text};
  transition: all 0.3s ease;
  box-sizing: border-box;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;

  &::placeholder {
    color: ${luxuryTheme.textSecondary};
  }

  &:focus {
    outline: none;
    border-color: ${luxuryTheme.primary};
    background: ${luxuryTheme.surface};
    box-shadow: 0 0 0 3px ${luxuryTheme.primary}15;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${luxuryTheme.cream};
  border-radius: 10px;
  border: 1px solid ${luxuryTheme.border};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${luxuryTheme.primaryLight};
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: ${luxuryTheme.primary};
  }

  label {
    margin: 0;
    cursor: pointer;
    color: ${luxuryTheme.text};
    font-size: 14px;
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

const Alert = styled.div<{ $variant: 'error' | 'success' | 'info' }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  background: ${props => {
    if (props.$variant === 'error') return luxuryTheme.errorLight;
    if (props.$variant === 'info') return luxuryTheme.primaryLight;
    return luxuryTheme.successLight;
  }};
  color: ${props => {
    if (props.$variant === 'error') return luxuryTheme.error;
    if (props.$variant === 'info') return luxuryTheme.primary;
    return luxuryTheme.success;
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'error') return `${luxuryTheme.error}30`;
    if (props.$variant === 'info') return `${luxuryTheme.primary}30`;
    return `${luxuryTheme.success}30`;
  }};

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const ScheduleSection = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid ${luxuryTheme.border};

  h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    font-weight: 600;
    color: ${luxuryTheme.text};
    margin: 0 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ScheduleGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ScheduleRow = styled.div<{ $active?: boolean }>`
  display: grid;
  grid-template-columns: 100px 1fr 1fr 40px;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: ${props => props.$active ? `${luxuryTheme.primary}08` : luxuryTheme.cream};
  border-radius: 10px;
  border: 1px solid ${props => props.$active ? `${luxuryTheme.primary}20` : luxuryTheme.border};
  opacity: ${props => props.$active ? 1 : 0.6};
  transition: all 0.3s ease;

  .day-label {
    font-weight: 600;
    color: ${props => props.$active ? luxuryTheme.primary : luxuryTheme.textSecondary};
    font-size: 13px;
  }

  input[type="time"] {
    padding: 8px 12px;
    border: 1px solid ${luxuryTheme.border};
    border-radius: 8px;
    font-size: 13px;
    color: ${luxuryTheme.text};
    background: ${luxuryTheme.surface};

    &:focus {
      outline: none;
      border-color: ${luxuryTheme.primary};
    }

    &:disabled {
      background: ${luxuryTheme.border};
      cursor: not-allowed;
    }
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: ${luxuryTheme.primary};
  }
`;

// ============================================
// CONSTANTS
// ============================================
const SPECIALTIES = [
  'Clínico Geral',
  'Cardiologista',
  'Dermatologista',
  'Endocrinologista',
  'Ginecologista',
  'Neurologista',
  'Nutricionista',
  'Ortopedista',
  'Pediatra',
  'Psicólogo',
  'Psiquiatra',
  'Urologista',
  'Outro'
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const ITEMS_PER_PAGE = 8;

// ============================================
// COMPONENT
// ============================================
const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderWithProfile | null>(null);
  const [selectedProviderForSchedule, setSelectedProviderForSchedule] = useState<ProviderWithProfile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialty: '',
    bio: '',
    is_active: true
  });
  const [schedules, setSchedules] = useState<ScheduleItem[]>(
    DAYS_OF_WEEK.map(day => ({
      day_of_week: day.value,
      start_time: '08:00',
      end_time: '18:00',
      is_active: day.value >= 1 && day.value <= 5,
    }))
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data: providersData, error: providersError } = await supabaseAdmin
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (providersError) throw providersError;

      if (!providersData || providersData.length === 0) {
        setProviders([]);
        setLoading(false);
        return;
      }

      const userIds = providersData.map(p => p.user_id);
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const combined = providersData.map(provider => ({
        ...provider,
        profile: profilesData?.find(p => p.id === provider.user_id) || {
          id: provider.user_id,
          email: '',
          first_name: 'Desconhecido',
          last_name: '',
          role: 'provider' as const,
          phone: null,
          patient_type: null,
          last_visit_at: null,
          labs_completed_at: null,
          created_at: '',
          updated_at: ''
        }
      }));

      setProviders(combined);
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (provider?: ProviderWithProfile) => {
    setTempPassword('');
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        email: provider.profile.email,
        first_name: provider.profile.first_name,
        last_name: provider.profile.last_name,
        phone: provider.profile.phone || '',
        specialty: provider.specialty,
        bio: provider.bio || '',
        is_active: provider.is_active
      });
    } else {
      setEditingProvider(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        specialty: '',
        bio: '',
        is_active: true
      });
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProvider(null);
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      specialty: '',
      bio: '',
      is_active: true
    });
    setError('');
    setTempPassword('');
  };

  const handleOpenScheduleModal = async (provider: ProviderWithProfile) => {
    setSelectedProviderForSchedule(provider);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabaseAdmin
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', provider.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const mergedSchedules = DAYS_OF_WEEK.map(day => {
          const existing = data.find(s => s.day_of_week === day.value);
          if (existing) {
            return {
              day_of_week: existing.day_of_week,
              start_time: existing.start_time,
              end_time: existing.end_time,
              is_active: existing.is_active,
            };
          }
          return {
            day_of_week: day.value,
            start_time: '08:00',
            end_time: '18:00',
            is_active: false,
          };
        });
        setSchedules(mergedSchedules);
      } else {
        setSchedules(
          DAYS_OF_WEEK.map(day => ({
            day_of_week: day.value,
            start_time: '08:00',
            end_time: '18:00',
            is_active: day.value >= 1 && day.value <= 5,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading schedules:', err);
    }

    setShowScheduleModal(true);
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedProviderForSchedule(null);
  };

  const handleSaveSchedules = async () => {
    if (!selectedProviderForSchedule) return;

    setSaving(true);
    setError('');

    try {
      await supabaseAdmin
        .from('provider_schedules')
        .delete()
        .eq('provider_id', selectedProviderForSchedule.id);

      const activeSchedules = schedules
        .filter(s => s.is_active)
        .map(s => ({
          provider_id: selectedProviderForSchedule.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          slot_duration: 30,
          is_active: true,
        }));

      if (activeSchedules.length > 0) {
        const { error } = await supabaseAdmin
          .from('provider_schedules')
          .insert(activeSchedules);

        if (error) throw error;
      }

      setSuccess('Horários salvos com sucesso!');
      setTimeout(() => {
        handleCloseScheduleModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.specialty) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    setError('');
    setTempPassword('');

    try {
      if (editingProvider) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProvider.user_id);

        if (profileError) throw profileError;

        const { error: providerError } = await supabaseAdmin
          .from('providers')
          .update({
            specialty: formData.specialty,
            bio: formData.bio || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProvider.id);

        if (providerError) throw providerError;
        setSuccess('Médico atualizado com sucesso!');
      } else {
        const existingProfile = await getProfileByEmail(formData.email);

        if (existingProfile) {
          const { data: existingProvider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', existingProfile.id)
            .single();

          if (existingProvider) {
            setError('Este usuário já é um médico cadastrado.');
            setSaving(false);
            return;
          }

          await promoteToProvider(existingProfile.id, {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            specialty: formData.specialty,
            bio: formData.bio,
            is_active: formData.is_active,
          });

          setSuccess('Usuário promovido a médico com sucesso!');
        } else {
          const result = await createProvider({
            email: formData.email,
            password: '',
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: 'provider',
            specialty: formData.specialty,
            bio: formData.bio,
            is_active: formData.is_active,
          });

          setTempPassword(result.tempPassword);
          setSuccess(`Médico criado com sucesso!`);
          await fetchProviders();
          setSaving(false);
          return;
        }
      }

      await fetchProviders();

      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar médico');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (provider: ProviderWithProfile) => {
    if (!window.confirm(`Desativar Dr(a). ${provider.profile.first_name} ${provider.profile.last_name}?`)) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('providers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', provider.id);

      if (error) throw error;
      await fetchProviders();
    } catch (err) {
      console.error('Error deactivating provider:', err);
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.profile.first_name.toLowerCase().includes(search.toLowerCase()) ||
    provider.profile.last_name.toLowerCase().includes(search.toLowerCase()) ||
    provider.profile.email.toLowerCase().includes(search.toLowerCase()) ||
    provider.specialty.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProviders.length / ITEMS_PER_PAGE);
  const paginatedProviders = filteredProviders.slice(
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
    total: providers.length,
    active: providers.filter(p => p.is_active).length,
    inactive: providers.filter(p => !p.is_active).length,
    specialties: new Set(providers.map(p => p.specialty)).size
  };

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>Médicos</h1>
            <p>Gerencie os médicos e profissionais de saúde</p>
          </div>
          <AddButton onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Adicionar Médico
          </AddButton>
        </Header>

        <StatsGrid>
          <StatCard $delay={0} $accentColor={luxuryTheme.primary}>
            <StatIcon $color={luxuryTheme.primary}>
              <Stethoscope size={24} />
            </StatIcon>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total de Médicos</StatLabel>
          </StatCard>

          <StatCard $delay={50} $accentColor={luxuryTheme.success}>
            <StatIcon $color={luxuryTheme.success}>
              <Activity size={24} />
            </StatIcon>
            <StatValue>{stats.active}</StatValue>
            <StatLabel>Médicos Ativos</StatLabel>
          </StatCard>

          <StatCard $delay={100} $accentColor={luxuryTheme.error}>
            <StatIcon $color={luxuryTheme.error}>
              <Users size={24} />
            </StatIcon>
            <StatValue>{stats.inactive}</StatValue>
            <StatLabel>Médicos Inativos</StatLabel>
          </StatCard>

          <StatCard $delay={150} $accentColor={luxuryTheme.primary}>
            <StatIcon $color={luxuryTheme.primary}>
              <Sparkles size={24} />
            </StatIcon>
            <StatValue>{stats.specialties}</StatValue>
            <StatLabel>Especialidades</StatLabel>
          </StatCard>
        </StatsGrid>

        <FiltersSection>
          <SearchContainer>
            <Search size={18} />
            <SearchInput
              type="text"
              placeholder="Buscar por nome, email ou especialidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchContainer>
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
                <SkeletonElement $width="120px" $height="32px" />
                <SkeletonElement $width="80px" $height="32px" />
                <SkeletonElement $width="100px" $height="36px" />
              </SkeletonCard>
            ))}
          </LoadingSkeleton>
        ) : paginatedProviders.length === 0 ? (
          <EmptyState>
            <Stethoscope />
            {providers.length === 0 ? (
              <>
                <h3>Cadastre os médicos da clínica</h3>
                <p>Comece adicionando os profissionais que atendem na clínica.<br />
                Cada médico terá acesso ao seu próprio painel com agenda e notificações.</p>
                <EmptyStateCTA onClick={() => setShowModal(true)}>
                  <Plus size={16} />
                  Adicionar Médico
                </EmptyStateCTA>
              </>
            ) : (
              <>
                <h3>Nenhum médico encontrado</h3>
                <p>Tente ajustar os termos da busca</p>
              </>
            )}
          </EmptyState>
        ) : (
          <>
            <ProvidersGrid>
              {paginatedProviders.map((provider, index) => (
                <ProviderCard key={provider.id} $index={index}>
                  <ProviderAvatar $active={provider.is_active}>
                    {getInitials(provider.profile.first_name, provider.profile.last_name)}
                  </ProviderAvatar>

                  <ProviderInfo>
                    <ProviderName>Dr(a). {provider.profile.first_name} {provider.profile.last_name}</ProviderName>
                    <ProviderEmail>
                      <Mail size={12} />
                      {provider.profile.email}
                    </ProviderEmail>
                  </ProviderInfo>

                  <ProviderSpecialty>
                    <SpecialtyBadge>
                      <Stethoscope />
                      {provider.specialty}
                    </SpecialtyBadge>
                  </ProviderSpecialty>

                  <StatusBadge $active={provider.is_active}>
                    {provider.is_active ? 'Ativo' : 'Inativo'}
                  </StatusBadge>

                  <ProviderActions>
                    <ActionButton $variant="info" onClick={() => handleOpenScheduleModal(provider)} title="Horários">
                      <Clock size={16} />
                    </ActionButton>
                    <ActionButton onClick={() => handleOpenModal(provider)} title="Editar">
                      <Edit2 size={16} />
                    </ActionButton>
                    <ActionButton $variant="danger" onClick={() => handleDelete(provider)} title="Desativar">
                      <Trash2 size={16} />
                    </ActionButton>
                  </ProviderActions>
                </ProviderCard>
              ))}
            </ProvidersGrid>

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

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <ModalOverlay onClick={handleCloseModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <div>
                  <h2>
                    <UserCog size={22} />
                    {editingProvider ? 'Editar Médico' : 'Adicionar Médico'}
                  </h2>
                </div>
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

                {tempPassword && (
                  <Alert $variant="info">
                    <AlertCircle size={18} />
                    <div>
                      <strong>Senha temporária gerada:</strong><br />
                      <code style={{ fontSize: '16px', fontWeight: 'bold', background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: '4px' }}>{tempPassword}</code><br />
                      <small>Anote esta senha! O médico deve alterá-la no primeiro acesso.</small>
                    </div>
                  </Alert>
                )}

                <FormGroup>
                  <label>Email {!editingProvider && <span>*</span>}</label>
                  <FormInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingProvider}
                    placeholder="email@exemplo.com"
                  />
                  {!editingProvider && (
                    <small>Se o email não existir, uma nova conta será criada automaticamente.</small>
                  )}
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
                  <label>Especialidade <span>*</span></label>
                  <FormSelect
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {SPECIALTIES.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </FormSelect>
                </FormGroup>

                <FormGroup>
                  <label>Bio / Descrição</label>
                  <FormTextarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Breve descrição profissional..."
                  />
                </FormGroup>

                <FormGroup>
                  <CheckboxGroup onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="is_active">Médico ativo (disponível para agendamentos)</label>
                  </CheckboxGroup>
                </FormGroup>
              </ModalBody>

              <ModalFooter>
                <Button $variant="secondary" onClick={handleCloseModal}>
                  {tempPassword ? 'Fechar' : 'Cancelar'}
                </Button>
                {!tempPassword && (
                  <Button $variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Modal de Horários */}
        {showScheduleModal && selectedProviderForSchedule && (
          <ModalOverlay onClick={handleCloseScheduleModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <div>
                  <h2>
                    <Calendar size={22} />
                    Horários de Trabalho
                  </h2>
                  <p>Dr(a). {selectedProviderForSchedule.profile.first_name} {selectedProviderForSchedule.profile.last_name}</p>
                </div>
                <CloseButton onClick={handleCloseScheduleModal}>
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

                <ScheduleGrid>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <ScheduleRow key={day.value} $active={schedules[index]?.is_active}>
                      <span className="day-label">{day.label}</span>
                      <input
                        type="time"
                        value={schedules[index]?.start_time || '08:00'}
                        onChange={(e) => {
                          const newSchedules = [...schedules];
                          newSchedules[index] = { ...newSchedules[index], start_time: e.target.value };
                          setSchedules(newSchedules);
                        }}
                        disabled={!schedules[index]?.is_active}
                      />
                      <input
                        type="time"
                        value={schedules[index]?.end_time || '18:00'}
                        onChange={(e) => {
                          const newSchedules = [...schedules];
                          newSchedules[index] = { ...newSchedules[index], end_time: e.target.value };
                          setSchedules(newSchedules);
                        }}
                        disabled={!schedules[index]?.is_active}
                      />
                      <input
                        type="checkbox"
                        checked={schedules[index]?.is_active || false}
                        onChange={(e) => {
                          const newSchedules = [...schedules];
                          newSchedules[index] = { ...newSchedules[index], is_active: e.target.checked };
                          setSchedules(newSchedules);
                        }}
                      />
                    </ScheduleRow>
                  ))}
                </ScheduleGrid>
              </ModalBody>

              <ModalFooter>
                <Button $variant="secondary" onClick={handleCloseScheduleModal}>
                  Cancelar
                </Button>
                <Button $variant="primary" onClick={handleSaveSchedules} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Horários'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default ProvidersPage;
