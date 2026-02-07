import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Stethoscope, Plus, Search, Edit2, Trash2, Check, AlertCircle,
  Calendar, Clock, X, UserCog, Phone, Mail, Activity, Users,
  ChevronLeft, ChevronRight, Sparkles, AlertTriangle, RotateCcw
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 300ms;
  animation-fill-mode: both;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ProviderCard = styled.div<{ $index: number }>`
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
  position: relative;

  &:hover {
    border-color: rgba(146, 86, 62, 0.15);
    box-shadow: 0 12px 40px rgba(146, 86, 62, 0.10);
    transform: translateY(-6px);
  }
`;

const ProviderAvatar = styled.div<{ $active: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.$active
    ? `linear-gradient(145deg, ${luxuryTheme.primary}, #7A4532)`
    : '#D5D0CC'};
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
    background: ${props => props.$active ? '#92563E' : '#8C8B8B'};
    border: 3px solid ${luxuryTheme.surface};
  }

  ${ProviderCard}:hover & {
    transform: scale(1.06);
    box-shadow: 0 8px 24px rgba(146, 86, 62, 0.20);
  }
`;

const ProviderInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 8px;
  width: 100%;
`;

const ProviderName = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 17px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const ProviderEmail = styled.div`
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

const ProviderSpecialty = styled.div`
  margin-bottom: 12px;
`;

const SpecialtyBadge = styled.span`
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

  svg {
    width: 11px;
    height: 11px;
  }
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: none;
`;

const ProviderActions = styled.div`
  display: flex;
  gap: 6px;
  width: 100%;
  padding-top: 14px;
  border-top: 1px solid rgba(146, 86, 62, 0.06);
  justify-content: center;
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
  border-radius: ${props => props.$round ? '50%' : '6px'};
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
    font-family: ${theme.typography.fontFamilyHeading};
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
    font-family: ${theme.typography.fontFamilyHeading};
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

const ConfirmDoctorName = styled.span`
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
  const [confirmProvider, setConfirmProvider] = useState<{ provider: ProviderWithProfile; action: 'deactivate' | 'reactivate' } | null>(null);

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

  const handleDelete = (provider: ProviderWithProfile) => {
    setConfirmProvider({ provider, action: 'deactivate' });
  };

  const handleReactivate = (provider: ProviderWithProfile) => {
    setConfirmProvider({ provider, action: 'reactivate' });
  };

  const confirmAction = async () => {
    if (!confirmProvider) return;

    const newStatus = confirmProvider.action === 'reactivate';

    try {
      const { error } = await supabaseAdmin
        .from('providers')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', confirmProvider.provider.id);

      if (error) throw error;
      setConfirmProvider(null);
      await fetchProviders();
    } catch (err) {
      console.error('Error updating provider:', err);
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

        <StatsRow>
          <StatPill>
            <Stethoscope />
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Médicos</StatLabel>
          </StatPill>
          <StatPill>
            <Activity />
            <StatValue>{stats.active}</StatValue>
            <StatLabel>Ativos</StatLabel>
          </StatPill>
          {stats.inactive > 0 && (
            <StatPill style={{ opacity: 0.5 }}>
              <Users />
              <StatValue>{stats.inactive}</StatValue>
              <StatLabel>Inativos</StatLabel>
            </StatPill>
          )}
          <StatPill>
            <Sparkles />
            <StatValue>{stats.specialties}</StatValue>
            <StatLabel>Especialidades</StatLabel>
          </StatPill>
        </StatsRow>

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
            {[0, 1, 2, 3, 4, 5].map(i => (
              <SkeletonCard key={i} $delay={i * 100}>
                <SkeletonElement $width="80px" $height="80px" $round />
                <SkeletonElement $width="140px" $height="18px" />
                <SkeletonElement $width="100px" $height="12px" />
                <SkeletonElement $width="110px" $height="28px" />
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
                    {provider.is_active ? (
                      <ActionButton $variant="danger" onClick={() => handleDelete(provider)} title="Desativar">
                        <Trash2 size={16} />
                      </ActionButton>
                    ) : (
                      <ActionButton $variant="primary" onClick={() => handleReactivate(provider)} title="Reativar">
                        <RotateCcw size={16} />
                      </ActionButton>
                    )}
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

        {/* Modal de Confirmação */}
        {confirmProvider && (
          <ConfirmOverlay onClick={() => setConfirmProvider(null)}>
            <ConfirmCard onClick={(e) => e.stopPropagation()}>
              <ConfirmBody>
                <ConfirmIconCircle style={confirmProvider.action === 'reactivate' ? { background: 'rgba(146, 86, 62, 0.12)', color: luxuryTheme.primary } : undefined}>
                  {confirmProvider.action === 'reactivate' ? <RotateCcw size={28} /> : <AlertTriangle size={28} />}
                </ConfirmIconCircle>
                <ConfirmTitle>
                  {confirmProvider.action === 'reactivate' ? 'Reativar Médico' : 'Desativar Médico'}
                </ConfirmTitle>
                <ConfirmText>
                  {confirmProvider.action === 'reactivate' ? 'Deseja reativar ' : 'Tem certeza que deseja desativar '}
                  <ConfirmDoctorName>Dr(a). {confirmProvider.provider.profile.first_name} {confirmProvider.provider.profile.last_name}</ConfirmDoctorName>?
                </ConfirmText>
                <ConfirmText style={{ fontSize: 13, opacity: 0.7 }}>
                  {confirmProvider.action === 'reactivate'
                    ? 'O médico voltará a ficar disponível para agendamentos.'
                    : 'O médico não ficará mais disponível para agendamentos.'}
                </ConfirmText>
              </ConfirmBody>
              <ConfirmFooter>
                <ConfirmBtn onClick={() => setConfirmProvider(null)}>
                  Cancelar
                </ConfirmBtn>
                <ConfirmBtn $danger={confirmProvider.action === 'deactivate'} style={confirmProvider.action === 'reactivate' ? { background: `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})`, color: 'white', border: 'none' } : undefined} onClick={confirmAction}>
                  {confirmProvider.action === 'reactivate' ? 'Reativar' : 'Desativar'}
                </ConfirmBtn>
              </ConfirmFooter>
            </ConfirmCard>
          </ConfirmOverlay>
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
