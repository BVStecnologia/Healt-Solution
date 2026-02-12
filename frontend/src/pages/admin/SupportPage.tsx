import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  LifeBuoy,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Bug,
  Lightbulb,
  HelpCircle,
  MoreHorizontal,
  X,
  Image,
  ArrowLeft,
  Loader,
  MessageSquare,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// ============================================
// TYPES
// ============================================
interface SupportTicket {
  id: string;
  created_by: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  screenshot_url: string | null;
  page_url: string | null;
  browser_info: string | null;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  creator_name?: string;
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
    color: ${theme.colors.text};
    margin: 0 0 8px;
    letter-spacing: 0.5px;
  }

  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: 15px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, ${theme.colors.primary}, #7A4833);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(146, 86, 62, 0.3);
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
  background: ${theme.colors.surface};
  border: 1px solid rgba(146, 86, 62, 0.08);
  border-radius: 40px;

  svg {
    width: 16px;
    height: 16px;
    color: ${theme.colors.primary};
    opacity: 0.6;
  }
`;

const StatValue = styled.span`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 20px;
  font-weight: 600;
  color: ${theme.colors.text};
`;

const StatLabel = styled.span`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
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
  background: ${props => props.$active ? `${theme.colors.primary}15` : theme.colors.surface};
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  border: 1px solid ${props => props.$active ? `${theme.colors.primary}30` : theme.colors.border};
  border-radius: 10px;
  font-size: 13px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;

const TicketsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: 200ms;
  animation-fill-mode: both;
`;

const TicketCard = styled.div<{ $priority: string }>`
  background: ${theme.colors.surface};
  border: 1px solid ${props =>
    props.$priority === 'high' ? 'rgba(196, 131, 106, 0.4)' :
    'rgba(146, 86, 62, 0.08)'
  };
  border-radius: 16px;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(146, 86, 62, 0.08);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const TicketHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const TicketTitle = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: ${theme.colors.text};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => `${props.$color}15`};
  color: ${props => props.$color};
  flex-shrink: 0;
`;

const TicketMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};

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

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 40px;
  background: ${theme.colors.surface};
  border: 1px dashed ${theme.colors.border};
  border-radius: 16px;
  animation: ${fadeInUp} 0.6s ease-out;

  svg {
    width: 64px;
    height: 64px;
    color: ${theme.colors.primary};
    margin-bottom: 20px;
    animation: ${float} 3s ease-in-out infinite;
  }

  h3 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 24px;
    color: ${theme.colors.text};
    margin: 0 0 8px;
  }

  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    line-height: 1.6;
  }
`;

const SpinnerIcon = styled.div`
  display: inline-flex;
  animation: ${spin} 1s linear infinite;

  svg {
    width: 64px;
    height: 64px;
    color: ${theme.colors.primary};
  }
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
  animation: ${keyframes`from { opacity: 0; } to { opacity: 1; }`} 0.2s ease;
`;

const ModalContent = styled.div`
  background: ${theme.colors.surface};
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${fadeInUp} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 0;

  h2 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 22px;
    font-weight: 500;
    color: ${theme.colors.text};
    margin: 0;
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.surfaceHover};
    color: ${theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 24px 28px 28px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  color: ${theme.colors.text};
  background: ${theme.colors.background};
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  color: ${theme.colors.text};
  background: ${theme.colors.background};
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  color: ${theme.colors.text};
  background: ${theme.colors.background};
  cursor: pointer;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FileUploadArea = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 2px dashed ${theme.colors.border};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${theme.colors.textSecondary};
  font-size: 13px;

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }

  input {
    display: none;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  font-size: 13px;
  color: ${theme.colors.text};

  img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 6px;
  }

  span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, ${theme.colors.primary}, #7A4833);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(146, 86, 62, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Detail view styles
const DetailSection = styled.div`
  margin-bottom: 20px;
`;

const DetailLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${theme.colors.textMuted};
  margin-bottom: 6px;
`;

const DetailValue = styled.div`
  font-size: 14px;
  color: ${theme.colors.text};
  line-height: 1.6;
  white-space: pre-wrap;
`;

const ScreenshotImage = styled.img`
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid ${theme.colors.border};
  cursor: pointer;
`;

const AdminNotesArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  color: ${theme.colors.text};
  background: ${theme.colors.background};
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const StatusSelect = styled.select`
  padding: 8px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  font-size: 13px;
  color: ${theme.colors.text};
  background: ${theme.colors.background};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: ${theme.colors.surface};
  color: ${theme.colors.primary};
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(135deg, ${theme.colors.primary}, #7A4833);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(146, 86, 62, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 12px;
  color: #B91C1C;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;

  svg { flex-shrink: 0; }
`;

const SuccessBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 12px;
  color: #166534;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;

  svg { flex-shrink: 0; }
