import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Clock,
  Save,
  AlertCircle,
  Check,
  Calendar,
  Loader2,
  Stethoscope,
  ChevronDown,
  Ban,
  Plus,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import HelpTip from '../../components/ui/HelpTip';
import { theme } from '../../styles/GlobalStyle';
import { supabase, callRPC } from '../../lib/supabaseClient';
import { useCurrentProvider } from '../../hooks/useCurrentProvider';

// ============================================
// TYPES
// ============================================
interface ScheduleSegment {
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  day_of_week: number;
  is_active: boolean;
  segments: ScheduleSegment[];
}

interface ProviderOption {
  id: string;
  name: string;
  specialty: string;
}

interface ProviderBlock {
  id: string;
  provider_id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_via: string;
  created_at: string;
}

type BlockPeriod = 'full_day' | 'morning' | 'afternoon' | 'custom';

// ============================================
// CONSTANTS
// ============================================
const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

const DEFAULT_SEGMENTS: ScheduleSegment[] = [
  { start_time: '08:00', end_time: '12:00' },
  { start_time: '13:00', end_time: '17:00' },
];

const DEFAULT_SCHEDULES: DaySchedule[] = DAYS_OF_WEEK.map(day => ({
  day_of_week: day.value,
  is_active: day.value >= 1 && day.value <= 5,
  segments: [...DEFAULT_SEGMENTS.map(s => ({ ...s }))],
}));

// ============================================
// THEME
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
    margin: 0;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 12px;

    svg {
      color: ${luxuryTheme.primary};
    }
  }

  p {
    color: ${luxuryTheme.textSecondary};
    margin: 4px 0 0;
    font-size: 14px;
  }
`;

const ProviderDropdownWrapper = styled.div`
  position: relative;
  max-width: 400px;
  margin-bottom: 24px;
  z-index: 20;
  animation: ${fadeInUp} 0.6s ease-out 0.05s both;

  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

const ProviderDropdownTrigger = styled.button<{ $open: boolean }>`
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid ${props => props.$open ? luxuryTheme.primary : luxuryTheme.border};
  border-radius: 12px;
  font-size: 14px;
  color: ${luxuryTheme.text};
  background: ${luxuryTheme.surface};
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  position: relative;

  ${props => props.$open && `box-shadow: 0 0 0 3px ${luxuryTheme.primary}15;`}

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

const ProviderDropdownMenu = styled.div<{ $open: boolean }>`
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

const ProviderDropdownOption = styled.button<{ $selected: boolean }>`
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 14px;
  color: ${props => props.$selected ? luxuryTheme.primary : luxuryTheme.textSecondary};
  font-weight: ${props => props.$selected ? '500' : '400'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(146, 86, 62, 0.04);
    color: ${luxuryTheme.text};
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(146, 86, 62, 0.05);
  }
`;

const Card = styled.div`
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 16px;
  padding: 32px;
  animation: ${fadeInUp} 0.6s ease-out 0.1s both;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  margin: 0 0 24px;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${luxuryTheme.primary};
  }
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 16px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const DayTile = styled.div<{ $active?: boolean; $selected?: boolean }>`
  background: ${props =>
    props.$selected ? `${luxuryTheme.primary}0A` :
    props.$active ? luxuryTheme.surface :
    luxuryTheme.cream};
  border-radius: 16px;
  border: 1.5px solid ${props =>
    props.$selected ? luxuryTheme.primary :
    props.$active ? `${luxuryTheme.primary}20` :
    luxuryTheme.border};
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  opacity: ${props => props.$active ? 1 : 0.5};
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  text-align: center;
  min-height: 100px;

  &:hover {
    border-color: ${luxuryTheme.primaryLight};
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(146, 86, 62, 0.08);
  }
`;

const DayName = styled.div<{ $active?: boolean }>`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.$active ? luxuryTheme.primary : luxuryTheme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const DayToggle = styled.div`
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: ${luxuryTheme.primary};
  }
`;

const DaySummaryText = styled.div`
  font-size: 11px;
  color: ${luxuryTheme.textSecondary};
  line-height: 1.5;
  white-space: pre-line;
  text-align: center;
`;

