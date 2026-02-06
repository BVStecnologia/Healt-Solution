import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { HelpCircle, X, Lightbulb } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  background: ${theme.colors.primaryA10};
  border: 1px solid ${theme.colors.primaryA20};
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  line-height: 1.6;
  animation: ${fadeIn} 0.4s ease-out;
`;

const IconWrapper = styled.div`
  flex-shrink: 0;
  color: ${theme.colors.primary};
  margin-top: 1px;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    color: ${theme.colors.text};
  }
`;

const DismissBtn = styled.button`
  flex-shrink: 0;
  border: none;
  background: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: ${theme.colors.text};
    background: ${theme.colors.borderLight};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

interface HelpTipProps {
  id: string;
  children: React.ReactNode;
  icon?: 'help' | 'lightbulb';
}

const HelpTip: React.FC<HelpTipProps> = ({ id, children, icon = 'lightbulb' }) => {
  const storageKey = `essence_help_${id}`;
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setDismissed(stored === 'true');
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  const Icon = icon === 'help' ? HelpCircle : Lightbulb;

  return (
    <Container>
      <IconWrapper><Icon /></IconWrapper>
      <Content>{children}</Content>
      <DismissBtn onClick={handleDismiss} title="Fechar dica">
        <X />
      </DismissBtn>
    </Container>
  );
};

export default HelpTip;
