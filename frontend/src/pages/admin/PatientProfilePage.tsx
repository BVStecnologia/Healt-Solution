import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
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
  MapPin,
  X,
  Save,
  Shield,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { Profile, Appointment, PatientType, AppointmentStatus } from '../../types/database';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
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
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

// Styled Components
const PageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: transparent;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  color: ${theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: ${theme.spacing.lg};

  &:hover {
    background: ${theme.colors.surface};
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
    transform: translateX(-4px);
  }

  svg {
    width: 18px;
    height: 18px;
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(-2px);
  }
`;

const ProfileHeader = styled.div<{ $type: PatientType | null }>`
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
    height: 6px;
    background: ${props => {
      switch (props.$type) {
        case 'vip': return 'linear-gradient(90deg, #D4AF37, #FFD700, #D4AF37)';
        case 'trt': return 'linear-gradient(90deg, #7C3AED, #A78BFA, #7C3AED)';
        case 'hormone': return 'linear-gradient(90deg, #EC4899, #F472B6, #EC4899)';
        case 'new': return 'linear-gradient(90deg, #10B981, #34D399, #10B981)';
        default: return `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight}, ${theme.colors.primary})`;
      }
    }};
    background-size: 200% 100%;
    animation: ${shimmer} 3s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, ${theme.colors.primarySoft}30 0%, transparent 70%);
    pointer-events: none;
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

const AvatarContainer = styled.div<{ $type: PatientType | null }>`
  position: relative;
  flex-shrink: 0;
`;

const Avatar = styled.div<{ $type: PatientType | null }>`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$type) {
      case 'vip': return 'linear-gradient(135deg, #D4AF37, #B8860B)';
      case 'trt': return 'linear-gradient(135deg, #7C3AED, #5B21B6)';
      case 'hormone': return 'linear-gradient(135deg, #EC4899, #BE185D)';
      case 'new': return 'linear-gradient(135deg, #10B981, #047857)';
      default: return `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`;
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 48px;
  font-weight: 600;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const TypeBadgeFloat = styled.div<{ $type: PatientType | null }>`
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${theme.colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${float} 3s ease-in-out infinite;

  svg {
    width: 20px;
    height: 20px;
    color: ${props => {
      switch (props.$type) {
        case 'vip': return '#D4AF37';
        case 'trt': return '#7C3AED';
        case 'hormone': return '#EC4899';
        case 'new': return '#10B981';
        default: return theme.colors.primary;
      }
    }};
  }
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

const PatientName = styled.h1`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 36px;
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

const TypeBadge = styled.span<{ $type: PatientType | null }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: ${theme.borderRadius.full};
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: ${props => {
    switch (props.$type) {
      case 'vip': return 'linear-gradient(135deg, #FEF3C7, #FDE68A)';
      case 'trt': return 'linear-gradient(135deg, #EDE9FE, #DDD6FE)';
      case 'hormone': return 'linear-gradient(135deg, #FCE7F3, #FBCFE8)';
      case 'new': return 'linear-gradient(135deg, #D1FAE5, #A7F3D0)';
      default: return `linear-gradient(135deg, ${theme.colors.primarySoft}, #E8D5CC)`;
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'vip': return '#92400E';
      case 'trt': return '#5B21B6';
      case 'hormone': return '#BE185D';
      case 'new': return '#047857';
      default: return theme.colors.primaryHover;
    }
  }};

  svg {
    width: 14px;
    height: 14px;
  }
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
  gap: ${theme.spacing.xl};
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ContactItem = styled.a`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${theme.colors.textSecondary};
  font-size: 14px;
  text-decoration: none;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  transition: all 0.3s ease;

  &:hover {
    background: ${theme.colors.primarySoft};
    color: ${theme.colors.primary};
    transform: translateY(-2px);
  }

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

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  ${props => props.$variant === 'primary' ? css`
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover});
    color: white;
    border: none;
    box-shadow: 0 4px 14px rgba(146, 86, 62, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(146, 86, 62, 0.4);
    }
  ` : css`
    background: ${theme.colors.surface};
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.background};
      border-color: ${theme.colors.primary};
      color: ${theme.colors.primary};
    }
  `}

  svg {
    width: 18px;
    height: 18px;
  }
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

const Card = styled.div<{ $delay?: number }>`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  box-shadow: ${theme.shadows.card};
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: ${props => props.$delay || 0}ms;
  animation-fill-mode: both;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, transparent 0%, ${theme.colors.primarySoft}10 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(146, 86, 62, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05);

    &::after {
      opacity: 1;
    }
  }
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
  transition: all 0.2s ease;

  &:hover {
    color: ${theme.colors.primaryHover};
    gap: 8px;
  }

  svg {
    width: 14px;
    height: 14px;
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

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => props.$color};
    transition: width 0.3s ease;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 80px;
    height: 80px;
    background: ${props => props.$color}08;
    border-radius: 50%;
    transform: translate(30%, -30%);
    transition: all 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

    &::before {
      width: 6px;
    }

    &::after {
      transform: translate(20%, -20%) scale(1.2);
    }
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

