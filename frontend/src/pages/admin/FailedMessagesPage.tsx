import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Phone,
  Clock,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { whatsappService } from '../../lib/whatsappService';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};

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

const StatsRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
  flex-wrap: wrap;
`;

const StatCard = styled.div<{ $color: string }>`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.lg};
  min-width: 160px;
  flex: 1;
  border-left: 4px solid ${props => props.$color};
  animation: ${fadeIn} 0.3s ease;

  .value {
    font-size: 32px;
    font-weight: 700;
    color: ${props => props.$color};
  }

  .label {
    font-size: 13px;
    color: ${theme.colors.textSecondary};
    margin-top: 4px;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger'; $loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: ${theme.borderRadius.lg};
  border: none;
  cursor: ${props => props.$loading ? 'wait' : 'pointer'};
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  opacity: ${props => props.$loading ? 0.7 : 1};

  ${props => {
    switch (props.$variant) {
      case 'danger':
        return `background: #dc2626; color: white; &:hover { background: #b91c1c; }`;
      case 'secondary':
        return `background: ${theme.colors.surface}; color: ${theme.colors.text}; border: 1px solid ${theme.colors.border}; &:hover { background: ${theme.colors.background}; }`;
      default:
        return `background: ${theme.colors.primary}; color: white; &:hover { opacity: 0.9; }`;
    }
  }}

  svg {
    ${props => props.$loading ? css`animation: ${spin} 1s linear infinite;` : ''}
  }
`;

const Table = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  overflow: hidden;
  animation: ${fadeIn} 0.3s ease;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 140px 200px 120px 100px 120px;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
  font-weight: 600;
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 900px) {
    display: none;
  }
`;

const TableRow = styled.div<{ $retrying?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 140px 200px 120px 100px 120px;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  align-items: center;
  transition: background 0.2s;
  opacity: ${props => props.$retrying ? 0.6 : 1};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${theme.colors.background};
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.xs};
    padding: ${theme.spacing.md};
  }
`;

const CellLabel = styled.span`
  display: none;
  font-weight: 600;
  font-size: 11px;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;

  @media (max-width: 900px) {
    display: inline;
    margin-right: 8px;
  }
`;

const MessagePreview = styled.div`
  font-size: 13px;
  color: ${theme.colors.text};
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PhoneCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${theme.colors.text};
`;

const ErrorCell = styled.div`
  font-size: 12px;
  color: #dc2626;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RetryBadge = styled.span<{ $count: number }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$count >= 3 ? '#fecaca' : '#fef3c7'};
  color: ${props => props.$count >= 3 ? '#dc2626' : '#d97706'};
`;

const SpinIcon = styled.span`
  display: inline-flex;
  animation: ${spin} 1s linear infinite;
`;

const RetryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.primary};
  background: transparent;
  color: ${theme.colors.primary};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${theme.colors.primary};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuccessBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: #d1fae5;
  color: #059669;
`;

const EmptyState = styled.div`
  padding: ${theme.spacing.xxl};
  text-align: center;
  color: ${theme.colors.textSecondary};

  svg {
    margin-bottom: ${theme.spacing.md};
    opacity: 0.3;
  }

  h3 {
    font-size: 18px;
    color: ${theme.colors.text};
    margin-bottom: ${theme.spacing.sm};
  }
`;

const DateCell = styled.div`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
`;

interface FailedMessage {
  id: string;
  phone_number: string;
  message: string;
  template_name: string | null;
  error: string | null;
  retry_count: number;
  created_at: string;
  last_retry_at: string | null;
  status: string;
}

const FailedMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<FailedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retrySuccess, setRetrySuccess] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ failed: 0, retriable: 0, exhausted: 0 });

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('message_logs')
        .select('id, phone_number, message, template_name, error, retry_count, created_at, last_retry_at, status')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading failed messages:', error);
        return;
      }

      const msgs = (data || []) as FailedMessage[];
      setMessages(msgs);
      setStats({
        failed: msgs.length,
        retriable: msgs.filter(m => m.retry_count < 3).length,
        exhausted: msgs.filter(m => m.retry_count >= 3).length,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleRetry = async (msg: FailedMessage) => {
    setRetryingId(msg.id);
    try {
      const instance = await whatsappService.getConnectedInstance();
      if (!instance) {
        window.alert('Nenhuma instancia WhatsApp conectada.');
        return;
      }

      const result = await whatsappService.sendText(
        instance.name,
        msg.phone_number,
        msg.message
      );

      if (result.success) {
        // Update status in DB
        await supabase
          .from('message_logs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            retry_count: msg.retry_count + 1,
            last_retry_at: new Date().toISOString(),
            error: null,
          })
          .eq('id', msg.id);

        setRetrySuccess(prev => new Set(prev).add(msg.id));
        setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== msg.id));
          setRetrySuccess(prev => {
            const next = new Set(prev);
            next.delete(msg.id);
            return next;
          });
        }, 2000);
      } else {
        await supabase
          .from('message_logs')
          .update({
            retry_count: msg.retry_count + 1,
            last_retry_at: new Date().toISOString(),
            error: result.error || 'Retry failed',
          })
          .eq('id', msg.id);

        window.alert(`Falha ao reenviar: ${result.error || 'Erro desconhecido'}`);
        loadMessages();
      }
    } catch (err) {
      console.error('Error retrying message:', err);
      window.alert('Erro ao tentar reenviar mensagem.');
    } finally {
      setRetryingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTemplate = (name: string | null) => {
    if (!name) return '-';
    const labels: Record<string, string> = {
      appointment_confirmed: 'Confirmacao',
      appointment_rejected: 'Rejeicao',
      appointment_cancelled: 'Cancelamento',
      appointment_cancelled_by_provider: 'Cancel. medico',
      appointment_auto_confirmed: 'Auto-confirmacao',
      reminder_24h: 'Lembrete 24h',
      reminder_1h: 'Lembrete 1h',
      no_show_patient: 'No-show (pac)',
      no_show_provider: 'No-show (med)',
      new_appointment_provider: 'Nova consulta (med)',
      new_appointment_clinic: 'Nova consulta (clin)',
      provider_reminder_2h: 'Lembrete 2h (med)',
      provider_reminder_15min: 'Lembrete 15min (med)',
    };
    return labels[name] || name;
  };

  return (
    <AdminLayout>
      <Header>
        <div>
          <h1>Mensagens Falhas</h1>
          <p>Mensagens WhatsApp que nao foram entregues</p>
        </div>
        <Button onClick={loadMessages} $loading={loading} $variant="secondary">
          <RefreshCw size={16} />
          Atualizar
        </Button>
      </Header>

      <StatsRow>
        <StatCard $color="#dc2626">
          <div className="value">{stats.failed}</div>
          <div className="label">Total falhas</div>
        </StatCard>
        <StatCard $color="#d97706">
          <div className="value">{stats.retriable}</div>
          <div className="label">Reenvio possivel</div>
        </StatCard>
        <StatCard $color="#6b7280">
          <div className="value">{stats.exhausted}</div>
          <div className="label">Tentativas esgotadas</div>
        </StatCard>
      </StatsRow>

      <Table>
        {messages.length === 0 && !loading ? (
          <EmptyState>
            <CheckCircle size={48} />
            <h3>Nenhuma mensagem falha</h3>
            <p>Todas as mensagens WhatsApp foram entregues com sucesso.</p>
          </EmptyState>
        ) : (
          <>
            <TableHeader>
              <span>Mensagem</span>
              <span>Telefone</span>
              <span>Erro</span>
              <span>Template</span>
              <span>Tentativas</span>
              <span>Acao</span>
            </TableHeader>
            {messages.map(msg => (
              <TableRow key={msg.id} $retrying={retryingId === msg.id}>
                <div>
                  <CellLabel>Mensagem:</CellLabel>
                  <MessagePreview title={msg.message}>
                    {msg.message.substring(0, 80)}...
                  </MessagePreview>
                  <DateCell>
                    <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {formatDate(msg.created_at)}
                  </DateCell>
                </div>

                <PhoneCell>
                  <CellLabel>Tel:</CellLabel>
                  <Phone size={14} />
                  {msg.phone_number}
                </PhoneCell>

                <div>
                  <CellLabel>Erro:</CellLabel>
                  <ErrorCell title={msg.error || 'Sem detalhes'}>
                    {msg.error || 'Sem detalhes'}
                  </ErrorCell>
                </div>

                <div>
                  <CellLabel>Template:</CellLabel>
                  <span style={{ fontSize: 12 }}>{formatTemplate(msg.template_name)}</span>
                </div>

                <div>
                  <CellLabel>Tentativas:</CellLabel>
                  <RetryBadge $count={msg.retry_count}>
                    <RotateCcw size={11} />
                    {msg.retry_count}/3
                  </RetryBadge>
                </div>

                <div>
                  {retrySuccess.has(msg.id) ? (
                    <SuccessBadge>
                      <CheckCircle size={12} />
                      Enviado!
                    </SuccessBadge>
                  ) : msg.retry_count >= 3 ? (
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Esgotado</span>
                  ) : (
                    <RetryButton
                      onClick={() => handleRetry(msg)}
                      disabled={retryingId === msg.id}
                    >
                      {retryingId === msg.id ? (
                        <SpinIcon><RefreshCw size={12} /></SpinIcon>
                      ) : (
                        <RotateCcw size={12} />
                      )}
                      Reenviar
                    </RetryButton>
                  )}
                </div>
              </TableRow>
            ))}
          </>
        )}
      </Table>
    </AdminLayout>
  );
};

export default FailedMessagesPage;
