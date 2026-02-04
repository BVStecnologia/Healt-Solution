import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/GlobalStyle';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const FullScreenWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${theme.colors.background};
  z-index: 9999;
`;

const InlineWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.lg};
`;

const Spinner = styled.div<{ $size: string }>`
  width: ${props => props.$size};
  height: ${props => props.$size};
  border: 3px solid ${theme.colors.border};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const Message = styled.p`
  margin-top: ${theme.spacing.md};
  color: ${theme.colors.textSecondary};
  font-size: 14px;
`;

const sizeMap = {
  small: '20px',
  medium: '32px',
  large: '48px',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  fullScreen = false,
}) => {
  const Wrapper = fullScreen ? FullScreenWrapper : InlineWrapper;

  return (
    <Wrapper>
      <Spinner $size={sizeMap[size]} />
      {message && <Message>{message}</Message>}
    </Wrapper>
  );
};

export default LoadingSpinner;
