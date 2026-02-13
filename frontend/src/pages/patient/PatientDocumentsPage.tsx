import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { theme } from '../../styles/GlobalStyle';
import { usePatientDocuments } from '../../hooks/usePatientDocuments';
import { DocumentCard } from '../../components/patient/DocumentCard';
import DocumentViewerModal from '../../components/ui/DocumentViewerModal';
import PatientUploadModal from '../../components/patient/PatientUploadModal';
import SignatureModal from '../../components/patient/SignatureModal';
import { PatientDocument } from '../../types/documents';
import {
  FileText, Upload, PenTool, FolderOpen, FileSearch, FileCheck,
  ClipboardList, ArrowRight, AlertCircle,
} from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageHeader = styled.div`
  margin-bottom: 28px;
  animation: ${fadeIn} 0.4s ease-out;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  margin-bottom: 6px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 1.75rem;
  font-weight: 700;
  color: ${theme.colors.text};
`;

const Subtitle = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 0.9rem;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(146, 86, 62, 0.3);
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    box-shadow: 0 6px 20px rgba(146, 86, 62, 0.4);
    transform: translateY(-2px);
  }

  svg { width: 18px; height: 18px; }
`;

/* ─── Summary Stats ─── */
const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 2px;
  animation: ${fadeIn} 0.4s ease-out 0.1s both;

  @media (max-width: 640px) {
    gap: 8px;
  }
`;

const StatCard = styled.button<{ $active: boolean; $color: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 14px;
  background: ${props => props.$active ? 'white' : theme.colors.background};
  border: 1.5px solid ${props => props.$active ? props.$color : 'transparent'};
  box-shadow: ${props => props.$active ? `0 2px 12px ${props.$color}18` : 'none'};
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: white;
    border-color: ${props => props.$color}40;
  }
`;

const StatIcon = styled.div<{ $bg: string; $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$bg};
  color: ${props => props.$color};
  flex-shrink: 0;

  svg { width: 18px; height: 18px; }
`;

const StatInfo = styled.div`
  text-align: left;
`;

const StatCount = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${theme.colors.text};
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${theme.colors.textMuted};
  margin-top: 2px;
  font-weight: 500;
`;

/* ─── Pending Alert Banner ─── */
const AlertBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(146, 86, 62, 0.04) 0%, rgba(180, 143, 122, 0.06) 100%);
  border: 1px solid rgba(146, 86, 62, 0.12);
  margin-bottom: 20px;
  animation: ${fadeIn} 0.4s ease-out 0.15s both;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(146, 86, 62, 0.25);
    background: linear-gradient(135deg, rgba(146, 86, 62, 0.06) 0%, rgba(180, 143, 122, 0.08) 100%);
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const AlertIconCircle = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(146, 86, 62, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${theme.colors.primary};

  svg { width: 20px; height: 20px; }
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 14px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin-bottom: 2px;
`;

const AlertDescription = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const AlertCTA = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${theme.colors.primary};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;

  svg { width: 16px; height: 16px; }
`;

/* ─── Section Header ─── */
const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  animation: ${fadeIn} 0.4s ease-out 0.2s both;
`;

const SectionTitle = styled.h2`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionCount = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  background: ${theme.colors.background};
  padding: 2px 8px;
  border-radius: 8px;
`;

/* ─── Grid ─── */
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AnimatedCardWrapper = styled.div<{ $delay: number }>`
  animation: ${fadeIn} 0.4s ease-out;
  animation-delay: ${props => props.$delay}ms;
  animation-fill-mode: both;
`;

/* ─── Empty State ─── */
const EmptyState = styled.div`
  text-align: center;
  padding: 56px ${theme.spacing.xl};
  background: white;
  border-radius: 16px;
  border: 1px dashed ${theme.colors.border};
  color: ${theme.colors.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: ${fadeIn} 0.4s ease-out 0.25s both;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;

  svg {
    width: 28px;
    height: 28px;
    color: ${theme.colors.textMuted};
  }
`;

const EmptyTitle = styled.p`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.text};
`;

const EmptyHint = styled.p`
  font-size: 13px;
  color: ${theme.colors.textMuted};
  max-width: 320px;
`;

/* ─── Types ─── */
type TabType = 'all' | 'clinical' | 'administrative' | 'plans';

const CLINICAL_TYPES = ['lab_result', 'prescription', 'other'];
const ADMIN_TYPES = ['invoice', 'consent_form', 'intake_form'];
const SIGNABLE_TYPES = ['consent_form', 'intake_form'];

// Brand palette: terracota #92563E, marrom #B48F7A, dourado #D4A574, cinza #4C4F54
const TAB_CONFIG: Record<TabType, { icon: React.ReactNode; color: string; bg: string }> = {
  all:            { icon: <FolderOpen />,    color: '#92563E', bg: 'rgba(146, 86, 62, 0.08)' },
  clinical:       { icon: <FileSearch />,    color: '#B48F7A', bg: 'rgba(180, 143, 122, 0.10)' },
  administrative: { icon: <ClipboardList />, color: '#92563E', bg: 'rgba(146, 86, 62, 0.08)' },
  plans:          { icon: <FileCheck />,     color: '#7A6355', bg: 'rgba(180, 143, 122, 0.10)' },
};

