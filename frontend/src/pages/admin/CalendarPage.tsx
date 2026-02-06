import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addDays, subDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock,
  Users,
  Calendar as CalendarIcon,
  X,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Save,
  Lock,
  Trash2,
} from 'lucide-react';
import { AppointmentType, ProviderBlock } from '../../types/database';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import HelpTip from '../../components/ui/HelpTip';
import { supabase } from '../../lib/supabaseClient';
import { useCurrentProvider } from '../../hooks/useCurrentProvider';

// Animações
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg};
  animation: ${fadeIn} 0.4s ease-out;

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 32px;
    font-weight: 400;
    color: ${theme.colors.text};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
    letter-spacing: 1px;

    .calendar-icon {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
      border-radius: ${theme.borderRadius.lg};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(146, 86, 62, 0.3);

      svg {
        width: 22px;
        height: 22px;
        color: white;
      }
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.lg};
`;

const TodayInfo = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.primarySoft};
    border-color: ${theme.colors.primaryA40};
    transform: translateY(-1px);
  }

  .date-display {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};

    .day {
      font-size: 28px;
      font-weight: 700;
      color: ${theme.colors.primary};
      line-height: 1;
      font-family: ${theme.typography.fontFamilyHeading};
    }

    .month-year {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      .month {
        font-size: 13px;
        font-weight: 600;
        color: ${theme.colors.text};
        text-transform: capitalize;
        line-height: 1.2;
      }

      .year {
        font-size: 11px;
        color: ${theme.colors.textMuted};
        line-height: 1.2;
      }
    }
  }

  .event-count {
    background: ${theme.colors.primary};
    color: white;
    padding: 4px 10px;
    border-radius: ${theme.borderRadius.full};
    font-size: 11px;
    font-weight: 600;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  ${props => props.$variant === 'primary' ? css`
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(146, 86, 62, 0.25);

    &:hover {
      box-shadow: 0 6px 20px rgba(146, 86, 62, 0.35);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  ` : css`
    background: ${theme.colors.surface};
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.background};
      border-color: ${theme.colors.primaryA50};
    }
  `}

  svg {
    width: 18px;
    height: 18px;
  }
`;

