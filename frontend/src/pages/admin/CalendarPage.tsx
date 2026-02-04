import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addDays, subDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, Users, Calendar as CalendarIcon } from 'lucide-react';
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
    background: ${theme.colors.primary};
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
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
      padding: ${theme.spacing.md};
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${theme.colors.textMuted};
    }

    td {
      padding: ${theme.spacing.md};
      border-bottom: 1px solid ${theme.colors.borderLight};
    }

    tr:hover td {
      background: ${theme.colors.primarySoft}20;
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
  gap: ${theme.spacing.lg};
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: 13px;
  color: ${theme.colors.textSecondary};

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
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
    let backgroundColor = theme.colors.primary;

    switch (event.status) {
      case 'pending':
        backgroundColor = '#F59E0B';
        break;
      case 'confirmed':
        backgroundColor = '#10B981';
        break;
      case 'cancelled':
      case 'no_show':
        backgroundColor = '#EF4444';
        break;
      case 'completed':
        backgroundColor = '#6B7280';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: event.status === 'cancelled' ? 0.6 : 1,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('Selected event:', event);
    // TODO: Abrir modal com detalhes da consulta
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
            <div className="dot" style={{ background: '#F59E0B' }} />
            Pendente
          </LegendItem>
          <LegendItem>
            <div className="dot" style={{ background: '#10B981' }} />
            Confirmada
          </LegendItem>
          <LegendItem>
            <div className="dot" style={{ background: '#6B7280' }} />
            Concluída
          </LegendItem>
          <LegendItem>
            <div className="dot" style={{ background: '#EF4444' }} />
            Cancelada
          </LegendItem>
        </Legend>
      </CalendarWrapper>
    </AdminLayout>
  );
};

export default CalendarPage;
