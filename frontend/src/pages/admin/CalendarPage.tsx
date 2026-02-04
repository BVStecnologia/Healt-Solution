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
  AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';

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
    font-size: 28px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};

    .calendar-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
      border-radius: ${theme.borderRadius.md};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(146, 86, 62, 0.25);

      svg {
        width: 20px;
        height: 20px;
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
    border-color: ${theme.colors.primary}40;
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
      border-color: ${theme.colors.primary}50;
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
    font-weight: 700;
    font-size: 11px;
    color: ${theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 2px solid ${theme.colors.border};
    background: ${theme.colors.background};
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
      background: ${theme.colors.primarySoft}30;
    }
  }

  .rbc-off-range-bg {
    background: ${theme.colors.background};

    &:hover {
      background: ${theme.colors.background};
    }
  }

  .rbc-today {
    background: linear-gradient(135deg, ${theme.colors.primarySoft} 0%, ${theme.colors.primarySoft}80 100%) !important;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight});
    }
  }

  .rbc-date-cell {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    font-size: 14px;
    font-weight: 500;
    text-align: right;

    > button {
      transition: all 0.2s ease;
      padding: 4px 8px;
      border-radius: ${theme.borderRadius.sm};

      &:hover {
        background: ${theme.colors.primary}15;
        color: ${theme.colors.primary};
      }
    }

    &.rbc-now > button {
      background: ${theme.colors.primary};
      color: white;
      font-weight: 700;
      border-radius: ${theme.borderRadius.full};
      width: 28px;
      height: 28px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(146, 86, 62, 0.3);
    }
  }

  .rbc-event {
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      z-index: 10;
    }

    &:active {
      transform: translateY(0) scale(1);
    }

    .rbc-event-content {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
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
    padding: 10px 16px;
    background: ${theme.colors.surface};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: ${theme.colors.background};
      border-color: ${theme.colors.primary}40;
    }

    &.rbc-active {
      background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
      color: white;
      border-color: transparent;
      box-shadow: 0 2px 8px rgba(146, 86, 62, 0.25);
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
    font-size: 22px;
    font-weight: 700;
    color: ${theme.colors.text};
    text-transform: capitalize;
    font-family: ${theme.typography.fontFamilyHeading};
    letter-spacing: -0.5px;
  }

  .rbc-time-view {
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.lg};
    overflow: hidden;
  }

  .rbc-time-header {
    border-bottom: 2px solid ${theme.colors.border};
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
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.lg};
    overflow: hidden;
  }

  .rbc-agenda-table {
    border: none;

    thead {
      background: linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 100%);
    }

    th {
      padding: ${theme.spacing.md} ${theme.spacing.lg};
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${theme.colors.textMuted};
      border-bottom: 2px solid ${theme.colors.border};
    }

    td {
      padding: ${theme.spacing.md} ${theme.spacing.lg};
      border-bottom: 1px solid ${theme.colors.borderLight};
      font-size: 13px;
      font-weight: 500;
    }

    tbody tr {
      transition: all 0.2s ease;
      border-left: 4px solid transparent;

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }
    }

    .rbc-agenda-date-cell {
      font-weight: 600;
      color: ${theme.colors.text};
      white-space: nowrap;
    }

    .rbc-agenda-time-cell {
      color: ${theme.colors.textMuted};
      font-family: monospace;
      font-size: 12px;
    }

    .rbc-agenda-event-cell {
      font-weight: 600;
      color: ${theme.colors.text};
    }
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
  gap: ${theme.spacing.xl};
  margin-top: ${theme.spacing.lg};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 100%);
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.borderLight};
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
    background: ${theme.colors.primary}15;
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
  background: ${props => props.$color || theme.colors.primary}12;
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
            border-color: ${theme.colors.primary}40;
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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  patientName: string;
  providerName: string;
  type: string;
}

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

const CalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const loadAppointments = useCallback(async () => {
    try {
      const start = startOfMonth(subDays(date, 7));
      const end = endOfMonth(addDays(date, 7));

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
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

      if (error) throw error;

      const calendarEvents: CalendarEvent[] = (data || []).map((apt: any) => {
        const startDate = new Date(apt.scheduled_at);
        const endDate = new Date(startDate.getTime() + (apt.duration || 30) * 60000);
        const patientName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'N/A';
        const providerName = apt.provider?.profile ? `Dr(a). ${apt.provider.profile.first_name}` : 'N/A';

        return {
          id: apt.id,
          title: `${patientName} - ${providerName}`,
          start: startDate,
          end: endDate,
          status: apt.status,
          patientName,
          providerName,
          type: apt.type,
        };
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }, [date]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const eventStyleGetter = (event: CalendarEvent) => {
    // Paleta luxuosa com alto contraste - tons que harmonizam com marrom/bege
    const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
      pending: {
        bg: '#FEF3C7',      // Âmbar claro
        border: '#D97706',   // Âmbar escuro
        text: '#92400E',     // Marrom âmbar (alto contraste)
      },
      confirmed: {
        bg: '#D1FAE5',      // Verde menta claro
        border: '#059669',   // Verde esmeralda
        text: '#065F46',     // Verde escuro (alto contraste)
      },
      checked_in: {
        bg: '#DBEAFE',      // Azul claro
        border: '#2563EB',   // Azul royal
        text: '#1E40AF',     // Azul escuro (alto contraste)
      },
      in_progress: {
        bg: '#E0E7FF',      // Índigo claro
        border: '#4F46E5',   // Índigo
        text: '#3730A3',     // Índigo escuro (alto contraste)
      },
      completed: {
        bg: '#F3F4F6',      // Cinza claro
        border: '#6B7280',   // Cinza médio
        text: '#374151',     // Cinza escuro (alto contraste)
      },
      cancelled: {
        bg: '#FEE2E2',      // Vermelho claro
        border: '#DC2626',   // Vermelho
        text: '#991B1B',     // Vermelho escuro (alto contraste)
      },
      no_show: {
        bg: '#FECACA',      // Vermelho rosado
        border: '#B91C1C',   // Vermelho tijolo
        text: '#7F1D1D',     // Vermelho muito escuro (alto contraste)
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
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
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
          Calendário
        </h1>
        <HeaderActions>
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
          <Button $variant="primary">
            <Plus />
            Nova Consulta
          </Button>
        </HeaderActions>
      </Header>

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
    </AdminLayout>
  );
};

export default CalendarPage;
