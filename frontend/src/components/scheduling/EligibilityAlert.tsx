import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import type { EligibilityResult } from '../../types/database';

interface EligibilityAlertProps {
  eligibility: EligibilityResult | null;
  loading?: boolean;
}

const Container = styled.div<{ $type: 'success' | 'warning' | 'error' | 'info' }>`
  display: flex;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  background: ${props => {
    switch (props.$type) {
      case 'success': return '#dcfce7';
      case 'warning': return '#fef3c7';
      case 'error': return '#fee2e2';
      default: return '#dbeafe';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$type) {
      case 'success': return '#86efac';
      case 'warning': return '#fcd34d';
      case 'error': return '#fca5a5';
      default: return '#93c5fd';
    }
  }};
`;

const IconWrapper = styled.div<{ $type: 'success' | 'warning' | 'error' | 'info' }>`
  flex-shrink: 0;
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#16a34a';
      case 'warning': return '#d97706';
      case 'error': return '#dc2626';
      default: return '#2563eb';
    }
  }};

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin-bottom: ${theme.spacing.xs};
`;

const Message = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const ReasonsList = styled.ul`
  margin: ${theme.spacing.sm} 0 0 0;
  padding-left: ${theme.spacing.lg};
  font-size: 13px;
  color: ${theme.colors.textSecondary};

  li {
    margin-bottom: ${theme.spacing.xs};
  }
`;

const RequirementsList = styled.div`
  margin-top: ${theme.spacing.sm};
  padding-top: ${theme.spacing.sm};
  border-top: 1px solid rgba(0,0,0,0.1);
`;

const Requirement = styled.div<{ $met: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: 13px;
  color: ${props => props.$met ? '#16a34a' : theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.xs};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const EligibilityAlert: React.FC<EligibilityAlertProps> = ({
  eligibility,
  loading = false,
}) => {
  if (loading) {
    return (
      <Container $type="info">
        <IconWrapper $type="info">
          <Info />
        </IconWrapper>
        <Content>
          <Title>Verificando elegibilidade...</Title>
          <Message>Aguarde enquanto verificamos seus requisitos.</Message>
        </Content>
      </Container>
    );
  }

  if (!eligibility) {
    return null;
  }

  const type = eligibility.eligible ? 'success' : 'error';
  const Icon = eligibility.eligible ? CheckCircle : XCircle;

  return (
    <Container $type={type}>
      <IconWrapper $type={type}>
        <Icon />
      </IconWrapper>
      <Content>
        <Title>
          {eligibility.eligible
            ? 'Você está elegível para este tipo de consulta'
            : 'Você não está elegível para este tipo de consulta'}
        </Title>

        {!eligibility.eligible && eligibility.reasons.length > 0 && (
          <>
            <Message>Motivos:</Message>
            <ReasonsList>
              {eligibility.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ReasonsList>
          </>
        )}

        {eligibility.requirements && (
          <RequirementsList>
            <Requirement $met={eligibility.requirements.labs_completed}>
              {eligibility.requirements.labs_completed ? <CheckCircle /> : <XCircle />}
              Exames laboratoriais {eligibility.requirements.labs_completed ? 'em dia' : 'pendentes'}
            </Requirement>
            {eligibility.requirements.visit_required && (
              <Requirement $met={!!eligibility.requirements.last_visit_date}>
                {eligibility.requirements.last_visit_date ? <CheckCircle /> : <XCircle />}
                Visita médica {eligibility.requirements.last_visit_date
                  ? `realizada`
                  : 'necessária'}
              </Requirement>
            )}
          </RequirementsList>
        )}

        {eligibility.next_eligible_date && (
          <Message style={{ marginTop: theme.spacing.sm }}>
            Próxima data elegível: {new Date(eligibility.next_eligible_date).toLocaleDateString('pt-BR')}
          </Message>
        )}
      </Content>
    </Container>
  );
};

export default EligibilityAlert;