const CalendarWrapper = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  box-shadow: ${theme.shadows.card};
  height: calc(100vh - 180px);
  min-height: 600px;
  animation: ${slideIn} 0.5s ease-out;

  .rbc-calendar {
    height: 100%;
    font-family: inherit;
  }

  .rbc-header {
    padding: ${theme.spacing.md} ${theme.spacing.sm};
    font-family: ${theme.typography.fontFamilyHeading};
    font-weight: 400;
    font-size: 13px;
    color: ${theme.colors.text};
    text-transform: lowercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid ${theme.colors.border};
    background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%);

    &:first-letter {
      text-transform: uppercase;
    }
  }

  .rbc-month-view {
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.lg};
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .rbc-month-row {
    border-bottom: 1px solid ${theme.colors.borderLight};

    &:last-child {
      border-bottom: none;
    }
  }

  .rbc-day-bg {
    background: ${theme.colors.surface};
    transition: background 0.2s ease;

    &:hover {
      background: ${theme.colors.primarySoftA30};
    }
  }

  .rbc-off-range-bg {
    background: ${theme.colors.background};

    &:hover {
      background: ${theme.colors.background};
    }
  }

  .rbc-today {
    background: linear-gradient(180deg, ${theme.colors.primarySoftA60} 0%, ${theme.colors.primarySoftA30} 100%) !important;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight}, ${theme.colors.primary});
    }
  }

  .rbc-date-cell {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    font-size: 14px;
    font-weight: 500;
    font-family: ${theme.typography.fontFamily};
    text-align: right;

    > button {
      transition: all 0.2s ease;
      padding: 4px 8px;
      border-radius: ${theme.borderRadius.sm};
      font-family: ${theme.typography.fontFamilyHeading};
      font-size: 15px;
      font-weight: 400;

      &:hover {
        background: ${theme.colors.primarySoft};
        color: ${theme.colors.primary};
      }
    }

    &.rbc-now > button {
      background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
      color: white;
      font-weight: 400;
      border-radius: ${theme.borderRadius.full};
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 10px rgba(146, 86, 62, 0.35);
    }
  }

  .rbc-event {
    border-radius: 8px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    font-family: ${theme.typography.fontFamily};
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    border: none !important;
    margin: 1px 2px;

    &:hover {
      transform: translateY(-1px) scale(1.01);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      z-index: 10;
    }

    &:active {
      transform: translateY(0) scale(1);
    }

    .rbc-event-content {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }
  }

  .rbc-row-segment {
    padding: 0 2px 2px 2px;
  }

  .rbc-event-label {
    font-weight: 700;
    font-size: 10px;
    opacity: 0.9;
  }

  .rbc-toolbar {
    margin-bottom: ${theme.spacing.xl};
    padding-bottom: ${theme.spacing.lg};
    border-bottom: 1px solid ${theme.colors.borderLight};
    flex-wrap: wrap;
    gap: ${theme.spacing.md};
  }

  .rbc-toolbar button {
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    padding: 10px 18px;
    background: ${theme.colors.surface};
    font-family: ${theme.typography.fontFamily};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: ${theme.colors.primarySoft};
      border-color: ${theme.colors.primaryA50};
      transform: translateY(-1px);
    }

    &.rbc-active,
    &.rbc-active:focus,
    &.rbc-active:hover {
      background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%) !important;
      color: white !important;
      border-color: transparent !important;
      box-shadow: 0 3px 12px rgba(146, 86, 62, 0.3) !important;
    }
  }

  .rbc-btn-group {
    border-radius: ${theme.borderRadius.lg};
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

    button {
      border-radius: 0;
      margin: 0 !important;
      border-right: none;

      &:first-child {
        border-radius: ${theme.borderRadius.lg} 0 0 ${theme.borderRadius.lg};
      }

      &:last-child {
        border-radius: 0 ${theme.borderRadius.lg} ${theme.borderRadius.lg} 0;
        border-right: 1px solid ${theme.colors.border};
      }
    }
  }

  .rbc-toolbar-label {
    font-size: 26px;
    font-weight: 400;
    color: ${theme.colors.text};
    text-transform: capitalize;
    font-family: ${theme.typography.fontFamilyHeading};
    letter-spacing: 1px;
  }

  .rbc-time-view {
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.lg};
    overflow: hidden;
  }

  .rbc-time-header {
    border-bottom: 2px solid ${theme.colors.border};
    background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%);
  }

  .rbc-time-header-cell {
    font-family: ${theme.typography.fontFamilyHeading};
  }

  /* Fix para números dos dias na view de semana/dia - FORÇA TOTAL */
  .rbc-time-view .rbc-time-header-content .rbc-header {
    background: ${theme.colors.surface} !important;
    border-bottom: 1px solid ${theme.colors.border} !important;
    padding: 8px 4px !important;
  }

  .rbc-time-view .rbc-header button,
  .rbc-time-view .rbc-header a,
  .rbc-time-view .rbc-header .rbc-button-link,
  .rbc-time-header-content button,
  .rbc-time-header button,
  .rbc-button-link {
    font-family: ${theme.typography.fontFamilyHeading} !important;
    font-size: 24px !important;
    font-weight: 400 !important;
    color: ${theme.colors.text} !important;
    text-decoration: none !important;
  }

  /* Linha do cabeçalho com nome dos dias (dom, seg, etc) */
  .rbc-time-header-content > .rbc-row.rbc-row-resource {
    border-bottom: 1px solid ${theme.colors.border};
  }

  .rbc-allday-cell {
    display: none;
  }

  .rbc-time-header-cell {
    min-height: 60px;
  }

  .rbc-time-content {
    border-top: none;
  }

  .rbc-timeslot-group {
    min-height: 60px;
    border-bottom: 1px solid ${theme.colors.borderLight};
  }

  .rbc-time-slot {
    font-size: 11px;
    color: ${theme.colors.textMuted};
    font-weight: 500;
  }

  .rbc-current-time-indicator {
    background: ${theme.colors.error};
    height: 2px;

    &::before {
      content: '';
      position: absolute;
      left: -4px;
      top: -3px;
      width: 8px;
      height: 8px;
      background: ${theme.colors.error};
      border-radius: 50%;
    }
  }

  .rbc-agenda-view {
    border: none;
    border-radius: ${theme.borderRadius.xl};
    overflow: hidden;
    background: transparent;
  }

  .rbc-agenda-table {
    border: none;
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 8px;

    thead {
      background: transparent;
    }

    th {
      padding: ${theme.spacing.sm} ${theme.spacing.lg};
      font-family: ${theme.typography.fontFamily};
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${theme.colors.textMuted};
      border: none;
      text-align: left;
    }

    td {
      padding: ${theme.spacing.md} ${theme.spacing.lg};
      font-size: 14px;
      font-weight: 500;
      vertical-align: middle;
      border: none;
      background: ${theme.colors.surface};
      border-top: 1px solid ${theme.colors.borderLight};
      border-bottom: 1px solid ${theme.colors.borderLight};

      &:first-child {
        border-left: 3px solid ${theme.colors.border};
        border-top-left-radius: ${theme.borderRadius.md};
        border-bottom-left-radius: ${theme.borderRadius.md};
      }

      &:last-child {
        border-right: 1px solid ${theme.colors.borderLight};
        border-top-right-radius: ${theme.borderRadius.md};
        border-bottom-right-radius: ${theme.borderRadius.md};
      }
    }

    tbody tr {
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        td {
          background: ${theme.colors.primarySoftA30};
        }
        td:first-child {
          border-left-color: ${theme.colors.primary};
        }
      }
    }

    /* Cores da borda esquerda por status */
    tbody tr[class*="pending"] td:first-child,
    tbody tr:has(.rbc-agenda-event-cell [data-status="pending"]) td:first-child {
      border-left-color: #D97706;
    }

    .rbc-agenda-date-cell {
      font-family: ${theme.typography.fontFamily};
      font-weight: 500;
      font-size: 13px;
      color: ${theme.colors.text};
      white-space: nowrap;
      min-width: 100px;

      &::first-letter {
        text-transform: uppercase;
      }
    }

    .rbc-agenda-time-cell {
      color: ${theme.colors.textSecondary};
      font-family: ${theme.typography.fontFamily};
      font-size: 13px;
      font-weight: 500;
      min-width: 90px;
    }

    .rbc-agenda-event-cell {
      font-weight: 500;
      color: ${theme.colors.text};
      font-size: 14px;

      > span, > div {
        display: flex;
        align-items: center;
      }
    }
  }

  .rbc-agenda-empty {
    padding: ${theme.spacing.xxxl};
    text-align: center;
    color: ${theme.colors.textMuted};
    font-size: 15px;
    font-style: italic;
    background: ${theme.colors.surface};
    border-radius: ${theme.borderRadius.xl};
    box-shadow: ${theme.shadows.sm};
  }

  .rbc-show-more {
    color: ${theme.colors.primary};
    font-weight: 600;
    font-size: 11px;
    background: transparent !important;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Legend = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  margin-top: ${theme.spacing.lg};
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.borderLight};
  justify-content: center;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: 12px;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  transition: all 0.2s ease;

  &:hover {
    color: ${theme.colors.text};
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: ${theme.borderRadius.md};
    font-weight: 600;
    font-size: 11px;
    border-left: 3px solid;
  }

  .pending {
    background: #FEF3C7;
    border-color: #D97706;
    color: #92400E;
  }

  .confirmed {
    background: #D1FAE5;
    border-color: #059669;
    color: #065F46;
  }

  .completed {
    background: #F3F4F6;
    border-color: #6B7280;
    color: #374151;
  }

  .cancelled {
    background: #FEE2E2;
    border-color: #DC2626;
    color: #991B1B;
  }
