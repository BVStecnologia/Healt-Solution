import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/GlobalStyle';
import { usePatientDocuments } from '../../hooks/usePatientDocuments';
import { DocumentCard } from '../../components/patient/DocumentCard';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import { PatientDocument } from '../../types/documents';
import { FileText, Filter } from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

const Header = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const Title = styled.h1`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 1.75rem;
  font-weight: 700;
  color: ${theme.colors.text};
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 0.9rem;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  overflow-x: auto;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  border-bottom: 2px solid ${props => props.$active ? theme.colors.primary : 'transparent'};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: ${theme.spacing.md};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px ${theme.spacing.xl};
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  border: 1px dashed ${theme.colors.border};
  color: ${theme.colors.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.md};

  svg {
    color: ${theme.colors.textMuted};
  }

  p {
    font-size: 15px;
    font-weight: 500;
  }

  small {
    font-size: 13px;
    color: ${theme.colors.textMuted};
  }
`;

type TabType = 'all' | 'clinical' | 'administrative' | 'plans';

const TABS: { key: TabType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'plans', label: 'Planos de Tratamento' },
  { key: 'clinical', label: 'Exames & Clínico' },
  { key: 'administrative', label: 'Administrativo' },
];

const CLINICAL_TYPES = ['lab_result', 'prescription', 'other'];
const ADMIN_TYPES = ['invoice', 'consent_form', 'intake_form'];

const PatientDocumentsPage: React.FC = () => {
  const { documents, loading, getSignedUrl } = usePatientDocuments();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewingDoc, setViewingDoc] = useState<PatientDocument | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string>('');

  const handleDownload = async (filePath: string) => {
    const url = await getSignedUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Erro ao gerar link de download.');
    }
  };

  const handleView = async (doc: PatientDocument) => {
    const url = await getSignedUrl(doc.file_url);
    if (url) {
      setViewerUrl(url);
      setViewingDoc(doc);
    } else {
      alert('Erro ao gerar link de visualizacao.');
    }
  };

  const filteredDocs = activeTab === 'all'
    ? documents
    : activeTab === 'clinical'
      ? documents.filter(d => CLINICAL_TYPES.includes(d.type))
      : activeTab === 'administrative'
        ? documents.filter(d => ADMIN_TYPES.includes(d.type))
        : documents.filter(d => d.type === 'treatment_plan');

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Carregando documentos..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <Header>
        <Title>Documentos</Title>
        <Subtitle>Acesse seus resultados de exames, planos e prescrições.</Subtitle>
      </Header>

      <TabsContainer>
        {TABS.map(tab => (
          <Tab
            key={tab.key}
            $active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabsContainer>

      {filteredDocs.length > 0 ? (
        <Grid>
          {filteredDocs.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDownload={() => handleDownload(doc.file_url)}
              onView={() => handleView(doc)}
            />
          ))}
        </Grid>
      ) : (
        <EmptyState>
          <FileText size={48} />
          <p>Nenhum documento encontrado.</p>
          {activeTab !== 'all' ? (
            <small>Tente selecionar outra categoria ou verifique se há novos arquivos.</small>
          ) : (
            <small>Documentos enviados pela clínica aparecerão aqui.</small>
          )}
        </EmptyState>
      )}

      <DocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => { setViewingDoc(null); setViewerUrl(''); }}
        fileUrl={viewerUrl}
        fileName={viewingDoc?.file_url || ''}
        title={viewingDoc?.title || ''}
      />
    </Layout>
  );
};

export default PatientDocumentsPage;
