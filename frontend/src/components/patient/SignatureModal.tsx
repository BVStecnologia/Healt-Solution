import React, { useState, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, X, CheckCircle, RotateCcw } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';

interface SignatureModalProps {
  documentTitle: string;
  onClose: () => void;
  onSign: (signatureDataUrl: string, fullName: string) => Promise<boolean>;
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

const checkPop = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
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
  max-width: 560px;
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

const DocName = styled.div`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 20px;
  padding: 10px 14px;
  background: ${theme.colors.background};
  border-radius: 10px;
  border: 1px solid ${theme.colors.borderLight};

  strong {
    color: ${theme.colors.text};
    font-weight: 500;
  }
`;

const CanvasWrapper = styled.div`
  position: relative;
  border: 2px solid ${theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  background: white;
  touch-action: none;

  &:focus-within {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }
`;

const CanvasHint = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${theme.colors.textMuted};
  font-size: 14px;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.6;
`;

const ClearRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  background: white;
  color: ${theme.colors.textSecondary};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
    background: ${theme.colors.primarySoft};
  }

  svg { width: 14px; height: 14px; }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  &:last-child { margin-bottom: 0; }
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

const SuccessOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 10;
  border-radius: 24px;

  svg {
    width: 64px;
    height: 64px;
    color: #10B981;
    animation: ${checkPop} 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  p {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 18px;
    color: ${theme.colors.text};
    font-weight: 500;
  }
`;

const SignatureModal: React.FC<SignatureModalProps> = ({ documentTitle, onClose, onSign }) => {
  const { t } = useTranslation();
  const sigRef = useRef<SignatureCanvas>(null);
  const [fullName, setFullName] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClear = () => {
    sigRef.current?.clear();
    setHasDrawn(false);
  };

  const handleEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setHasDrawn(true);
    }
  }, []);

  const handleSubmit = async () => {
    if (!sigRef.current || sigRef.current.isEmpty() || !fullName.trim()) return;

    setSigning(true);
    const dataUrl = sigRef.current.getCanvas().toDataURL('image/png');
    const ok = await onSign(dataUrl, fullName.trim());
    setSigning(false);

    if (ok) {
      setSuccess(true);
      setTimeout(() => onClose(), 1800);
    }
  };

  const canSubmit = hasDrawn && fullName.trim().length >= 2 && !signing && !success;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        {success && (
          <SuccessOverlay>
            <CheckCircle />
            <p>{t('documents.signature.success')}</p>
          </SuccessOverlay>
        )}

        <ModalHeader>
          <ModalTitle>
            <PenTool />
            {t('documents.signature.title')}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <DocName>
            {t('documents.signature.document')}: <strong>{documentTitle}</strong>
          </DocName>

          <FormLabel>{t('documents.signature.drawLabel')}</FormLabel>
          <CanvasWrapper>
            {!hasDrawn && (
              <CanvasHint>
                <PenTool size={16} />
                {t('documents.signature.drawHint')}
              </CanvasHint>
            )}
            <SignatureCanvas
              ref={sigRef}
              penColor="#92563E"
              canvasProps={{
                width: 504,
                height: 180,
                style: {
                  width: '100%',
                  height: '180px',
                  display: 'block',
                },
              }}
              onEnd={handleEnd}
            />
          </CanvasWrapper>
          <ClearRow>
            <ClearButton type="button" onClick={handleClear}>
              <RotateCcw />
              {t('documents.signature.clear')}
            </ClearButton>
          </ClearRow>

          <FormGroup>
            <FormLabel>{t('documents.signature.fullNameLabel')}</FormLabel>
            <FormInput
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder={t('documents.signature.fullNamePlaceholder')}
            />
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <ModalButton $variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </ModalButton>
          <ModalButton
            $variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {signing ? (
              <>{t('documents.signature.signing')}</>
            ) : (
              <>
                <PenTool />
                {t('documents.signature.sign')}
              </>
            )}
          </ModalButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default SignatureModal;