const DayOffLabel = styled.div`
  font-size: 11px;
  color: ${luxuryTheme.textSecondary};
  opacity: 0.5;
  font-style: italic;
`;

const ExpandedPanel = styled.div`
  background: ${luxuryTheme.surface};
  border: 1.5px solid ${luxuryTheme.primary}30;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 16px;
  animation: ${fadeInUp} 0.3s ease-out;
`;

const ExpandedHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(146, 86, 62, 0.08);

  .day-title {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 16px;
    font-weight: 500;
    color: ${luxuryTheme.primary};
  }
`;

const SegmentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SegmentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .segment-label {
    font-size: 11px;
    font-weight: 600;
    color: ${luxuryTheme.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    min-width: 52px;
  }

  input[type="time"] {
    padding: 7px 10px;
    border: 1px solid ${luxuryTheme.border};
    border-radius: 8px;
    font-size: 13px;
    color: ${luxuryTheme.text};
    background: ${luxuryTheme.surface};
    width: 120px;

    &:focus {
      outline: none;
      border-color: ${luxuryTheme.primary};
    }
  }

  .segment-dash {
    color: ${luxuryTheme.textSecondary};
    font-size: 13px;
  }

  @media (max-width: 480px) {
    input[type="time"] {
      width: 100px;
      padding: 6px 8px;
      font-size: 12px;
    }
  }
`;

const RemoveSegmentBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${luxuryTheme.textSecondary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${luxuryTheme.errorLight};
    color: ${luxuryTheme.error};
  }
`;

const AddSegmentBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px dashed ${luxuryTheme.border};
  border-radius: 8px;
  background: transparent;
  color: ${luxuryTheme.textSecondary};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;

  &:hover {
    border-color: ${luxuryTheme.primary};
    color: ${luxuryTheme.primary};
    background: ${luxuryTheme.primarySoft};
  }
`;

const Alert = styled.div<{ $variant: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
  animation: ${fadeInUp} 0.3s ease-out;
  background: ${props => props.$variant === 'success' ? luxuryTheme.successLight : luxuryTheme.errorLight};
  color: ${props => props.$variant === 'success' ? luxuryTheme.success : luxuryTheme.error};
  border: 1px solid ${props => props.$variant === 'success' ? `${luxuryTheme.success}30` : `${luxuryTheme.error}30`};
`;

const SaveButton = styled.button<{ $saving?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 32px;
  background: linear-gradient(145deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryDark});
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 24px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(146, 86, 62, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.6s ease-out 0.2s both;
`;

const SummaryCard = styled.div`
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 12px;
  padding: 20px;
  text-align: center;

  .value {
    font-size: 28px;
    font-weight: 700;
    color: ${luxuryTheme.primary};
    margin-bottom: 4px;
  }

  .label {
    font-size: 13px;
    color: ${luxuryTheme.textSecondary};
    font-weight: 500;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: ${luxuryTheme.textSecondary};
  font-size: 15px;

  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const BlocksCard = styled(Card)`
  margin-top: 24px;
  animation: ${fadeInUp} 0.6s ease-out 0.15s both;
`;

const BlockForm = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px;
  background: ${luxuryTheme.cream};
  border-radius: 12px;
  border: 1px solid ${luxuryTheme.border};
  margin-bottom: 24px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: ${luxuryTheme.text};
    margin-bottom: 6px;
  }

  input[type="date"],
  input[type="time"],
  input[type="text"] {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid ${luxuryTheme.border};
    border-radius: 8px;
    font-size: 14px;
    color: ${luxuryTheme.text};
    background: ${luxuryTheme.surface};
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: ${luxuryTheme.primary};
    }
  }
`;

const PeriodOptions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const PeriodButton = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.$active ? luxuryTheme.primary : luxuryTheme.border};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$active ? luxuryTheme.primarySoft : luxuryTheme.surface};
  color: ${props => props.$active ? luxuryTheme.primary : luxuryTheme.textSecondary};

  &:hover {
    border-color: ${luxuryTheme.primary};
    color: ${luxuryTheme.primary};
  }
`;

const BlockTimeRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  span {
    color: ${luxuryTheme.textSecondary};
    font-size: 13px;
  }

  input[type="time"] {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid ${luxuryTheme.border};
    border-radius: 8px;
    font-size: 14px;
    color: ${luxuryTheme.text};
    background: ${luxuryTheme.surface};

    &:focus {
      outline: none;
      border-color: ${luxuryTheme.primary};
    }
  }
`;

const AddBlockButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(145deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryDark});
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  grid-column: 1 / -1;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(146, 86, 62, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BlockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BlockItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: ${luxuryTheme.cream};
  border-radius: 10px;
  border: 1px solid ${luxuryTheme.border};
  gap: 12px;

  .block-info {
    flex: 1;
    min-width: 0;

    .block-date {
      font-weight: 600;
      color: ${luxuryTheme.text};
      font-size: 14px;
    }

    .block-period {
      font-size: 13px;
      color: ${luxuryTheme.primary};
      font-weight: 500;
    }

    .block-reason {
      font-size: 12px;
      color: ${luxuryTheme.textSecondary};
      margin-top: 2px;
    }
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid ${luxuryTheme.errorLight};
  border-radius: 8px;
  background: ${luxuryTheme.surface};
  color: ${luxuryTheme.error};
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: ${luxuryTheme.errorLight};
  }
`;

const EmptyBlocks = styled.div`
  text-align: center;
  padding: 32px 20px;
  color: ${luxuryTheme.textSecondary};
  font-size: 14px;

  svg {
    margin-bottom: 8px;
    opacity: 0.4;
  }
`;

const ConflictAlert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 13px;
  margin-bottom: 16px;
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #FDE68A;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }

  ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
`;

// ============================================
// COMPONENT
// ============================================
const MySchedulePage: React.FC = () => {
  const location = useLocation();
  const { providerId, loading: providerLoading, isAdmin: isAdminRole } = useCurrentProvider();
  const isDoctorEnv = location.pathname.startsWith('/doctor');
  // Admin sempre tem dropdown (gerencia médicos), mesmo no env médico
  // Só provider real perde o dropdown no env médico (vê apenas própria agenda)
  const isAdmin = isAdminRole;
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Admin: lista de providers para selecionar
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Blocks state
  const [blocks, setBlocks] = useState<ProviderBlock[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockPeriod, setBlockPeriod] = useState<BlockPeriod>('full_day');
  const [blockStartTime, setBlockStartTime] = useState('08:00');
  const [blockEndTime, setBlockEndTime] = useState('12:00');
  const [blockReason, setBlockReason] = useState('');
  const [blockConflicts, setBlockConflicts] = useState<any[]>([]);

  const effectiveProviderId = isAdmin ? selectedProviderId : providerId;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
        setProviderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Admin: carregar lista de providers
  useEffect(() => {
    if (!isAdmin) return;

    const loadProviders = async () => {
      const { data } = await supabase
        .from('providers')
        .select('id, specialty, user_id, profiles:profiles!providers_user_id_fkey(first_name, last_name)')
        .eq('is_active', true)
        .order('created_at');

      if (data && data.length > 0) {
        const options = data.map((p: any) => ({
          id: p.id,
          name: p.profiles ? `Dr(a). ${p.profiles.first_name} ${p.profiles.last_name}` : 'Sem nome',
          specialty: p.specialty || '',
        }));
        setProviders(options);
        setSelectedProviderId(options[0].id);
      }
    };

    loadProviders();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin && !providerLoading && !providerId) {
      setLoading(false);
    }
  }, [isAdmin, providerLoading, providerId]);

  const loadSchedules = useCallback(async () => {
    if (!effectiveProviderId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', effectiveProviderId)
        .order('start_time');

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        // Agrupar por dia da semana (múltiplos segmentos por dia)
        const grouped = DAYS_OF_WEEK.map(day => {
          const dayRows = data.filter(s => s.day_of_week === day.value && s.is_active);
          if (dayRows.length > 0) {
            return {
              day_of_week: day.value,
              is_active: true,
              segments: dayRows.map(s => ({
                start_time: s.start_time?.slice(0, 5) || '08:00',
                end_time: s.end_time?.slice(0, 5) || '18:00',
              })),
            };
          }
          return {
            day_of_week: day.value,
            is_active: false,
            segments: [...DEFAULT_SEGMENTS.map(s => ({ ...s }))],
          };
        });
        setSchedules(grouped);
      } else {
        setSchedules(DEFAULT_SCHEDULES.map(d => ({
          ...d,
          segments: d.segments.map(s => ({ ...s })),
        })));
      }
    } catch (err) {
      console.error('Erro ao carregar horários:', err);
      setError('Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  }, [effectiveProviderId]);

  useEffect(() => {
    if (effectiveProviderId) {
      loadSchedules();
    }
  }, [effectiveProviderId, loadSchedules]);

  const handleSave = async () => {
    if (!effectiveProviderId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Flatten: cada segmento de cada dia ativo vira um item do JSON
      const rows = schedules.flatMap(day =>
        day.is_active
          ? day.segments.map(seg => ({
              day_of_week: day.day_of_week,
              start_time: seg.start_time,
              end_time: seg.end_time,
              slot_duration: 30,
            }))
          : []
      );

      // RPC transacional: delete + insert atômico (sem race condition)
      await callRPC('update_provider_schedules', {
        p_provider_id: effectiveProviderId,
        p_schedules: rows,
      });

      setSuccess('Horários salvos com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.message || 'Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  // ---- Schedule segment helpers ----
  const updateSegment = (dayIndex: number, segIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedules(prev => {
      const next = [...prev];
      next[dayIndex] = {
        ...next[dayIndex],
        segments: next[dayIndex].segments.map((seg, i) =>
          i === segIndex ? { ...seg, [field]: value } : seg
        ),
      };
      return next;
    });
  };

  const addSegment = (dayIndex: number) => {
    setSchedules(prev => {
      const next = [...prev];
      const lastSeg = next[dayIndex].segments[next[dayIndex].segments.length - 1];
      const [h] = lastSeg.end_time.split(':').map(Number);

      // Prevenir overflow de hora (precisa de pelo menos 2h: 1h gap + 1h turno)
      if (h >= 22) return prev;

      const newStart = `${String(h + 1).padStart(2, '0')}:00`;
      const newEnd = `${String(Math.min(h + 5, 23)).padStart(2, '0')}:00`;
      next[dayIndex] = {
        ...next[dayIndex],
        segments: [...next[dayIndex].segments, { start_time: newStart, end_time: newEnd }],
      };
      return next;
    });
  };

  const removeSegment = (dayIndex: number, segIndex: number) => {
    setSchedules(prev => {
      const next = [...prev];
      next[dayIndex] = {
        ...next[dayIndex],
        segments: next[dayIndex].segments.filter((_, i) => i !== segIndex),
      };
      return next;
    });
  };

  const toggleDay = (dayIndex: number, active: boolean) => {
    setSchedules(prev => {
      const next = [...prev];
      next[dayIndex] = { ...next[dayIndex], is_active: active };
      // Se ativando e não tem segmentos, adicionar defaults
      if (active && next[dayIndex].segments.length === 0) {
        next[dayIndex].segments = [...DEFAULT_SEGMENTS.map(s => ({ ...s }))];
      }
      return next;
    });
  };

  // ---- BLOCKS ----
  const loadBlocks = useCallback(async () => {
    if (!effectiveProviderId) return;

    try {
      setBlocksLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error: fetchError } = await supabase
        .from('provider_blocks')
        .select('*')
        .eq('provider_id', effectiveProviderId)
        .gte('block_date', today)
        .lte('block_date', futureDate)
        .order('block_date')
        .order('start_time');

      if (fetchError) throw fetchError;
      setBlocks(data || []);
    } catch (err) {
      console.error('Erro ao carregar bloqueios:', err);
    } finally {
      setBlocksLoading(false);
    }
  }, [effectiveProviderId]);

  useEffect(() => {
    if (effectiveProviderId) {
      loadBlocks();
    }
  }, [effectiveProviderId, loadBlocks]);

  const handleCreateBlock = async () => {
    if (!effectiveProviderId || !blockDate) return;

    setBlockSaving(true);
    setError('');
    setBlockConflicts([]);

    try {
      let startTime: string | null = null;
      let endTime: string | null = null;

      if (blockPeriod === 'morning') {
        startTime = '08:00';
        endTime = '12:00';
      } else if (blockPeriod === 'afternoon') {
        startTime = '12:00';
        endTime = '18:00';
      } else if (blockPeriod === 'custom') {
        startTime = blockStartTime;
        endTime = blockEndTime;
      }

      const result = await callRPC<{ block: any; conflicts: any[] }>('create_provider_block', {
        p_provider_id: effectiveProviderId,
        p_block_date: blockDate,
        p_start_time: startTime,
        p_end_time: endTime,
        p_reason: blockReason || null,
        p_created_via: 'panel',
      });

      if (result.conflicts && result.conflicts.length > 0) {
        setBlockConflicts(result.conflicts);
      }

      setBlockDate('');
      setBlockPeriod('full_day');
      setBlockStartTime('08:00');
      setBlockEndTime('12:00');
      setBlockReason('');
      setSuccess('Bloqueio adicionado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      loadBlocks();
    } catch (err: any) {
      console.error('Erro ao criar bloqueio:', err);
      setError(err.message || 'Erro ao criar bloqueio');
    } finally {
      setBlockSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await callRPC('delete_provider_block', {
        p_block_id: blockId,
      });

      setBlocks(prev => prev.filter(b => b.id !== blockId));
      setSuccess('Bloqueio removido!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erro ao remover bloqueio:', err);
      setError(err.message || 'Erro ao remover bloqueio');
    }
  };

  const formatBlockDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const weekday = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
    return `${weekday}, ${day}/${month}/${year}`;
  };

  const formatBlockPeriod = (block: ProviderBlock) => {
    if (!block.start_time && !block.end_time) return 'Dia inteiro';
    const start = block.start_time?.slice(0, 5) || '';
    const end = block.end_time?.slice(0, 5) || '';
    return `${start} — ${end}`;
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // Summary stats
  const activeDays = schedules.filter(s => s.is_active).length;
  const totalHours = schedules
    .filter(s => s.is_active)
    .reduce((acc, day) => {
      return acc + day.segments.reduce((segAcc, seg) => {
        const [startH, startM] = seg.start_time.split(':').map(Number);
        const [endH, endM] = seg.end_time.split(':').map(Number);
        return segAcc + (endH + endM / 60) - (startH + startM / 60);
      }, 0);
    }, 0);

  const firstTime = (() => {
    for (const day of schedules) {
      if (day.is_active && day.segments.length > 0) {
        return day.segments[0].start_time;
      }
    }
    return '--:--';
  })();

  const formatDaySummary = (day: DaySchedule) => {
    if (!day.is_active) return '';
    return day.segments.map(s => `${s.start_time}–${s.end_time}`).join('  ·  ');
  };

  const formatDayTileSummary = (day: DaySchedule) => {
    if (!day.is_active) return '';
    return day.segments.map(s => `${s.start_time}–${s.end_time}`).join('\n');
  };

  const selectedProviderName = isAdmin
    ? providers.find(p => p.id === selectedProviderId)?.name || ''
    : '';

  if (providerLoading) {
    return (
      <AdminLayout>
        <LoadingContainer>
          <Loader2 size={32} />
          Carregando...
        </LoadingContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>
              <Clock size={28} />
              {isAdmin ? (isDoctorEnv ? 'Minha Agenda' : 'Agenda do Médico') : 'Minha Agenda'}
            </h1>
            <p>
              {isAdmin
                ? 'Gerencie os dias e horários de atendimento dos médicos'
                : 'Gerencie seus dias e horários de atendimento'}
            </p>
          </div>
        </Header>

        <HelpTip id="my-schedule">
          <strong>Como funciona:</strong> Ative os dias da semana e defina os turnos de atendimento.
          Voce pode ter multiplos turnos por dia (ex: manha e tarde). Pacientes so conseguirao
          agendar dentro desses horarios.
        </HelpTip>

        {isAdmin && providers.length > 0 && (
          <ProviderDropdownWrapper ref={providerDropdownRef}>
            <ProviderDropdownTrigger
              $open={providerDropdownOpen}
              onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
              type="button"
            >
              {providers.find(p => p.id === selectedProviderId)
                ? `${providers.find(p => p.id === selectedProviderId)!.name} — ${providers.find(p => p.id === selectedProviderId)!.specialty}`
                : 'Selecionar médico'
              }
              <ChevronDown size={16} />
            </ProviderDropdownTrigger>
            <ProviderDropdownMenu $open={providerDropdownOpen}>
              {providers.map(p => (
                <ProviderDropdownOption
                  key={p.id}
                  $selected={selectedProviderId === p.id}
                  onClick={() => { setSelectedProviderId(p.id); setProviderDropdownOpen(false); }}
                >
                  {p.name} — {p.specialty}
                </ProviderDropdownOption>
              ))}
            </ProviderDropdownMenu>
          </ProviderDropdownWrapper>
        )}

        {!isAdmin && !providerId && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px', color: luxuryTheme.textSecondary }}>
              <Stethoscope size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 8px', color: luxuryTheme.text }}>Perfil de médico não encontrado</h3>
              <p style={{ margin: 0 }}>Sua conta não está vinculada a um registro de médico.</p>
            </div>
          </Card>
        )}

        {effectiveProviderId && (
          <>
            {!loading && (
              <SummaryGrid>
                <SummaryCard>
                  <div className="value">{activeDays}</div>
                  <div className="label">Dias ativos</div>
                </SummaryCard>
                <SummaryCard>
                  <div className="value">{totalHours.toFixed(0)}h</div>
                  <div className="label">Horas semanais</div>
                </SummaryCard>
                <SummaryCard>
                  <div className="value">{firstTime}</div>
                  <div className="label">Primeiro horário</div>
                </SummaryCard>
              </SummaryGrid>
            )}

            <Card>
              <SectionTitle>
                <Calendar size={20} />
                Horários de Trabalho{selectedProviderName ? ` — ${selectedProviderName}` : ''}
              </SectionTitle>
              <p style={{ fontSize: 13, color: luxuryTheme.textSecondary, margin: '-16px 0 20px', opacity: 0.7 }}>
                Clique em um dia para editar os turnos
              </p>

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

              {loading ? (
                <LoadingContainer>
                  <Loader2 size={28} />
                  Carregando horários...
                </LoadingContainer>
              ) : (
                <>
                  <WeekGrid>
                    {DAYS_OF_WEEK.map((day, dayIndex) => {
                      const daySchedule = schedules[dayIndex];
                      return (
                        <DayTile
                          key={day.value}
                          $active={daySchedule?.is_active}
                          $selected={expandedDay === dayIndex}
                          onClick={() => setExpandedDay(expandedDay === dayIndex ? null : dayIndex)}
                        >
                          <DayName $active={daySchedule?.is_active}>{day.short}</DayName>
                          <DayToggle onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={daySchedule?.is_active || false}
                              onChange={(e) => toggleDay(dayIndex, e.target.checked)}
                            />
                          </DayToggle>
                          {daySchedule?.is_active ? (
                            <DaySummaryText>{formatDayTileSummary(daySchedule)}</DaySummaryText>
                          ) : (
                            <DayOffLabel>Folga</DayOffLabel>
                          )}
                        </DayTile>
                      );
                    })}
                  </WeekGrid>

                  {expandedDay !== null && schedules[expandedDay]?.is_active && (
                    <ExpandedPanel>
                      <ExpandedHeader>
                        <span className="day-title">
                          {DAYS_OF_WEEK[expandedDay].label} — Turnos
                        </span>
                        <AddSegmentBtn onClick={() => addSegment(expandedDay)}>
                          <Plus size={14} />
                          Adicionar turno
                        </AddSegmentBtn>
                      </ExpandedHeader>
                      <SegmentsContainer>
                        {schedules[expandedDay].segments.map((seg, segIndex) => (
                          <SegmentRow key={segIndex}>
                            <span className="segment-label">
                              Turno {segIndex + 1}
                            </span>
                            <input
                              type="time"
                              value={seg.start_time}
                              onChange={(e) => updateSegment(expandedDay, segIndex, 'start_time', e.target.value)}
                            />
                            <span className="segment-dash">—</span>
                            <input
                              type="time"
                              value={seg.end_time}
                              onChange={(e) => updateSegment(expandedDay, segIndex, 'end_time', e.target.value)}
                            />
                            {schedules[expandedDay].segments.length > 1 && (
                              <RemoveSegmentBtn
                                onClick={() => removeSegment(expandedDay, segIndex)}
                                title="Remover turno"
                              >
                                <X size={14} />
                              </RemoveSegmentBtn>
                            )}
                          </SegmentRow>
                        ))}
                      </SegmentsContainer>
                    </ExpandedPanel>
                  )}

                  <SaveButton onClick={handleSave} disabled={saving} $saving={saving}>
                    {saving ? (
                      <>
                        <Loader2 size={18} />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Salvar Horários
                      </>
                    )}
                  </SaveButton>
                </>
              )}
            </Card>

            {/* ---- BLOQUEIOS ---- */}
            <BlocksCard>
              <SectionTitle>
                <Ban size={20} />
                Bloqueios de Agenda{selectedProviderName ? ` — ${selectedProviderName}` : ''}
              </SectionTitle>

              {blockConflicts.length > 0 && (
                <ConflictAlert>
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Atenção:</strong> Existem consultas agendadas neste período:
                    <ul>
                      {blockConflicts.map((c: any, i: number) => (
                        <li key={i}>
                          {c.patient_name} — {c.type} ({c.status})
                        </li>
                      ))}
                    </ul>
                  </div>
                </ConflictAlert>
              )}

              <BlockForm>
                <FormGroup>
                  <label>Data do bloqueio</label>
                  <input
                    type="date"
                    value={blockDate}
                    min={getTodayStr()}
                    onChange={(e) => setBlockDate(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <label>Período</label>
                  <PeriodOptions>
                    <PeriodButton
                      $active={blockPeriod === 'full_day'}
                      onClick={() => setBlockPeriod('full_day')}
                    >
                      Dia inteiro
                    </PeriodButton>
                    <PeriodButton
                      $active={blockPeriod === 'morning'}
                      onClick={() => setBlockPeriod('morning')}
                    >
                      Manhã
                    </PeriodButton>
                    <PeriodButton
                      $active={blockPeriod === 'afternoon'}
                      onClick={() => setBlockPeriod('afternoon')}
                    >
                      Tarde
                    </PeriodButton>
                    <PeriodButton
                      $active={blockPeriod === 'custom'}
                      onClick={() => setBlockPeriod('custom')}
                    >
                      Personalizado
                    </PeriodButton>
                  </PeriodOptions>
                </FormGroup>

                {blockPeriod === 'custom' && (
                  <FormGroup $fullWidth>
                    <label>Horário</label>
                    <BlockTimeRow>
                      <input
                        type="time"
                        value={blockStartTime}
                        onChange={(e) => setBlockStartTime(e.target.value)}
                      />
                      <span>até</span>
                      <input
                        type="time"
                        value={blockEndTime}
                        onChange={(e) => setBlockEndTime(e.target.value)}
                      />
                    </BlockTimeRow>
                  </FormGroup>
                )}

                <FormGroup $fullWidth>
                  <label>Motivo (opcional)</label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Ex: Almoço, Reunião, Férias..."
                  />
                </FormGroup>

                <AddBlockButton
                  onClick={handleCreateBlock}
                  disabled={blockSaving || !blockDate}
                >
                  {blockSaving ? (
                    <>
                      <Loader2 size={16} />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Adicionar Bloqueio
                    </>
                  )}
                </AddBlockButton>
              </BlockForm>

              {blocksLoading ? (
                <LoadingContainer>
                  <Loader2 size={24} />
                  Carregando bloqueios...
                </LoadingContainer>
              ) : blocks.length === 0 ? (
                <EmptyBlocks>
                  <Ban size={32} />
                  <p>Nenhum bloqueio nos próximos 60 dias</p>
                </EmptyBlocks>
              ) : (
                <BlockList>
                  {blocks.map((block) => (
                    <BlockItem key={block.id}>
                      <div className="block-info">
                        <div className="block-date">{formatBlockDate(block.block_date)}</div>
                        <div className="block-period">{formatBlockPeriod(block)}</div>
                        {block.reason && <div className="block-reason">{block.reason}</div>}
                      </div>
                      <DeleteButton onClick={() => handleDeleteBlock(block.id)} title="Remover bloqueio">
                        <Trash2 size={16} />
                      </DeleteButton>
                    </BlockItem>
                  ))}
                </BlockList>
              )}
            </BlocksCard>
          </>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default MySchedulePage;