`;

// Modal Overlay com blur elegante
const modalFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const modalSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(30, 20, 15, 0.6);
  backdrop-filter: blur(8px);
  z-index: 1000;
  animation: ${modalFadeIn} 0.25s ease-out;
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 480px;
  background: linear-gradient(145deg, #FFFBF7 0%, #FFF8F2 100%);
  border-radius: 24px;
  box-shadow:
    0 25px 80px rgba(146, 86, 62, 0.25),
    0 10px 30px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  z-index: 1001;
  animation: ${modalSlideIn} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg,
      ${theme.colors.primary} 0%,
      ${theme.colors.primaryLight} 50%,
      ${theme.colors.primary} 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s ease-in-out infinite;
  }
`;

const ModalHeader = styled.div`
  padding: 28px 28px 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const ModalTitle = styled.div`
  h2 {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: ${theme.colors.primary};
    margin: 0 0 8px;
    font-family: ${theme.typography.fontFamilyHeading};
  }

  h3 {
    font-size: 24px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0;
    font-family: ${theme.typography.fontFamilyHeading};
    line-height: 1.2;
  }
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: ${theme.colors.background};
  color: ${theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.primaryA15};
    color: ${theme.colors.primary};
    transform: rotate(90deg);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ModalBody = styled.div`
  padding: 24px 28px;
`;

const StatusBadge = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 20px;

  ${props => {
    switch (props.$status) {
      case 'pending':
        return `
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          color: #92400E;
          border: 1px solid #F59E0B40;
        `;
      case 'confirmed':
        return `
          background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
          color: #065F46;
          border: 1px solid #10B98140;
        `;
      case 'completed':
        return `
          background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
          color: #374151;
          border: 1px solid #6B728040;
        `;
      case 'cancelled':
      case 'no_show':
        return `
          background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
          color: #991B1B;
          border: 1px solid #EF444440;
        `;
      default:
        return `
          background: ${theme.colors.background};
          color: ${theme.colors.text};
        `;
    }
  }}

  svg {
    width: 14px;
    height: 14px;
  }
`;

const DetailCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid ${theme.colors.borderLight};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid ${theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
`;