const PatientDocumentsPage: React.FC = () => {
  const { documents, loading, getSignedUrl, upload, signDocument } = usePatientDocuments();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewingDoc, setViewingDoc] = useState<PatientDocument | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [viewerSigUrl, setViewerSigUrl] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [signingDoc, setSigningDoc] = useState<PatientDocument | null>(null);

  const pendingSignature = documents.filter(
    d => SIGNABLE_TYPES.includes(d.type) && !d.signed_at
  );

  const getFilteredDocs = (tab: TabType) => {
    switch (tab) {
      case 'clinical': return documents.filter(d => CLINICAL_TYPES.includes(d.type));
      case 'administrative': return documents.filter(d => ADMIN_TYPES.includes(d.type));
      case 'plans': return documents.filter(d => d.type === 'treatment_plan');
      default: return documents;
    }
  };

  const filteredDocs = getFilteredDocs(activeTab);

  const TABS: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: t('documents.tabAll'), count: documents.length },
    { key: 'clinical', label: t('documents.tabClinical'), count: getFilteredDocs('clinical').length },
    { key: 'administrative', label: t('documents.tabAdministrative'), count: getFilteredDocs('administrative').length },
    { key: 'plans', label: t('documents.tabPlans'), count: getFilteredDocs('plans').length },
  ];

  const handleDownload = async (filePath: string) => {
    const url = await getSignedUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(t('documents.downloadError'));
    }
  };

  const handleView = async (doc: PatientDocument) => {
    const url = await getSignedUrl(doc.file_url);
    if (url) {
      setViewerUrl(url);
      if (doc.signature_url) {
        const sigUrl = await getSignedUrl(doc.signature_url);
        setViewerSigUrl(sigUrl || '');
      } else {
        setViewerSigUrl('');
      }
      setViewingDoc(doc);
    } else {
      alert(t('documents.viewError'));
    }
  };

  const handleSign = async (signatureDataUrl: string, fullName: string) => {
    if (!signingDoc) return false;
    return signDocument(signingDoc.id, signatureDataUrl, fullName);
  };

  const handlePendingClick = () => {
    if (pendingSignature.length === 1) {
      setSigningDoc(pendingSignature[0]);
    } else {
      setActiveTab('administrative');
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message={t('documents.loading')} />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader>
        <HeaderRow>
          <Title>{t('documents.title')}</Title>
          <UploadButton onClick={() => setShowUploadModal(true)}>
            <Upload />
            {t('documents.patientUpload.button')}
          </UploadButton>
        </HeaderRow>
        <Subtitle>{t('documents.subtitle')}</Subtitle>
      </PageHeader>

      {/* Pending Signature Alert */}
      {pendingSignature.length > 0 && (
        <AlertBanner onClick={handlePendingClick}>
          <AlertIconCircle>
            <PenTool />
          </AlertIconCircle>
          <AlertContent>
            <AlertTitle>
              {pendingSignature.length === 1
                ? t('documents.pendingAlert.titleSingle')
                : t('documents.pendingAlert.titleMultiple', { count: pendingSignature.length })}
            </AlertTitle>
            <AlertDescription>
              {pendingSignature.map(d => d.title).join(', ')}
            </AlertDescription>
          </AlertContent>
          <AlertCTA>
            {pendingSignature.length === 1
              ? t('documents.signature.sign')
              : t('documents.pendingAlert.viewAll')}
            <ArrowRight />
          </AlertCTA>
        </AlertBanner>
      )}

      {/* Category Stats */}
      <StatsRow>
        {TABS.map(tab => {
          const cfg = TAB_CONFIG[tab.key];
          return (
            <StatCard
              key={tab.key}
              $active={activeTab === tab.key}
              $color={cfg.color}
              onClick={() => setActiveTab(tab.key)}
            >
              <StatIcon $bg={cfg.bg} $color={cfg.color}>
                {cfg.icon}
              </StatIcon>
              <StatInfo>
                <StatCount>{tab.count}</StatCount>
                <StatLabel>{tab.label}</StatLabel>
              </StatInfo>
            </StatCard>
          );
        })}
      </StatsRow>

      {/* Section Header */}
      <SectionHeader>
        <SectionTitle>
          {TAB_CONFIG[activeTab].icon}
          {TABS.find(t => t.key === activeTab)?.label}
          <SectionCount>{filteredDocs.length}</SectionCount>
        </SectionTitle>
      </SectionHeader>

      {/* Document Cards Grid */}
      {filteredDocs.length > 0 ? (
        <Grid>
          {filteredDocs.map((doc, i) => (
            <AnimatedCardWrapper key={doc.id} $delay={i * 60}>
              <DocumentCard
                document={doc}
                onDownload={() => handleDownload(doc.file_url)}
                onView={() => handleView(doc)}
                onSign={
                  SIGNABLE_TYPES.includes(doc.type) && !doc.signed_at
                    ? () => setSigningDoc(doc)
                    : undefined
                }
              />
            </AnimatedCardWrapper>
          ))}
        </Grid>
      ) : (
        <EmptyState>
          <EmptyIcon>
            <FileText />
          </EmptyIcon>
          <EmptyTitle>{t('documents.emptyTitle')}</EmptyTitle>
          <EmptyHint>
            {activeTab !== 'all'
              ? t('documents.emptyFilterHint')
              : t('documents.emptyHint')}
          </EmptyHint>
        </EmptyState>
      )}

      {/* Modals */}
      <DocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => { setViewingDoc(null); setViewerUrl(''); setViewerSigUrl(''); }}
        fileUrl={viewerUrl}
        fileName={viewingDoc?.file_url || ''}
        title={viewingDoc?.title || ''}
        signatureUrl={viewerSigUrl || undefined}
        signedByName={viewingDoc?.signed_by_name || undefined}
        signedAt={viewingDoc?.signed_at || undefined}
      />

      {showUploadModal && (
        <PatientUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={upload}
        />
      )}

      {signingDoc && (
        <SignatureModal
          documentTitle={signingDoc.title}
          onClose={() => setSigningDoc(null)}
          onSign={handleSign}
        />
      )}
    </Layout>
  );
};

export default PatientDocumentsPage;
