import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  User,
  Stethoscope,
  CalendarDays,
  AlertCircle,
  CheckCheck,
  XOctagon,
  UserX,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { useWhatsAppNotifications } from '../../hooks/admin/useWhatsAppNotifications';

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

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ============================================
// LUXURY COLOR PALETTE
// ============================================
const luxuryColors = {
  primary: '#92563E',
  primaryLight: '#B8956E',
  primaryDark: '#6B3D2A',
  gold: '#D4AF37',
  goldMuted: '#C9A962',
  cream: '#FDF8F3',
  warmWhite: '#FEFCFA',
  beige: '#F5EDE4',
  beigeLight: '#FAF6F1',
  textDark: '#3D2E24',
  textMuted: '#8B7355',
  success: '#6B8E6B',
  successLight: '#E8F0E8',
  warning: '#C9923E',
  warningLight: '#FEF3E2',
  danger: '#B85C5C',
  dangerLight: '#FBEAEA',
  info: '#5B7B9A',
  infoLight: '#EBF2F7',
};

// Status colors mapping
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: luxuryColors.warningLight, text: luxuryColors.warning, border: `${luxuryColors.warning}40` },
  confirmed: { bg: luxuryColors.successLight, text: luxuryColors.success, border: `${luxuryColors.success}40` },
  checked_in: { bg: luxuryColors.infoLight, text: luxuryColors.info, border: `${luxuryColors.info}40` },
  in_progress: { bg: `${luxuryColors.primary}15`, text: luxuryColors.primary, border: `${luxuryColors.primary}40` },
  completed: { bg: `${luxuryColors.gold}15`, text: luxuryColors.goldMuted, border: `${luxuryColors.gold}40` },
  cancelled: { bg: luxuryColors.dangerLight, text: luxuryColors.danger, border: `${luxuryColors.danger}40` },
  no_show: { bg: luxuryColors.beige, text: luxuryColors.textMuted, border: `${luxuryColors.textMuted}40` },
};

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
    font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
    font-size: 36px;
    font-weight: 600;
    color: ${luxuryColors.textDark};
    margin: 0 0 6px;
    letter-spacing: -0.5px;
  }

  p {
    color: ${luxuryColors.textMuted};
    margin: 0;
    font-size: 15px;
    font-weight: 400;
  }
`;

const StatsBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.5s ease-out 0.1s both;
`;

const StatPill = styled.div<{ $active?: boolean; $color?: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${props => props.$active ? luxuryColors.primary : luxuryColors.warmWhite};
  color: ${props => props.$active ? 'white' : luxuryColors.textDark};
  border-radius: 25px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.$active ? luxuryColors.primary : 'rgba(146, 86, 62, 0.1)'};
  box-shadow: ${props => props.$active ? `0 4px 12px ${luxuryColors.primary}30` : 'none'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(146, 86, 62, 0.15);
    border-color: ${luxuryColors.primary};
  }

  .count {
    background: ${props => props.$active ? 'rgba(255,255,255,0.25)' : props.$color || luxuryColors.beige};
    color: ${props => props.$active ? 'white' : props.$color ? luxuryColors.textDark : luxuryColors.textMuted};
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.5s ease-out 0.2s both;
`;

const SearchBox = styled.div`
  flex: 1;
  min-width: 280px;
  position: relative;

  svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: ${luxuryColors.textMuted};
    transition: color 0.2s ease;
  }

  input {
    width: 100%;
    padding: 14px 16px 14px 48px;
    border: 1px solid rgba(146, 86, 62, 0.12);
    border-radius: 14px;
    font-size: 14px;
    background: ${luxuryColors.warmWhite};
    color: ${luxuryColors.textDark};
    transition: all 0.3s ease;

    &::placeholder {
      color: ${luxuryColors.textMuted};
    }

    &:focus {
      outline: none;
      border-color: ${luxuryColors.primary};
      box-shadow: 0 0 0 3px ${luxuryColors.primary}15;
    }

    &:focus + svg {
      color: ${luxuryColors.primary};
    }
  }
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: ${props => props.$active ? luxuryColors.primary : luxuryColors.warmWhite};
  color: ${props => props.$active ? 'white' : luxuryColors.textDark};
  border: 1px solid ${props => props.$active ? luxuryColors.primary : 'rgba(146, 86, 62, 0.12)'};
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    border-color: ${luxuryColors.primary};
    background: ${props => props.$active ? luxuryColors.primaryDark : luxuryColors.beigeLight};
  }