const DetailIcon = styled.div<{ $color?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${props => props.$color ? props.$color + '12' : theme.colors.primaryA12};
  color: ${props => props.$color || theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const DetailInfo = styled.div`
  flex: 1;

  .label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${theme.colors.textMuted};
    margin-bottom: 2px;
  }

  .value {
    font-size: 15px;
    font-weight: 600;
    color: ${theme.colors.text};
  }
`;

const ModalFooter = styled.div`
  padding: 0 28px 28px;
  display: flex;
  gap: 12px;
`;

const ModalButton = styled.button<{ $variant: 'primary' | 'success' | 'danger' | 'secondary' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(146, 86, 62, 0.3);

          &:hover {
            box-shadow: 0 6px 20px rgba(146, 86, 62, 0.4);
            transform: translateY(-2px);
          }
        `;
      case 'success':
        return `
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);

          &:hover {
            box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
            transform: translateY(-2px);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);

          &:hover {
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
            transform: translateY(-2px);
          }
        `;
      case 'secondary':
        return `
          background: ${theme.colors.background};
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};

          &:hover {
            background: ${theme.colors.primarySoft};
            border-color: ${theme.colors.primaryA40};
          }
        `;
    }
  }}

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// New Appointment Modal Styles
const NewAppointmentModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(180deg, #FFFDFB 0%, #FAF8F6 100%);
  border-radius: 24px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(146, 86, 62, 0.05);
  animation: ${slideIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1001;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${theme.colors.primary}, #D4AF37, ${theme.colors.primary});
    background-size: 200% 100%;
  }
`;

const NewAppointmentHeader = styled.div`
  padding: 28px 28px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${theme.colors.borderLight};

  h2 {
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
  }
`;

const NewAppointmentBody = styled.div`
  padding: 24px 28px;
`;

const PatientBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(135deg, ${theme.colors.primarySoft} 0%, #E8D5CC 100%);
  border-radius: 16px;
  margin-bottom: 24px;
  border: 1px solid ${theme.colors.primaryA20};
`;

const PatientAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 18px;
  font-weight: 600;
`;

const PatientBannerInfo = styled.div`
  flex: 1;

  .name {
    font-weight: 600;
    color: ${theme.colors.text};
    font-size: 15px;
    margin-bottom: 2px;
  }

  .label {
    font-size: 12px;
    color: ${theme.colors.textSecondary};
  }
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
  ${props => props.$fullWidth && `
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

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  color: ${theme.colors.text};
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const NewAppointmentFooter = styled.div`
  padding: 20px 28px 28px;
  display: flex;
  gap: 12px;
  border-top: 1px solid ${theme.colors.borderLight};
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

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  border: 1px solid #EF444440;
  border-radius: 12px;
  color: #991B1B;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;

  svg {
    width: 18px;
    height: 18px;
    color: #DC2626;
  }
`;

// Componente customizado para evento da agenda - Versão Limpa
const AgendaEventContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 2px 0;
`;

const AgendaPatientName = styled.span`
  font-weight: 600;
  color: ${theme.colors.text};
  font-size: 14px;
  min-width: 140px;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AgendaSeparator = styled.span`
  color: ${theme.colors.borderLight};
  font-weight: 300;
`;

const AgendaType = styled.span`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  min-width: 80px;
`;

const AgendaProvider = styled.span`
  font-size: 13px;
  color: ${theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 14px;
    height: 14px;
    opacity: 0.6;
  }
`;

const AgendaStatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: ${theme.borderRadius.full};
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  margin-left: auto;

  ${props => {
    switch (props.$status) {
      case 'pending':
        return `
          background: #FEF3C7;
          color: #92400E;
        `;
      case 'confirmed':
        return `
          background: #D1FAE5;
          color: #065F46;
        `;
      case 'completed':
        return `
          background: #F3F4F6;
          color: #4B5563;
        `;
      case 'cancelled':
      case 'no_show':
        return `
          background: #FEE2E2;
          color: #991B1B;
        `;
      default:
        return `
          background: ${theme.colors.background};
          color: ${theme.colors.text};
        `;
    }
  }}
`;

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  patientId: string;
  patientName: string;
  providerName: string;
  type: string;
  isBlock?: boolean;
  blockReason?: string;
}

interface Provider {
  id: string;
  user_id: string;
  specialty: string;
  profile?: {
    first_name: string;
    last_name: string;
  };
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const APPOINTMENT_TYPES: { value: AppointmentType; label: string; duration: number }[] = [
  { value: 'initial_consultation', label: 'Consulta Inicial', duration: 60 },
  { value: 'follow_up', label: 'Retorno', duration: 30 },
  { value: 'hormone_check', label: 'Avaliação Hormonal', duration: 45 },
  { value: 'lab_review', label: 'Revisão de Exames', duration: 20 },
  { value: 'nutrition', label: 'Nutrição', duration: 45 },
  { value: 'health_coaching', label: 'Health Coaching', duration: 30 },
  { value: 'therapy', label: 'Terapia', duration: 50 },
  { value: 'personal_training', label: 'Personal Training', duration: 60 },
];

const messages = {
  today: 'Hoje',
  previous: 'Anterior',
  next: 'Próximo',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Nenhuma consulta neste período.',
  showMore: (total: number) => `+ ${total} mais`,
};

// Helper para formatar tipo de consulta
const formatTypeShort = (type: string): string => {
  const types: Record<string, string> = {
    initial_consultation: 'Inicial',
    follow_up: 'Retorno',
    hormone_check: 'Hormonal',
    lab_review: 'Exames',
    nutrition: 'Nutrição',
    health_coaching: 'Coaching',
    therapy: 'Terapia',
    personal_training: 'Personal',
  };
  return types[type] || type;
};

// Helper para formatar status
const formatStatusShort = (status: string): string => {
  const statuses: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmada',
    checked_in: 'Check-in',
    in_progress: 'Em Curso',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    no_show: 'Faltou',
  };
  return statuses[status] || status;
};

// Componente customizado para renderizar evento na Agenda - Versão Limpa
const CustomAgendaEvent: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  return (
    <AgendaEventContent>
      <AgendaPatientName>{event.patientName}</AgendaPatientName>
      <AgendaSeparator>·</AgendaSeparator>
      <AgendaType>{formatTypeShort(event.type)}</AgendaType>
      <AgendaSeparator>·</AgendaSeparator>
      <AgendaProvider>
        <Stethoscope />
        {event.providerName}
      </AgendaProvider>
      <AgendaStatusBadge $status={event.status}>
        {formatStatusShort(event.status)}
      </AgendaStatusBadge>
    </AgendaEventContent>
  );
};

// Provider filter styled for calendar
const ProviderFilterWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ProviderFilterSelect = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: 13px;
  font-weight: 500;
  background: ${theme.colors.surface};
  color: ${theme.colors.text};
  cursor: pointer;
  min-width: 180px;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%238C8B8B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 36px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }
`;

interface ProviderOption {
  id: string;
  name: string;
}

const CalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { providerId, isProvider, isAdmin } = useCurrentProvider();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([]);

  // New appointment modal state
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newAppointmentForm, setNewAppointmentForm] = useState({
    patient_id: '',
    provider_id: '',
    type: 'follow_up' as AppointmentType,
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '09:00',
    notes: '',
  });
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [appointmentError, setAppointmentError] = useState('');

  // Block modal state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    provider_id: '',
    block_date: format(new Date(), 'yyyy-MM-dd'),
    period: 'full_day' as 'full_day' | 'morning' | 'afternoon' | 'custom',
    start_time: '08:00',
    end_time: '18:00',
    reason: '',
  });
  const [savingBlock, setSavingBlock] = useState(false);
  const [blockSuccess, setBlockSuccess] = useState(false);
  const [blockError, setBlockError] = useState('');

  // Ler view da URL ou usar 'month' como padrão
  const viewFromUrl = searchParams.get('view') as View | null;
  const validViews: View[] = ['month', 'week', 'day', 'agenda'];
  const initialView: View = viewFromUrl && validViews.includes(viewFromUrl) ? viewFromUrl : 'month';

  // Ler data da URL ou usar hoje como padrão
  const dateFromUrl = searchParams.get('date');
  const parsedDate = dateFromUrl ? parseISO(dateFromUrl) : new Date();
  const initialDate = isValid(parsedDate) ? parsedDate : new Date();

  const [view, setView] = useState<View>(initialView);
  const [date, setDate] = useState(initialDate);

  // Atualizar URL quando view ou date mudar
  const updateUrl = useCallback((newView: View, newDate: Date) => {
    const params = new URLSearchParams();
    params.set('view', newView);
    params.set('date', format(newDate, 'yyyy-MM-dd'));
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Handlers que atualizam state e URL
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
    updateUrl(newView, date);
  }, [date, updateUrl]);

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
    updateUrl(view, newDate);
  }, [view, updateUrl]);

  // Determinar provider_id ativo para filtro
  const activeProviderId = isProvider ? providerId : (providerFilter !== 'all' ? providerFilter : null);

  // Carregar lista de médicos para dropdown (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    const loadProviderOptions = async () => {
      try {
        const { data } = await supabase
          .from('providers')
          .select('id, profile:profiles(first_name, last_name)')
          .eq('is_active', true);

        const options = (data || []).map((p: any) => {
          const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
          return {
            id: p.id,
            name: prof ? `Dr(a). ${prof.first_name} ${prof.last_name}` : p.id,
          };
        });
        setProviderOptions(options);
      } catch (err) {
        console.error('Error loading providers:', err);
      }
    };
    loadProviderOptions();
  }, [isAdmin]);

  const loadAppointments = useCallback(async () => {
    try {
      const start = startOfMonth(subDays(date, 7));
      const end = endOfMonth(addDays(date, 7));

      let query = supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          scheduled_at,
          duration,
          type,
          status,
          patient:profiles!appointments_patient_id_fkey(first_name, last_name),
          provider:providers!appointments_provider_id_fkey(
            profile:profiles(first_name, last_name)
          )
        `)
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())
        .order('scheduled_at', { ascending: true });

      if (activeProviderId) {
        query = query.eq('provider_id', activeProviderId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const calendarEvents: CalendarEvent[] = (data || []).map((apt: any) => {
        const startDate = new Date(apt.scheduled_at);
        const endDate = new Date(startDate.getTime() + (apt.duration || 30) * 60000);
        const patientName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'N/A';
        const providerName = apt.provider?.profile ? `Dr(a). ${apt.provider.profile.first_name}` : 'N/A';

        return {
          id: apt.id,
          title: patientName,
          start: startDate,
          end: endDate,
          status: apt.status,
          patientId: apt.patient_id,
          patientName,
          providerName,
          type: apt.type,
        };
      });

      // Load provider blocks
      let blockQuery = supabase
        .from('provider_blocks')
        .select(`
          id,
          provider_id,
          block_date,
          start_time,
          end_time,
          reason,
          created_via,
          provider:providers!provider_blocks_provider_id_fkey(
            profile:profiles(first_name, last_name)
          )
        `)
        .gte('block_date', format(start, 'yyyy-MM-dd'))
        .lte('block_date', format(end, 'yyyy-MM-dd'));

      if (activeProviderId) {
        blockQuery = blockQuery.eq('provider_id', activeProviderId);
      }

      const { data: blocksData } = await blockQuery;

      const blockEvents: CalendarEvent[] = (blocksData || []).map((block: any) => {
        const providerName = block.provider?.profile
          ? `Dr(a). ${block.provider.profile.first_name}`
          : '';

        let blockStart: Date;
        let blockEnd: Date;

        if (!block.start_time) {
          // Full day block
          blockStart = new Date(`${block.block_date}T08:00:00`);
          blockEnd = new Date(`${block.block_date}T18:00:00`);
        } else {
          blockStart = new Date(`${block.block_date}T${block.start_time}`);
          blockEnd = new Date(`${block.block_date}T${block.end_time}`);
        }

        const label = block.reason || (!block.start_time ? 'Dia bloqueado' : 'Bloqueado');

        return {
          id: `block-${block.id}`,
          title: `🔒 ${label}${providerName ? ` - ${providerName}` : ''}`,
          start: blockStart,
          end: blockEnd,
          status: 'blocked',
          patientId: '',
          patientName: '',
          providerName,
          type: 'block',
          isBlock: true,
          blockReason: block.reason,
        };
      });

      setEvents([...calendarEvents, ...blockEvents]);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }, [date, activeProviderId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Load providers and patients for new appointment modal
  useEffect(() => {
    const loadProvidersAndPatients = async () => {
      try {
        // Fetch providers
        const { data: providersData } = await supabase
          .from('providers')
          .select(`
            id,
            user_id,
            specialty,
            profile:profiles(first_name, last_name)
          `)
          .eq('is_active', true);

        // Map to ensure profile is an object, not array
        const mappedProviders = (providersData || []).map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          specialty: p.specialty,
          profile: Array.isArray(p.profile) ? p.profile[0] : p.profile,
        }));

        setProviders(mappedProviders);

        // Fetch patients
        const { data: patientsData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'patient')
          .order('first_name');

        setPatients(patientsData || []);
      } catch (error) {
        console.error('Error loading providers/patients:', error);
      }
    };

    loadProvidersAndPatients();
  }, []);

  // Store patientId from URL to apply when patients are loaded
  const [pendingPatientId, setPendingPatientId] = useState<string | null>(null);

  // Check URL for new appointment modal
  useEffect(() => {
    const newAppointment = searchParams.get('newAppointment');
    const patientId = searchParams.get('patientId');

    if (newAppointment === 'true') {
      if (patientId) {
        setPendingPatientId(patientId);
      }
      setIsNewAppointmentOpen(true);

      // Clear URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('newAppointment');
      newParams.delete('patientId');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Apply pending patient when patients are loaded
  useEffect(() => {
    if (pendingPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === pendingPatientId);
      if (patient) {
        setSelectedPatient(patient);
        setNewAppointmentForm(prev => ({ ...prev, patient_id: pendingPatientId }));
      }
      setPendingPatientId(null);
    }
  }, [pendingPatientId, patients]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    // Block events style
    if (event.isBlock) {
      if (view === 'agenda') {
        return {
          style: {
            backgroundColor: 'transparent',
            border: 'none',
            color: '#991B1B',
            fontWeight: 600,
            fontSize: '14px',
            padding: 0,
            boxShadow: 'none',
          },
        };
      }
      return {
        style: {
          backgroundColor: '#FEE2E2',
          borderLeft: '4px solid #DC2626',
          borderRadius: '6px',
          color: '#991B1B',
          fontWeight: 600,
          fontSize: '12px',
          padding: '4px 8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          opacity: 0.9,
          display: 'block',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(220,38,38,0.05) 5px, rgba(220,38,38,0.05) 10px)',
        },
      };
    }

    // Na view Agenda, usar estilo minimal
    if (view === 'agenda') {
      return {
        style: {
          backgroundColor: 'transparent',
          border: 'none',
          color: theme.colors.text,
          fontWeight: 500,
          fontSize: '14px',
          padding: 0,
          boxShadow: 'none',
        },
      };
    }

    // Paleta para outras views (mês, semana, dia)
    const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
      pending: {
        bg: '#FEF3C7',
        border: '#D97706',
        text: '#92400E',
      },
      confirmed: {
        bg: '#D1FAE5',
        border: '#059669',
        text: '#065F46',
      },
      checked_in: {
        bg: '#DBEAFE',
        border: '#2563EB',
        text: '#1E40AF',
      },
      in_progress: {
        bg: '#E0E7FF',
        border: '#4F46E5',
        text: '#3730A3',
      },
      completed: {
        bg: '#F3F4F6',
        border: '#6B7280',
        text: '#374151',
      },
      cancelled: {
        bg: '#FEE2E2',
        border: '#DC2626',
        text: '#991B1B',
      },
      no_show: {
        bg: '#FECACA',
        border: '#B91C1C',
        text: '#7F1D1D',
      },
    };

    const style = statusStyles[event.status] || statusStyles.pending;

    return {
      style: {
        backgroundColor: style.bg,
        borderLeft: `4px solid ${style.border}`,
        borderRadius: '6px',
        color: style.text,
        fontWeight: 600,
        fontSize: '12px',
        padding: '4px 8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        opacity: event.status === 'cancelled' || event.status === 'no_show' ? 0.85 : 1,
        display: 'block',
        textDecoration: event.status === 'cancelled' ? 'line-through' : 'none',
      },
    };
  }, [view]);

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.isBlock) return; // Don't open detail modal for blocks
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleViewPatient = () => {
    if (selectedEvent?.patientId) {
      closeModal();
      navigate(`/admin/patients/${selectedEvent.patientId}`, { state: { from: '/admin/calendar' } });
    }
  };

  const handleConfirmAppointment = async () => {
    if (!selectedEvent) return;
    try {
      await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', selectedEvent.id);

      // Atualizar evento local
      setEvents(prev => prev.map(e =>
        e.id === selectedEvent.id ? { ...e, status: 'confirmed' } : e
      ));
      setSelectedEvent(prev => prev ? { ...prev, status: 'confirmed' } : null);
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedEvent) return;
    try {
      await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', selectedEvent.id);

      // Atualizar evento local
      setEvents(prev => prev.map(e =>
        e.id === selectedEvent.id ? { ...e, status: 'cancelled' } : e
      ));
      closeModal();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const formatAppointmentType = (type: string) => {
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

  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      checked_in: 'Check-in',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
      cancelled: 'Cancelada',
      no_show: 'Não Compareceu',
    };
    return statuses[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle />;
      case 'confirmed':
      case 'completed':
        return <CheckCircle />;
      case 'cancelled':
      case 'no_show':
        return <XCircle />;
      default:
        return <Clock />;
    }
  };

  // Ir para hoje
  const goToToday = useCallback(() => {
    const today = new Date();
    setDate(today);
    updateUrl(view, today);
  }, [view, updateUrl]);

  // New Appointment handlers
  const openNewAppointmentModal = () => {
    setNewAppointmentForm({
      patient_id: '',
      provider_id: isProvider && providerId ? providerId : '',
      type: 'follow_up',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '09:00',
      notes: '',
    });
    setSelectedPatient(null);
    setAppointmentSuccess(false);
    setAppointmentError('');
    setIsNewAppointmentOpen(true);
  };

  const closeNewAppointmentModal = () => {
    setIsNewAppointmentOpen(false);
    setSelectedPatient(null);
    setAppointmentSuccess(false);
    setAppointmentError('');
  };

  const handleCreateAppointment = async () => {
    if (!newAppointmentForm.patient_id || !newAppointmentForm.provider_id) {
      setAppointmentError('Selecione o paciente e o médico');
      return;
    }

    setSavingAppointment(true);
    setAppointmentError('');

    try {
      const scheduledAt = new Date(`${newAppointmentForm.scheduled_date}T${newAppointmentForm.scheduled_time}`);
      const appointmentType = APPOINTMENT_TYPES.find(t => t.value === newAppointmentForm.type);
      const duration = appointmentType?.duration || 30;

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: newAppointmentForm.patient_id,
          provider_id: newAppointmentForm.provider_id,
          type: newAppointmentForm.type,
          scheduled_at: scheduledAt.toISOString(),
          duration,
          notes: newAppointmentForm.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setAppointmentSuccess(true);
      loadAppointments();

      setTimeout(() => {
        closeNewAppointmentModal();
      }, 1500);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      setAppointmentError(error.message || 'Erro ao criar agendamento');
    } finally {
      setSavingAppointment(false);
    }
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Block modal handlers
  const openBlockModal = () => {
    setBlockForm({
      provider_id: isProvider && providerId ? providerId : '',
      block_date: format(new Date(), 'yyyy-MM-dd'),
      period: 'full_day',
      start_time: '08:00',
      end_time: '18:00',
      reason: '',
    });
    setBlockSuccess(false);
    setBlockError('');
    setIsBlockModalOpen(true);
  };

  const closeBlockModal = () => {
    setIsBlockModalOpen(false);
    setBlockSuccess(false);
    setBlockError('');
  };

  const handleCreateBlock = async () => {
    if (!blockForm.provider_id) {
      setBlockError('Selecione o médico');
      return;
    }

    setSavingBlock(true);
    setBlockError('');

    try {
      let startTime: string | null = null;
      let endTime: string | null = null;

      if (blockForm.period === 'morning') {
        startTime = '08:00';
        endTime = '12:00';
      } else if (blockForm.period === 'afternoon') {
        startTime = '12:00';
        endTime = '18:00';
      } else if (blockForm.period === 'custom') {
        startTime = blockForm.start_time;
        endTime = blockForm.end_time;
      }
      // full_day: startTime and endTime stay null

      const { error } = await supabase.rpc('create_provider_block', {
        p_provider_id: blockForm.provider_id,
        p_block_date: blockForm.block_date,
        p_start_time: startTime,
        p_end_time: endTime,
        p_reason: blockForm.reason || null,
        p_created_via: 'panel',
      });

      if (error) throw error;

      setBlockSuccess(true);
      loadAppointments();

      setTimeout(() => {
        closeBlockModal();
      }, 1500);
    } catch (error: any) {
      console.error('Error creating block:', error);
      setBlockError(error.message || 'Erro ao criar bloqueio');
    } finally {
      setSavingBlock(false);
    }
  };

  // Contagem de eventos do dia atual
  const todayEvents = useMemo(() => {
    const today = new Date();
    return events.filter(e =>
      format(e.start, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    );
  }, [events]);

  return (
    <AdminLayout>
      <Header>
        <h1>
          <span className="calendar-icon">
            <CalendarIcon />
          </span>
          {isProvider ? 'Minha Agenda' : 'Calendário'}
        </h1>
        <HeaderActions>
          {isAdmin && providerOptions.length > 0 && (
            <ProviderFilterWrapper>
              <ProviderFilterSelect
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <option value="all">Todos os médicos</option>
                {providerOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </ProviderFilterSelect>
            </ProviderFilterWrapper>
          )}
          <TodayInfo onClick={goToToday}>
            <div className="date-display">
              <span className="day">{format(new Date(), 'd')}</span>
              <div className="month-year">
                <span className="month">{format(new Date(), 'MMMM', { locale: ptBR })}</span>
                <span className="year">{format(new Date(), 'yyyy')}</span>
              </div>
            </div>
            {todayEvents.length > 0 && (
              <span className="event-count">{todayEvents.length} consulta{todayEvents.length > 1 ? 's' : ''}</span>
            )}
          </TodayInfo>
          {isAdmin && (
            <Button $variant="secondary" onClick={openBlockModal}>
              <Lock />
              Bloquear Data
            </Button>
          )}
          <Button $variant="primary" onClick={openNewAppointmentModal}>
            <Plus />
            Nova Consulta
          </Button>
        </HeaderActions>
      </Header>

      <HelpTip id="calendar">
        <strong>Dica:</strong> Clique em uma consulta para ver detalhes e alterar o status.
        Use os botoes acima para alternar entre visao de mes, semana ou dia.
        {isAdmin && ' Filtre por medico para ver a agenda individual.'}
      </HelpTip>

      <CalendarWrapper>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={handleNavigate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          messages={messages}
          culture="pt-BR"
          formats={{
            monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: ptBR }),
            weekdayFormat: (date: Date) => format(date, 'EEE', { locale: ptBR }),
            dayFormat: (date: Date) => format(date, 'd', { locale: ptBR }),
            dayHeaderFormat: (date: Date) => format(date, 'EEEE, d MMMM', { locale: ptBR }),
            dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${format(start, 'd MMM', { locale: ptBR })} - ${format(end, 'd MMM yyyy', { locale: ptBR })}`,
            agendaDateFormat: (date: Date) => format(date, 'EEE, d MMM', { locale: ptBR }),
            agendaTimeFormat: (date: Date) => format(date, 'HH:mm', { locale: ptBR }),
            agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
          }}
          components={{
            agenda: {
              event: CustomAgendaEvent,
            } as any,
          }}
          popup
          selectable
        />

        <Legend>
          <LegendItem>
            <span className="status-badge pending">Pendente</span>
          </LegendItem>
          <LegendItem>
            <span className="status-badge confirmed">Confirmada</span>
          </LegendItem>
          <LegendItem>
            <span className="status-badge completed">Concluída</span>
          </LegendItem>
          <LegendItem>
            <span className="status-badge cancelled">Cancelada</span>
          </LegendItem>
          <LegendItem>
            <span className="status-badge cancelled" style={{ background: '#FEE2E2', borderColor: '#DC2626', color: '#991B1B' }}>
              🔒 Bloqueado
            </span>
          </LegendItem>
        </Legend>
      </CalendarWrapper>

      {/* Modal de Detalhes da Consulta */}
      {isModalOpen && selectedEvent && (
        <>
          <ModalOverlay onClick={closeModal} />
          <ModalContainer>
            <ModalHeader>
              <ModalTitle>
                <h2>Detalhes da Consulta</h2>
                <h3>{selectedEvent.patientName}</h3>
              </ModalTitle>
              <CloseButton onClick={closeModal}>
                <X />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <StatusBadge $status={selectedEvent.status}>
                {getStatusIcon(selectedEvent.status)}
                {formatStatus(selectedEvent.status)}
              </StatusBadge>

              <DetailCard>
                <DetailRow>
                  <DetailIcon $color="#8B5CF6">
                    <User />
                  </DetailIcon>
                  <DetailInfo>
                    <div className="label">Paciente</div>
                    <div className="value">{selectedEvent.patientName}</div>
                  </DetailInfo>
                </DetailRow>

                <DetailRow>
                  <DetailIcon $color={theme.colors.primary}>
                    <Stethoscope />
                  </DetailIcon>
                  <DetailInfo>
                    <div className="label">Médico</div>
                    <div className="value">{selectedEvent.providerName}</div>
                  </DetailInfo>
                </DetailRow>

                <DetailRow>
                  <DetailIcon $color="#059669">
                    <CalendarIcon />
                  </DetailIcon>
                  <DetailInfo>
                    <div className="label">Data e Horário</div>
                    <div className="value">
                      {format(selectedEvent.start, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </DetailInfo>
                </DetailRow>

                <DetailRow>
                  <DetailIcon $color="#F59E0B">
                    <FileText />
                  </DetailIcon>
                  <DetailInfo>
                    <div className="label">Tipo de Consulta</div>
                    <div className="value">{formatAppointmentType(selectedEvent.type)}</div>
                  </DetailInfo>
                </DetailRow>
              </DetailCard>
            </ModalBody>

            <ModalFooter>
              <ModalButton $variant="primary" onClick={handleViewPatient}>
                <User />
                Ver Ficha
              </ModalButton>
              {selectedEvent.status === 'pending' && (
                <>
                  <ModalButton $variant="success" onClick={handleConfirmAppointment}>
                    <CheckCircle />
                    Confirmar
                  </ModalButton>
                  <ModalButton $variant="danger" onClick={handleCancelAppointment}>
                    <XCircle />
                    Cancelar
                  </ModalButton>
                </>
              )}
              {selectedEvent.status === 'confirmed' && (
                <ModalButton $variant="danger" onClick={handleCancelAppointment}>
                  <XCircle />
                  Cancelar Consulta
                </ModalButton>
              )}
              <ModalButton $variant="secondary" onClick={closeModal}>
                Fechar
              </ModalButton>
            </ModalFooter>
          </ModalContainer>
        </>
      )}

      {/* New Appointment Modal */}
      {isNewAppointmentOpen && (
        <>
          <ModalOverlay onClick={closeNewAppointmentModal} />
          <NewAppointmentModal onClick={e => e.stopPropagation()}>
            <NewAppointmentHeader>
              <h2>
                <Plus />
                Nova Consulta
              </h2>
              <CloseButton onClick={closeNewAppointmentModal}>
                <X />
              </CloseButton>
            </NewAppointmentHeader>

            <NewAppointmentBody>
              {appointmentSuccess && (
                <SuccessMessage>
                  <CheckCircle />
                  Consulta agendada com sucesso!
                </SuccessMessage>
              )}

              {appointmentError && (
                <ErrorMessage>
                  <AlertCircle />
                  {appointmentError}
                </ErrorMessage>
              )}

              {selectedPatient && (
                <PatientBanner>
                  <PatientAvatar>
                    {getPatientInitials(selectedPatient.first_name, selectedPatient.last_name)}
                  </PatientAvatar>
                  <PatientBannerInfo>
                    <div className="name">{selectedPatient.first_name} {selectedPatient.last_name}</div>
                    <div className="label">Paciente selecionado</div>
                  </PatientBannerInfo>
                </PatientBanner>
              )}

              <FormGrid>
                {!selectedPatient && (
                  <FormGroup $fullWidth>
                    <FormLabel>Paciente</FormLabel>
                    <FormSelect
                      value={newAppointmentForm.patient_id}
                      onChange={e => {
                        const patientId = e.target.value;
                        setNewAppointmentForm(prev => ({ ...prev, patient_id: patientId }));
                        const patient = patients.find(p => p.id === patientId);
                        setSelectedPatient(patient || null);
                      }}
                    >
                      <option value="">Selecione o paciente</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </option>
                      ))}
                    </FormSelect>
                  </FormGroup>
                )}

                <FormGroup $fullWidth>
                  <FormLabel>Médico</FormLabel>
                  <FormSelect
                    value={newAppointmentForm.provider_id}
                    onChange={e => setNewAppointmentForm(prev => ({ ...prev, provider_id: e.target.value }))}
                  >
                    <option value="">Selecione o médico</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        Dr(a). {provider.profile?.first_name} {provider.profile?.last_name} - {provider.specialty}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>

                <FormGroup $fullWidth>
                  <FormLabel>Tipo de Consulta</FormLabel>
                  <FormSelect
                    value={newAppointmentForm.type}
                    onChange={e => setNewAppointmentForm(prev => ({ ...prev, type: e.target.value as AppointmentType }))}
                  >
                    {APPOINTMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} ({type.duration} min)
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Data</FormLabel>
                  <FormInput
                    type="date"
                    value={newAppointmentForm.scheduled_date}
                    onChange={e => setNewAppointmentForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Horário</FormLabel>
                  <FormInput
                    type="time"
                    value={newAppointmentForm.scheduled_time}
                    onChange={e => setNewAppointmentForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  />
                </FormGroup>

                <FormGroup $fullWidth>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormTextarea
                    value={newAppointmentForm.notes}
                    onChange={e => setNewAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionais sobre a consulta..."
                  />
                </FormGroup>
              </FormGrid>
            </NewAppointmentBody>

            <NewAppointmentFooter>
              <ModalButton $variant="secondary" onClick={closeNewAppointmentModal}>
                Cancelar
              </ModalButton>
              <ModalButton
                $variant="primary"
                onClick={handleCreateAppointment}
                disabled={savingAppointment || !newAppointmentForm.patient_id || !newAppointmentForm.provider_id}
              >
                {savingAppointment ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <Save />
                    Agendar Consulta
                  </>
                )}
              </ModalButton>
            </NewAppointmentFooter>
          </NewAppointmentModal>
        </>
      )}
      {/* Block Modal */}
      {isBlockModalOpen && (
        <>
          <ModalOverlay onClick={closeBlockModal} />
          <NewAppointmentModal onClick={e => e.stopPropagation()}>
            <NewAppointmentHeader>
              <h2>
                <Lock />
                Bloquear Data
              </h2>
              <CloseButton onClick={closeBlockModal}>
                <X />
              </CloseButton>
            </NewAppointmentHeader>

            <NewAppointmentBody>
              {blockSuccess && (
                <SuccessMessage>
                  <CheckCircle />
                  Bloqueio criado com sucesso!
                </SuccessMessage>
              )}

              {blockError && (
                <ErrorMessage>
                  <AlertCircle />
                  {blockError}
                </ErrorMessage>
              )}

              <FormGrid>
                <FormGroup $fullWidth>
                  <FormLabel>Médico</FormLabel>
                  <FormSelect
                    value={blockForm.provider_id}
                    onChange={e => setBlockForm(prev => ({ ...prev, provider_id: e.target.value }))}
                  >
                    <option value="">Selecione o médico</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        Dr(a). {provider.profile?.first_name} {provider.profile?.last_name} - {provider.specialty}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Data</FormLabel>
                  <FormInput
                    type="date"
                    value={blockForm.block_date}
                    onChange={e => setBlockForm(prev => ({ ...prev, block_date: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Período</FormLabel>
                  <FormSelect
                    value={blockForm.period}
                    onChange={e => setBlockForm(prev => ({ ...prev, period: e.target.value as any }))}
                  >
                    <option value="full_day">Dia Inteiro</option>
                    <option value="morning">Manhã (08:00-12:00)</option>
                    <option value="afternoon">Tarde (12:00-18:00)</option>
                    <option value="custom">Horário Personalizado</option>
                  </FormSelect>
                </FormGroup>

                {blockForm.period === 'custom' && (
                  <>
                    <FormGroup>
                      <FormLabel>Início</FormLabel>
                      <FormInput
                        type="time"
                        value={blockForm.start_time}
                        onChange={e => setBlockForm(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </FormGroup>
                    <FormGroup>
                      <FormLabel>Fim</FormLabel>
                      <FormInput
                        type="time"
                        value={blockForm.end_time}
                        onChange={e => setBlockForm(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </FormGroup>
                  </>
                )}

                <FormGroup $fullWidth>
                  <FormLabel>Motivo (opcional)</FormLabel>
                  <FormTextarea
                    value={blockForm.reason}
                    onChange={e => setBlockForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Ex: Férias, compromisso pessoal, congresso..."
                  />
                </FormGroup>
              </FormGrid>
            </NewAppointmentBody>

            <NewAppointmentFooter>
              <ModalButton $variant="secondary" onClick={closeBlockModal}>
                Cancelar
              </ModalButton>
              <ModalButton
                $variant="danger"
                onClick={handleCreateBlock}
                disabled={savingBlock || !blockForm.provider_id}
              >
                {savingBlock ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <Lock />
                    Bloquear
                  </>
                )}
              </ModalButton>
            </NewAppointmentFooter>
          </NewAppointmentModal>
        </>
      )}
    </AdminLayout>
  );
};

export default CalendarPage;
