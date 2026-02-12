import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Users,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Loader2,
  TrendingUp,
  Activity,
  Phone,
  Sparkles,
  PieChart,
  BarChart3,
  CalendarCheck,
  UserCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase, fetchWithTimeout } from '../../lib/supabaseClient';
import { EVOLUTION_API_URL, evolutionHeaders } from '../../lib/whatsappService';
import { useWhatsAppNotifications } from '../../hooks/admin/useWhatsAppNotifications';
import { useCurrentProvider } from '../../hooks/useCurrentProvider';
import SetupChecklist from '../../components/admin/SetupChecklist';
import { getTreatmentLabel } from '../../constants/treatments';

// ============================================
// ANIMATIONS
// ============================================
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

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

// ============================================
// LUXURY COLOR PALETTE
// ============================================
const luxuryColors = {
  // Accent colors (hex for concatenation/dynamic props)
  primary: '#92563E',
  primaryLight: '#B8956E',
  primaryDark: '#6B3D2A',
  gold: '#D4AF37',
  goldMuted: '#C9A962',
  success: '#6B8E6B',
  warning: '#C9923E',
  danger: '#B85C5C',
  // Theme-responsive colors (CSS variables - adapt to dark mode)
  cream: theme.colors.surface,
  warmWhite: theme.colors.surface,
  beige: theme.colors.borderLight,
  beigeLight: theme.colors.background,
  textDark: theme.colors.text,
  textMuted: theme.colors.textSecondary,
  successLight: theme.colors.successLight,
  warningLight: theme.colors.warningLight,
  dangerLight: theme.colors.errorLight,
};

// Chart colors palette
const chartColors = [
  luxuryColors.primary,
  luxuryColors.primaryLight,
  luxuryColors.gold,
  luxuryColors.warning,
  luxuryColors.success,
  luxuryColors.goldMuted,
];

// ============================================
// STYLED COMPONENTS
// ============================================
const PageWrapper = styled.div`
  animation: ${fadeInUp} 0.6s ease-out;
`;

const Header = styled.div`
  margin-bottom: 32px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, ${luxuryColors.primary}, ${luxuryColors.gold});
    border-radius: 2px;
  }

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 32px;
    font-weight: 400;
    color: ${luxuryColors.textDark};
    margin: 0 0 6px;
    letter-spacing: 0.5px;
  }

  p {
    color: ${luxuryColors.textMuted};
    margin: 0;
    font-size: 15px;
    font-weight: 400;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

interface StatCardProps {
  $delay?: number;
  $accentColor?: string;
}

const StatCard = styled.div<StatCardProps>`
  background: ${luxuryColors.warmWhite};
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(146, 86, 62, 0.08);
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => props.$delay || 0}ms;
  animation-fill-mode: both;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg,
      ${props => props.$accentColor || luxuryColors.primary},
      ${props => props.$accentColor ? `${props.$accentColor}99` : luxuryColors.primaryLight}
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle at top right,
      ${props => props.$accentColor || luxuryColors.primary}08,
      transparent 70%
    );
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 12px 40px rgba(146, 86, 62, 0.12),
      0 4px 12px rgba(146, 86, 62, 0.08);
    border-color: rgba(146, 86, 62, 0.15);

    &::before {
      opacity: 1;
    }
  }
`;

const StatCardContent = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${luxuryColors.textMuted};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 42px;
  font-weight: 600;
  color: ${luxuryColors.textDark};
  line-height: 1;
  letter-spacing: -1px;
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, ${props => props.$color}15, ${props => props.$color}08);
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 26px;
    height: 26px;
    stroke-width: 1.5;
  }

  ${StatCard}:hover & {
    transform: scale(1.08);
    background: linear-gradient(135deg, ${props => props.$color}20, ${props => props.$color}12);
  }
`;

const StatTrend = styled.div<{ $positive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: ${props => props.$positive ? luxuryColors.success : luxuryColors.textMuted};
  font-weight: 500;

  svg {
    width: 14px;
    height: 14px;
  }
`;

// Charts Section
const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  margin-bottom: 28px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div<{ $delay?: number }>`
  background: ${luxuryColors.warmWhite};
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(146, 86, 62, 0.06);
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => props.$delay || 0}ms;
  animation-fill-mode: both;

  &:hover {
    box-shadow: 0 8px 32px rgba(146, 86, 62, 0.08);
  }
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 18px;
  font-weight: 600;
  color: ${luxuryColors.textDark};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    width: 18px;
    height: 18px;
    color: ${luxuryColors.primary};
    stroke-width: 1.5;
  }
