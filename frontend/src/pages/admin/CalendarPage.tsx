import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';

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
  margin-bottom: ${theme.spacing.xl};

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$variant === 'primary' ? `
    background: ${theme.colors.primary};
    color: white;
    border: none;
    &:hover {
      background: ${theme.colors.primaryHover};
    }
  ` : `
    background: ${theme.colors.surface};
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};
    &:hover {
      background: ${theme.colors.background};
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
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  height: calc(100vh - 180px);
  min-height: 600px;

  .rbc-calendar {
    height: 100%;
    font-family: inherit;
  }

  .rbc-header {
    padding: ${theme.spacing.md};
    font-weight: 600;
    font-size: 13px;
    color: ${theme.colors.textSecondary};
    text-transform: uppercase;
    border-bottom: 1px solid ${theme.colors.border};
  }

  .rbc-month-view {
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.lg};
    overflow: hidden;
  }

  .rbc-day-bg {
    background: ${theme.colors.surface};
  }

  .rbc-off-range-bg {
    background: ${theme.colors.background};
  }

  .rbc-today {
    background: ${theme.colors.primarySoft};
  }

  .rbc-date-cell {
    padding: ${theme.spacing.sm};
    font-size: 14px;

    &.rbc-now {
      font-weight: 700;
      color: ${theme.colors.primary};
    }
  }

  .rbc-event {
    background: ${theme.colors.primary};
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 12px;
    border: none;

    &.rbc-event-pending {
      background: #F59E0B;
    }

    &.rbc-event-confirmed {
      background: #10B981;
    }

    &.rbc-event-cancelled {
      background: #EF4444;
      text-decoration: line-through;
    }
  }

  .rbc-toolbar {
    margin-bottom: ${theme.spacing.lg};
    flex-wrap: wrap;
    gap: ${theme.spacing.md};
  }

  .rbc-toolbar button {
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    background: ${theme.colors.surface};
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: ${theme.colors.background};
    }

    &.rbc-active {
      background: ${theme.colors.primary};
      color: white;
      border-color: ${theme.colors.primary};
    }
  }

  .rbc-btn-group button + button {
    margin-left: -1px;
  }

  .rbc-toolbar-label {
    font-size: 18px;
    font-weight: 600;
    color: ${theme.colors.text};
    text-transform: capitalize;
  }

  .rbc-time-view {
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.lg};
    overflow: hidden;
  }

  .rbc-time-header {
    border-bottom: 1px solid ${theme.colors.border};
  }

  .rbc-time-content {
    border-top: none;
  }

  .rbc-timeslot-group {
    min-height: 60px;
    border-bottom: 1px solid ${theme.colors.borderLight};
  }

  .rbc-time-slot {
    font-size: 12px;
    color: ${theme.colors.textMuted};
  }

  .rbc-current-time-indicator {
    background: ${theme.colors.error};
  }

  .rbc-agenda-view {
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.lg};
    overflow: hidden;
  }

  .rbc-agenda-table {
    border: none;

    thead {
      background: ${theme.colors.background};
    }

    th, td {
      padding: ${theme.spacing.md};
      border-bottom: 1px solid ${theme.colors.border};
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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

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

  return (
    <AdminLayout>
      <Header>
        <h1>Calendário</h1>
        <HeaderActions>
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
          onView={setView}
          date={date}
          onNavigate={setDate}
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
