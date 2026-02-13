import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
  FileText, FileSpreadsheet, FileCheck, FileOutput, FileSearch,
  Download, Trash2, Eye, PenTool, CheckCircle, Clock, Calendar,
} from 'lucide-react';
import { PatientDocument, DocumentType } from '../../types/documents';
import { theme } from '../../styles/GlobalStyle';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface DocumentCardProps {
  document: PatientDocument;
  onDelete?: (id: string) => void;
  onDownload?: () => void;
  onView?: () => void;
  onSign?: () => void;
  variant?: 'default' | 'pending';
}

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(146, 86, 62, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(146, 86, 62, 0); }
`;

const Card = styled.div<{ $variant?: string }>`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s;
  border: 1px solid ${props => props.$variant === 'pending'
    ? 'rgba(146, 86, 62, 0.2)' : theme.colors.borderLight};
  position: relative;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
`;

const CardTop = styled.div<{ $color: string }>`
  height: 4px;
  background: ${props => props.$color};
`;

const CardBody = styled.div`
  padding: 20px;
`;

const CardRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

const IconCircle = styled.div<{ $bg: string; $color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => props.$bg};
  color: ${props => props.$color};
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 15px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0 0 6px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const TypeBadge = styled.span<{ $bg: string; $color: string }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: ${props => props.$bg};
  color: ${props => props.$color};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const DateText = styled.span`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 4px;

  svg { width: 12px; height: 12px; }
`;

const StatusSection = styled.div`
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid ${theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const StatusBadge = styled.div<{ $type: 'signed' | 'pending' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 8px;

  ${props => props.$type === 'signed' ? `
    background: rgba(16, 185, 129, 0.08);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.15);
  ` : `
    background: rgba(146, 86, 62, 0.06);
    color: ${theme.colors.primary};
    border: 1px solid rgba(146, 86, 62, 0.12);
  `}

  svg { width: 14px; height: 14px; }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionBtn = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  svg { width: 14px; height: 14px; }

  ${props => props.$primary ? css`
    background: linear-gradient(135deg, #92563E, #7A4532);
    color: white;
    animation: ${pulse} 2.5s ease-in-out infinite;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(146, 86, 62, 0.35);
      animation: none;
    }
  ` : css`
    background: ${theme.colors.background};
    color: ${theme.colors.textSecondary};

    &:hover {
      background: ${theme.colors.primarySoft};
      color: ${theme.colors.primary};
    }
  `}
`;

const DeleteBtn = styled(ActionBtn)`
  &:hover {
    background: rgba(239, 68, 68, 0.08);
    color: #DC2626;
  }
`;

// Brand palette: terracota #92563E, marrom #B48F7A, dourado #ECCAA4, bege #F1E9D3, cinza #4C4F54
const TYPE_STYLES: Record<string, { bg: string; color: string; accent: string }> = {
  lab_result:      { bg: 'rgba(180, 143, 122, 0.10)', color: '#8B6F5C', accent: '#B48F7A' },
  prescription:    { bg: 'rgba(146, 86, 62, 0.08)',   color: '#92563E', accent: '#92563E' },
  invoice:         { bg: 'rgba(76, 79, 84, 0.07)',    color: '#4C4F54', accent: '#6B6E73' },
  treatment_plan:  { bg: 'rgba(180, 143, 122, 0.10)', color: '#7A6355', accent: '#B48F7A' },
  consent_form:    { bg: 'rgba(146, 86, 62, 0.08)',   color: '#92563E', accent: '#92563E' },
  intake_form:     { bg: 'rgba(212, 165, 116, 0.12)', color: '#A07850', accent: '#D4A574' },
  other:           { bg: 'rgba(140, 139, 139, 0.08)', color: '#6B6E73', accent: '#8C8B8B' },
};

const getTypeStyle = (type: DocumentType) => TYPE_STYLES[type] || TYPE_STYLES.other;

const getIcon = (type: DocumentType) => {
  switch (type) {
    case 'lab_result': return <FileSearch size={22} />;
    case 'prescription': return <FileText size={22} />;
    case 'invoice': return <FileSpreadsheet size={22} />;
    case 'treatment_plan': return <FileCheck size={22} />;
    case 'consent_form': return <FileCheck size={22} />;
    case 'intake_form': return <FileOutput size={22} />;
    default: return <FileText size={22} />;
  }
};

const DOC_TYPE_KEY_MAP: Record<string, string> = {
  lab_result: 'documents.type.labResult',
  prescription: 'documents.type.prescription',
  invoice: 'documents.type.invoice',
  treatment_plan: 'documents.type.treatmentPlan',
  consent_form: 'documents.type.consentForm',
  intake_form: 'documents.type.intakeForm',
};

const SIGNABLE_TYPES = ['consent_form', 'intake_form'];

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document, onDelete, onDownload, onView, onSign, variant = 'default',
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? ptBR : enUS;
  const getTypeLabel = (type: DocumentType) => t(DOC_TYPE_KEY_MAP[type] || 'documents.type.other');

  const isSignable = SIGNABLE_TYPES.includes(document.type);
  const isSigned = !!document.signed_at;
  const style = getTypeStyle(document.type);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) onDownload();
    else window.open(document.file_url, '_blank');
  };

  return (
    <Card $variant={variant} onClick={onView} style={{ cursor: onView ? 'pointer' : 'default' }}>
      <CardTop $color={style.accent} />
      <CardBody>
        <CardRow>
          <IconCircle $bg={style.bg} $color={style.color}>
            {getIcon(document.type)}
          </IconCircle>
          <CardContent>
            <Title title={document.title}>{document.title}</Title>
            <MetaRow>
              <TypeBadge $bg={style.bg} $color={style.color}>
                {getTypeLabel(document.type)}
              </TypeBadge>
              <DateText>
                <Calendar />
                {format(new Date(document.created_at), 'd MMM yyyy', { locale: dateLocale })}
              </DateText>
            </MetaRow>
          </CardContent>
        </CardRow>

        <StatusSection>
          {isSignable && !isSigned && (
            <StatusBadge $type="pending">
              <Clock />
              {t('documents.signature.pendingBadge')}
            </StatusBadge>
          )}
          {isSignable && isSigned && (
            <StatusBadge $type="signed">
              <CheckCircle />
              {t('documents.signature.signedBadge')}
            </StatusBadge>
          )}
          {!isSignable && <div />}

          <Actions>
            {onSign && (
              <ActionBtn $primary onClick={(e) => { e.stopPropagation(); onSign(); }}>
                <PenTool />
                {t('documents.signature.sign')}
              </ActionBtn>
            )}
            {onView && (
              <ActionBtn onClick={(e) => { e.stopPropagation(); onView(); }}>
                <Eye />
                {t('documents.action.viewShort')}
              </ActionBtn>
            )}
            <ActionBtn onClick={handleDownload}>
              <Download />
            </ActionBtn>
            {onDelete && (
              <DeleteBtn onClick={(e) => { e.stopPropagation(); onDelete(document.id); }}>
                <Trash2 />
              </DeleteBtn>
            )}
          </Actions>
        </StatusSection>
      </CardBody>
    </Card>
  );
};