`;

const ChartLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${luxuryColors.textMuted};

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div<{ $delay?: number }>`
  background: ${luxuryColors.warmWhite};
  border-radius: 20px;
  padding: 28px;
  border: 1px solid rgba(146, 86, 62, 0.06);
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => props.$delay || 0}ms;
  animation-fill-mode: both;

  &:hover {
    box-shadow: 0 8px 32px rgba(146, 86, 62, 0.08);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${luxuryColors.beige};
`;

const SectionTitle = styled.h2`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 22px;
  font-weight: 600;
  color: ${luxuryColors.textDark};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    width: 20px;
    height: 20px;
    color: ${luxuryColors.primary};
    stroke-width: 1.5;
  }
`;

const CardBadge = styled.span`
  background: ${luxuryColors.primary}12;
  color: ${luxuryColors.primary};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const PendingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PendingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: ${luxuryColors.beigeLight};
  border-radius: 14px;
  transition: all 0.25s ease;
  border: 1px solid transparent;
  cursor: pointer;

  &:hover {
    background: ${luxuryColors.beige};
    border-color: rgba(146, 86, 62, 0.1);
    transform: translateX(4px);
  }
`;

const PendingAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${luxuryColors.primary}, ${luxuryColors.primaryLight});
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
`;

const PendingInfo = styled.div`
  flex: 1;
  min-width: 0;

  .name {
    font-weight: 600;
    color: ${luxuryColors.textDark};
    font-size: 15px;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .details {
    font-size: 13px;
    color: ${luxuryColors.textMuted};
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .tag {
    background: ${luxuryColors.primary}10;
    color: ${luxuryColors.primary};
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }
`;

const PendingActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $variant: 'approve' | 'reject' }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;

  ${props => props.$variant === 'approve' && css`
    background: ${luxuryColors.successLight};
    color: ${luxuryColors.success};

    &:hover:not(:disabled) {
      background: ${luxuryColors.success};
      color: white;
      transform: scale(1.08);
    }
  `}

  ${props => props.$variant === 'reject' && css`
    background: ${luxuryColors.dangerLight};
    color: ${luxuryColors.danger};

    &:hover:not(:disabled) {
      background: ${luxuryColors.danger};
      color: white;
      transform: scale(1.08);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${luxuryColors.textMuted};

  svg {
    width: 56px;
    height: 56px;
    margin-bottom: 16px;
    stroke-width: 1;
    color: ${luxuryColors.primaryLight};
    animation: ${float} 3s ease-in-out infinite;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }
`;

const WhatsAppCard = styled(Card)`
  background: linear-gradient(135deg, ${luxuryColors.warmWhite}, ${luxuryColors.cream});
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -30%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, ${luxuryColors.success}08, transparent 70%);
    pointer-events: none;
  }
`;

const WhatsAppStatus = styled.div<{ $connected: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: ${props => props.$connected ? luxuryColors.successLight : luxuryColors.dangerLight};
  border-radius: 30px;
  margin-bottom: 24px;
  transition: all 0.3s ease;

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${props => props.$connected ? luxuryColors.success : luxuryColors.danger};
    animation: ${props => props.$connected ? pulse : 'none'} 2s ease-in-out infinite;
  }

  span {
    font-size: 14px;
    color: ${props => props.$connected ? luxuryColors.success : luxuryColors.danger};
    font-weight: 600;
  }
`;

const PhoneDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: ${luxuryColors.beigeLight};
  border-radius: 14px;
  margin-top: 8px;

  .icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, ${luxuryColors.primary}, ${luxuryColors.primaryDark});
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  .info {
    flex: 1;

    .label {
      font-size: 12px;
      color: ${luxuryColors.textMuted};
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .number {
      font-size: 18px;
      font-weight: 600;
      color: ${luxuryColors.textDark};
      font-family: ${theme.typography.fontFamilyHeading};
    }
  }
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
`;

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: ${luxuryColors.primary}08;
  border: 1px solid ${luxuryColors.primary}15;
  border-radius: 12px;
  color: ${luxuryColors.primary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: ${luxuryColors.primary};
    color: white;
    border-color: ${luxuryColors.primary};
    transform: translateY(-2px);
  }
`;

// Today's appointments
const TodayList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${luxuryColors.beige};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${luxuryColors.primaryLight};
    border-radius: 2px;
  }
`;

const TodayItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${luxuryColors.beigeLight};
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: ${luxuryColors.beige};
    transform: translateX(4px);
  }
