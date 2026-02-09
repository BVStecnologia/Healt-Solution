import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { X, Download, ChevronLeft, ChevronRight, FileText, AlertCircle, Loader } from 'lucide-react';
import { theme } from '../styles/GlobalStyle';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ============================================
// TYPES
// ============================================
interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  title: string;
}

type FileType = 'pdf' | 'image' | 'docx' | 'xlsx' | 'unsupported';

// ============================================
// HELPERS
// ============================================
const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
};

const detectFileType = (fileName: string): FileType => {
  const ext = getFileExtension(fileName);
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (ext === 'docx') return 'docx';
  if (['xlsx', 'xls'].includes(ext)) return 'xlsx';
  return 'unsupported';
};

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ============================================
// STYLED COMPONENTS
// ============================================
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(57, 57, 57, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.lg};
  animation: ${fadeInUp} 0.3s ease-out;
`;

const ModalContainer = styled.div`
  background: linear-gradient(180deg, #FFFDFB 0%, #FAF8F6 100%);
  border-radius: 24px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(146, 86, 62, 0.05);
  overflow: hidden;
  animation: ${slideIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight}, ${theme.colors.primary});
    background-size: 200% 100%;
    animation: ${shimmer} 3s linear infinite;
    z-index: 1;
  }
`;

const ModalHeader = styled.div`
  padding: 28px 28px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${theme.colors.borderLight};
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 20px;
  font-weight: 400;
  color: ${theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  svg {
    width: 22px;
    height: 22px;
    color: ${theme.colors.primary};
    flex-shrink: 0;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${theme.colors.background};
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${theme.colors.primarySoft};
    color: ${theme.colors.primary};
    transform: rotate(90deg);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
`;

const ModalFooter = styled.div`
  padding: 16px 28px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid ${theme.colors.borderLight};
  flex-shrink: 0;
`;

const DownloadBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(146, 86, 62, 0.3);
  text-decoration: none;
  margin-left: auto;

  &:hover {
    box-shadow: 0 6px 20px rgba(146, 86, 62, 0.4);
    transform: translateY(-2px);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// PDF specific
const PdfContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;

  .react-pdf__Document {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .react-pdf__Page {
    box-shadow: ${theme.shadows.md};
    border-radius: 4px;
    overflow: hidden;

    canvas {
      max-width: 100% !important;
      height: auto !important;
    }
  }
`;

const PdfNav = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PdfNavBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid ${theme.colors.border};
  background: white;
  color: ${theme.colors.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
    background: ${theme.colors.primarySoft};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const PdfPageInfo = styled.span`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  font-weight: 500;
  min-width: 100px;
  text-align: center;
`;

// Image specific
const ImageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  img {
    max-width: 100%;
    max-height: 65vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: ${theme.shadows.md};
  }
`;

// DOCX specific
const DocxContainer = styled.div`
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.border};
  max-height: 65vh;
  overflow-y: auto;
  line-height: 1.6;

  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.typography.fontFamilyHeading};
    color: ${theme.colors.text};
    margin: 1em 0 0.5em;
  }

  p {
    margin: 0.5em 0;
    color: ${theme.colors.text};
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;

    th, td {
      border: 1px solid ${theme.colors.border};
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: ${theme.colors.background};
      font-weight: 600;
    }
  }

  ul, ol {
    padding-left: 24px;
  }

  img {
    max-width: 100%;
  }
`;

// XLSX specific
const XlsxContainer = styled.div`
  width: 100%;
  max-height: 65vh;
  overflow: auto;
  border-radius: 8px;
  border: 1px solid ${theme.colors.border};
  box-shadow: ${theme.shadows.sm};
`;

const SheetTabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 8px 12px;
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
  overflow-x: auto;
`;

const SheetTab = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: ${props => props.$active ? '600' : '400'};
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: ${props => props.$active ? theme.shadows.sm : 'none'};

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 13px;

  th, td {
    border: 1px solid ${theme.colors.borderLight};
    padding: 8px 12px;
    text-align: left;
    white-space: nowrap;
  }

  th {
    background: ${theme.colors.background};
    font-weight: 600;
    color: ${theme.colors.text};
    position: sticky;
    top: 0;
    z-index: 1;
  }

  td {
    color: ${theme.colors.textSecondary};
  }

  tr:hover td {
    background: ${theme.colors.background};
  }
`;

// Fallback
const FallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 32px;
  text-align: center;

  svg {
    width: 56px;
    height: 56px;
    color: ${theme.colors.textMuted};
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 15px;
    color: ${theme.colors.textSecondary};
    font-weight: 500;
  }

  small {
    color: ${theme.colors.textMuted};
    font-size: 13px;
  }
`;

// Loading
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px;
  color: ${theme.colors.textMuted};
  font-size: 14px;

  svg {
    width: 28px;
    height: 28px;
    color: ${theme.colors.primary};
    animation: ${spin} 1s linear infinite;
  }
`;

// Error
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px;
  text-align: center;

  svg {
    width: 40px;
    height: 40px;
    color: #EF4444;
    opacity: 0.7;
  }

  p {
    margin: 0;
    color: ${theme.colors.textSecondary};
    font-size: 14px;
  }
`;

