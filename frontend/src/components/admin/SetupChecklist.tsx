import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  CheckCircle2, Circle, MessageCircle, Stethoscope,
  Clock, Bell, ChevronRight, ChevronDown, Sparkles, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../../styles/GlobalStyle';
import { supabase } from '../../lib/supabaseClient';

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const checkPop = keyframes`
  0% { transform: scale(0.8); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

// ============================================
// STYLED COMPONENTS
// ============================================
const Wrapper = styled.div`
  animation: ${fadeInUp} 0.5s ease-out;
  margin-bottom: 28px;
`;

const Card = styled.div`
  background: linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.background});
  border-radius: 20px;
  border: 1px solid rgba(146, 86, 62, 0.1);
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #92563E, #D4AF37);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20px;
    font-weight: 600;
    color: ${theme.colors.text};
    margin: 0;
  }

  .subtitle {
    font-size: 13px;
    color: ${theme.colors.textSecondary};
    margin: 2px 0 0;
  }
`;

const IconBadge = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #92563E15, #D4AF3710);
  color: #92563E;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
    stroke-width: 1.5;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProgressPill = styled.div`
  padding: 6px 14px;
  border-radius: 20px;
  background: #92563E12;
  color: #92563E;
  font-size: 13px;
  font-weight: 600;
`;

const DismissButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.borderLight};
    color: ${theme.colors.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ProgressBarContainer = styled.div`
  padding: 0 24px;
  margin-bottom: 16px;
`;

const ProgressBarTrack = styled.div`
  height: 6px;
  background: ${theme.colors.borderLight};
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, #92563E, #D4AF37);
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
`;

const StepList = styled.div`
  padding: 0 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StepItem = styled.div<{ $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: ${props => props.$completed ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  background: ${props => props.$completed ? 'transparent' : 'transparent'};

  &:hover {
    background: ${props => props.$completed ? 'transparent' : theme.colors.borderLight};
  }
`;

const StepIcon = styled.div<{ $completed: boolean }>`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${props => props.$completed ? '#059669' : theme.colors.textSecondary};
  animation: ${props => props.$completed ? checkPop : 'none'} 0.3s ease;

  svg {
    width: 22px;
    height: 22px;
    stroke-width: ${props => props.$completed ? 2.5 : 1.5};
  }
`;

const StepContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const StepTitle = styled.div<{ $completed: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$completed ? theme.colors.textSecondary : theme.colors.text};
  text-decoration: ${props => props.$completed ? 'line-through' : 'none'};
`;

const StepDescription = styled.div`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin-top: 2px;
`;

const StepArrow = styled.div<{ $completed: boolean }>`
  color: ${props => props.$completed ? 'transparent' : '#92563E'};
  display: flex;
  align-items: center;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CompletedCard = styled(Card)`
  &::before {
    background: linear-gradient(90deg, #059669, #10B981);
  }
`;

const CompletedContent = styled.div`
  padding: 24px;
  text-align: center;

  h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20px;
    font-weight: 600;
    color: ${theme.colors.text};
    margin: 12px 0 6px;
  }

  p {
    color: ${theme.colors.textSecondary};
    font-size: 14px;
    margin: 0 0 16px;
  }
`;

const CompletedIcon = styled.div`
  color: #059669;
  svg {
    width: 40px;
    height: 40px;
    stroke-width: 1.5;
  }
`;

const CompletedDismiss = styled.button`
  padding: 8px 20px;
  border-radius: 10px;
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.surface};
  color: ${theme.colors.text};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.borderLight};
  }
`;

// ============================================
// TYPES
// ============================================
interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route: string;
  icon: React.ReactNode;
}

const STORAGE_KEY = 'essence_setup_dismissed';

// ============================================
// COMPONENT
// ============================================
interface SetupChecklistProps {
  whatsappConnected: boolean;
  totalProviders: number;
}

const SetupChecklist: React.FC<SetupChecklistProps> = ({ whatsappConnected, totalProviders }) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [hasSchedules, setHasSchedules] = useState(false);
  const [hasRules, setHasRules] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setDismissed(true);
      return;
    }

    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const [schedulesRes, rulesRes] = await Promise.all([
        supabase.from('provider_schedules').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('notification_rules').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      setHasSchedules((schedulesRes.count || 0) > 0);
      setHasRules((rulesRes.count || 0) > 0);
    } catch (err) {
      console.error('Error checking setup status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  if (dismissed || loading) return null;

  const steps: SetupStep[] = [
    {
      id: 'whatsapp',
      title: 'Conectar WhatsApp',
      description: 'Envie notificações automáticas aos pacientes',
      completed: whatsappConnected,
      route: '/admin/whatsapp',
      icon: <MessageCircle />,
    },
    {
      id: 'providers',
      title: 'Cadastrar médicos',
      description: 'Adicione os profissionais da clínica',
      completed: totalProviders > 0,
      route: '/admin/providers',
      icon: <Stethoscope />,
    },
    {
      id: 'schedules',
      title: 'Configurar horários',
      description: 'Defina quando cada médico atende',
      completed: hasSchedules,
      route: '/admin/my-schedule',
      icon: <Clock />,
    },
    {
      id: 'rules',
      title: 'Ativar lembretes',
      description: 'Configure lembretes automáticos por WhatsApp',
      completed: hasRules,
      route: '/admin/notifications',
      icon: <Bell />,
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const allCompleted = completedCount === steps.length;
  const progress = (completedCount / steps.length) * 100;

  // All done - show success card with dismiss
  if (allCompleted) {
    return (
      <Wrapper>
        <CompletedCard>
          <CompletedContent>
            <CompletedIcon><CheckCircle2 /></CompletedIcon>
            <h3>Sistema configurado!</h3>
            <p>Tudo pronto para receber agendamentos.</p>
            <CompletedDismiss onClick={handleDismiss}>Entendi</CompletedDismiss>
          </CompletedContent>
        </CompletedCard>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Card>
        <CardHeader>
          <HeaderLeft>
            <IconBadge><Sparkles /></IconBadge>
            <div>
              <h3>Configure sua clínica</h3>
              <div className="subtitle">Complete os passos abaixo para começar</div>
            </div>
          </HeaderLeft>
          <HeaderActions>
            <ProgressPill>{completedCount}/{steps.length}</ProgressPill>
            <DismissButton onClick={handleDismiss} title="Minimizar">
              <X />
            </DismissButton>
          </HeaderActions>
        </CardHeader>

        <ProgressBarContainer>
          <ProgressBarTrack>
            <ProgressBarFill $progress={progress} />
          </ProgressBarTrack>
        </ProgressBarContainer>

        <StepList>
          {steps.map(step => (
            <StepItem
              key={step.id}
              $completed={step.completed}
              onClick={() => !step.completed && navigate(step.route)}
            >
              <StepIcon $completed={step.completed}>
                {step.completed ? <CheckCircle2 /> : <Circle />}
              </StepIcon>
              <StepContent>
                <StepTitle $completed={step.completed}>{step.title}</StepTitle>
                {!step.completed && (
                  <StepDescription>{step.description}</StepDescription>
                )}
              </StepContent>
              <StepArrow $completed={step.completed}>
                <ChevronRight />
              </StepArrow>
            </StepItem>
          ))}
        </StepList>
      </Card>
    </Wrapper>
  );
};

export default SetupChecklist;