`;

const TodayTime = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${luxuryColors.primary};
  min-width: 50px;
`;

const TodayInfo = styled.div`
  flex: 1;
  min-width: 0;

  .name {
    font-weight: 500;
    color: ${luxuryColors.textDark};
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .type {
    font-size: 12px;
    color: ${luxuryColors.textMuted};
  }
`;

const TodayStatus = styled.div<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;

  ${props => {
    switch (props.$status) {
      case 'confirmed':
        return `background: rgba(146, 86, 62, 0.10); color: #92563E;`;
      case 'pending':
        return `background: rgba(212, 165, 116, 0.15); color: #A67B5B;`;
      case 'in_progress':
        return `background: rgba(122, 69, 50, 0.12); color: #7A4532;`;
      default:
        return `background: ${luxuryColors.beige}; color: ${luxuryColors.textMuted};`;
    }
  }}
`;

// Custom Tooltip for charts
const CustomTooltip = styled.div`
  background: ${luxuryColors.warmWhite};
  border: 1px solid ${luxuryColors.beige};
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);

  .label {
    font-size: 12px;
    color: ${luxuryColors.textMuted};
    margin-bottom: 4px;
  }

  .value {
    font-size: 16px;
    font-weight: 600;
    color: ${luxuryColors.textDark};
  }
