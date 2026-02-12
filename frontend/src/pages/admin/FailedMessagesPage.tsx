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
  XCircle,
  Send,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { whatsappService } from '../../lib/whatsappService';

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
    width: 16px;
    height: 16px;
    color: ${luxuryTheme.primary};
    ${props => props.$loading ? css`animation: ${spin} 1s linear infinite;` : ''}
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

const Table = styled.div`
  background: ${luxuryTheme.surface};
  border: 1px solid rgba(146, 86, 62, 0.08);
  border-radius: 20px;
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 200ms;
  animation-fill-mode: both;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 180px 130px 90px 110px;
  gap: 12px;
  padding: 14px 24px;
  background: rgba(146, 86, 62, 0.03);
  border-bottom: 1px solid rgba(146, 86, 62, 0.06);
  font-weight: 500;
  font-size: 11px;
  color: ${luxuryTheme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.8px;

  @media (max-width: 900px) {
    display: none;
  }
`;

const TableRow = styled.div<{ $retrying?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 120px 180px 130px 90px 110px;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(146, 86, 62, 0.05);
  align-items: center;
  transition: all 0.2s ease;
  opacity: ${props => props.$retrying ? 0.5 : 1};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(146, 86, 62, 0.02);
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 16px 20px;
  }
`;

const CellLabel = styled.span`
  display: none;
  font-weight: 500;
  font-size: 10px;
  color: ${luxuryTheme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 900px) {
    display: inline;
    margin-right: 8px;
  }
`;

const MessagePreview = styled.div`
  font-size: 13px;
  color: ${luxuryTheme.text};
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
`;

const DateCell = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${luxuryTheme.textSecondary};
  margin-top: 4px;

  svg {
    width: 11px;
    height: 11px;
    opacity: 0.5;
  }
`;

const PhoneCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${luxuryTheme.textSecondary};

  svg {
    width: 13px;
    height: 13px;
    color: ${luxuryTheme.primary};
    opacity: 0.5;
  }
`;

const ErrorCell = styled.div`
  font-size: 12px;
  color: ${luxuryTheme.error};
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.85;
`;

const TemplateCell = styled.span`
  font-size: 12px;
  color: ${luxuryTheme.textSecondary};
`;

const RetryBadge = styled.span<{ $count: number }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: ${props => props.$count >= 3 ? `${luxuryTheme.error}10` : `${luxuryTheme.warning}10`};
  color: ${props => props.$count >= 3 ? `${luxuryTheme.error}CC` : `${luxuryTheme.warning}`};

  svg {
    width: 10px;
    height: 10px;
  }
`;

const RetryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 10px;
  border: none;
  background: ${luxuryTheme.primary}12;
  color: ${luxuryTheme.primary};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${luxuryTheme.primary}20;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const SuccessBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: ${luxuryTheme.success}12;
  color: ${luxuryTheme.success};

  svg {
    width: 11px;
    height: 11px;
  }
`;

const ExhaustedLabel = styled.span`
  font-size: 11px;
  color: ${luxuryTheme.textSecondary};
  opacity: 0.6;
`;

const SpinIcon = styled.span`
  display: inline-flex;
  animation: ${spin} 1s linear infinite;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 40px;

  svg {
    width: 48px;
    height: 48px;
    color: ${luxuryTheme.success};
    opacity: 0.4;
    margin-bottom: 16px;
    animation: ${float} 3s ease-in-out infinite;
  }

  h3 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 20px;
    font-weight: 400;
    color: ${luxuryTheme.text};
    margin: 0 0 8px;
  }

  p {
    color: ${luxuryTheme.textSecondary};
    margin: 0;
    font-size: 14px;
  }
