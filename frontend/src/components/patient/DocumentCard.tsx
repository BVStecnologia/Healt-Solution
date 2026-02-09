import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FileText, FileSpreadsheet, FileCheck, FileOutput, FileSearch, Download, Trash2, Eye } from 'lucide-react';
import { PatientDocument, DocumentType } from '../../types/documents';
import { theme } from '../../styles/GlobalStyle';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface DocumentCardProps {
  document: PatientDocument;
  onDelete?: (id: string) => void;
  onDownload?: () => void;
  onView?: () => void;
}

const Card = styled.div<{ $clickable?: boolean }>`
  background: white;
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
  box-shadow: ${theme.shadows.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid ${theme.colors.border};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
  }
`;

const IconWrapper = styled.div<{ $type: DocumentType }>`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  background-color: ${props => {
    switch (props.$type) {
      case 'lab_result': return 'rgba(146, 86, 62, 0.10)';
      case 'prescription': return 'rgba(180, 143, 122, 0.12)';
      case 'invoice': return 'rgba(212, 165, 116, 0.12)';
      case 'treatment_plan': return 'rgba(196, 131, 106, 0.10)';
      default: return 'rgba(140, 139, 139, 0.10)';
    }
  }};

  color: ${props => {
    switch (props.$type) {
      case 'lab_result': return '#92563E';
      case 'prescription': return '#7A6355';
      case 'invoice': return '#A67B5B';
      case 'treatment_plan': return '#B48F7A';
      default: return '#8C8B8B';
    }
  }};
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.h3`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 1rem;
  color: ${theme.colors.text};
  margin-bottom: 4px;
  font-weight: 500;
`;

const Meta = styled.div`
  font-size: 0.875rem;
  color: ${theme.colors.textSecondary};
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

const ActionBtn = styled.button`
  padding: ${theme.spacing.sm};
  color: ${theme.colors.textSecondary};
  border-radius: ${theme.borderRadius.full};
  transition: all 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    background: ${theme.colors.background};
    color: ${theme.colors.primary};
  }
`;

const DeleteBtn = styled(ActionBtn)`
  &:hover {
    background: rgba(196, 131, 106, 0.12);
    color: #C4836A;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Badge = styled.span`
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
`;

const getIcon = (type: DocumentType) => {
  switch (type) {
    case 'lab_result': return <FileSearch size={24} />;
    case 'prescription': return <FileText size={24} />;
    case 'invoice': return <FileSpreadsheet size={24} />;
    case 'treatment_plan': return <FileCheck size={24} />;
    case 'consent_form': return <FileCheck size={24} />; // Using FileCheck for consent too
    case 'intake_form': return <FileOutput size={24} />;
    default: return <FileText size={24} />;
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

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete, onDownload, onView }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt' ? ptBR : enUS;
  const getTypeLabel = (type: DocumentType) => t(DOC_TYPE_KEY_MAP[type] || 'documents.type.other');

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload();
    } else {
      window.open(document.file_url, '_blank');
    }
  };

  const handleCardClick = () => {
    if (onView) onView();
  };

  return (
    <Card $clickable={!!onView} onClick={handleCardClick}>
      <IconWrapper $type={document.type}>
        {getIcon(document.type)}
      </IconWrapper>
      <Content>
        <Title>{document.title}</Title>
        <Meta>
          <span>{format(new Date(document.created_at), 'd MMMM, yyyy', { locale: dateLocale })}</span>
          <Badge>{getTypeLabel(document.type)}</Badge>
        </Meta>
      </Content>
      <Actions>
        {onView && (
          <ActionBtn onClick={(e) => { e.stopPropagation(); onView(); }} title={t('documents.action.view')}>
            <Eye size={20} />
          </ActionBtn>
        )}
        <ActionBtn onClick={handleDownload} title={t('documents.action.download')}>
          <Download size={20} />
        </ActionBtn>
        {onDelete && (
          <DeleteBtn onClick={(e) => { e.stopPropagation(); onDelete(document.id); }} title={t('documents.action.delete')}>
            <Trash2 size={18} />
          </DeleteBtn>
        )}
      </Actions>
    </Card>
  );
};