`;

// ============================================
// INTERFACES
// ============================================
interface Stats {
  totalPatients: number;
  totalProviders: number;
  pendingAppointments: number;
  todayAppointments: number;
}

interface PendingAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string | null;
  patient_is_test: boolean;
  provider_name: string;
  scheduled_at: string;
  type: string;
}

interface TodayAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_is_test: boolean;
  time: string;
  type: string;
  status: string;
}

interface WeeklyData {
  day: string;
  consultas: number;
}

interface TypeDistribution {
  name: string;
  value: number;
}

// ============================================
// COMPONENT
// ============================================
const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { navigateTo } = useSmartNavigation();
  const { providerId, isProvider: isProviderRole, isAdmin: isAdminRole } = useCurrentProvider();

  // Detectar ambiente pela URL (environment switcher)
  const isDoctorEnv = location.pathname.startsWith('/doctor');
  // Para layout/labels: usar ambiente da URL
  const isProvider = isDoctorEnv || isProviderRole;
  const isAdmin = !isDoctorEnv && isAdminRole;
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalProviders: 0,
    pendingAppointments: 0,
    todayAppointments: 0,
  });
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [typeDistribution, setTypeDistribution] = useState<TypeDistribution[]>([]);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { sendConfirmation, sendRejection, isConnected: whatsappReady } = useWhatsAppNotifications();

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: await evolutionHeaders(),
      });

      if (response.ok) {
        const instances = await response.json();
        const connectedInstance = instances.find((inst: any) =>
          inst.connectionStatus === 'open' || inst.state === 'open'
        );

        if (connectedInstance) {
          setWhatsappConnected(true);
          const detailResponse = await fetchWithTimeout(
            `${EVOLUTION_API_URL}/instance/connectionState/${connectedInstance.name || connectedInstance.instanceName}`,
            { headers: await evolutionHeaders() }
          );
          if (detailResponse.ok) {
            const detail = await detailResponse.json();
            // Tenta diferentes caminhos possíveis para o número
            const phoneNumber = detail.instance?.user?.id
              || detail.instance?.wuid?.user
              || detail.state?.user?.id
              || connectedInstance.ownerJid?.split('@')[0]
              || null;
            if (phoneNumber) {
              setWhatsappPhone(phoneNumber);
            }
          }
        } else {
          setWhatsappConnected(false);
          setWhatsappPhone(null);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar WhatsApp:', error);
      setWhatsappConnected(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadPendingAppointments();
    loadTodayAppointments();
    loadWeeklyData();
    loadTypeDistribution();
    if (isAdmin) {
      checkWhatsAppStatus();
      const interval = setInterval(checkWhatsAppStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [providerId, isDoctorEnv]);

  const loadStats = async () => {
    try {
      // Ambiente doctor: stats filtradas pelo provider
      if (isDoctorEnv && providerId) {
        const { count: pendingCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('provider_id', providerId);

        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', providerId)
          .gte('scheduled_at', `${today}T00:00:00`)
          .lt('scheduled_at', `${today}T23:59:59`);

        const { data: myPatients } = await supabase
          .from('appointments')
          .select('patient_id')
          .eq('provider_id', providerId);

        const uniquePatients = new Set((myPatients || []).map((a: any) => a.patient_id));

        const { count: totalAppointments } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', providerId);

        setStats({
          totalPatients: uniquePatients.size,
          totalProviders: totalAppointments || 0,
          pendingAppointments: pendingCount || 0,
          todayAppointments: todayCount || 0,
        });
      } else if (isDoctorEnv && !providerId) {
        // Admin visualizando ambiente doctor sem provider record
        setStats({ totalPatients: 0, totalProviders: 0, pendingAppointments: 0, todayAppointments: 0 });
      } else {
        // Admin: stats globais
        const { count: patientsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'patient')
          .or('is_test.is.null,is_test.eq.false');

        const { count: providersCount } = await supabase
          .from('providers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        const { count: pendingCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('scheduled_at', `${today}T00:00:00`)
          .lt('scheduled_at', `${today}T23:59:59`);

        setStats({
          totalPatients: patientsCount || 0,
          totalProviders: providersCount || 0,
          pendingAppointments: pendingCount || 0,
          todayAppointments: todayCount || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPendingAppointments = async () => {
    try {
      // Admin visualizando doctor env sem provider record
      if (isDoctorEnv && !providerId) { setPendingAppointments([]); return; }

      let query = supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          scheduled_at,
          type,
          patient:profiles!appointments_patient_id_fkey(id, first_name, last_name, phone, is_test),
          provider:providers!appointments_provider_id_fkey(
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (isDoctorEnv && providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = (data || []).map((apt: any) => ({
        id: apt.id,
        patient_id: apt.patient_id,
        patient_name: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'N/A',
        patient_phone: apt.patient?.phone || null,
        patient_is_test: apt.patient?.is_test || false,
        provider_name: apt.provider?.profile ? `${t('common.drPrefix')} ${apt.provider.profile.first_name}` : 'N/A',
        scheduled_at: apt.scheduled_at,
        type: apt.type,
      }));

      setPendingAppointments(formatted);
    } catch (error) {
      console.error('Error loading pending appointments:', error);
    }
  };

  const loadTodayAppointments = async () => {
    try {
      if (isDoctorEnv && !providerId) { setTodayAppointments([]); return; }

      const today = new Date().toISOString().split('T')[0];
      let query = supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          scheduled_at,
          type,
          status,
          patient:profiles!appointments_patient_id_fkey(first_name, last_name, is_test)
        `)
        .gte('scheduled_at', `${today}T00:00:00`)
        .lt('scheduled_at', `${today}T23:59:59`)
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (isDoctorEnv && providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = (data || []).map((apt: any) => ({
        id: apt.id,
        patient_id: apt.patient_id,
        patient_name: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'N/A',
        patient_is_test: apt.patient?.is_test || false,
        time: new Date(apt.scheduled_at).toLocaleTimeString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
        type: apt.type,
        status: apt.status,
      }));

      setTodayAppointments(formatted);
    } catch (error) {
      console.error('Error loading today appointments:', error);
    }
  };

  const loadWeeklyData = async () => {
    try {
      if (isDoctorEnv && !providerId) { setWeeklyData([]); return; }

      const days = [];
      const dayNames = [
        t('dashboard.dayNames.sun'), t('dashboard.dayNames.mon'), t('dashboard.dayNames.tue'),
        t('dashboard.dayNames.wed'), t('dashboard.dayNames.thu'), t('dashboard.dayNames.fri'),
        t('dashboard.dayNames.sat'),
      ];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        let query = supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('scheduled_at', `${dateStr}T00:00:00`)
          .lt('scheduled_at', `${dateStr}T23:59:59`);

        if (isDoctorEnv && providerId) {
          query = query.eq('provider_id', providerId);
        }

        const { count } = await query;

        days.push({
          day: dayNames[date.getDay()],
          consultas: count || 0,
        });
      }

      setWeeklyData(days);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const loadTypeDistribution = async () => {
    try {
      if (isDoctorEnv && !providerId) { setTypeDistribution([]); return; }

      let query = supabase
        .from('appointments')
        .select('type');

      if (isDoctorEnv && providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typeCounts: Record<string, number> = {};
      (data || []).forEach((apt: any) => {
        const typeName = formatType(apt.type);
        typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
      });

      const distribution = Object.entries(typeCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setTypeDistribution(distribution);
    } catch (error) {
      console.error('Error loading type distribution:', error);
    }
  };

  const handleApprove = async (apt: PendingAppointment) => {
    setProcessingId(apt.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', apt.id);

      if (error) throw error;

      if (apt.patient_phone && whatsappReady) {
        const date = new Date(apt.scheduled_at);
        const result = await sendConfirmation({
          patientName: apt.patient_name,
          patientPhone: apt.patient_phone,
          patientId: apt.patient_id,
          providerName: apt.provider_name,
          appointmentType: formatType(apt.type),
          appointmentDate: date.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', { timeZone: 'UTC' }),
          appointmentTime: date.toLocaleTimeString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
          appointmentId: apt.id,
        });
        if (!result.success) {
          window.alert(`${t('dashboard.confirmWhatsappFail')} ${result.error || t('dashboard.unknownError')}`);
        }
      }

      loadStats();
      loadPendingAppointments();
      loadTodayAppointments();
    } catch (error) {
      console.error('Error approving appointment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (apt: PendingAppointment) => {
    const reason = window.prompt(
      t('dashboard.rejectionPrompt'),
      t('dashboard.rejectionDefault')
    );
    if (reason === null) return; // Cancelou o prompt

    setProcessingId(apt.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancellation_reason: reason || t('dashboard.rejectionDefault'),
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', apt.id);

      if (error) throw error;

      if (apt.patient_phone && whatsappReady) {
        const result = await sendRejection({
          patientName: apt.patient_name,
          patientPhone: apt.patient_phone,
          patientId: apt.patient_id,
          providerName: apt.provider_name,
          appointmentType: formatType(apt.type),
          appointmentDate: '',
          appointmentTime: '',
          appointmentId: apt.id,
          reason: reason || t('dashboard.rejectionDefault'),
        });
        if (!result.success) {
          window.alert(`${t('dashboard.rejectWhatsappFail')} ${result.error || t('dashboard.unknownError')}`);
        }
      }

      loadStats();
      loadPendingAppointments();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  const formatType = (type: string) => getTreatmentLabel(type, i18n.language as 'pt' | 'en');

  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      pending: t('status.pending'),
      confirmed: t('status.confirmedMasc'),
      checked_in: t('status.checkedIn'),
      in_progress: t('status.inProgress'),
      completed: t('status.completedMasc'),
      cancelled: t('status.cancelledMasc'),
      no_show: t('status.noShow'),
    };
    return statuses[status] || status;
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '';
    const cleaned = phone.replace('@s.whatsapp.net', '').replace('@c.us', '');
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      const ddd = cleaned.slice(2, 4);
      const rest = cleaned.slice(4);
      if (rest.length === 9) {
        return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
      }
      return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
    return `+${cleaned}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // Custom tooltip component for Recharts
  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <CustomTooltip>
          <div className="label">{label}</div>
          <div className="value">{payload[0].value}</div>
        </CustomTooltip>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <PageWrapper>
        <Header>
          <h1>{isProvider ? t('dashboard.myPanel') : t('dashboard.title')}</h1>
          <p>{isProvider ? t('dashboard.subtitleProvider') : t('dashboard.subtitle')}</p>
        </Header>

        {isAdmin && (
          <SetupChecklist
            whatsappConnected={whatsappConnected}
            totalProviders={stats.totalProviders}
          />
        )}

        <StatsGrid>
          <StatCard $delay={0} $accentColor={luxuryColors.primary}>
            <StatCardContent>
              <StatInfo>
                <StatLabel>{isProvider ? t('dashboard.myPatients') : t('dashboard.patients')}</StatLabel>
                <StatValue>{stats.totalPatients}</StatValue>
                <StatTrend $positive>
                  <TrendingUp />
                  <span>{isProvider ? t('dashboard.trendAttended') : t('dashboard.trendActive')}</span>
                </StatTrend>
              </StatInfo>
              <StatIcon $color={luxuryColors.primary}>
                <Users />
              </StatIcon>
            </StatCardContent>
          </StatCard>

          <StatCard $delay={100} $accentColor={luxuryColors.primaryLight}>
            <StatCardContent>
              <StatInfo>
                <StatLabel>{isProvider ? t('dashboard.totalAppointments') : t('dashboard.providers')}</StatLabel>
                <StatValue>{stats.totalProviders}</StatValue>
                <StatTrend $positive>
                  <Activity />
                  <span>{isProvider ? t('dashboard.trendCompleted') : t('dashboard.trendAvailable')}</span>
                </StatTrend>
              </StatInfo>
              <StatIcon $color={luxuryColors.primaryLight}>
                {isProvider ? <Calendar /> : <Stethoscope />}
              </StatIcon>
            </StatCardContent>
          </StatCard>

          <StatCard $delay={200} $accentColor={luxuryColors.warning}>
            <StatCardContent>
              <StatInfo>
                <StatLabel>{t('dashboard.pendingCount')}</StatLabel>
                <StatValue>{stats.pendingAppointments}</StatValue>
                <StatTrend>
                  <Clock />
                  <span>{t('dashboard.trendPending')}</span>
                </StatTrend>
              </StatInfo>
              <StatIcon $color={luxuryColors.warning}>
                <Clock />
              </StatIcon>
            </StatCardContent>
          </StatCard>

          <StatCard $delay={300} $accentColor={luxuryColors.gold}>
            <StatCardContent>
              <StatInfo>
                <StatLabel>{t('dashboard.todayCount')}</StatLabel>
                <StatValue>{stats.todayAppointments}</StatValue>
                <StatTrend $positive>
                  <Sparkles />
                  <span>{t('dashboard.trendScheduled')}</span>
                </StatTrend>
              </StatInfo>
              <StatIcon $color={luxuryColors.gold}>
                <Calendar />
              </StatIcon>
            </StatCardContent>
          </StatCard>
        </StatsGrid>

        {/* Charts Section */}
        <ChartsGrid>
          <ChartCard $delay={350}>
            <ChartHeader>
              <ChartTitle>
                <BarChart3 />
                {t('dashboard.chartWeekly')}
              </ChartTitle>
            </ChartHeader>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={luxuryColors.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={luxuryColors.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: luxuryColors.textMuted, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: luxuryColors.textMuted, fontSize: 12 }}
                />
                <Tooltip content={renderTooltip} />
                <Area
                  type="monotone"
                  dataKey="consultas"
                  stroke={luxuryColors.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorConsultas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard $delay={400}>
            <ChartHeader>
              <ChartTitle>
                <PieChart />
                {t('dashboard.chartTypes')}
              </ChartTitle>
            </ChartHeader>
            {typeDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <RechartsPieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <ChartLegend>
                  {typeDistribution.map((item, index) => (
                    <LegendItem key={item.name}>
                      <div className="dot" style={{ background: chartColors[index % chartColors.length] }} />
                      <span>{item.name} ({item.value})</span>
                    </LegendItem>
                  ))}
                </ChartLegend>
              </>
            ) : (
              <EmptyState>
                <PieChart />
                <p>{t('dashboard.chartNoData')}</p>
              </EmptyState>
            )}
          </ChartCard>
        </ChartsGrid>

        {/* Today's Schedule + Pending */}
        <SectionGrid>
          <Card $delay={450}>
            <CardHeader>
              <SectionTitle>
                <Clock />
                {t('dashboard.pendingAppointments')}
              </SectionTitle>
              {pendingAppointments.length > 0 && (
                <CardBadge>{pendingAppointments.length}</CardBadge>
              )}
            </CardHeader>

            {pendingAppointments.length > 0 ? (
              <PendingList>
                {pendingAppointments.map(apt => (
                  <PendingItem key={apt.id} onClick={() => navigateTo(`/admin/patients/${apt.patient_id}`)}>
                    <PendingAvatar>
                      {getInitials(apt.patient_name)}
                    </PendingAvatar>
                    <PendingInfo>
                      <div className="name">
                        {apt.patient_name}
                        {apt.patient_is_test && <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366F1', background: '#6366F115', border: '1px dashed #6366F140', padding: '1px 5px', borderRadius: '6px', marginLeft: '6px', letterSpacing: '0.5px' }}>TEST</span>}
                      </div>
                      <div className="details">
                        <span className="tag">{formatType(apt.type)}</span>
                        <span>{apt.provider_name}</span>
                        <span>•</span>
                        <span>{formatDate(apt.scheduled_at)}</span>
                      </div>
                    </PendingInfo>
                    <PendingActions>
                      <ActionButton
                        $variant="approve"
                        onClick={(e) => { e.stopPropagation(); handleApprove(apt); }}
                        title={t('dashboard.approve')}
                        disabled={processingId === apt.id}
                      >
                        {processingId === apt.id ? <Loader2 className="spin" /> : <CheckCircle />}
                      </ActionButton>
                      <ActionButton
                        $variant="reject"
                        onClick={(e) => { e.stopPropagation(); handleReject(apt); }}
                        title={t('dashboard.reject')}
                        disabled={processingId === apt.id}
                      >
                        <XCircle />
                      </ActionButton>
                    </PendingActions>
                  </PendingItem>
                ))}
              </PendingList>
            ) : (
              <EmptyState>
                <CheckCircle />
                <p>{t('dashboard.noPending')}<br />{t('dashboard.allProcessed')}</p>
              </EmptyState>
            )}
          </Card>

          <Card $delay={500}>
            <CardHeader>
              <SectionTitle>
                <CalendarCheck />
                {t('dashboard.todaySchedule')}
              </SectionTitle>
              {todayAppointments.length > 0 && (
                <CardBadge>{todayAppointments.length}</CardBadge>
              )}
            </CardHeader>

            {todayAppointments.length > 0 ? (
              <TodayList>
                {todayAppointments.map(apt => (
                  <TodayItem key={apt.id} onClick={() => navigateTo(`/admin/patients/${apt.patient_id}`)}>
                    <TodayTime>{apt.time}</TodayTime>
                    <TodayInfo>
                      <div className="name">
                        {apt.patient_name}
                        {apt.patient_is_test && <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366F1', background: '#6366F115', border: '1px dashed #6366F140', padding: '1px 5px', borderRadius: '6px', marginLeft: '6px', letterSpacing: '0.5px' }}>TEST</span>}
                      </div>
                      <div className="type">{formatType(apt.type)}</div>
                    </TodayInfo>
                    <TodayStatus $status={apt.status}>
                      {formatStatus(apt.status)}
                    </TodayStatus>
                  </TodayItem>
                ))}
              </TodayList>
            ) : (
              <EmptyState>
                <Calendar />
                <p>{t('dashboard.noToday')}</p>
              </EmptyState>
            )}
          </Card>
        </SectionGrid>

        {/* WhatsApp Status - Compact (Admin only) */}
        {isAdmin && (
        <div style={{ marginTop: '24px' }}>
          <WhatsAppCard $delay={550}>
            <CardHeader>
              <SectionTitle>
                <MessageCircle />
                WhatsApp
              </SectionTitle>
              <WhatsAppStatus $connected={whatsappConnected}>
                <div className="dot" />
                <span>{whatsappConnected ? t('status.connected') : t('status.disconnected')}</span>
              </WhatsAppStatus>
            </CardHeader>

            {whatsappConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <PhoneDisplay style={{ flex: 1, margin: 0 }}>
                  <div className="icon-wrapper">
                    <Phone />
                  </div>
                  <div className="info">
                    <div className="label">{t('dashboard.whatsappPhone')}</div>
                    <div className="number">{whatsappPhone ? formatPhone(whatsappPhone) : t('common.loading')}</div>
                  </div>
                </PhoneDisplay>
                <QuickActionButton onClick={() => window.location.href = '/admin/whatsapp'}>
                  <MessageCircle />
                  {t('dashboard.whatsappManage')}
                </QuickActionButton>
              </div>
            ) : (
              <EmptyState style={{ padding: '20px' }}>
                <MessageCircle />
                <p>{t('dashboard.whatsappSetup')}</p>
              </EmptyState>
            )}
          </WhatsAppCard>
        </div>
        )}
      </PageWrapper>
    </AdminLayout>
  );
};

export default AdminDashboard;