`;

const AppointmentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AppointmentCard = styled.div<{ $delay?: number }>`
  background: ${luxuryColors.warmWhite};
  border-radius: 18px;
  padding: 24px;
  border: 1px solid rgba(146, 86, 62, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${fadeInUp} 0.5s ease-out;
  animation-delay: ${props => (props.$delay || 0) * 50}ms;
  animation-fill-mode: both;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, ${luxuryColors.primary}, ${luxuryColors.primaryLight});
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(146, 86, 62, 0.1);
    border-color: rgba(146, 86, 62, 0.12);

    &::before {
      opacity: 1;
    }
  }
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const PatientAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, ${luxuryColors.primary}, ${luxuryColors.primaryLight});
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px ${luxuryColors.primary}30;
`;

const PatientInfo = styled.div`
  flex: 1;
  min-width: 0;

  .name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20px;
    font-weight: 600;
    color: ${luxuryColors.textDark};
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .details {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 14px;
    color: ${luxuryColors.textMuted};
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 6px;

    svg {
      width: 16px;
      height: 16px;
      color: ${luxuryColors.primaryLight};
    }
  }
`;

const TypeTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: ${luxuryColors.primary}12;
  color: ${luxuryColors.primary};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${props => statusColors[props.$status]?.bg || luxuryColors.beige};
  color: ${props => statusColors[props.$status]?.text || luxuryColors.textMuted};
  border: 1px solid ${props => statusColors[props.$status]?.border || 'transparent'};
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 10px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${luxuryColors.beige};
  }
`;