`;

// ============================================
// HELPERS
// ============================================
const CATEGORY_CONFIG: Record<string, { icon: React.FC<any>; color: string }> = {
  bug: { icon: Bug, color: '#C4836A' },
  suggestion: { icon: Lightbulb, color: '#B48F7A' },
  question: { icon: HelpCircle, color: '#6B8E6B' },
  other: { icon: MoreHorizontal, color: '#8C8B8B' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B8E6B',
  medium: '#B48F7A',
  high: '#C4836A',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#B48F7A',
  in_progress: '#92563E',
  resolved: '#6B8E6B',
};

function formatDate(dateStr: string): string {
  const dt = new Date(dateStr);
  const day = dt.getDate().toString().padStart(2, '0');
  const month = (dt.getMonth() + 1).toString().padStart(2, '0');
  const year = dt.getFullYear();
  const hours = dt.getHours().toString().padStart(2, '0');
  const minutes = dt.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// ============================================
// COMPONENT
// ============================================
type FilterType = 'all' | 'open' | 'in_progress' | 'resolved';

const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const location = useLocation();
  const isAdmin = profile?.role === 'admin';
  const isDoctorView = location.pathname.startsWith('/doctor');

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('open');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('bug');
  const [formPriority, setFormPriority] = useState('medium');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFilePreview, setFormFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Detail edit state (admin)
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingDetail, setSavingDetail] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch creator names
      if (data && data.length > 0) {
        const creatorIds = Array.from(new Set(data.map(t => t.created_by)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        const nameMap: Record<string, string> = {};
        profiles?.forEach(p => {
          nameMap[p.id] = `${p.first_name} ${p.last_name}`;
        });

        data.forEach(ticket => {
          ticket.creator_name = nameMap[ticket.created_by] || t('support.unknownUser');
        });
      }

      setTickets(data || []);
      setErrorMsg('');
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setErrorMsg(t('support.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(t('support.fileTooLarge'));
      return;
    }

    setFormFile(file);
    const reader = new FileReader();
    reader.onload = () => setFormFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formDescription.trim()) {
      setErrorMsg(t('support.errorRequired'));
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      let screenshotUrl: string | null = null;

      // Upload screenshot if provided
      if (formFile) {
        const ticketId = crypto.randomUUID();
        const ext = formFile.name.split('.').pop();
        const filePath = `support/${ticketId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('patient-documents')
          .upload(filePath, formFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          screenshotUrl = filePath;
        }
      }

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          created_by: profile!.id,
          title: formTitle.trim(),
          description: formDescription.trim(),
          category: formCategory,
          priority: formPriority,
          screenshot_url: screenshotUrl,
          page_url: window.location.href,
          browser_info: navigator.userAgent,
        });

      if (error) throw error;

      setSuccessMsg(t('support.successCreate'));
      setShowCreateModal(false);
      resetForm();
      fetchTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
      setErrorMsg(t('support.errorCreate'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('bug');
    setFormPriority('medium');
    setFormFile(null);
    setFormFilePreview(null);
  };

  const openDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditNotes(ticket.admin_notes || '');
  };

  const handleSaveDetail = async () => {
    if (!selectedTicket) return;
    setSavingDetail(true);

    try {
      const updates: Record<string, any> = {
        status: editStatus,
        admin_notes: editNotes || null,
        updated_at: new Date().toISOString(),
      };

      if (editStatus === 'resolved' && selectedTicket.status !== 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', selectedTicket.id);

      if (error) throw error;

      setSuccessMsg(t('support.successUpdate'));
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      console.error('Error updating ticket:', err);
      setErrorMsg(t('support.errorUpdate'));
    } finally {
      setSavingDetail(false);
    }
  };

  const getScreenshotUrl = async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(path, 300);
    return data?.signedUrl || null;
  };

  // Stats
  const allTickets = tickets;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  const getCategoryIcon = (category: string) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
    const Icon = config.icon;
    return <Icon size={14} />;
  };

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>{t('support.title')}</h1>
            <p>{t('support.subtitle')}</p>
          </div>
          <HeaderActions>
            <PrimaryButton onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              {t('support.newTicket')}
            </PrimaryButton>
          </HeaderActions>
        </Header>

        {successMsg && (
          <SuccessBanner>
            <CheckCircle size={16} />
            {successMsg}
          </SuccessBanner>
        )}

        {errorMsg && !showCreateModal && !selectedTicket && (
          <ErrorBanner>
            <AlertCircle size={16} />
            {errorMsg}
          </ErrorBanner>
        )}

        <StatsRow>
          <StatPill>
            <AlertCircle />
            <StatValue>{openCount}</StatValue>
            <StatLabel>{t('support.statusOpen')}</StatLabel>
          </StatPill>
          <StatPill>
            <Loader />
            <StatValue>{inProgressCount}</StatValue>
            <StatLabel>{t('support.statusInProgress')}</StatLabel>
          </StatPill>
          <StatPill>
            <CheckCircle />
            <StatValue>{resolvedCount}</StatValue>
            <StatLabel>{t('support.statusResolved')}</StatLabel>
          </StatPill>
        </StatsRow>

        <FiltersSection>
          <FilterButton $active={filter === 'all'} onClick={() => setFilter('all')}>
            {t('common.all')}
          </FilterButton>
          <FilterButton $active={filter === 'open'} onClick={() => setFilter('open')}>
            <AlertCircle size={14} />
            {t('support.statusOpen')}
          </FilterButton>
          <FilterButton $active={filter === 'in_progress'} onClick={() => setFilter('in_progress')}>
            <Loader size={14} />
            {t('support.statusInProgress')}
          </FilterButton>
          <FilterButton $active={filter === 'resolved'} onClick={() => setFilter('resolved')}>
            <CheckCircle size={14} />
            {t('support.statusResolved')}
          </FilterButton>
        </FiltersSection>

        {loading ? (
          <EmptyState>
            <SpinnerIcon><RefreshCw /></SpinnerIcon>
            <h3>{t('common.loading')}</h3>
          </EmptyState>
        ) : tickets.length === 0 ? (
          <EmptyState>
            <LifeBuoy />
            <h3>{t('support.emptyTitle')}</h3>
            <p>{t('support.emptyDescription')}</p>
          </EmptyState>
        ) : (
          <TicketsList>
            {tickets.map(ticket => {
              const catConfig = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.other;
              return (
                <TicketCard
                  key={ticket.id}
                  $priority={ticket.priority}
                  onClick={() => openDetail(ticket)}
                >
                  <TicketHeader>
                    <TicketTitle>{ticket.title}</TicketTitle>
                    <Badge $color={catConfig.color}>
                      {getCategoryIcon(ticket.category)}
                      {t(`support.category.${ticket.category}`)}
                    </Badge>
                    <Badge $color={PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.medium}>
                      {t(`support.priority.${ticket.priority}`)}
                    </Badge>
                    <Badge $color={STATUS_COLORS[ticket.status] || STATUS_COLORS.open}>
                      {t(`support.status.${ticket.status}`)}
                    </Badge>
                  </TicketHeader>
                  <TicketMeta>
                    <span>
                      <Clock size={14} />
                      {formatDate(ticket.created_at)}
                    </span>
                    {isAdmin && ticket.creator_name && (
                      <span>
                        <MessageSquare size={14} />
                        {ticket.creator_name}
                      </span>
                    )}
                    {ticket.screenshot_url && (
                      <span>
                        <Image size={14} />
                        {t('support.hasScreenshot')}
                      </span>
                    )}
                  </TicketMeta>
                </TicketCard>
              );
            })}
          </TicketsList>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <ModalOverlay onClick={() => setShowCreateModal(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <h2>{t('support.newTicket')}</h2>
                <CloseButton onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                {errorMsg && (
                  <ErrorBanner>
                    <AlertCircle size={16} />
                    {errorMsg}
                  </ErrorBanner>
                )}

                <FormGroup>
                  <Label>{t('support.titleField')} *</Label>
                  <Input
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder={t('support.titlePlaceholder')}
                    maxLength={200}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{t('support.descriptionField')} *</Label>
                  <TextArea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder={t('support.descriptionPlaceholder')}
                  />
                </FormGroup>

                <FormRow>
                  <FormGroup>
                    <Label>{t('support.categoryLabel')}</Label>
                    <Select value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                      <option value="bug">{t('support.category.bug')}</option>
                      <option value="suggestion">{t('support.category.suggestion')}</option>
                      <option value="question">{t('support.category.question')}</option>
                      <option value="other">{t('support.category.other')}</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>{t('support.priorityLabel')}</Label>
                    <Select value={formPriority} onChange={e => setFormPriority(e.target.value)}>
                      <option value="low">{t('support.priority.low')}</option>
                      <option value="medium">{t('support.priority.medium')}</option>
                      <option value="high">{t('support.priority.high')}</option>
                    </Select>
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <Label>{t('support.screenshotLabel')}</Label>
                  {formFile ? (
                    <FilePreview>
                      {formFilePreview && <img src={formFilePreview} alt="" />}
                      <span>{formFile.name}</span>
                      <CloseButton onClick={() => { setFormFile(null); setFormFilePreview(null); }}>
                        <X size={16} />
                      </CloseButton>
                    </FilePreview>
                  ) : (
                    <FileUploadArea>
                      <Image />
                      <span>{t('support.screenshotHint')}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileChange}
                      />
                    </FileUploadArea>
                  )}
                </FormGroup>

                <SubmitButton onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      {t('common.saving')}
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      {t('support.submitTicket')}
                    </>
                  )}
                </SubmitButton>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Detail Modal */}
        {selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            isAdmin={isAdmin}
            editStatus={editStatus}
            editNotes={editNotes}
            saving={savingDetail}
            onChangeStatus={setEditStatus}
            onChangeNotes={setEditNotes}
            onSave={handleSaveDetail}
            onClose={() => setSelectedTicket(null)}
            getScreenshotUrl={getScreenshotUrl}
            t={t}
          />
        )}
      </PageContainer>
    </AdminLayout>
  );
};

