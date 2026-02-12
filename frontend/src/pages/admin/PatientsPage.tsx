import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes, css } from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import {
  Users, UserPlus, Search, Edit2, Check, AlertCircle,
  Crown, Activity, Phone, Mail, ChevronLeft, ChevronRight, X,
  Sparkles, AlertTriangle, Heart, Droplets, ChevronDown, FlaskConical, Eye, EyeOff
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
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
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
  position: relative;
  z-index: 10;
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

const DropdownWrapper = styled.div`
  position: relative;
  min-width: 180px;
  z-index: 50;
`;

const DropdownTrigger = styled.button<{ $open: boolean }>`
  width: 100%;
  padding: 14px 40px 14px 16px;
  background: ${luxuryTheme.surface};
  border: 1px solid ${props => props.$open ? luxuryTheme.primary : luxuryTheme.border};
  border-radius: 12px;
  font-size: 14px;
  color: ${luxuryTheme.text};
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  position: relative;

  ${props => props.$open && css`
    box-shadow: 0 0 0 3px ${luxuryTheme.primary}15;
  `}

  &:hover {
    border-color: ${luxuryTheme.primaryLight};
  }

  svg {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%) ${props => props.$open ? 'rotate(180deg)' : 'rotate(0deg)'};
    transition: transform 0.2s ease;
    color: ${luxuryTheme.primary};
  }
`;

const DropdownMenu = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow: hidden;
  opacity: ${props => props.$open ? 1 : 0};
  transform: ${props => props.$open ? 'translateY(0)' : 'translateY(-8px)'};
  pointer-events: ${props => props.$open ? 'auto' : 'none'};
  transition: all 0.2s ease;
`;

const DropdownOption = styled.button<{ $selected: boolean }>`
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 13px;
  color: ${props => props.$selected ? luxuryTheme.primary : luxuryTheme.textSecondary};
  font-weight: ${props => props.$selected ? '500' : '400'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(146, 86, 62, 0.04);
    color: ${luxuryTheme.text};
  }
`;

const PatientsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 300ms;
  animation-fill-mode: both;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const PatientCard = styled.div<{ $index: number }>`
  background: ${luxuryTheme.surface};
  border: 1px solid rgba(146, 86, 62, 0.08);
  border-radius: 20px;
  padding: 28px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => 200 + props.$index * 60}ms;
  animation-fill-mode: both;
  cursor: pointer;

  &:hover {
    border-color: rgba(146, 86, 62, 0.15);
    box-shadow: 0 12px 40px rgba(146, 86, 62, 0.10);
    transform: translateY(-6px);
  }
`;

const PatientAvatar = styled.div<{ $hasImage?: boolean }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: ${props => props.$hasImage ? 'transparent' : '#E8E4E0'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textSecondary};
  font-weight: 500;
  font-size: 22px;
  font-family: ${theme.typography.fontFamilyHeading};
  letter-spacing: 0.5px;
  overflow: hidden;
  margin-bottom: 10px;
  transition: all 0.3s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  ${PatientCard}:hover & {
    transform: scale(1.06);
    box-shadow: 0 6px 20px rgba(146, 86, 62, 0.15);
  }
`;

const PatientInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  margin-bottom: 6px;
`;

const PatientName = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 15px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
`;

const PatientEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${luxuryTheme.textSecondary};
  font-size: 11px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
    width: 11px;
    height: 11px;
  }
`;

const PatientBadge = styled.span<{ $type: PatientType | null }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  background: ${props => `${getPatientTypeColor(props.$type || 'general')}0A`};
  color: ${props => `${getPatientTypeColor(props.$type || 'general')}BB`};
  margin-bottom: 8px;

  svg {
    width: 10px;
    height: 10px;
    opacity: 0.7;
  }
`;

const TestBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  background: #6366F115;
  color: #6366F1;
  white-space: nowrap;
  border: 1px dashed #6366F140;

  svg {
    width: 10px;
    height: 10px;
  }
`;

const TestToggle = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${props => props.$active ? '#6366F110' : luxuryTheme.surface};
  border: 1px solid ${props => props.$active ? '#6366F140' : luxuryTheme.border};
  border-radius: 12px;
  font-size: 13px;
  color: ${props => props.$active ? '#6366F1' : luxuryTheme.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    border-color: #6366F180;
    color: #6366F1;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #6366F108;
  border: 1px dashed #6366F130;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #6366F112;
    border-color: #6366F150;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #6366F1;
    cursor: pointer;
  }

  span {
    font-size: 14px;
    color: ${luxuryTheme.text};
    font-weight: 500;
  }

  small {
    font-size: 12px;
    color: ${luxuryTheme.textSecondary};
    font-weight: 400;
  }
`;

const NoShowBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  background: ${luxuryTheme.error}12;
  color: ${luxuryTheme.error};
  white-space: nowrap;

  svg {
    width: 10px;
    height: 10px;
  }