`;

// ============================================
// TYPES
// ============================================
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

// ============================================
// COMPONENT
// ============================================
// ============================================
// CONTENT COMPONENT (used by AdminSettingsPage tabs)
// ============================================
export const FailedMessagesContent: React.FC = () => {
  const { t } = useTranslation();
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
        window.alert(t('failedMessages.noWhatsapp'));
        return;
      }

      const result = await whatsappService.sendText(
        instance.name,
        msg.phone_number,
        msg.message
      );

      if (result.success) {
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

        window.alert(`${t('failedMessages.retryFail')}: ${result.error || t('dashboard.unknownError')}`);
        loadMessages();
      }
    } catch (err) {
      console.error('Error retrying message:', err);
      window.alert(t('failedMessages.retryError'));
    } finally {
      setRetryingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTemplate = (name: string | null) => {
    if (!name) return '-';
    const labelKeys: Record<string, string> = {
      appointment_confirmed: 'failedMessages.template.confirmed',
      appointment_rejected: 'failedMessages.template.rejected',
      appointment_cancelled: 'failedMessages.template.cancelled',
      appointment_cancelled_by_provider: 'failedMessages.template.cancelledByProvider',
      appointment_auto_confirmed: 'failedMessages.template.autoConfirmed',
      reminder_24h: 'failedMessages.template.reminder24h',
      reminder_1h: 'failedMessages.template.reminder1h',
      no_show_patient: 'failedMessages.template.noShowPatient',
      no_show_provider: 'failedMessages.template.noShowProvider',
      new_appointment_provider: 'failedMessages.template.newAppointmentProvider',
      new_appointment_clinic: 'failedMessages.template.newAppointmentClinic',
      provider_reminder_2h: 'failedMessages.template.providerReminder2h',
      provider_reminder_15min: 'failedMessages.template.providerReminder15min',
    };
    return labelKeys[name] ? t(labelKeys[name]) : name;
  };

  return (
    <PageContainer>
      <Header>
        <div>
          <h1>{t('failedMessages.title')}</h1>
          <p>{t('failedMessages.subtitle')}</p>
        </div>
        <RefreshButton onClick={loadMessages} $loading={loading}>
          <RefreshCw size={16} />
          {t('failedMessages.refresh')}
        </RefreshButton>
      </Header>

      <StatsRow>
          <StatPill>
            <XCircle style={{ color: luxuryTheme.error }} />
            <StatValue>{stats.failed}</StatValue>
            <StatLabel>{t('failedMessages.statFailed')}</StatLabel>
          </StatPill>
          <StatPill>
            <Send style={{ color: luxuryTheme.warning }} />
            <StatValue>{stats.retriable}</StatValue>
            <StatLabel>{t('failedMessages.statRetriable')}</StatLabel>
          </StatPill>
          <StatPill>
            <AlertTriangle style={{ color: luxuryTheme.textSecondary }} />
            <StatValue>{stats.exhausted}</StatValue>
            <StatLabel>{t('failedMessages.statExhausted')}</StatLabel>
          </StatPill>
        </StatsRow>

        <Table>
          {messages.length === 0 && !loading ? (
            <EmptyState>
              <CheckCircle />
              <h3>{t('failedMessages.emptyTitle')}</h3>
              <p>{t('failedMessages.emptyDescription')}</p>
            </EmptyState>
          ) : (
            <>
              <TableHeader>
                <span>{t('failedMessages.headerMessage')}</span>
                <span>{t('failedMessages.headerPhone')}</span>
                <span>{t('failedMessages.headerError')}</span>
                <span>{t('failedMessages.headerTemplate')}</span>
                <span>{t('failedMessages.headerAttempts')}</span>
                <span>{t('failedMessages.headerAction')}</span>
              </TableHeader>
              {messages.map(msg => (
                <TableRow key={msg.id} $retrying={retryingId === msg.id}>
                  <div>
                    <CellLabel>{t('failedMessages.cellMessage')}</CellLabel>
                    <MessagePreview title={msg.message}>
                      {msg.message.substring(0, 80)}...
                    </MessagePreview>
                    <DateCell>
                      <Clock size={11} />
                      {formatDate(msg.created_at)}
                    </DateCell>
                  </div>

                  <PhoneCell>
                    <CellLabel>{t('failedMessages.cellPhone')}</CellLabel>
                    <Phone size={14} />
                    {msg.phone_number}
                  </PhoneCell>

                  <div>
                    <CellLabel>{t('failedMessages.cellError')}</CellLabel>
                    <ErrorCell title={msg.error || t('failedMessages.noDetails')}>
                      {msg.error || t('failedMessages.noDetails')}
                    </ErrorCell>
                  </div>

                  <div>
                    <CellLabel>{t('failedMessages.cellTemplate')}</CellLabel>
                    <TemplateCell>{formatTemplate(msg.template_name)}</TemplateCell>
                  </div>

                  <div>
                    <CellLabel>{t('failedMessages.cellAttempts')}</CellLabel>
                    <RetryBadge $count={msg.retry_count}>
                      <RotateCcw size={11} />
                      {msg.retry_count}/3
                    </RetryBadge>
                  </div>

                  <div>
                    {retrySuccess.has(msg.id) ? (
                      <SuccessBadge>
                        <CheckCircle size={12} />
                        {t('failedMessages.sent')}
                      </SuccessBadge>
                    ) : msg.retry_count >= 3 ? (
                      <ExhaustedLabel>{t('failedMessages.exhausted')}</ExhaustedLabel>
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
                        {t('failedMessages.resend')}
                      </RetryButton>
                    )}
                  </div>
                </TableRow>
              ))}
            </>
          )}
        </Table>
    </PageContainer>
  );
};

// ============================================
// STANDALONE PAGE
// ============================================
const FailedMessagesPage: React.FC = () => (
  <AdminLayout>
    <FailedMessagesContent />
  </AdminLayout>
);

export default FailedMessagesPage;
