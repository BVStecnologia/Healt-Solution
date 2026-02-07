import React, { useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Upload, X, FileUp, CheckCircle } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import { DocumentType } from '../../types/documents';

interface DocumentUploadModalProps {
  onClose: () => void;
  onUpload: (data: { file: File; title: string; type: DocumentType; category?: string }) => Promise<boolean>;
}

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

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
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(146, 86, 62, 0.05);
  overflow: hidden;
  animation: ${slideIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;

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
  }
`;

const ModalHeader = styled.div`
  padding: 28px 28px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${theme.colors.borderLight};
`;

const ModalTitle = styled.h2`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 22px;
  font-weight: 400;
  color: ${theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;

  svg {
    width: 24px;
    height: 24px;
    color: ${theme.colors.primary};
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
  padding: 24px 28px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  color: ${theme.colors.text};
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  font-size: 15px;
  color: ${theme.colors.text};
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238C8B8B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 44px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }
`;

const DropZone = styled.button<{ $isDragOver: boolean; $hasFile: boolean }>`
  display: block;
  width: 100%;
  border: 2px dashed ${props => props.$isDragOver ? theme.colors.primary : props.$hasFile ? '#10B981' : theme.colors.border};
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$isDragOver ? theme.colors.primarySoft : props.$hasFile ? '#F0FDF4' : 'white'};
  font-family: inherit;

  &:hover {
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primarySoft};
  }

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }

  svg {
    width: 32px;
    height: 32px;
    color: ${props => props.$hasFile ? '#10B981' : theme.colors.textMuted};
    margin-bottom: 8px;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: ${props => props.$hasFile ? '#065F46' : theme.colors.textSecondary};
    font-weight: ${props => props.$hasFile ? '500' : '400'};
  }

  small {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: ${theme.colors.textMuted};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ModalFooter = styled.div`
  padding: 20px 28px 28px;
  display: flex;
  gap: 12px;
  border-top: 1px solid ${theme.colors.borderLight};
`;

const ModalButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  ${props => props.$variant === 'primary' ? css`
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 14px rgba(146, 86, 62, 0.3);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(146, 86, 62, 0.4);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  ` : css`
    background: white;
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.background};
      border-color: ${theme.colors.primaryA40};
    }
  `}

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  border: 1px solid #10B98140;
  border-radius: 12px;
  color: #065F46;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;

  svg {
    width: 18px;
    height: 18px;
    color: #059669;
  }
`;

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'lab_result', label: 'Resultado de Exame' },
  { value: 'prescription', label: 'Receita/Prescrição' },
  { value: 'treatment_plan', label: 'Plano de Tratamento' },
  { value: 'consent_form', label: 'Termo de Consentimento' },
  { value: 'intake_form', label: 'Formulário Inicial' },
  { value: 'invoice', label: 'Nota Fiscal' },
  { value: 'other', label: 'Outro' },
];

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx';

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('lab_result');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (!title) {
      // Auto-fill title from filename (remove extension)
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleSubmit = async () => {
    if (!file || !title || !type) return;

    setUploading(true);
    const ok = await onUpload({ file, title, type, category: category || undefined });
    setUploading(false);

    if (ok) {
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    }
  };

  const canSubmit = file && title.trim() && type && !uploading && !success;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Upload />
            Enviar Documento
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {success && (
            <SuccessMessage>
              <CheckCircle />
              Documento enviado com sucesso!
            </SuccessMessage>
          )}

          <FormGroup>
            <FormLabel>Arquivo</FormLabel>
            <HiddenInput
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            <DropZone
              type="button"
              $isDragOver={isDragOver}
              $hasFile={!!file}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <FileUp />
              {file ? (
                <p>{file.name}</p>
              ) : (
                <>
                  <p>Clique ou arraste um arquivo aqui</p>
                  <small>PDF, imagens, Word, Excel</small>
                </>
              )}
            </DropZone>
          </FormGroup>

          <FormGroup>
            <FormLabel>Titulo</FormLabel>
            <FormInput
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Exame de sangue - Fevereiro 2026"
            />
          </FormGroup>

          <FormGroup>
            <FormLabel>Tipo de Documento</FormLabel>
            <FormSelect
              value={type}
              onChange={e => setType(e.target.value as DocumentType)}
            >
              {DOCUMENT_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </FormSelect>
          </FormGroup>

          <FormGroup>
            <FormLabel>Categoria (opcional)</FormLabel>
            <FormInput
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Ex: Hormonal, Estética, Geral..."
            />
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <ModalButton $variant="secondary" onClick={onClose}>
            Cancelar
          </ModalButton>
          <ModalButton
            $variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {uploading ? (
              <>Enviando...</>
            ) : (
              <>
                <Upload />
                Enviar
              </>
            )}
          </ModalButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default DocumentUploadModal;