`;

const PatientActions = styled.div`
  display: flex;
  gap: 6px;
  width: 100%;
  padding-top: 14px;
  border-top: 1px solid rgba(146, 86, 62, 0.06);
  justify-content: center;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  background: ${luxuryTheme.primary}15;
  color: ${luxuryTheme.primary};
  border: 1px solid ${luxuryTheme.primary}30;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${luxuryTheme.primary}25;
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
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 1100px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 800px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const SkeletonCard = styled.div<{ $delay: number }>`
  background: ${luxuryTheme.surface};
  border: 1px solid rgba(146, 86, 62, 0.08);
  border-radius: 20px;
  padding: 28px 20px;
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
const getPatientTypeOptions = (lang: string) => ACTIVE_PATIENT_TYPES.map(t => ({
  value: t.key as PatientType,
  label: lang === 'en' ? t.labelEn : t.label,
}));

const ITEMS_PER_PAGE = 8;

// ============================================
// COMPONENT
// ============================================
const PatientsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const PATIENT_TYPE_OPTIONS = getPatientTypeOptions(lang);
  const [searchParams, setSearchParams] = useSearchParams();
  const { navigateTo } = useSmartNavigation();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTestPatients, setShowTestPatients] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    patient_type: 'new' as PatientType,
    preferred_language: 'pt' as PreferredLanguage,
    date_of_birth: '',
    is_test: false,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        preferred_language: patient.preferred_language || 'pt',
        date_of_birth: patient.date_of_birth || '',
        is_test: patient.is_test || false,
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
        preferred_language: 'pt',
        date_of_birth: '',
        is_test: false,
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
      preferred_language: 'pt',
      date_of_birth: '',
      is_test: false,
    });
    setError('');
    setSuccess('');
  };

  const handleViewPatient = (patient: Profile) => {
    navigateTo(`/admin/patients/${patient.id}`);
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name) {
      setError(t('patients.errorRequired'));
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
            date_of_birth: formData.date_of_birth || null,
            is_test: formData.is_test,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPatient.id);

        if (error) throw error;
        setSuccess(t('patients.successUpdate'));
      } else {
        // Validações para novo paciente
        if (!formData.email) {
          setError(t('patients.errorEmail'));
          setSaving(false);
          return;
        }

        if (!formData.password || formData.password.length < 6) {
          setError(t('patients.errorPassword'));
          setSaving(false);
          return;
        }

        if (!formData.preferred_language) {
          setError(t('patients.errorLanguage'));
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
          setError(t('patients.errorDuplicateEmail'));
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
              date_of_birth: formData.date_of_birth || null,
              is_test: formData.is_test,
            });

          // Restaurar sessão do admin após criar o paciente
          if (adminSession) {
            await supabase.auth.setSession(adminSession);
          }

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
            setError(t('patients.errorProfileCreate'));
            setSaving(false);
            return;
          }

          setSuccess(t('patients.successCreate'));
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
      setError(err.message || t('patients.errorSavePatient'));
    } finally {
      setSaving(false);
    }
  };

  const realPatients = patients.filter(p => !p.is_test);
  const testPatients = patients.filter(p => p.is_test);

  const filteredPatients = patients.filter(patient => {
    // Hide test patients unless toggle is on
    if (patient.is_test && !showTestPatients) return false;

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
  }, [search, typeFilter, showTestPatients]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getLabel = (type: PatientType | null) => {
    return getPatientTypeLabelFromConstants(type || 'general', lang);
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
    total: realPatients.length,
    test: testPatients.length,
    new: realPatients.filter(p => p.patient_type === 'new').length,
    wellness: realPatients.filter(p => p.patient_type === 'wellness').length,
    vip: realPatients.filter(p => p.patient_type === 'vip').length
  };

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>{t('patients.title')}</h1>
            <p>{t('patients.subtitle')}</p>
          </div>
          <NewPatientButton onClick={() => handleOpenModal()}>
            <UserPlus size={18} />
            {t('patients.newTitle')}
          </NewPatientButton>
        </Header>

        <StatsRow>
          <StatPill>
            <Users />
            <StatValue>{stats.total}</StatValue>
            <StatLabel>{t('patients.title')}</StatLabel>
          </StatPill>
          <StatPill>
            <UserPlus />
            <StatValue>{stats.new}</StatValue>
            <StatLabel>{t('patientType.new')}</StatLabel>
          </StatPill>
          <StatPill>
            <Activity />
            <StatValue>{stats.wellness}</StatValue>
            <StatLabel>{t('patientType.wellness')}</StatLabel>
          </StatPill>
          {stats.vip > 0 && (
            <StatPill>
              <Crown />
              <StatValue>{stats.vip}</StatValue>
              <StatLabel>{t('patientType.vip')}</StatLabel>
            </StatPill>
          )}
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
          {stats.test > 0 && (
            <TestToggle
              $active={showTestPatients}
              onClick={() => setShowTestPatients(!showTestPatients)}
              title={t('patients.toggleTest')}
            >
              {showTestPatients ? <Eye size={16} /> : <EyeOff size={16} />}
              {t('patients.testCount', { count: stats.test })}
            </TestToggle>
          )}
          <DropdownWrapper ref={dropdownRef}>
            <DropdownTrigger
              $open={dropdownOpen}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              type="button"
            >
              {typeFilter === 'all'
                ? t('patientType.allTypes')
                : PATIENT_TYPE_OPTIONS.find(opt => opt.value === typeFilter)?.label || typeFilter
              }
              <ChevronDown size={16} />
            </DropdownTrigger>
            <DropdownMenu $open={dropdownOpen}>
              <DropdownOption
                $selected={typeFilter === 'all'}
                onClick={() => { setTypeFilter('all'); setDropdownOpen(false); }}
              >
                {t('patientType.allTypes')}
              </DropdownOption>
              {PATIENT_TYPE_OPTIONS.map(type => (
                <DropdownOption
                  key={type.value}
                  $selected={typeFilter === type.value}
                  onClick={() => { setTypeFilter(type.value); setDropdownOpen(false); }}
                >
                  {type.label}
                </DropdownOption>
              ))}
            </DropdownMenu>
          </DropdownWrapper>
        </FiltersSection>

        {loading ? (
          <LoadingSkeleton>
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <SkeletonCard key={i} $delay={i * 80}>
                <SkeletonElement $width="72px" $height="72px" $round />
                <SkeletonElement $width="120px" $height="16px" />
                <SkeletonElement $width="90px" $height="12px" />
                <SkeletonElement $width="80px" $height="24px" />
              </SkeletonCard>
            ))}
          </LoadingSkeleton>
        ) : paginatedPatients.length === 0 ? (
          <EmptyState>
            <Users />
            {patients.length === 0 ? (
              <>
                <h3>{t('appointments.emptyDefault')}</h3>
                <p>{t('patients.emptyRegistered')}<br />
                Você pode criar o primeiro paciente agora.</p>
                <EmptyStateCTA onClick={() => setShowModal(true)}>
                  <UserPlus size={16} />
                  {t('patients.newTitle')}
                </EmptyStateCTA>
              </>
            ) : (
              <>
                <h3>{t('appointments.emptyDefault')}</h3>
                <p>{t('common.tryAdjustFilters')}</p>
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
                      {patient.is_test && (
                        <TestBadge>
                          <FlaskConical />
                          TEST
                        </TestBadge>
                      )}
                      {(patient.no_show_count || 0) > 0 && (
                        <NoShowBadge title={`${patient.no_show_count} falta(s)`}>
                          <AlertTriangle />
                          {patient.no_show_count}
                        </NoShowBadge>
                      )}
                    </PatientName>
                    <PatientEmail>
                      <Mail size={11} />
                      {patient.email}
                    </PatientEmail>
                  </PatientInfo>

                  <PatientBadge $type={patient.patient_type}>
                    {getBadgeIcon(patient.patient_type)}
                    {getLabel(patient.patient_type)}
                  </PatientBadge>

                  <PatientActions>
                    <ActionButton onClick={(e) => { e.stopPropagation(); handleOpenModal(patient); }}>
                      <Edit2 size={15} />
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
                  {editingPatient ? t('patients.editTitle') : t('patients.newTitle')}
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
                  <label>{t('patients.email')} {!editingPatient && <span>*</span>}</label>
                  <FormInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingPatient}
                    placeholder={t('common.emailPlaceholder')}
                  />
                </FormGroup>

                {!editingPatient && (
                  <FormGroup>
                    <label>{t('patients.password')} <span>*</span></label>
                    <FormInput
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={t('patients.passwordHint')}
                    />
                  </FormGroup>
                )}

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

                <FormGroup>
                  <label>{t('patients.dateOfBirth')}</label>
                  <FormInput
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </FormGroup>

                <FormGroup>
                  <label>{t('patients.patientType')}</label>
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
                  <label>{t('language.preference')} <span>*</span></label>
                  <FormSelect
                    value={formData.preferred_language}
                    onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value as PreferredLanguage })}
                  >
                    <option value="pt">{t('language.pt')}</option>
                    <option value="en">{t('language.en')}</option>
                  </FormSelect>
                </FormGroup>

                <CheckboxRow>
                  <input
                    type="checkbox"
                    checked={formData.is_test}
                    onChange={(e) => setFormData({ ...formData, is_test: e.target.checked })}
                  />
                  <div>
                    <span>{t('patients.testPatient')}</span><br />
                    <small>{t('patients.testPatientHint')}</small>
                  </div>
                </CheckboxRow>
              </ModalBody>

              <ModalFooter>
                <Button $variant="secondary" onClick={handleCloseModal}>
                  {t('common.cancel')}
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

export default PatientsPage;
