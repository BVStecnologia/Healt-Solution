import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Headphones,
  RefreshCw,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  User,
  MessageCircle,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabaseAdmin } from '../../lib/adminService';

// ============================================
// TYPES
// ============================================
interface HandoffSession {
  id: string;
  patient_phone: string;
  patient_id: string | null;
  patient_name: string | null;
  attendant_id: string | null;
  reason: string | null;
  status: string;
  instance_name: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  last_message_at: string;
}

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// ============================================
// THEME
// ============================================
const luxuryTheme = {
  primary: '#92563E',
  primaryLight: '#B8956E',
  primaryDark: '#7A4832',
  success: '#6B8E6B',
  error: '#C4836A',
  warning: '#B48F7A',
  cream: theme.colors.background,
  surface: theme.colors.surface,
  border: theme.colors.border,
  text: theme.colors.text,
  textSecondary: theme.colors.textSecondary,
};

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
    margin: 0 0 8px;
    letter-spacing: 0.5px;
  }

  p {
    color: ${luxuryTheme.textSecondary};
    margin: 0;
    font-size: 15px;
  }
`;

const RefreshButton = styled.button<{ $loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${luxuryTheme.surface};
  color: ${luxuryTheme.text};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.$loading ? 'wait' : 'pointer'};
  opacity: ${props => props.$loading ? 0.7 : 1};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${luxuryTheme.primaryLight};
    background: ${luxuryTheme.cream};
  }

  svg {
    ${props => props.$loading && css`animation: ${spin} 1s linear infinite;`}
  }
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.5s ease-out;
`;

const StatPill = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: ${luxuryTheme.surface};
  border: 1px solid rgba(146, 86, 62, 0.08);
  border-radius: 40px;

  svg {
    width: 16px;
    height: 16px;
    color: ${luxuryTheme.primary};
    opacity: 0.6;
  }
`;

const StatValue = styled.span`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 20px;
  font-weight: 600;
  color: ${luxuryTheme.text};
`;

const StatLabel = styled.span`
  font-size: 13px;
  color: ${luxuryTheme.textSecondary};
  font-weight: 400;
`;

const FiltersSection = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 100ms;
  animation-fill-mode: both;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: ${props => props.$active ? `${luxuryTheme.primary}15` : luxuryTheme.surface};
  color: ${props => props.$active ? luxuryTheme.primary : luxuryTheme.textSecondary};
  border: 1px solid ${props => props.$active ? `${luxuryTheme.primary}30` : luxuryTheme.border};
  border-radius: 10px;
  font-size: 13px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${luxuryTheme.primary};
    color: ${luxuryTheme.primary};
  }
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 200ms;
  animation-fill-mode: both;
`;

const SessionCard = styled.div<{ $status: string }>`
  background: ${luxuryTheme.surface};
  border: 1px solid ${props =>
    props.$status === 'waiting' ? `${luxuryTheme.warning}40` :
    props.$status === 'active' ? `${luxuryTheme.primary}30` :
    'rgba(146, 86, 62, 0.08)'
  };
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(146, 86, 62, 0.08);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SessionAvatar = styled.div<{ $status: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props =>
    props.$status === 'waiting' ? `${luxuryTheme.warning}20` :
    props.$status === 'active' ? `${luxuryTheme.primary}15` :
    `${luxuryTheme.textSecondary}15`
  };
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 22px;
    height: 22px;
    color: ${props =>
      props.$status === 'waiting' ? luxuryTheme.warning :
      props.$status === 'active' ? luxuryTheme.primary :
      luxuryTheme.textSecondary
    };
    ${props => props.$status === 'waiting' && css`animation: ${pulse} 2s ease-in-out infinite;`}
  }
`;

const SessionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SessionName = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: ${luxuryTheme.text};
  margin-bottom: 4px;
`;

const SessionMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: ${luxuryTheme.textSecondary};

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props =>
    props.$status === 'waiting' ? `${luxuryTheme.warning}15` :
    props.$status === 'active' ? `${luxuryTheme.primary}15` :
    `${luxuryTheme.success}15`
  };
  color: ${props =>
    props.$status === 'waiting' ? luxuryTheme.warning :
    props.$status === 'active' ? luxuryTheme.primary :
    luxuryTheme.success
  };
  flex-shrink: 0;
`;

const ResolvedByBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
  background: ${luxuryTheme.cream};
  color: ${luxuryTheme.textSecondary};
  border: 1px solid ${luxuryTheme.border};
`;

const SessionActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: ${props =>
    props.$variant === 'primary' ? `linear-gradient(135deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryLight})` :
    props.$variant === 'danger' ? `${luxuryTheme.error}15` :
    luxuryTheme.surface
  };
  color: ${props =>
    props.$variant === 'primary' ? 'white' :
    props.$variant === 'danger' ? luxuryTheme.error :
    luxuryTheme.primary
  };
  border: 1px solid ${props =>
    props.$variant === 'primary' ? 'transparent' :
    props.$variant === 'danger' ? `${luxuryTheme.error}30` :
    luxuryTheme.border
  };
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 40px;
  background: ${luxuryTheme.surface};
  border: 1px dashed ${luxuryTheme.border};
  border-radius: 16px;
  animation: ${fadeInUp} 0.6s ease-out;

  svg {
    width: 64px;
    height: 64px;
    color: ${luxuryTheme.primary};
    margin-bottom: 20px;
    animation: ${float} 3s ease-in-out infinite;
  }

  h3 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 24px;
    color: ${luxuryTheme.text};
    margin: 0 0 8px;
  }

  p {
    color: ${luxuryTheme.textSecondary};
    margin: 0;
    line-height: 1.6;
  }
`;

const ElapsedTime = styled.span`
  font-weight: 600;
  color: ${luxuryTheme.primary};
`;

const SpinnerIcon = styled.div`
  display: inline-flex;
  animation: ${spin} 1s linear infinite;

  svg {
    width: 64px;
    height: 64px;
    color: ${luxuryTheme.primary};
  }
`;

// ============================================
// HELPERS
// ============================================
function formatPhone(phone: string): string {
  return phone
    .replace('@s.whatsapp.net', '')
    .replace(/^(\d{1,3})(\d+)$/, '+$1 $2');
}

function formatElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}min`;

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatDate(dateStr: string): string {
  const dt = new Date(dateStr);
  const day = dt.getDate().toString().padStart(2, '0');
  const month = (dt.getMonth() + 1).toString().padStart(2, '0');
  const hours = dt.getHours().toString().padStart(2, '0');
  const minutes = dt.getMinutes().toString().padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}

function getResolvedByLabel(resolvedBy: string | null): string {
  switch (resolvedBy) {
    case 'attendant_keyword': return 'Atendente (#fechar)';
    case 'admin_panel': return 'Admin (painel)';
    case 'auto_timeout': return 'Auto (timeout)';
    case 'patient_return': return 'Paciente (bot)';
    default: return resolvedBy || '-';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'waiting': return 'Aguardando';
    case 'active': return 'Ativo';
    case 'resolved': return 'Encerrado';
    default: return status;
  }
}

// ============================================
// COMPONENT
// ============================================
type FilterType = 'active' | 'resolved' | 'all';

const HandoffSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<HandoffSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('active');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin
        .from('handoff_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'active') {
        query = query.in('status', ['waiting', 'active']);
      } else if (filter === 'resolved') {
        query = query.eq('status', 'resolved');
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching handoff sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-refresh every 30 seconds for active sessions
  useEffect(() => {
    if (filter !== 'resolved') {
      const interval = setInterval(fetchSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [filter, fetchSessions]);

  const handleResolve = async (session: HandoffSession) => {
    setResolvingId(session.id);
    try {
      const { error } = await supabaseAdmin
        .from('handoff_sessions')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: 'admin_panel',
        })
        .eq('id', session.id)
        .in('status', ['waiting', 'active']);

      if (error) throw error;
      await fetchSessions();
    } catch (err) {
      console.error('Error resolving session:', err);
      alert('Erro ao encerrar sessão');
    } finally {
      setResolvingId(null);
    }
  };

  // Stats
  const activeSessions = sessions.filter(s => s.status === 'waiting' || s.status === 'active');
  const waitingSessions = sessions.filter(s => s.status === 'waiting');
  const resolvedSessions = sessions.filter(s => s.status === 'resolved');

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>Handoff</h1>
            <p>Sessões de atendimento humano via WhatsApp</p>
          </div>
          <RefreshButton onClick={fetchSessions} $loading={loading}>
            <RefreshCw size={16} />
            Atualizar
          </RefreshButton>
        </Header>

        <StatsRow>
          <StatPill>
            <Headphones />
            <StatValue>{activeSessions.length}</StatValue>
            <StatLabel>Ativas</StatLabel>
          </StatPill>
          {waitingSessions.length > 0 && (
            <StatPill>
              <Clock />
              <StatValue>{waitingSessions.length}</StatValue>
              <StatLabel>Aguardando</StatLabel>
            </StatPill>
          )}
          <StatPill>
            <CheckCircle />
            <StatValue>{resolvedSessions.length}</StatValue>
            <StatLabel>Encerradas</StatLabel>
          </StatPill>
        </StatsRow>

        <FiltersSection>
          <FilterButton
            $active={filter === 'active'}
            onClick={() => setFilter('active')}
          >
            <Headphones size={14} />
            Ativas
          </FilterButton>
          <FilterButton
            $active={filter === 'resolved'}
            onClick={() => setFilter('resolved')}
          >
            <CheckCircle size={14} />
            Encerradas
          </FilterButton>
          <FilterButton
            $active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            <Filter size={14} />
            Todas
          </FilterButton>
        </FiltersSection>

        {loading ? (
          <EmptyState>
            <SpinnerIcon><RefreshCw /></SpinnerIcon>
            <h3>Carregando...</h3>
          </EmptyState>
        ) : sessions.length === 0 ? (
          <EmptyState>
            <Headphones />
            <h3>
              {filter === 'active' ? 'Nenhuma sessão ativa' :
               filter === 'resolved' ? 'Nenhuma sessão encerrada' :
               'Nenhuma sessão encontrada'}
            </h3>
            <p>
              {filter === 'active'
                ? 'Quando um paciente solicitar atendimento humano pelo WhatsApp, a sessão aparecerá aqui.'
                : 'O histórico de sessões encerradas aparecerá aqui.'}
            </p>
          </EmptyState>
        ) : (
          <SessionsList>
            {sessions.map(session => (
              <SessionCard key={session.id} $status={session.status}>
                <SessionAvatar $status={session.status}>
                  {session.status === 'resolved' ? (
                    <CheckCircle />
                  ) : session.status === 'waiting' ? (
                    <Clock />
                  ) : (
                    <MessageCircle />
                  )}
                </SessionAvatar>

                <SessionInfo>
                  <SessionName>
                    {session.patient_name || 'Paciente desconhecido'}
                  </SessionName>
                  <SessionMeta>
                    <span>
                      <Phone size={14} />
                      {formatPhone(session.patient_phone)}
                    </span>
                    <span>
                      <Clock size={14} />
                      {formatDate(session.created_at)}
                    </span>
                    {session.status !== 'resolved' && (
                      <span>
                        <ElapsedTime>{formatElapsed(session.created_at)}</ElapsedTime>
                      </span>
                    )}
                    {session.reason && (
                      <span>
                        <AlertCircle size={14} />
                        {session.reason}
                      </span>
                    )}
                  </SessionMeta>
                </SessionInfo>

                <StatusBadge $status={session.status}>
                  {getStatusLabel(session.status)}
                </StatusBadge>

                {session.status === 'resolved' && session.resolved_by && (
                  <ResolvedByBadge>
                    {getResolvedByLabel(session.resolved_by)}
                  </ResolvedByBadge>
                )}

                {session.status !== 'resolved' && (
                  <SessionActions>
                    <ActionButton
                      $variant="danger"
                      onClick={() => handleResolve(session)}
                      disabled={resolvingId === session.id}
                    >
                      <XCircle size={16} />
                      {resolvingId === session.id ? 'Encerrando...' : 'Encerrar'}
                    </ActionButton>
                  </SessionActions>
                )}
              </SessionCard>
            ))}
          </SessionsList>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default HandoffSessionsPage;
