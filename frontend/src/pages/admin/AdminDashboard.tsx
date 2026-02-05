import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Users,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  Loader2,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { useWhatsAppNotifications } from '../../hooks/admin/useWhatsAppNotifications';

const Header = styled.div`
  margin-bottom: ${theme.spacing.xl};

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0 0 ${theme.spacing.xs};
  }

  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled.div<{ $color?: string }>`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.lg};
  background: ${props => props.$color}15;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
  }
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${theme.colors.text};
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin-top: 4px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0 0 ${theme.spacing.md};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
`;

const WhatsAppStatus = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  background: ${props => props.$connected ? '#10B98115' : '#EF444415'};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing.md};

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${props => props.$connected ? '#10B981' : '#EF4444'};
  }

  span {
    font-size: 14px;
    color: ${props => props.$connected ? '#10B981' : '#EF4444'};
    font-weight: 500;
  }
`;

const PendingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const PendingItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
`;

const PendingInfo = styled.div`
  flex: 1;

  .name {
    font-weight: 500;
    color: ${theme.colors.text};
    font-size: 14px;
  }

  .details {
    font-size: 13px;
    color: ${theme.colors.textSecondary};
    margin-top: 2px;
  }
`;

const PendingActions = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
`;

const ActionButton = styled.button<{ $variant: 'approve' | 'reject' }>`
  width: 36px;
  height: 36px;
  border-radius: ${theme.borderRadius.md};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  ${props => props.$variant === 'approve' && `
    background: #10B98115;
    color: #10B981;
    &:hover:not(:disabled) { background: #10B98125; }
  `}

  ${props => props.$variant === 'reject' && `
    background: #EF444415;
    color: #EF4444;
    &:hover:not(:disabled) { background: #EF444425; }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
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
  padding: ${theme.spacing.xl};
  color: ${theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${theme.spacing.md};
    opacity: 0.3;
  }
`;

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
  provider_name: string;
  scheduled_at: string;
  type: string;
}

const EVOLUTION_API_URL = process.env.REACT_APP_EVOLUTION_API_URL || 'http://localhost:8082';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY || 'sua_chave_evolution_aqui';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalProviders: 0,
    pendingAppointments: 0,
    todayAppointments: 0,
  });
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Hook de notificações WhatsApp
  const { sendConfirmation, sendRejection, isConnected: whatsappReady } = useWhatsAppNotifications();

  // Verificar status do WhatsApp
  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      if (response.ok) {
        const instances = await response.json();
        // Verificar se há alguma instância conectada
        const connectedInstance = instances.find((inst: any) =>
          inst.connectionStatus === 'open' || inst.state === 'open'
        );

        if (connectedInstance) {
          setWhatsappConnected(true);
          // Buscar detalhes da instância conectada
          const detailResponse = await fetch(
            `${EVOLUTION_API_URL}/instance/connectionState/${connectedInstance.name || connectedInstance.instanceName}`,
            { headers: { 'apikey': EVOLUTION_API_KEY } }
          );
          if (detailResponse.ok) {
            const detail = await detailResponse.json();
            if (detail.instance?.user?.id) {
              setWhatsappPhone(detail.instance.user.id);
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
    checkWhatsAppStatus();

    // Polling para atualizar status do WhatsApp a cada 10 segundos
    const interval = setInterval(checkWhatsAppStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // Contar pacientes
      const { count: patientsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'patient');

      // Contar providers
      const { count: providersCount } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Contar consultas pendentes
      const { count: pendingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Contar consultas hoje
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
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPendingAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          scheduled_at,
          type,
          patient:profiles!appointments_patient_id_fkey(id, first_name, last_name, phone),
          provider:providers!appointments_provider_id_fkey(
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (error) throw error;

      const formatted = (data || []).map((apt: any) => ({
        id: apt.id,
        patient_id: apt.patient_id,
        patient_name: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'N/A',
        patient_phone: apt.patient?.phone || null,
        provider_name: apt.provider?.profile ? `Dr(a). ${apt.provider.profile.first_name}` : 'N/A',
        scheduled_at: apt.scheduled_at,
        type: apt.type,
      }));

      setPendingAppointments(formatted);
    } catch (error) {
      console.error('Error loading pending appointments:', error);
    }
  };

  const handleApprove = async (apt: PendingAppointment) => {
    setProcessingId(apt.id);
    try {
      // Atualizar status no banco
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', apt.id);

      if (error) throw error;

      // Enviar notificação WhatsApp se tiver telefone
      if (apt.patient_phone && whatsappReady) {
        const date = new Date(apt.scheduled_at);
        await sendConfirmation({
          patientName: apt.patient_name,
          patientPhone: apt.patient_phone,
          patientId: apt.patient_id,
          providerName: apt.provider_name,
          appointmentType: formatType(apt.type),
          appointmentDate: date.toLocaleDateString('pt-BR'),
          appointmentTime: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          appointmentId: apt.id,
        });
        console.log('[Dashboard] Notificação de confirmação enviada');
      }

      loadStats();
      loadPendingAppointments();
    } catch (error) {
      console.error('Error approving appointment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (apt: PendingAppointment) => {
    setProcessingId(apt.id);
    try {
      // Atualizar status no banco
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', rejection_reason: 'Horário não disponível' })
        .eq('id', apt.id);

      if (error) throw error;

      // Enviar notificação WhatsApp se tiver telefone
      if (apt.patient_phone && whatsappReady) {
        await sendRejection({
          patientName: apt.patient_name,
          patientPhone: apt.patient_phone,
          patientId: apt.patient_id,
          providerName: apt.provider_name,
          appointmentType: formatType(apt.type),
          appointmentDate: '',
          appointmentTime: '',
          appointmentId: apt.id,
          reason: 'Horário não disponível',
        });
        console.log('[Dashboard] Notificação de rejeição enviada');
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
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatType = (type: string) => {
    const types: Record<string, string> = {
      initial_consultation: 'Consulta Inicial',
      follow_up: 'Retorno',
      hormone_check: 'Avaliação Hormonal',
      lab_review: 'Revisão de Exames',
      nutrition: 'Nutrição',
      health_coaching: 'Health Coaching',
    };
    return types[type] || type;
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

  return (
    <AdminLayout>
      <Header>
        <h1>Dashboard</h1>
        <p>Visão geral do sistema</p>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon $color={theme.colors.primary}>
            <Users />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.totalPatients}</StatValue>
            <StatLabel>Pacientes</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#8B5CF6">
            <Stethoscope />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.totalProviders}</StatValue>
            <StatLabel>Médicos</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#F59E0B">
            <Clock />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.pendingAppointments}</StatValue>
            <StatLabel>Pendentes</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#10B981">
            <Calendar />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.todayAppointments}</StatValue>
            <StatLabel>Hoje</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      <Grid>
        <Card>
          <CardHeader>
            <SectionTitle>Consultas Pendentes</SectionTitle>
          </CardHeader>

          {pendingAppointments.length > 0 ? (
            <PendingList>
              {pendingAppointments.map(apt => (
                <PendingItem key={apt.id}>
                  <PendingInfo>
                    <div className="name">{apt.patient_name}</div>
                    <div className="details">
                      {formatType(apt.type)} • {apt.provider_name} • {formatDate(apt.scheduled_at)}
                    </div>
                  </PendingInfo>
                  <PendingActions>
                    <ActionButton
                      $variant="approve"
                      onClick={() => handleApprove(apt)}
                      title="Aprovar"
                      disabled={processingId === apt.id}
                    >
                      {processingId === apt.id ? <Loader2 className="spin" /> : <CheckCircle />}
                    </ActionButton>
                    <ActionButton
                      $variant="reject"
                      onClick={() => handleReject(apt)}
                      title="Rejeitar"
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
              <p>Nenhuma consulta pendente</p>
            </EmptyState>
          )}
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle>WhatsApp</SectionTitle>
          </CardHeader>

          <WhatsAppStatus $connected={whatsappConnected}>
            <div className="dot" />
            <span>{whatsappConnected ? 'Conectado' : 'Desconectado'}</span>
          </WhatsAppStatus>

          {whatsappConnected && whatsappPhone ? (
            <EmptyState>
              <MessageCircle />
              <p>Número: {formatPhone(whatsappPhone)}</p>
            </EmptyState>
          ) : (
            <EmptyState>
              <MessageCircle />
              <p>Configure uma instância em<br />Configurações → WhatsApp</p>
            </EmptyState>
          )}
        </Card>
      </Grid>
    </AdminLayout>
  );
};

export default AdminDashboard;
