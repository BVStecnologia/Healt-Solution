import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Heart, Brain, Sparkles, Droplets, Stethoscope, Dna, Clock, ChevronLeft, Video, Building2 } from 'lucide-react';
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
import { getTreatmentLabel, getTreatmentsByCategory, getTreatmentDuration, getTreatmentPrice, formatPriceShort } from '../../constants/treatments';

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
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing.xl};
  padding: 0 ${theme.spacing.md};
`;

const StepItem = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StepCircle = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  flex-shrink: 0;
  background: ${props =>
    props.$completed
      ? theme.colors.primary
      : props.$active
      ? theme.colors.primary
      : 'transparent'};
  color: ${props =>
    props.$completed || props.$active
      ? 'white'
      : theme.colors.textSecondary};
  border: 2px solid ${props =>
    props.$completed || props.$active
      ? theme.colors.primary
      : '#D5CFC9'};
`;

const StepLabel = styled.span<{ $active: boolean; $completed: boolean }>`
  font-size: 13px;
  font-weight: ${props => props.$active ? 600 : 400};
  color: ${props =>
    props.$active
      ? theme.colors.text
      : props.$completed
      ? theme.colors.primary
      : theme.colors.textSecondary};
  transition: all 0.3s ease;

  @media (max-width: 600px) {
    display: none;
  }
`;

const StepConnector = styled.div<{ $completed: boolean }>`
  width: 48px;
  height: 2px;
  margin: 0 4px;
  border-radius: 1px;
  background: ${props => props.$completed ? theme.colors.primary : '#D5CFC9'};
  transition: background 0.3s ease;

  @media (max-width: 600px) {
    width: 24px;
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

const CATEGORY_ICONS_LARGE: Record<string, (size: number) => React.ReactNode> = {
  wellbeing: (s) => <Heart size={s} />,
  personalized: (s) => <Brain size={s} />,
  rejuvenation: (s) => <Sparkles size={s} />,
  iv_therapy: (s) => <Droplets size={s} />,
  peptide_therapy: (s) => <Dna size={s} />,
  general: (s) => <Stethoscope size={s} />,
};

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CategoryCard = styled.button<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.xl};
  background: ${theme.colors.surface};
  cursor: pointer;
  text-align: left;
  transition: all 0.25s ease;

  &:hover {
    border-color: ${props => props.$color};
    box-shadow: 0 4px 16px ${props => props.$color}18;
    transform: translateY(-2px);
  }
`;

const CategoryIconWrap = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.lg};
  background: ${props => props.$color}14;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${props => props.$color};
`;

const CategoryCardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CategoryCardName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin-bottom: 2px;
`;

const CategoryCardCount = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const CategoryCardArrow = styled.div`
  color: ${theme.colors.textSecondary};
  flex-shrink: 0;
`;

const SubStepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.lg};
`;

const SubStepBack = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.surface};
  cursor: pointer;
  color: ${theme.colors.textSecondary};
  transition: all 0.15s ease;

  &:hover {
    background: ${theme.colors.border};
    color: ${theme.colors.text};
  }
`;

const SubStepTitle = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$color};

  svg {
    color: ${props => props.$color};
  }
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const DurationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: ${theme.colors.textSecondary};
  background: ${theme.colors.background};
  padding: 2px 6px;
  border-radius: 8px;
`;

const PriceBadge = styled.span<{ $variable?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.$variable ? theme.colors.textSecondary : theme.colors.primary};
  background: ${props => props.$variable ? theme.colors.background : `${theme.colors.primary}10`};
  padding: 2px 6px;
  border-radius: 8px;
  font-style: ${props => props.$variable ? 'italic' : 'normal'};
`;

const ModalityToggle = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.sm};
`;

const ModalityOption = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border: 2px solid ${props => props.$active ? theme.colors.primary : theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${props => props.$active ? theme.colors.primaryA10 : theme.colors.surface};
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: 14px;
  font-weight: ${props => props.$active ? 600 : 400};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.primary};
  }

  svg {
    flex-shrink: 0;
  }
`;

const ModalityLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  margin-top: ${theme.spacing.lg};
`;

const NewAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createAppointment } = useAppointments();
  const { providers, loading: providersLoading } = useProviders();
  const { slots, loading: slotsLoading, fetchSlots, clearSlots } = useAvailability();
  const { eligibility, loading: eligibilityLoading, checkEligibility } = useEligibility();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  // Iniciar com amanhã (regra de 24h mínimas, sincronizado com TimeSlotPicker)
  const [selectedDate, setSelectedDate] = useState<Date>(() => addDays(startOfDay(new Date()), 1));
  const [selectedModality, setSelectedModality] = useState<'in_office' | 'telehealth'>('in_office');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Verificar elegibilidade quando tipo é selecionado
  useEffect(() => {
    if (selectedType) {
      checkEligibility(selectedType).catch(() => {});
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
        modality: selectedModality,
      });
      navigate('/appointments');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const msg = error?.message || error?.details || '';
      if (msg.includes('24')) {
        setSubmitError(t('booking.error24h'));
      } else if (msg.includes('conflict') || msg.includes('já existe') || msg.includes('already')) {
        setSubmitError(t('booking.errorConflict'));
      } else if (msg.includes('slot') || msg.includes('disponível') || msg.includes('available')) {
        setSubmitError(t('booking.errorUnavailable'));
      } else {
        setSubmitError(t('booking.errorGeneric'));
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
    return `${t('common.drPrefix')} ${selectedProvider.profile.first_name} ${selectedProvider.profile.last_name}`;
  };

  const getTypeName = () => {
    return selectedType ? getTreatmentLabel(selectedType, i18n.language as 'pt' | 'en') : '';
  };

  return (
    <Layout>
      <PageHeader>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </BackButton>
        <Title>{t('booking.title')}</Title>
      </PageHeader>

      <Steps>
        {[
          { num: 1, label: t('booking.stepType') },
          { num: 2, label: t('booking.stepProvider') },
          { num: 3, label: t('booking.stepTime') },
          { num: 4, label: t('booking.stepConfirm') },
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <StepItem $active={step === s.num} $completed={step > s.num}>
              <StepCircle $active={step === s.num} $completed={step > s.num}>
                {step > s.num ? <Check size={16} /> : s.num}
              </StepCircle>
              <StepLabel $active={step === s.num} $completed={step > s.num}>
                {s.label}
              </StepLabel>
            </StepItem>
            {i < 3 && <StepConnector $completed={step > s.num} />}
          </React.Fragment>
        ))}
      </Steps>

      {/* Step 1: Tipo de Consulta (2 sub-steps: category → treatment) */}
      {step === 1 && !selectedCategory && (
        <StepContent>
          <Card padding="large">
            <h3 style={{ margin: `0 0 ${theme.spacing.lg}` }}>
              {t('booking.categoryPrompt')}
            </h3>

            <CategoryGrid>
              {getTreatmentsByCategory().map(({ category, treatments }) => (
                <CategoryCard
                  key={category.key}
                  $color={category.color}
                  onClick={() => setSelectedCategory(category.key)}
                >
                  <CategoryIconWrap $color={category.color}>
                    {CATEGORY_ICONS_LARGE[category.key]?.(24)}
                  </CategoryIconWrap>
                  <CategoryCardInfo>
                    <CategoryCardName>{i18n.language === 'en' ? category.labelEn : category.label}</CategoryCardName>
                    <CategoryCardCount>
                      {treatments.length} {treatments.length === 1 ? t('booking.treatmentSingular') : t('booking.treatmentPlural')}
                    </CategoryCardCount>
                  </CategoryCardInfo>
                  <CategoryCardArrow>
                    <ArrowRight size={18} />
                  </CategoryCardArrow>
                </CategoryCard>
              ))}
            </CategoryGrid>
          </Card>
        </StepContent>
      )}

      {step === 1 && selectedCategory && (
        <StepContent>
          <Card padding="large">
            {(() => {
              const group = getTreatmentsByCategory().find(g => g.category.key === selectedCategory);
              if (!group) return null;
              return (
                <>
                  <SubStepHeader>
                    <SubStepBack onClick={() => { setSelectedCategory(null); setSelectedType(null); }}>
                      <ChevronLeft size={18} />
                    </SubStepBack>
                    <SubStepTitle $color={group.category.color}>
                      {CATEGORY_ICONS_LARGE[group.category.key]?.(20)}
                      {i18n.language === 'en' ? group.category.labelEn : group.category.label}
                    </SubStepTitle>
                  </SubStepHeader>

                  <TypeGrid>
                    {group.treatments.map(tr => (
                      <TypeCard
                        key={tr.key}
                        $selected={selectedType === tr.key}
                        $disabled={false}
                        onClick={() => handleTypeSelect(tr.key as AppointmentType)}
                      >
                        <TypeName $selected={selectedType === tr.key}>{i18n.language === 'en' ? tr.labelEn : tr.label}</TypeName>
                        <TypeDescription>{i18n.language === 'en' ? tr.descriptionEn : tr.description}</TypeDescription>
                        <BadgeRow>
                          <DurationBadge>
                            <Clock size={10} />
                            {tr.duration} min
                          </DurationBadge>
                          <PriceBadge $variable={tr.priceUsd === null}>
                            {formatPriceShort(tr.priceUsd)}
                          </PriceBadge>
                        </BadgeRow>
                      </TypeCard>
                    ))}
                  </TypeGrid>

                  {selectedType && (
                    <>
                      <div style={{ marginTop: theme.spacing.lg }}>
                        <EligibilityAlert
                          eligibility={eligibility}
                          loading={eligibilityLoading}
                        />
                      </div>

                      <ModalityLabel>{t('booking.modalityLabel', 'Modality')}</ModalityLabel>
                      <ModalityToggle>
                        <ModalityOption
                          $active={selectedModality === 'in_office'}
                          onClick={() => setSelectedModality('in_office')}
                        >
                          <Building2 size={18} />
                          {t('booking.inOffice', 'In-Office')}
                        </ModalityOption>
                        <ModalityOption
                          $active={selectedModality === 'telehealth'}
                          onClick={() => setSelectedModality('telehealth')}
                        >
                          <Video size={18} />
                          {t('booking.telehealth', 'Telehealth')}
                        </ModalityOption>
                      </ModalityToggle>
                    </>
                  )}

                  <Actions style={{ marginTop: theme.spacing.xl }}>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!canProceedStep1}
                    >
                      {t('common.continue')}
                    </Button>
                  </Actions>
                </>
              );
            })()}
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
                {t('common.back')}
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
                {t('common.back')}
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
              {t('booking.confirmPrompt')}
            </h3>

            <Summary>
              <SummaryRow>
                <SummaryLabel>{t('booking.summaryType')}</SummaryLabel>
                <SummaryValue>{getTypeName()}</SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>{t('booking.summaryProvider')}</SummaryLabel>
                <SummaryValue>{getProviderName()}</SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>{t('booking.modalityLabel', 'Modality')}</SummaryLabel>
                <SummaryValue style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedModality === 'telehealth' ? <Video size={14} /> : <Building2 size={14} />}
                  {selectedModality === 'telehealth' ? t('booking.telehealth', 'Telehealth') : t('booking.inOffice', 'In-Office')}
                </SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>{t('booking.summaryDate')}</SummaryLabel>
                <SummaryValue>
                  {selectedSlot && (() => {
                    const d = new Date(selectedSlot.start);
                    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
                  })()}
                </SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>{t('booking.summaryTime')}</SummaryLabel>
                <SummaryValue>
                  {selectedSlot && (() => {
                    const d = new Date(selectedSlot.start);
                    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
                  })()}
                </SummaryValue>
              </SummaryRow>
              {selectedType && (
                <SummaryRow>
                  <SummaryLabel>{t('booking.summaryPrice')}</SummaryLabel>
                  <SummaryValue style={{
                    color: getTreatmentPrice(selectedType) === null ? theme.colors.textSecondary : theme.colors.primary,
                    fontStyle: getTreatmentPrice(selectedType) === null ? 'italic' : 'normal',
                  }}>
                    {getTreatmentPrice(selectedType) !== null
                      ? formatPriceShort(getTreatmentPrice(selectedType))
                      : t('booking.priceVariable')}
                  </SummaryValue>
                </SummaryRow>
              )}
            </Summary>

            {submitError && (
              <ErrorAlert>
                <AlertTriangle size={18} />
                {submitError}
              </ErrorAlert>
            )}

            <Actions>
              <Button variant="ghost" onClick={() => { setSubmitError(null); setStep(3); }}>
                {t('common.back')}
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={submitting}
              >
                {t('booking.confirmButton')}
              </Button>
            </Actions>
          </Card>
        </StepContent>
      )}
    </Layout>
  );
};

export default NewAppointmentPage;