// ============================================
// SUB-VIEWERS
// ============================================
const PdfViewer: React.FC<{ fileUrl: string }> = ({ fileUrl }) => {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  return (
    <PdfContainer>
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <LoadingContainer>
            <Loader />
            {t('documents.viewer.loadingPdf')}
          </LoadingContainer>
        }
        error={
          <ErrorContainer>
            <AlertCircle />
            <p>{t('documents.viewer.errorPdf')}</p>
          </ErrorContainer>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={Math.min(window.innerWidth - 120, 800)}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
      {numPages > 1 && (
        <PdfNav style={{ marginTop: 16 }}>
          <PdfNavBtn
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft />
          </PdfNavBtn>
          <PdfPageInfo>
            {t('documents.viewer.pageInfo', { pageNumber, numPages })}
          </PdfPageInfo>
          <PdfNavBtn
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight />
          </PdfNavBtn>
        </PdfNav>
      )}
    </PdfContainer>
  );
};

const ImageViewer: React.FC<{ fileUrl: string; title: string }> = ({ fileUrl, title }) => (
  <ImageContainer>
    <img src={fileUrl} alt={title} />
  </ImageContainer>
);

const DocxViewer: React.FC<{ fileUrl: string }> = ({ fileUrl }) => {
  const { t } = useTranslation();
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDocx = async () => {
      try {
        setLoading(true);
        const mammoth = await import('mammoth');
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) {
          setHtml(result.value);
        }
      } catch (err) {
        console.error('[DocxViewer] Error:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDocx();
    return () => { cancelled = true; };
  }, [fileUrl]);

  if (loading) {
    return (
      <LoadingContainer>
        <Loader />
        {t('documents.viewer.convertingDoc')}
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <AlertCircle />
        <p>{t('documents.viewer.errorDoc')}</p>
      </ErrorContainer>
    );
  }

  return <DocxContainer dangerouslySetInnerHTML={{ __html: html }} />;
};

const XlsxViewer: React.FC<{ fileUrl: string }> = ({ fileUrl }) => {
  const { t } = useTranslation();
  const [sheets, setSheets] = useState<{ name: string; data: string[][] }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadXlsx = async () => {
      try {
        setLoading(true);
        const XLSX = await import('xlsx');
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const parsedSheets = workbook.SheetNames.map(name => {
          const sheet = workbook.Sheets[name];
          const data: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
          return { name, data };
        });

        if (!cancelled) {
          setSheets(parsedSheets);
          setActiveSheet(0);
        }
      } catch (err) {
        console.error('[XlsxViewer] Error:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadXlsx();
    return () => { cancelled = true; };
  }, [fileUrl]);

  if (loading) {
    return (
      <LoadingContainer>
        <Loader />
        {t('documents.viewer.loadingSheet')}
      </LoadingContainer>
    );
  }

  if (error || sheets.length === 0) {
    return (
      <ErrorContainer>
        <AlertCircle />
        <p>{t('documents.viewer.errorSheet')}</p>
      </ErrorContainer>
    );
  }

  const currentSheet = sheets[activeSheet];
  const headers = currentSheet.data[0] || [];
  const rows = currentSheet.data.slice(1);

  return (
    <XlsxContainer>
      {sheets.length > 1 && (
        <SheetTabs>
          {sheets.map((sheet, i) => (
            <SheetTab
              key={sheet.name}
              $active={i === activeSheet}
              onClick={() => setActiveSheet(i)}
            >
              {sheet.name}
            </SheetTab>
          ))}
        </SheetTabs>
      )}
      <div style={{ overflow: 'auto' }}>
        <DataTable>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h != null ? String(h) : ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td key={ci}>{row[ci] != null ? String(row[ci]) : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </XlsxContainer>
  );
};

const FallbackViewer: React.FC<{ fileName: string }> = ({ fileName }) => {
  const { t } = useTranslation();
  const ext = getFileExtension(fileName).toUpperCase() || t('documents.viewer.unknown');
  return (
    <FallbackContainer>
      <FileText />
      <p>{t('documents.viewer.previewUnavailable', { ext })}</p>
      <small>{t('documents.viewer.downloadHint')}</small>
    </FallbackContainer>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  title,
}) => {
  const { t } = useTranslation();
  const fileType = detectFileType(fileName);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const renderViewer = () => {
    switch (fileType) {
      case 'pdf':
        return <PdfViewer fileUrl={fileUrl} />;
      case 'image':
        return <ImageViewer fileUrl={fileUrl} title={title} />;
      case 'docx':
        return <DocxViewer fileUrl={fileUrl} />;
      case 'xlsx':
        return <XlsxViewer fileUrl={fileUrl} />;
      default:
        return <FallbackViewer fileName={fileName} />;
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FileText />
            <span>{title}</span>
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {renderViewer()}
        </ModalBody>

        <ModalFooter>
          <div />
          <DownloadBtn href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
            <Download />
            {t('documents.viewer.download')}
          </DownloadBtn>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default DocumentViewerModal;
