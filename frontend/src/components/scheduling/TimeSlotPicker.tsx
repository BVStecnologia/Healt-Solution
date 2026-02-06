import React, { useState } from 'react';
import styled from 'styled-components';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import type { TimeSlot } from '../../types/database';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (slot: TimeSlot) => void;
  onDateChange: (date: Date) => void;
  loading?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.text};
`;

const WeekNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.sm};
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.surface};
  cursor: pointer;
  color: ${theme.colors.text};

  &:hover {
    background: ${theme.colors.border};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const WeekLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.text};
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${theme.spacing.xs};
`;

const DayButton = styled.button<{ $selected: boolean; $today: boolean; $disabled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${theme.spacing.sm};
  border: 2px solid ${props =>
    props.$disabled ? 'transparent' : props.$selected ? theme.colors.primary : props.$today ? theme.colors.primary + '40' : 'transparent'
  };
  border-radius: ${theme.borderRadius.md};
  background: ${props => props.$disabled ? 'transparent' : props.$selected ? theme.colors.primary : 'transparent'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.4 : 1};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$disabled ? 'transparent' : props.$selected ? theme.colors.primary : theme.colors.border};
  }
`;

const DayName = styled.span<{ $selected: boolean; $disabled: boolean }>`
  font-size: 11px;
  text-transform: uppercase;
  color: ${props => props.$disabled ? theme.colors.textSecondary : props.$selected ? 'white' : theme.colors.textSecondary};
  margin-bottom: 2px;
`;

const DayNumber = styled.span<{ $selected: boolean; $disabled: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$disabled ? theme.colors.textSecondary : props.$selected ? 'white' : theme.colors.text};
`;

const SlotsContainer = styled.div`
  margin-top: ${theme.spacing.md};
`;

const SlotsLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.sm};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const SlotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${theme.spacing.sm};

  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const SlotButton = styled.button<{ $selected: boolean; $available: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${props =>
    props.$selected ? theme.colors.primary : props.$available ? theme.colors.border : theme.colors.border
  };
  border-radius: ${theme.borderRadius.md};
  background: ${props =>
    props.$selected ? theme.colors.primary : props.$available ? theme.colors.surface : theme.colors.border + '50'
  };
  color: ${props =>
    props.$selected ? 'white' : props.$available ? theme.colors.text : theme.colors.textSecondary
  };
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.$available ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.$available ? 1 : 0.5};
  transition: all 0.2s ease;

  &:hover {
    ${props => props.$available && !props.$selected && `
      border-color: ${theme.colors.primary};
      background: ${theme.colors.primary}10;
    `}
  }
`;

const EmptySlots = styled.div`
  text-align: center;
  padding: ${theme.spacing.lg};
  color: ${theme.colors.textSecondary};
  font-size: 14px;
`;

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  onDateChange,
  loading = false,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  // Iniciar com amanhã (regra de 24h mínimas de antecedência)
  const [selectedDate, setSelectedDate] = useState<Date>(() => addDays(startOfDay(new Date()), 1));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    onDateChange(date);
  };

  const availableSlots = slots.filter(s => s.available);

  return (
    <Container>
      <Label>Selecione a data e horário</Label>

      <WeekNav>
        <NavButton onClick={handlePrevWeek}>
          <ChevronLeft />
        </NavButton>
        <WeekLabel>
          {format(currentWeekStart, "MMMM 'de' yyyy", { locale: ptBR })}
        </WeekLabel>
        <NavButton onClick={handleNextWeek}>
          <ChevronRight />
        </NavButton>
      </WeekNav>

      <DaysGrid>
        {weekDays.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          // Bloquear datas passadas e hoje (regra de 24h mínimas)
          const tomorrow = addDays(startOfDay(new Date()), 1);
          const isPast = isBefore(day, tomorrow);

          return (
            <DayButton
              key={day.toISOString()}
              $selected={isSelected && !isPast}
              $today={isToday}
              $disabled={isPast}
              onClick={() => !isPast && handleDayClick(day)}
              type="button"
              disabled={isPast}
            >
              <DayName $selected={isSelected && !isPast} $disabled={isPast}>
                {format(day, 'EEE', { locale: ptBR })}
              </DayName>
              <DayNumber $selected={isSelected && !isPast} $disabled={isPast}>
                {format(day, 'd')}
              </DayNumber>
            </DayButton>
          );
        })}
      </DaysGrid>

      <SlotsContainer>
        <SlotsLabel>
          <Clock />
          Horários disponíveis para {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
        </SlotsLabel>

        {loading ? (
          <EmptySlots>Carregando horários...</EmptySlots>
        ) : availableSlots.length === 0 ? (
          <EmptySlots>Nenhum horário disponível nesta data</EmptySlots>
        ) : (
          <SlotsGrid>
            {slots.map(slot => {
              const isSelected = slot.start === selectedSlot;
              // Use UTC hours since DB stores local clinic times as UTC
              const d = new Date(slot.start);
              const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

              return (
                <SlotButton
                  key={slot.start}
                  $selected={isSelected}
                  $available={slot.available}
                  onClick={() => slot.available && onSelectSlot(slot)}
                  type="button"
                  disabled={!slot.available}
                >
                  {time}
                </SlotButton>
              );
            })}
          </SlotsGrid>
        )}
      </SlotsContainer>
    </Container>
  );
};

export default TimeSlotPicker;
