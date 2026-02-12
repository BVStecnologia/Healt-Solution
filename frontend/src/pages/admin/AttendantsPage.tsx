import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
  Headphones, Plus, Search, Edit2, X, Check, AlertCircle,
  Phone, Mail, Calendar, Clock, Users, Activity,
  ChevronLeft, ChevronRight, MessageSquare, BellRing,
  ToggleLeft, ToggleRight, AlertTriangle, RotateCcw
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { theme } from '../../styles/GlobalStyle';
import { supabaseAdmin } from '../../lib/adminService';

// ============================================
// TYPES
// ============================================
interface Attendant {
  id: string;
  name: string;
  phone: string;
  email: string;
  notify_whatsapp: boolean;
  notify_email: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AttendantScheduleItem {
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

const AttendantsGrid = styled.div`
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

const AttendantCard = styled.div<{ $index: number }>`
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

const AttendantAvatar = styled.div<{ $active: boolean }>`
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

  ${AttendantCard}:hover & {
    transform: scale(1.06);
    box-shadow: 0 8px 24px rgba(146, 86, 62, 0.20);
  }
`;

const AttendantInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 8px;
  width: 100%;
`;

const AttendantName = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 17px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const AttendantContact = styled.div`
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

const NotificationBadges = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
`;

const NotifBadge = styled.span<{ $active: boolean; $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.$active
    ? `rgba(146, 86, 62, 0.08)`
    : `rgba(140, 139, 139, 0.08)`};
  color: ${props => props.$active
    ? luxuryTheme.primary
    : luxuryTheme.textSecondary};
  opacity: ${props => props.$active ? 1 : 0.5};

  svg {
    width: 11px;
    height: 11px;
  }
`;

const AttendantActions = styled.div`
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

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 12px;
  color: #B91C1C;
  font-size: 14px;
  font-weight: 500;
  animation: ${fadeInUp} 0.4s ease-out;

  svg { flex-shrink: 0; }
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
    if (props.$variant === 'info') return luxuryTheme.primarySoft;
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
const DAY_KEYS = [
  { value: 0, key: 'days.sunShort' },
  { value: 1, key: 'days.monShort' },
  { value: 2, key: 'days.tueShort' },
  { value: 3, key: 'days.wedShort' },
  { value: 4, key: 'days.thuShort' },
  { value: 5, key: 'days.friShort' },
  { value: 6, key: 'days.satShort' },
];

const ITEMS_PER_PAGE = 9;

// ============================================
// COMPONENT
// ============================================
const AttendantsPage: React.FC = () => {
  const { t } = useTranslation();
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState<Attendant | null>(null);
  const [selectedAttendantForSchedule, setSelectedAttendantForSchedule] = useState<Attendant | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notify_whatsapp: true,
    notify_email: false,
    is_active: true,
  });
  const [schedules, setSchedules] = useState<AttendantScheduleItem[]>(
    DAY_KEYS.map(day => ({
      day_of_week: day.value,
      start_time: '10:00',
      end_time: '18:00',
      is_active: day.value >= 1 && day.value <= 5,
    }))
  );
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ attendant: Attendant; action: 'deactivate' | 'reactivate' } | null>(null);

  useEffect(() => {
    fetchAttendants();
  }, []);

  const fetchAttendants = async () => {
    try {
      const { data, error: fetchError } = await supabaseAdmin
        .from('attendants')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAttendants(data || []);
      setListError('');
    } catch (err) {
      console.error('Error fetching attendants:', err);
      setListError(t('attendants.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (attendant?: Attendant) => {
    if (attendant) {
      setEditingAttendant(attendant);
      setFormData({
        name: attendant.name,
        phone: attendant.phone || '',
        email: attendant.email || '',
        notify_whatsapp: attendant.notify_whatsapp,
        notify_email: attendant.notify_email,
        is_active: attendant.is_active,
      });
    } else {
      setEditingAttendant(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        notify_whatsapp: true,
        notify_email: false,
        is_active: true,
      });
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAttendant(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      notify_whatsapp: true,
      notify_email: false,
      is_active: true,
    });
    setError('');
    setSuccess('');
  };

  const handleOpenScheduleModal = async (attendant: Attendant) => {
    setSelectedAttendantForSchedule(attendant);
    setError('');
    setSuccess('');

    try {
      const { data, error: schedError } = await supabaseAdmin
        .from('attendant_schedules')
        .select('*')
        .eq('attendant_id', attendant.id);

      if (schedError) throw schedError;

      if (data && data.length > 0) {
        const mergedSchedules = DAY_KEYS.map(day => {
          const existing = data.find((s: any) => s.day_of_week === day.value);
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
            start_time: '10:00',
            end_time: '18:00',
            is_active: false,
          };
        });
        setSchedules(mergedSchedules);
      } else {
        setSchedules(
          DAY_KEYS.map(day => ({
            day_of_week: day.value,
            start_time: '10:00',
            end_time: '18:00',
            is_active: day.value >= 1 && day.value <= 5,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading schedules:', err);
      setListError(t('attendants.scheduleLoadError'));
    }

    setShowScheduleModal(true);
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedAttendantForSchedule(null);
  };

  const handleSaveSchedules = async () => {
    if (!selectedAttendantForSchedule) return;

    setSaving(true);
    setError('');

    try {
      // Delete existing schedules
      await supabaseAdmin
        .from('attendant_schedules')
        .delete()
        .eq('attendant_id', selectedAttendantForSchedule.id);

      // Insert active schedules
      const activeSchedules = schedules
        .filter(s => s.is_active)
        .map(s => ({
          attendant_id: selectedAttendantForSchedule.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          is_active: true,
        }));

      if (activeSchedules.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('attendant_schedules')
          .insert(activeSchedules);

        if (insertError) throw insertError;
      }

      setSuccess(t('attendants.successSchedules'));
      setTimeout(() => {
        handleCloseScheduleModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      setError(t('attendants.errorRequired'));
      return;
    }

    if (!formData.phone && !formData.email) {
      setError(t('attendants.phoneHint') + ' / ' + t('attendants.emailHint'));
      return;
    }

    if (formData.notify_whatsapp && !formData.phone) {
      setError(t('attendants.phoneHint'));
      return;
    }

    if (formData.notify_email && !formData.email) {
      setError(t('attendants.emailHint'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingAttendant) {
        const { error: updateError } = await supabaseAdmin
          .from('attendants')
          .update({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            notify_whatsapp: formData.notify_whatsapp,
            notify_email: formData.notify_email,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAttendant.id);

        if (updateError) throw updateError;
        setSuccess(t('attendants.successUpdate'));
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('attendants')
          .insert({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            notify_whatsapp: formData.notify_whatsapp,
            notify_email: formData.notify_email,
            is_active: formData.is_active,
          });

        if (insertError) throw insertError;
        setSuccess(t('attendants.successCreate'));
      }

      await fetchAttendants();

      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (attendant: Attendant) => {
    setConfirmAction({
      attendant,
      action: attendant.is_active ? 'deactivate' : 'reactivate',
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    const newStatus = confirmAction.action === 'reactivate';

    try {
      const { error: updateError } = await supabaseAdmin
        .from('attendants')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', confirmAction.attendant.id);

      if (updateError) throw updateError;
      setConfirmAction(null);
      await fetchAttendants();
    } catch (err) {
      console.error('Error updating attendant:', err);
      setListError(t('attendants.updateError'));
    }
  };

  // Filter
  const filteredAttendants = attendants.filter(att =>
    att.name.toLowerCase().includes(search.toLowerCase()) ||
    (att.phone && att.phone.toLowerCase().includes(search.toLowerCase())) ||
    (att.email && att.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredAttendants.length / ITEMS_PER_PAGE);
  const paginatedAttendants = filteredAttendants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Stats
  const stats = {
    total: attendants.length,
    active: attendants.filter(a => a.is_active).length,
    inactive: attendants.filter(a => !a.is_active).length,
  };

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>{t('attendants.title')}</h1>
            <p>{t('attendants.subtitle')}</p>
          </div>
          <AddButton onClick={() => handleOpenModal()}>
            <Plus size={18} />
            {t('attendants.newAttendant')}
          </AddButton>
        </Header>

        <StatsRow>
          <StatPill>
            <Headphones />
            <StatValue>{stats.total}</StatValue>
            <StatLabel>{t('attendants.total')}</StatLabel>
          </StatPill>
          <StatPill>
            <Activity />
            <StatValue>{stats.active}</StatValue>
            <StatLabel>{t('attendants.active')}</StatLabel>
          </StatPill>
          {stats.inactive > 0 && (
            <StatPill style={{ opacity: 0.5 }}>
              <Users />
              <StatValue>{stats.inactive}</StatValue>
              <StatLabel>{t('status.inactive')}</StatLabel>
            </StatPill>
          )}
        </StatsRow>

        <FiltersSection>
          <SearchContainer>
            <Search size={18} />
            <SearchInput
              type="text"
              placeholder={t('attendants.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchContainer>
        </FiltersSection>

        {listError && (
          <ErrorBanner>
            <AlertTriangle size={16} />
            {listError}
          </ErrorBanner>
        )}

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
        ) : paginatedAttendants.length === 0 ? (
          <EmptyState>
            <Headphones />
            {attendants.length === 0 ? (
              <>
                <h3>{t('attendants.emptyTitle')}</h3>
                <p>{t('attendants.emptyDescription')}</p>
                <EmptyStateCTA onClick={() => handleOpenModal()}>
                  <Plus size={16} />
                  {t('attendants.newAttendant')}
                </EmptyStateCTA>
              </>
            ) : (
              <>
                <h3>{t('attendants.emptyTitle')}</h3>
                <p>{t('common.tryAdjustSearch')}</p>
              </>
            )}
          </EmptyState>
        ) : (
          <>
            <AttendantsGrid>
              {paginatedAttendants.map((attendant, index) => (
                <AttendantCard key={attendant.id} $index={index}>
                  <AttendantAvatar $active={attendant.is_active}>
                    {getInitials(attendant.name)}
                  </AttendantAvatar>

                  <AttendantInfo>
                    <AttendantName>{attendant.name}</AttendantName>
                    {attendant.phone && (
                      <AttendantContact>
                        <Phone size={12} />
                        {attendant.phone}
                      </AttendantContact>
                    )}
                    {attendant.email && (
                      <AttendantContact>
                        <Mail size={12} />
                        {attendant.email}
                      </AttendantContact>
                    )}
                  </AttendantInfo>

                  <NotificationBadges>
                    <NotifBadge $active={attendant.notify_whatsapp}>
                      <MessageSquare />
                      WhatsApp
                    </NotifBadge>
                    <NotifBadge $active={attendant.notify_email}>
                      <BellRing />
                      Email
                    </NotifBadge>
                  </NotificationBadges>

                  <AttendantActions>
                    <ActionButton $variant="info" onClick={() => handleOpenScheduleModal(attendant)} title={t('attendants.scheduleTitle')}>
                      <Clock size={16} />
                    </ActionButton>
                    <ActionButton onClick={() => handleOpenModal(attendant)} title={t('common.edit')}>
                      <Edit2 size={16} />
                    </ActionButton>
                    {attendant.is_active ? (
                      <ActionButton $variant="danger" onClick={() => handleToggleActive(attendant)} title={t('attendants.deactivate')}>
                        <ToggleRight size={16} />
                      </ActionButton>
                    ) : (
                      <ActionButton $variant="primary" onClick={() => handleToggleActive(attendant)} title={t('attendants.activate')}>
                        <RotateCcw size={16} />
                      </ActionButton>
                    )}
                  </AttendantActions>
                </AttendantCard>
              ))}
            </AttendantsGrid>

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

        {/* Modal de Cadastro/Edicao */}
        {showModal && (
          <ModalOverlay onClick={handleCloseModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <div>
                  <h2>
                    <Headphones size={22} />
                    {editingAttendant ? t('attendants.editTitle') : t('attendants.newAttendant')}
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

                <FormGroup>
                  <label>{t('attendants.name')} <span>*</span></label>
                  <FormInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('attendants.namePlaceholder')}
                  />
                </FormGroup>

                <FormGroup>
                  <label>{t('attendants.phone')}</label>
                  <FormInput
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('attendants.phonePlaceholder')}
                  />
                  <small>{t('attendants.phoneHint')}</small>
                </FormGroup>

                <FormGroup>
                  <label>{t('attendants.email')}</label>
                  <FormInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('attendants.emailPlaceholder')}
                  />
                  <small>{t('attendants.emailHint')}</small>
                </FormGroup>

                <FormGroup>
                  <CheckboxGroup onClick={() => setFormData({ ...formData, notify_whatsapp: !formData.notify_whatsapp })}>
                    <input
                      type="checkbox"
                      id="notify_whatsapp"
                      checked={formData.notify_whatsapp}
                      onChange={(e) => setFormData({ ...formData, notify_whatsapp: e.target.checked })}
                    />
                    <label htmlFor="notify_whatsapp">{t('attendants.notifyWhatsapp')}</label>
                  </CheckboxGroup>
                </FormGroup>

                <FormGroup>
                  <CheckboxGroup onClick={() => setFormData({ ...formData, notify_email: !formData.notify_email })}>
                    <input
                      type="checkbox"
                      id="notify_email"
                      checked={formData.notify_email}
                      onChange={(e) => setFormData({ ...formData, notify_email: e.target.checked })}
                    />
                    <label htmlFor="notify_email">{t('attendants.notifyEmail')}</label>
                  </CheckboxGroup>
                </FormGroup>

                <FormGroup>
                  <CheckboxGroup onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="is_active">{t('attendants.activeCheckbox')}</label>
                  </CheckboxGroup>
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

        {/* Modal de Confirmacao Ativar/Desativar */}
        {confirmAction && (
          <ConfirmOverlay onClick={() => setConfirmAction(null)}>
            <ConfirmCard onClick={(e) => e.stopPropagation()}>
              <ConfirmBody>
                <ConfirmIconCircle style={confirmAction.action === 'reactivate' ? { background: 'rgba(146, 86, 62, 0.12)', color: luxuryTheme.primary } : undefined}>
                  {confirmAction.action === 'reactivate' ? <RotateCcw size={28} /> : <AlertTriangle size={28} />}
                </ConfirmIconCircle>
                <ConfirmTitle>
                  {confirmAction.action === 'reactivate' ? t('attendants.activateTitle') : t('attendants.deactivateTitle')}
                </ConfirmTitle>
                <ConfirmText>
                  {confirmAction.action === 'reactivate'
                    ? t('attendants.activateConfirm', { name: confirmAction.attendant.name })
                    : t('attendants.deactivateConfirm', { name: confirmAction.attendant.name })}
                </ConfirmText>
                <ConfirmText style={{ fontSize: 13, opacity: 0.7 }}>
                  {confirmAction.action === 'reactivate'
                    ? t('attendants.activateDescription')
                    : t('attendants.deactivateDescription')}
                </ConfirmText>
              </ConfirmBody>
              <ConfirmFooter>
                <ConfirmBtn onClick={() => setConfirmAction(null)}>
                  {t('common.cancel')}
                </ConfirmBtn>
                <ConfirmBtn
                  $danger={confirmAction.action === 'deactivate'}
                  style={confirmAction.action === 'reactivate' ? {
                    background: `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})`,
                    color: 'white',
                    border: 'none',
                  } : undefined}
                  onClick={executeConfirmAction}
                >
                  {confirmAction.action === 'reactivate' ? t('attendants.activate') : t('attendants.deactivate')}
                </ConfirmBtn>
              </ConfirmFooter>
            </ConfirmCard>
          </ConfirmOverlay>
        )}

        {/* Modal de Horarios */}
        {showScheduleModal && selectedAttendantForSchedule && (
          <ModalOverlay onClick={handleCloseScheduleModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <div>
                  <h2>
                    <Calendar size={22} />
                    {t('attendants.scheduleTitle')}
                  </h2>
                  <p>{selectedAttendantForSchedule.name}</p>
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

                <Alert $variant="info">
                  <AlertCircle size={18} />
                  <div>
                    {t('attendants.scheduleHint')}
                  </div>
                </Alert>

                <ScheduleGrid>
                  {DAY_KEYS.map((day, index) => (
                    <ScheduleRow key={day.value} $active={schedules[index]?.is_active}>
                      <span className="day-label">{t(day.key)}</span>
                      <input
                        type="time"
                        value={schedules[index]?.start_time || '10:00'}
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
                  {t('common.cancel')}
                </Button>
                <Button $variant="primary" onClick={handleSaveSchedules} disabled={saving}>
                  {saving ? t('common.saving') : t('attendants.saveSchedules')}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default AttendantsPage;