const FullWidthCard = styled(Card)`
  grid-column: 1 / -1;
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
      case 'completed': return '#10B981';
      case 'confirmed': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      case 'no_show': return '#6B7280';
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
      case 'completed': return '#D1FAE5';
      case 'confirmed': return '#DBEAFE';
      case 'pending': return '#FEF3C7';
      case 'cancelled': return '#FEE2E2';
      case 'no_show': return '#F3F4F6';
      default: return theme.colors.background;
    }
  }};

  svg {
    width: 20px;
    height: 20px;
    color: ${props => {
      switch (props.$status) {
        case 'completed': return '#059669';
        case 'confirmed': return '#2563EB';
        case 'pending': return '#D97706';
        case 'cancelled': return '#DC2626';
        case 'no_show': return '#4B5563';
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
      case 'completed': return '#D1FAE5';
      case 'confirmed': return '#DBEAFE';
      case 'pending': return '#FEF3C7';
      case 'cancelled': return '#FEE2E2';
      case 'no_show': return '#F3F4F6';
      default: return theme.colors.background;
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'completed': return '#047857';
      case 'confirmed': return '#1D4ED8';
      case 'pending': return '#B45309';
      case 'cancelled': return '#B91C1C';
      case 'no_show': return '#374151';
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

// Modal animation - must be defined before ModalContainer
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

// Edit Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(57, 57, 57, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.lg};
  animation: ${fadeInUp} 0.3s ease-out;
`;

const ModalContainer = styled.div`
  background: linear-gradient(180deg, #FFFDFB 0%, #FAF8F6 100%);
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(146, 86, 62, 0.05);
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
  ${props => props.$fullWidth && css`
    grid-column: 1 / -1;
  `}
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
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
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

const FormSelect = styled.select`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  color: ${theme.colors.text};
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238C8B8B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 44px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
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
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 14px rgba(146, 86, 62, 0.3);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(146, 86, 62, 0.4);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  ` : css`
    background: white;
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.background};
      border-color: ${theme.colors.primary}40;
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
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  border: 1px solid #10B98140;
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

// Helper functions
const getPatientTypeLabel = (type: PatientType | null): string => {
  switch (type) {
    case 'vip': return 'VIP';
    case 'trt': return 'TRT';
    case 'hormone': return 'Hormonal';
    case 'new': return 'Novo';
    default: return 'Geral';
  }
};

const getPatientTypeIcon = (type: PatientType | null) => {
  switch (type) {
    case 'vip': return <Star />;
    case 'trt': return <Activity />;
    case 'hormone': return <Heart />;
    case 'new': return <Sparkles />;
    default: return <User />;
  }
};

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

const getStatusLabel = (status: AppointmentStatus): string => {
  switch (status) {
    case 'completed': return 'Concluída';
    case 'confirmed': return 'Confirmada';
    case 'pending': return 'Pendente';
    case 'cancelled': return 'Cancelada';
    case 'no_show': return 'Não Compareceu';
    case 'checked_in': return 'Check-in';
    case 'in_progress': return 'Em Andamento';
    default: return status;
  }
};

const getAppointmentTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    initial_consultation: 'Consulta Inicial',
    follow_up: 'Retorno',
    hormone_check: 'Avaliação Hormonal',
    lab_review: 'Revisão de Exames',
    nutrition: 'Nutrição',
    health_coaching: 'Health Coaching',
    therapy: 'Terapia',
    personal_training: 'Personal Training',
  };
  return types[type] || type;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