const ActionButton = styled.button<{ $variant?: 'approve' | 'reject' | 'view' | 'default' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  ${props => {
    switch (props.$variant) {
      case 'approve':
        return css`
          background: ${luxuryColors.successLight};
          color: ${luxuryColors.success};
          &:hover:not(:disabled) {
            background: ${luxuryColors.success};
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px ${luxuryColors.success}40;
          }
        `;
      case 'reject':
        return css`
          background: ${luxuryColors.dangerLight};
          color: ${luxuryColors.danger};
          &:hover:not(:disabled) {
            background: ${luxuryColors.danger};
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px ${luxuryColors.danger}40;
          }
        `;
      case 'view':
        return css`
          background: ${luxuryColors.beigeLight};
          color: ${luxuryColors.textDark};
          &:hover {
            background: ${luxuryColors.beige};
            transform: translateY(-2px);
          }
        `;
      default:
        return css`
          background: ${luxuryColors.primary}10;
          color: ${luxuryColors.primary};
          &:hover {
            background: ${luxuryColors.primary};
            color: white;
            transform: translateY(-2px);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
  animation: ${fadeIn} 0.5s ease-out 0.4s both;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid ${props => props.$active ? luxuryColors.primary : 'rgba(146, 86, 62, 0.12)'};
  background: ${props => props.$active ? luxuryColors.primary : luxuryColors.warmWhite};
  color: ${props => props.$active ? 'white' : luxuryColors.textDark};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled) {
    border-color: ${luxuryColors.primary};
    background: ${props => props.$active ? luxuryColors.primaryDark : luxuryColors.beigeLight};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 40px;
  background: ${luxuryColors.warmWhite};
  border-radius: 20px;
  border: 1px dashed rgba(146, 86, 62, 0.2);
  animation: ${fadeInUp} 0.5s ease-out;

  svg {
    width: 64px;
    height: 64px;
    color: ${luxuryColors.primaryLight};
    margin-bottom: 20px;
    opacity: 0.6;
  }

  h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 24px;
    font-weight: 600;
    color: ${luxuryColors.textDark};
    margin: 0 0 8px;
  }

  p {
    color: ${luxuryColors.textMuted};
    font-size: 15px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SkeletonCard = styled.div`
  background: ${luxuryColors.warmWhite};
  border-radius: 18px;
  padding: 24px;
  border: 1px solid rgba(146, 86, 62, 0.06);

  .skeleton-content {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .skeleton-avatar {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(90deg, ${luxuryColors.beige} 25%, ${luxuryColors.beigeLight} 50%, ${luxuryColors.beige} 75%);
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }

  .skeleton-text {
    flex: 1;

    .line {
      height: 14px;
      background: linear-gradient(90deg, ${luxuryColors.beige} 25%, ${luxuryColors.beigeLight} 50%, ${luxuryColors.beige} 75%);
      background-size: 200% 100%;
      animation: ${shimmer} 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 10px;

      &:first-child {
        width: 40%;
        height: 20px;
      }

      &:last-child {
        width: 60%;
        margin-bottom: 0;
      }
    }
  }
`;

// ============================================
// INTERFACES
// ============================================
interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  scheduled_at: string;
  type: string;
  status: string;
  notes: string | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  provider: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

interface StatusCount {
  status: string;
  count: number;
}

// ============================================
// COMPONENT
// ============================================
const AdminAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { sendConfirmation, sendRejection, isConnected: whatsappReady } = useWhatsAppNotifications();

  useEffect(() => {
    loadAppointments();
    loadStatusCounts();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          provider_id,
          scheduled_at,
          type,
          status,
          notes,
          patient:profiles!appointments_patient_id_fkey(id, first_name, last_name, phone),
          provider:providers!appointments_provider_id_fkey(
            profile:profiles(first_name, last_name)
          )
        `)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase response - relations come as arrays
      const transformed = (data || []).map((apt: any) => ({
        ...apt,
        patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
        provider: Array.isArray(apt.provider)
          ? {
              profile: Array.isArray(apt.provider[0]?.profile)
                ? apt.provider[0].profile[0]
                : apt.provider[0]?.profile
            }
          : apt.provider,
      }));

      setAppointments(transformed);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('status');

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((apt: { status: string }) => {
        counts[apt.status] = (counts[apt.status] || 0) + 1;
      });

      const statusList = Object.entries(counts).map(([status, count]) => ({ status, count }));
      setStatusCounts(statusList);
    } catch (error) {
      console.error('Error loading status counts:', error);
    }
  };

  const handleApprove = async (apt: Appointment) => {
    setProcessingId(apt.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', apt.id);

      if (error) throw error;

      if (apt.patient?.phone && whatsappReady) {
        const date = new Date(apt.scheduled_at);
        await sendConfirmation({
          patientName: `${apt.patient.first_name} ${apt.patient.last_name}`,
          patientPhone: apt.patient.phone,
          patientId: apt.patient_id,
          providerName: apt.provider?.profile ? `Dr(a). ${apt.provider.profile.first_name}` : 'N/A',
          appointmentType: formatType(apt.type),
          appointmentDate: date.toLocaleDateString('pt-BR'),
          appointmentTime: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          appointmentId: apt.id,
        });
      }

      loadAppointments();
      loadStatusCounts();
    } catch (error) {
      console.error('Error approving appointment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (apt: Appointment) => {
    setProcessingId(apt.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', rejection_reason: 'Horário não disponível' })
        .eq('id', apt.id);

      if (error) throw error;

      if (apt.patient?.phone && whatsappReady) {
        await sendRejection({
          patientName: `${apt.patient.first_name} ${apt.patient.last_name}`,
          patientPhone: apt.patient.phone,
          patientId: apt.patient_id,
          providerName: apt.provider?.profile ? `Dr(a). ${apt.provider.profile.first_name}` : 'N/A',
          appointmentType: formatType(apt.type),
          appointmentDate: '',
          appointmentTime: '',
          appointmentId: apt.id,
          reason: 'Horário não disponível',
        });
      }

      loadAppointments();
      loadStatusCounts();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatType = (type: string) => {
    const types: Record<string, string> = {
      initial_consultation: 'Consulta Inicial',
      follow_up: 'Retorno',
      hormone_check: 'Avaliação Hormonal',
      lab_review: 'Revisão de Exames',
      nutrition: 'Nutrição',
      health_coaching: 'Health Coaching',
      therapy: 'Terapia',
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
      case 'pending': return <AlertCircle />;
      case 'confirmed': return <CheckCircle />;
      case 'checked_in': return <User />;
      case 'in_progress': return <Stethoscope />;
      case 'completed': return <CheckCheck />;
      case 'cancelled': return <XOctagon />;
      case 'no_show': return <UserX />;
      default: return <Calendar />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusCount = (status: string) => {
    const found = statusCounts.find(s => s.status === status);
    return found?.count || 0;
  };

  const totalCount = statusCounts.reduce((acc, s) => acc + s.count, 0);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    let result = appointments;

    if (statusFilter !== 'all') {
      result = result.filter(apt => apt.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(apt =>
        `${apt.patient?.first_name} ${apt.patient?.last_name}`.toLowerCase().includes(query) ||
        apt.provider?.profile?.first_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [appointments, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const statusTabs = [
    { key: 'all', label: 'Todas', count: totalCount },
    { key: 'pending', label: 'Pendentes', count: getStatusCount('pending') },
    { key: 'confirmed', label: 'Confirmadas', count: getStatusCount('confirmed') },
    { key: 'in_progress', label: 'Em Andamento', count: getStatusCount('in_progress') },
    { key: 'completed', label: 'Concluídas', count: getStatusCount('completed') },
    { key: 'cancelled', label: 'Canceladas', count: getStatusCount('cancelled') },
  ];

  return (
    <AdminLayout>
      <PageWrapper>
        <Header>
          <h1>Consultas</h1>
          <p>Gerencie todas as consultas da clínica</p>
        </Header>

        <StatsBar>
          {statusTabs.map(tab => (
            <StatPill
              key={tab.key}
              $active={statusFilter === tab.key}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
              <span className="count">{tab.count}</span>
            </StatPill>
          ))}
        </StatsBar>

        <ControlsBar>
          <SearchBox>
            <input
              type="text"
              placeholder="Buscar por nome do paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search />
          </SearchBox>
        </ControlsBar>

        {loading ? (
          <LoadingState>
            {[1, 2, 3, 4, 5].map(i => (
              <SkeletonCard key={i}>
                <div className="skeleton-content">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-text">
                    <div className="line" />
                    <div className="line" />
                  </div>
                </div>
              </SkeletonCard>
            ))}
          </LoadingState>
        ) : paginatedAppointments.length === 0 ? (
          <EmptyState>
            <CalendarDays />
            <h3>Nenhuma consulta encontrada</h3>
            <p>
              {searchQuery
                ? 'Tente ajustar sua busca'
                : statusFilter !== 'all'
                  ? `Não há consultas ${formatStatus(statusFilter).toLowerCase()}`
                  : 'Ainda não há consultas cadastradas'}
            </p>
          </EmptyState>
        ) : (
          <>
            <AppointmentsList>
              {paginatedAppointments.map((apt, index) => (
                <AppointmentCard key={apt.id} $delay={index}>
                  <CardContent>
                    <PatientAvatar>
                      {getInitials(apt.patient?.first_name, apt.patient?.last_name)}
                    </PatientAvatar>

                    <PatientInfo>
                      <div className="name">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                        <TypeTag>{formatType(apt.type)}</TypeTag>
                      </div>
                      <div className="details">
                        <div className="detail-item">
                          <Stethoscope />
                          <span>
                            {apt.provider?.profile
                              ? `Dr(a). ${apt.provider.profile.first_name} ${apt.provider.profile.last_name}`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <Calendar />
                          <span>{formatDate(apt.scheduled_at)}</span>
                        </div>
                        <div className="detail-item">
                          <Clock />
                          <span>{formatTime(apt.scheduled_at)}</span>
                        </div>
                      </div>
                    </PatientInfo>

                    <StatusBadge $status={apt.status}>
                      {getStatusIcon(apt.status)}
                      {formatStatus(apt.status)}
                    </StatusBadge>

                    <CardActions>
                      {apt.status === 'pending' && (
                        <>
                          <ActionButton
                            $variant="approve"
                            onClick={() => handleApprove(apt)}
                            disabled={processingId === apt.id}
                            title="Aprovar consulta"
                          >
                            {processingId === apt.id ? (
                              <Loader2 className="spin" />
                            ) : (
                              <CheckCircle />
                            )}
                            Aprovar
                          </ActionButton>
                          <ActionButton
                            $variant="reject"
                            onClick={() => handleReject(apt)}
                            disabled={processingId === apt.id}
                            title="Rejeitar consulta"
                          >
                            <XCircle />
                            Rejeitar
                          </ActionButton>
                        </>
                      )}
                      <ActionButton
                        $variant="view"
                        onClick={() => navigate(`/admin/patients/${apt.patient_id}`)}
                        title="Ver perfil do paciente"
                      >
                        <Eye />
                        Perfil
                      </ActionButton>
                    </CardActions>
                  </CardContent>
                </AppointmentCard>
              ))}
            </AppointmentsList>

            {totalPages > 1 && (
              <Pagination>
                <PageButton
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft />
                </PageButton>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PageButton
                      key={pageNum}
                      $active={currentPage === pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </PageButton>
                  );
                })}

                <PageButton
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight />
                </PageButton>
              </Pagination>
            )}
          </>
        )}
      </PageWrapper>
    </AdminLayout>
  );
};

export default AdminAppointmentsPage;
