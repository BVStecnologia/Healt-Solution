import React from 'react';
import styled from 'styled-components';
import { FileText, FileSpreadsheet, FileCheck, FileOutput, FileSearch, Download, Trash2, Eye } from 'lucide-react';
import { PatientDocument, DocumentType } from '../../types/documents';
import { theme } from '../../styles/GlobalStyle';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      case 'lab_result': return '#EEF2FF'; // Cyan/Blueish
      case 'prescription': return '#ECFDF5'; // Greenish
      case 'invoice': return '#FFFBEB'; // Yellowish
      case 'treatment_plan': return '#F5F3FF'; // Purple
      default: return '#F3F4F6'; // Gray
    }
  }};

  color: ${props => {
    switch (props.$type) {
      case 'lab_result': return '#4F46E5';
      case 'prescription': return '#059669';
      case 'invoice': return '#D97706';
      case 'treatment_plan': return '#7C3AED';
      default: return '#6B7280';
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
    background: #FEE2E2;
    color: #DC2626;
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

const getTypeLabel = (type: DocumentType) => {
  switch (type) {
    case 'lab_result': return 'Resultado de Exame';
    case 'prescription': return 'Receita/Prescrição';
    case 'invoice': return 'Nota Fiscal';
    case 'treatment_plan': return 'Plano de Tratamento';
    case 'consent_form': return 'Consentimento';
    case 'intake_form': return 'Formulário Inicial';
    default: return 'Geral';
  }
};

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete, onDownload, onView }) => {
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
          <span>{format(new Date(document.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}</span>
          <Badge>{getTypeLabel(document.type)}</Badge>
        </Meta>
      </Content>
      <Actions>
        {onView && (
          <ActionBtn onClick={(e) => { e.stopPropagation(); onView(); }} title="Visualizar documento">
            <Eye size={20} />
          </ActionBtn>
        )}
        <ActionBtn onClick={handleDownload} title="Baixar documento">
          <Download size={20} />
        </ActionBtn>
        {onDelete && (
          <DeleteBtn onClick={(e) => { e.stopPropagation(); onDelete(document.id); }} title="Excluir documento">
            <Trash2 size={18} />
          </DeleteBtn>
        )}
      </Actions>
    </Card>
  );
};