const PATIENT_TYPES: { value: PatientType; label: string }[] = [
  { value: 'new', label: 'Novo Paciente' },
  { value: 'general', label: 'Geral' },
  { value: 'trt', label: 'TRT' },
  { value: 'hormone', label: 'Hormonal' },
  { value: 'vip', label: 'VIP' }
];

const PatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
  });

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    patient_type: 'general' as PatientType,
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Fetch patient profile
      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch patient appointments
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

      // Calculate stats
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
          <p>Carregando ficha do paciente...</p>
        </LoadingState>
      </AdminLayout>
    );
  }

  if (!patient) {
    return (
      <AdminLayout>
        <EmptyState>
          <User />
          <p>Paciente não encontrado</p>
        </EmptyState>
      </AdminLayout>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const openEditModal = () => {
    if (patient) {
      setEditForm({
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone || '',
        patient_type: patient.patient_type || 'general',
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
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone || null,
          patient_type: editForm.patient_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patient.id);

      if (error) throw error;

      // Update local state
      setPatient(prev => prev ? {
        ...prev,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone || null,
        patient_type: editForm.patient_type,
        updated_at: new Date().toISOString(),
      } : null);

      setSaveSuccess(true);
      setTimeout(() => {
        closeEditModal();
      }, 1500);
    } catch (error) {
      console.error('Error saving patient:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <PageContainer>
        <BackButton onClick={() => navigate('/admin/patients')}>
          <ArrowLeft />
          Voltar para Pacientes
        </BackButton>

        <ProfileHeader $type={patient.patient_type}>
          <HeaderContent>
            <AvatarContainer $type={patient.patient_type}>
              <Avatar $type={patient.patient_type}>
                {getInitials(patient.first_name, patient.last_name)}
              </Avatar>
              <TypeBadgeFloat $type={patient.patient_type}>
                {getPatientTypeIcon(patient.patient_type)}
              </TypeBadgeFloat>
            </AvatarContainer>

            <HeaderInfo>
              <PatientName>{patient.first_name} {patient.last_name}</PatientName>

              <PatientMeta>
                <TypeBadge $type={patient.patient_type}>
                  {getPatientTypeIcon(patient.patient_type)}
                  {getPatientTypeLabel(patient.patient_type)}
                </TypeBadge>
                <MetaItem>
                  <Clock />
                  Desde {formatDate(patient.created_at)}
                </MetaItem>
              </PatientMeta>

              <ContactRow>
                <ContactItem href={`mailto:${patient.email}`}>
                  <Mail />
                  {patient.email}
                </ContactItem>
                {patient.phone && (
                  <ContactItem href={`tel:${patient.phone}`}>
                    <Phone />
                    {patient.phone}
                  </ContactItem>
                )}
              </ContactRow>
            </HeaderInfo>

            <HeaderActions>
              <ActionButton $variant="secondary" onClick={openEditModal}>
                <Edit3 />
                Editar
              </ActionButton>
              <ActionButton $variant="primary" onClick={() => navigate(`/admin/calendar?newAppointment=true&patientId=${patient.id}`)}>
                <Calendar />
                Agendar
              </ActionButton>
            </HeaderActions>
          </HeaderContent>
        </ProfileHeader>

        <StatsRow>
          <StatCard $color={theme.colors.primary} $delay={100}>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total de Consultas</StatLabel>
          </StatCard>
          <StatCard $color="#10B981" $delay={200}>
            <StatValue>{stats.completed}</StatValue>
            <StatLabel>Consultas Realizadas</StatLabel>
          </StatCard>
          <StatCard $color="#3B82F6" $delay={300}>
            <StatValue>{stats.upcoming}</StatValue>
            <StatLabel>Próximas Consultas</StatLabel>
          </StatCard>
        </StatsRow>

        <Grid>
          <Card $delay={400}>
            <CardHeader>
              <CardTitle>
                <User />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Nome Completo</InfoLabel>
                <InfoValue>{patient.first_name} {patient.last_name}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{patient.email}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Telefone</InfoLabel>
                <InfoValue>{patient.phone || '-'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Tipo de Paciente</InfoLabel>
                <InfoValue>{getPatientTypeLabel(patient.patient_type)}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </Card>

          <Card $delay={500}>
            <CardHeader>
              <CardTitle>
                <Activity />
                Informações Médicas
              </CardTitle>
            </CardHeader>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Última Visita</InfoLabel>
                <InfoValue>{formatDate(patient.last_visit_at)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Exames Realizados</InfoLabel>
                <InfoValue>{formatDate(patient.labs_completed_at)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Cadastrado em</InfoLabel>
                <InfoValue>{formatDate(patient.created_at)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Última Atualização</InfoLabel>
                <InfoValue>{formatDate(patient.updated_at)}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </Card>

          {upcomingAppointments.length > 0 && (
            <FullWidthCard $delay={600}>
              <CardHeader>
                <CardTitle>
                  <Calendar />
                  Próximas Consultas
                </CardTitle>
                <CardLink onClick={() => navigate(`/admin/calendar?patientId=${patient.id}`)}>
                  Ver todas <ChevronRight />
                </CardLink>
              </CardHeader>
              <AppointmentList>
                {upcomingAppointments.map((apt) => (
                  <AppointmentItem key={apt.id} $status={apt.status}>
                    <AppointmentIcon $status={apt.status}>
                      {getStatusIcon(apt.status)}
                    </AppointmentIcon>
                    <AppointmentInfo>
                      <AppointmentTitle>{getAppointmentTypeLabel(apt.type)}</AppointmentTitle>
                      <AppointmentMeta>
                        <span>{formatDateTime(apt.scheduled_at)}</span>
                        <span>•</span>
                        <span>
                          {apt.provider?.profile
                            ? `Dr(a). ${apt.provider.profile.first_name} ${apt.provider.profile.last_name}`
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

          <FullWidthCard $delay={700}>
            <CardHeader>
              <CardTitle>
                <FileText />
                Histórico de Consultas
              </CardTitle>
              <CardLink onClick={() => navigate(`/admin/appointments?patientId=${patient.id}`)}>
                Ver todas <ChevronRight />
              </CardLink>
            </CardHeader>
            {pastAppointments.length > 0 ? (
              <AppointmentList>
                {pastAppointments.map((apt) => (
                  <AppointmentItem key={apt.id} $status={apt.status}>
                    <AppointmentIcon $status={apt.status}>
                      {getStatusIcon(apt.status)}
                    </AppointmentIcon>
                    <AppointmentInfo>
                      <AppointmentTitle>{getAppointmentTypeLabel(apt.type)}</AppointmentTitle>
                      <AppointmentMeta>
                        <span>{formatDateTime(apt.scheduled_at)}</span>
                        <span>•</span>
                        <span>
                          {apt.provider?.profile
                            ? `Dr(a). ${apt.provider.profile.first_name} ${apt.provider.profile.last_name}`
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
                <p>Nenhuma consulta no histórico</p>
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
                Editar Paciente
              </ModalTitle>
              <CloseButton onClick={closeEditModal}>
                <X />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              {saveSuccess && (
                <SuccessMessage>
                  <CheckCircle />
                  Dados salvos com sucesso!
                </SuccessMessage>
              )}

              <FormGrid>
                <FormGroup>
                  <FormLabel>Nome</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.first_name}
                    onChange={e => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Nome"
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Sobrenome</FormLabel>
                  <FormInput
                    type="text"
                    value={editForm.last_name}
                    onChange={e => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Sobrenome"
                  />
                </FormGroup>

                <FormGroup $fullWidth>
                  <FormLabel>Email</FormLabel>
                  <FormInput
                    type="email"
                    value={patient?.email || ''}
                    disabled
                    placeholder="Email não pode ser alterado"
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Telefone</FormLabel>
                  <FormInput
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Tipo de Paciente</FormLabel>
                  <FormSelect
                    value={editForm.patient_type}
                    onChange={e => setEditForm(prev => ({ ...prev, patient_type: e.target.value as PatientType }))}
                  >
                    {PATIENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </FormSelect>
                </FormGroup>
              </FormGrid>
            </ModalBody>

            <ModalFooter>
              <ModalButton $variant="secondary" onClick={closeEditModal}>
                Cancelar
              </ModalButton>
              <ModalButton
                $variant="primary"
                onClick={handleSavePatient}
                disabled={saving || !editForm.first_name || !editForm.last_name}
              >
                {saving ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <Save />
                    Salvar Alterações
                  </>
                )}
              </ModalButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}
    </AdminLayout>
  );
};

export default PatientProfilePage;
