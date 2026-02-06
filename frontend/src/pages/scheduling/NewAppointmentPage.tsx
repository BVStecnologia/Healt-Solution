import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { theme } from '../../styles/GlobalStyle';
import { useAppointments } from '../../hooks/useAppointments';
import { useProviders } from '../../hooks/useProviders';
import { useAvailability } from '../../hooks/useAvailability';
import { useEligibility } from '../../hooks/useEligibility';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProviderSelect from '../../components/scheduling/ProviderSelect';
import TimeSlotPicker from '../../components/scheduling/TimeSlotPicker';
import EligibilityAlert from '../../components/scheduling/EligibilityAlert';
import type { AppointmentType, Provider, TimeSlot } from '../../types/database';

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.surface};
  cursor: pointer;
  color: ${theme.colors.text};

  &:hover {
    background: ${theme.colors.border};
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0;
`;

const Steps = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  background: ${props =>
    props.$completed
      ? theme.colors.success
      : props.$active
      ? theme.colors.primary
      : theme.colors.border};
  color: ${props => (props.$active || props.$completed ? 'white' : theme.colors.textSecondary)};
  font-size: 13px;
  font-weight: 500;

  span {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${props => (props.$active || props.$completed ? 'white' : theme.colors.textSecondary)};
    color: ${props =>
      props.$completed
        ? theme.colors.success
        : props.$active
        ? theme.colors.primary
        : theme.colors.border};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
  }
`;

const StepContent = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const TypeCard = styled.button<{ $selected: boolean; $disabled: boolean }>`
  padding: ${theme.spacing.lg};
  border: 2px solid ${props =>
    props.$selected ? theme.colors.primary : props.$disabled ? theme.colors.border : theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${props =>
    props.$selected ? theme.colors.primaryA10 : props.$disabled ? theme.colors.borderA30 : theme.colors.surface};
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'pointer')};
  text-align: left;
  opacity: ${props => (props.$disabled ? 0.6 : 1)};
  transition: all 0.2s ease;

  &:hover {
    ${props =>
      !props.$disabled &&
      !props.$selected &&
      `border-color: ${theme.colors.primary};`}
  }
`;

const TypeName = styled.div<{ $selected: boolean }>`
  font-size: 15px;
  font-weight: 500;
  color: ${props => (props.$selected ? theme.colors.primary : theme.colors.text)};
  margin-bottom: ${theme.spacing.xs};
`;

const TypeDescription = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const Summary = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${theme.spacing.sm} 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const SummaryLabel = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: 14px;
`;

const SummaryValue = styled.span`
  color: ${theme.colors.text};
  font-size: 14px;
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
`;

const ErrorAlert = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: ${theme.borderRadius.md};
  color: #991B1B;
  font-size: 14px;
  margin-bottom: ${theme.spacing.md};

  svg {
    flex-shrink: 0;
    color: #DC2626;
  }
`;

const appointmentTypes: { type: AppointmentType; name: string; description: string }[] = [
  { type: 'initial_consultation', name: 'Consulta Inicial', description: 'Primeira consulta com o médico' },
  { type: 'follow_up', name: 'Retorno', description: 'Acompanhamento de tratamento' },
  { type: 'hormone_check', name: 'Avaliação Hormonal', description: 'Verificação de níveis hormonais' },
  { type: 'lab_review', name: 'Revisão de Exames', description: 'Análise de resultados laboratoriais' },
  { type: 'nutrition', name: 'Nutrição', description: 'Consulta com nutricionista' },
  { type: 'health_coaching', name: 'Health Coaching', description: 'Sessão de coaching de saúde' },
];

const NewAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAppointment } = useAppointments();
  const { providers, loading: providersLoading } = useProviders();
  const { slots, loading: slotsLoading, fetchSlots, clearSlots } = useAvailability();
  const { eligibility, loading: eligibilityLoading, checkEligibility } = useEligibility();

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  // Iniciar com amanhã (regra de 24h mínimas, sincronizado com TimeSlotPicker)
  const [selectedDate, setSelectedDate] = useState<Date>(() => addDays(startOfDay(new Date()), 1));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Verificar elegibilidade quando tipo é selecionado
  useEffect(() => {
    if (selectedType) {
      checkEligibility(selectedType);
    }
  }, [selectedType, checkEligibility]);

  // Buscar slots quando provider e data mudam
  useEffect(() => {
    if (selectedProvider && selectedType) {
      fetchSlots(selectedProvider.id, format(selectedDate, 'yyyy-MM-dd'), selectedType);
    }
  }, [selectedProvider, selectedDate, selectedType, fetchSlots]);

  const handleTypeSelect = (type: AppointmentType) => {
    setSelectedType(type);
    setSelectedProvider(null);
    setSelectedSlot(null);
    clearSlots();
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedProvider || !selectedSlot) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      await createAppointment({
        provider_id: selectedProvider.id,
        type: selectedType,
        scheduled_at: selectedSlot.start,
      });
      navigate('/appointments');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const msg = error?.message || error?.details || '';
      if (msg.includes('24')) {
        setSubmitError('Agendamentos devem ser feitos com pelo menos 24 horas de antecedência.');
      } else if (msg.includes('conflict') || msg.includes('já existe') || msg.includes('already')) {
        setSubmitError('Já existe uma consulta agendada neste horário.');
      } else if (msg.includes('slot') || msg.includes('disponível') || msg.includes('available')) {
        setSubmitError('Este horário não está mais disponível. Selecione outro.');
      } else {
        setSubmitError('Não foi possível agendar a consulta. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedStep1 = selectedType && eligibility?.eligible;
  const canProceedStep2 = selectedProvider;
  const canProceedStep3 = selectedSlot;

  const getProviderName = () => {
    if (!selectedProvider?.profile) return '';
    return `Dr(a). ${selectedProvider.profile.first_name} ${selectedProvider.profile.last_name}`;
  };

  const getTypeName = () => {
    return appointmentTypes.find(t => t.type === selectedType)?.name || '';
  };

  return (
    <Layout>
      <PageHeader>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </BackButton>
        <Title>Nova Consulta</Title>
      </PageHeader>

      <Steps>
        <Step $active={step === 1} $completed={step > 1}>
          <span>{step > 1 ? <Check size={12} /> : '1'}</span>
          Tipo
        </Step>
        <Step $active={step === 2} $completed={step > 2}>
          <span>{step > 2 ? <Check size={12} /> : '2'}</span>
          Médico
        </Step>
        <Step $active={step === 3} $completed={step > 3}>
          <span>{step > 3 ? <Check size={12} /> : '3'}</span>
          Horário
        </Step>
        <Step $active={step === 4} $completed={false}>
          <span>4</span>
          Confirmar
        </Step>
      </Steps>

      {/* Step 1: Tipo de Consulta */}
      {step === 1 && (
        <StepContent>
          <Card padding="large">
            <h3 style={{ margin: `0 0 ${theme.spacing.lg}` }}>
              Selecione o tipo de consulta
            </h3>

            <TypeGrid>
              {appointmentTypes.map(({ type, name, description }) => (
                <TypeCard
                  key={type}
                  $selected={selectedType === type}
                  $disabled={false}
                  onClick={() => handleTypeSelect(type)}
                >
                  <TypeName $selected={selectedType === type}>{name}</TypeName>
                  <TypeDescription>{description}</TypeDescription>
                </TypeCard>
              ))}
            </TypeGrid>

            {selectedType && (
              <div style={{ marginTop: theme.spacing.lg }}>
                <EligibilityAlert
                  eligibility={eligibility}
                  loading={eligibilityLoading}
                />
              </div>
            )}

            <Actions style={{ marginTop: theme.spacing.xl }}>
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
              >
                Continuar
              </Button>
            </Actions>
          </Card>
        </StepContent>
      )}

      {/* Step 2: Selecionar Médico */}
      {step === 2 && (
        <StepContent>
          <Card padding="large">
            <ProviderSelect
              providers={providers}
              selectedId={selectedProvider?.id || null}
              onSelect={handleProviderSelect}
              loading={providersLoading}
            />

            <Actions style={{ marginTop: theme.spacing.xl }}>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
              >
                Continuar
              </Button>
            </Actions>
          </Card>
        </StepContent>
      )}

      {/* Step 3: Selecionar Horário */}
      {step === 3 && (
        <StepContent>
          <Card padding="large">
            <TimeSlotPicker
              slots={slots}
              selectedSlot={selectedSlot?.start || null}
              onSelectSlot={handleSlotSelect}
              onDateChange={handleDateChange}
              loading={slotsLoading}
            />

            <Actions style={{ marginTop: theme.spacing.xl }}>
              <Button variant="ghost" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
              >
                Continuar
              </Button>
            </Actions>
          </Card>
        </StepContent>
      )}

      {/* Step 4: Confirmação */}
      {step === 4 && (
        <StepContent>
          <Card padding="large">
            <h3 style={{ margin: `0 0 ${theme.spacing.lg}` }}>
              Confirme os dados da consulta
            </h3>

            <Summary>
              <SummaryRow>
                <SummaryLabel>Tipo de consulta</SummaryLabel>
                <SummaryValue>{getTypeName()}</SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>Médico</SummaryLabel>
                <SummaryValue>{getProviderName()}</SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>Data</SummaryLabel>
                <SummaryValue>
                  {selectedSlot && (() => {
                    const d = new Date(selectedSlot.start);
                    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
                  })()}
                </SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>Horário</SummaryLabel>
                <SummaryValue>
                  {selectedSlot && (() => {
                    const d = new Date(selectedSlot.start);
                    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
                  })()}
                </SummaryValue>
              </SummaryRow>
            </Summary>

            {submitError && (
              <ErrorAlert>
                <AlertTriangle size={18} />
                {submitError}
              </ErrorAlert>
            )}

            <Actions>
              <Button variant="ghost" onClick={() => { setSubmitError(null); setStep(3); }}>
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={submitting}
              >
                Confirmar Agendamento
              </Button>
            </Actions>
          </Card>
        </StepContent>
      )}
    </Layout>
  );
};

export default NewAppointmentPage;