// ============================================
// DETAIL MODAL COMPONENT
// ============================================
interface DetailModalProps {
  ticket: SupportTicket;
  isAdmin: boolean;
  editStatus: string;
  editNotes: string;
  saving: boolean;
  onChangeStatus: (s: string) => void;
  onChangeNotes: (s: string) => void;
  onSave: () => void;
  onClose: () => void;
  getScreenshotUrl: (path: string) => Promise<string | null>;
  t: (key: string) => string;
}

const TicketDetailModal: React.FC<DetailModalProps> = ({
  ticket, isAdmin, editStatus, editNotes, saving,
  onChangeStatus, onChangeNotes, onSave, onClose,
  getScreenshotUrl, t,
}) => {
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);

  useEffect(() => {
    if (ticket.screenshot_url) {
      getScreenshotUrl(ticket.screenshot_url).then(url => setScreenshotSrc(url));
    }
  }, [ticket.screenshot_url, getScreenshotUrl]);

  const catConfig = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.other;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>{ticket.title}</h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <Badge $color={catConfig.color}>
              {t(`support.category.${ticket.category}`)}
            </Badge>
            <Badge $color={PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.medium}>
              {t(`support.priority.${ticket.priority}`)}
            </Badge>
            <Badge $color={STATUS_COLORS[ticket.status] || STATUS_COLORS.open}>
              {t(`support.status.${ticket.status}`)}
            </Badge>
          </div>

          <DetailSection>
            <DetailLabel>{t('support.descriptionField')}</DetailLabel>
            <DetailValue>{ticket.description}</DetailValue>
          </DetailSection>

          {ticket.creator_name && (
            <DetailSection>
              <DetailLabel>{t('support.createdBy')}</DetailLabel>
              <DetailValue>{ticket.creator_name}</DetailValue>
            </DetailSection>
          )}

          <DetailSection>
            <DetailLabel>{t('support.createdAt')}</DetailLabel>
            <DetailValue>{formatDate(ticket.created_at)}</DetailValue>
          </DetailSection>

          {ticket.page_url && (
            <DetailSection>
              <DetailLabel>{t('support.pageUrl')}</DetailLabel>
              <DetailValue style={{ fontSize: 12, color: theme.colors.textSecondary, wordBreak: 'break-all' }}>
                {ticket.page_url}
              </DetailValue>
            </DetailSection>
          )}

          {screenshotSrc && (
            <DetailSection>
              <DetailLabel>{t('support.screenshotLabel')}</DetailLabel>
              <ScreenshotImage
                src={screenshotSrc}
                alt="Screenshot"
                onClick={() => window.open(screenshotSrc, '_blank')}
              />
            </DetailSection>
          )}

          {/* Admin controls */}
          {isAdmin && (
            <>
              <DetailSection>
                <DetailLabel>{t('support.statusLabel')}</DetailLabel>
                <StatusSelect value={editStatus} onChange={e => onChangeStatus(e.target.value)}>
                  <option value="open">{t('support.status.open')}</option>
                  <option value="in_progress">{t('support.status.in_progress')}</option>
                  <option value="resolved">{t('support.status.resolved')}</option>
                </StatusSelect>
              </DetailSection>

              <DetailSection>
                <DetailLabel>{t('support.adminNotes')}</DetailLabel>
                <AdminNotesArea
                  value={editNotes}
                  onChange={e => onChangeNotes(e.target.value)}
                  placeholder={t('support.adminNotesPlaceholder')}
                />
              </DetailSection>

              <ActionRow>
                <SecondaryButton onClick={onClose}>
                  {t('common.cancel')}
                </SecondaryButton>
                <SaveButton onClick={onSave} disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </SaveButton>
              </ActionRow>
            </>
          )}

          {/* Provider read-only view of admin notes */}
          {!isAdmin && ticket.admin_notes && (
            <DetailSection>
              <DetailLabel>{t('support.adminResponse')}</DetailLabel>
              <DetailValue>{ticket.admin_notes}</DetailValue>
            </DetailSection>
          )}

          {!isAdmin && (
            <ActionRow>
              <SecondaryButton onClick={onClose}>
                <ArrowLeft size={16} />
                {t('common.back')}
              </SecondaryButton>
            </ActionRow>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SupportPage;
