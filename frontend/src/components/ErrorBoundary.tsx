import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { theme } from '../styles/GlobalStyle';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${theme.colors.background};
  padding: ${theme.spacing.xl};
`;

const Card = styled.div`
  max-width: 480px;
  width: 100%;
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xxl};
  text-align: center;
  box-shadow: 0 4px 24px ${theme.colors.shadow};
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${theme.colors.errorLight};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${theme.spacing.lg};
  color: ${theme.colors.error};
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${theme.colors.text};
  margin-bottom: ${theme.spacing.sm};
`;

const Message = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: ${theme.spacing.lg};
`;

const ReloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.lg};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const Details = styled.details`
  margin-top: ${theme.spacing.lg};
  text-align: left;

  summary {
    cursor: pointer;
    color: ${theme.colors.textMuted};
    font-size: 0.8rem;
  }

  pre {
    margin-top: ${theme.spacing.sm};
    padding: ${theme.spacing.md};
    background: ${theme.colors.background};
    border-radius: ${theme.borderRadius.md};
    font-size: 0.75rem;
    color: ${theme.colors.error};
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Card>
            <IconWrapper>
              <AlertTriangle size={28} />
            </IconWrapper>
            <Title>Something went wrong</Title>
            <Message>
              An unexpected error occurred. Please reload the page to continue.
            </Message>
            <ReloadButton onClick={this.handleReload}>
              <RefreshCw size={16} />
              Reload page
            </ReloadButton>
            {this.state.error && (
              <Details>
                <summary>Technical details</summary>
                <pre>{this.state.error.message}</pre>
              </Details>
            )}
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
