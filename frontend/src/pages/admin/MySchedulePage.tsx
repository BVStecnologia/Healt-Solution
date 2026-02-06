import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Clock,
  Save,
  AlertCircle,
  Check,
  Calendar,
  Loader2,
  Stethoscope,
  ChevronDown,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { useCurrentProvider } from '../../hooks/useCurrentProvider';

// ============================================
// TYPES
// ============================================
interface ScheduleItem {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ProviderOption {
  id: string;
  name: string;
  specialty: string;
}

// ============================================
// CONSTANTS
// ============================================
const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const DEFAULT_SCHEDULES: ScheduleItem[] = DAYS_OF_WEEK.map(day => ({
  day_of_week: day.value,
  start_time: '08:00',
  end_time: '18:00',
  is_active: day.value >= 1 && day.value <= 5,
}));

// ============================================
// THEME
// ============================================
const luxuryTheme = {
  primary: '#92563E',
  primaryLight: '#AF8871',
  primarySoft: '#F4E7DE',
  primaryDark: '#7A4832',
  cream: '#FDF8F3',
  surface: '#FFFFFF',
  border: '#E5E0DB',
  text: '#393939',
  textSecondary: '#8C8B8B',
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
};

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// ============================================
// STYLED COMPONENTS
// ============================================
const PageContainer = styled.div``;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
  animation: ${fadeInUp} 0.6s ease-out;

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: ${luxuryTheme.text};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;

    svg {
      color: ${luxuryTheme.primary};
    }
  }

  p {
    color: ${luxuryTheme.textSecondary};
    margin: 4px 0 0;
    font-size: 14px;
  }
`;

const ProviderSelect = styled.div`
  position: relative;
  margin-bottom: 24px;
  animation: ${fadeInUp} 0.6s ease-out 0.05s both;

  select {
    width: 100%;
    max-width: 400px;
    padding: 12px 40px 12px 16px;
    border: 1px solid ${luxuryTheme.border};
    border-radius: 12px;
    font-size: 14px;
    color: ${luxuryTheme.text};
    background: ${luxuryTheme.surface};
    cursor: pointer;
    appearance: none;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: ${luxuryTheme.primary};
    }
  }

  svg {
    position: absolute;
    right: calc(100% - 400px + 14px);
    top: 50%;
    transform: translateY(-50%);
    color: ${luxuryTheme.textSecondary};
    pointer-events: none;

    @media (min-width: 401px) {
      right: auto;
      left: 376px;
    }
  }

  @media (max-width: 480px) {
    select {
      max-width: 100%;
    }
    svg {
      right: 14px;
      left: auto;
    }
  }
`;

const Card = styled.div`
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 16px;
  padding: 32px;
  animation: ${fadeInUp} 0.6s ease-out 0.1s both;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${luxuryTheme.text};
  margin: 0 0 24px;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${luxuryTheme.primary};
  }
`;

const ScheduleGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ScheduleRow = styled.div<{ $active?: boolean }>`
  display: grid;
  grid-template-columns: 100px 1fr 1fr 40px;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: ${props => props.$active ? `${luxuryTheme.primary}08` : luxuryTheme.cream};
  border-radius: 10px;
  border: 1px solid ${props => props.$active ? `${luxuryTheme.primary}20` : luxuryTheme.border};
  opacity: ${props => props.$active ? 1 : 0.6};
  transition: all 0.3s ease;

  .day-label {
    font-weight: 600;
    color: ${props => props.$active ? luxuryTheme.primary : luxuryTheme.textSecondary};
    font-size: 13px;
  }

  input[type="time"] {
    padding: 8px 12px;
    border: 1px solid ${luxuryTheme.border};
    border-radius: 8px;
    font-size: 13px;
    color: ${luxuryTheme.text};
    background: ${luxuryTheme.surface};

    &:focus {
      outline: none;
      border-color: ${luxuryTheme.primary};
    }

    &:disabled {
      background: ${luxuryTheme.border};
      cursor: not-allowed;
    }
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: ${luxuryTheme.primary};
  }

  @media (max-width: 480px) {
    grid-template-columns: 70px 1fr 1fr 32px;
    gap: 8px;
    padding: 10px 12px;

    .day-label {
      font-size: 12px;
    }

    input[type="time"] {
      padding: 6px 8px;
      font-size: 12px;
    }
  }
`;

const Alert = styled.div<{ $variant: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
  animation: ${fadeInUp} 0.3s ease-out;
  background: ${props => props.$variant === 'success' ? luxuryTheme.successLight : luxuryTheme.errorLight};
  color: ${props => props.$variant === 'success' ? luxuryTheme.success : luxuryTheme.error};
  border: 1px solid ${props => props.$variant === 'success' ? `${luxuryTheme.success}30` : `${luxuryTheme.error}30`};
`;

const SaveButton = styled.button<{ $saving?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 32px;
  background: linear-gradient(145deg, ${luxuryTheme.primary}, ${luxuryTheme.primaryDark});
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 24px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(146, 86, 62, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.6s ease-out 0.2s both;
`;

const SummaryCard = styled.div`
  background: ${luxuryTheme.surface};
  border: 1px solid ${luxuryTheme.border};
  border-radius: 12px;
  padding: 20px;
  text-align: center;

  .value {
    font-size: 28px;
    font-weight: 700;
    color: ${luxuryTheme.primary};
    margin-bottom: 4px;
  }

  .label {
    font-size: 13px;
    color: ${luxuryTheme.textSecondary};
    font-weight: 500;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: ${luxuryTheme.textSecondary};
  font-size: 15px;

  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ============================================
// COMPONENT
// ============================================
const MySchedulePage: React.FC = () => {
  const { providerId, loading: providerLoading, isAdmin } = useCurrentProvider();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Admin: lista de providers para selecionar
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // O ID efetivo: para provider usa o próprio, para admin usa o selecionado
  const effectiveProviderId = isAdmin ? selectedProviderId : providerId;

  // Admin: carregar lista de providers
  useEffect(() => {
    if (!isAdmin) return;

    const loadProviders = async () => {
      const { data } = await supabase
        .from('providers')
        .select('id, specialty, user_id, profiles:profiles!providers_user_id_fkey(first_name, last_name)')
        .eq('is_active', true)
        .order('created_at');

      if (data && data.length > 0) {
        const options = data.map((p: any) => ({
          id: p.id,
          name: p.profiles ? `Dr(a). ${p.profiles.first_name} ${p.profiles.last_name}` : 'Sem nome',
          specialty: p.specialty || '',
        }));
        setProviders(options);
        // Auto-selecionar o primeiro
        setSelectedProviderId(options[0].id);
      }
    };

    loadProviders();
  }, [isAdmin]);

  // Provider direto: setar loading false se não tem providerId
  useEffect(() => {
    if (!isAdmin && !providerLoading && !providerId) {
      setLoading(false);
    }
  }, [isAdmin, providerLoading, providerId]);

  const loadSchedules = useCallback(async () => {
    if (!effectiveProviderId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', effectiveProviderId);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const mergedSchedules = DAYS_OF_WEEK.map(day => {
          const existing = data.find(s => s.day_of_week === day.value);
          if (existing) {
            return {
              day_of_week: existing.day_of_week,
              start_time: existing.start_time,
              end_time: existing.end_time,
              is_active: existing.is_active,
            };
          }
          return {
            day_of_week: day.value,
            start_time: '08:00',
            end_time: '18:00',
            is_active: false,
          };
        });
        setSchedules(mergedSchedules);
      } else {
        setSchedules([...DEFAULT_SCHEDULES]);
      }
    } catch (err) {
      console.error('Erro ao carregar horários:', err);
      setError('Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  }, [effectiveProviderId]);

  useEffect(() => {
    if (effectiveProviderId) {
      loadSchedules();
    }
  }, [effectiveProviderId, loadSchedules]);

  const handleSave = async () => {
    if (!effectiveProviderId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Delete existing schedules
      const { error: deleteError } = await supabase
        .from('provider_schedules')
        .delete()
        .eq('provider_id', effectiveProviderId);

      if (deleteError) throw deleteError;

      // Insert active schedules
      const activeSchedules = schedules
        .filter(s => s.is_active)
        .map(s => ({
          provider_id: effectiveProviderId,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          slot_duration: 30,
          is_active: true,
        }));

      if (activeSchedules.length > 0) {
        const { error: insertError } = await supabase
          .from('provider_schedules')
          .insert(activeSchedules);

        if (insertError) throw insertError;
      }

      setSuccess('Horários salvos com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.message || 'Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  // Summary stats
  const activeDays = schedules.filter(s => s.is_active).length;
  const totalHours = schedules
    .filter(s => s.is_active)
    .reduce((acc, s) => {
      const [startH, startM] = s.start_time.split(':').map(Number);
      const [endH, endM] = s.end_time.split(':').map(Number);
      return acc + (endH + endM / 60) - (startH + startM / 60);
    }, 0);

  const selectedProviderName = isAdmin
    ? providers.find(p => p.id === selectedProviderId)?.name || ''
    : '';

  if (providerLoading) {
    return (
      <AdminLayout>
        <LoadingContainer>
          <Loader2 size={32} />
          Carregando...
        </LoadingContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <div>
            <h1>
              <Clock size={28} />
              {isAdmin ? 'Agenda do Médico' : 'Minha Agenda'}
            </h1>
            <p>
              {isAdmin
                ? 'Gerencie os dias e horários de atendimento dos médicos'
                : 'Gerencie seus dias e horários de atendimento'}
            </p>
          </div>
        </Header>

        {/* Admin: seletor de provider */}
        {isAdmin && providers.length > 0 && (
          <ProviderSelect>
            <select
              value={selectedProviderId || ''}
              onChange={(e) => setSelectedProviderId(e.target.value)}
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.specialty}
                </option>
              ))}
            </select>
            <ChevronDown size={18} />
          </ProviderSelect>
        )}

        {/* Provider sem registro */}
        {!isAdmin && !providerId && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px', color: luxuryTheme.textSecondary }}>
              <Stethoscope size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 8px', color: luxuryTheme.text }}>Perfil de médico não encontrado</h3>
              <p style={{ margin: 0 }}>Sua conta não está vinculada a um registro de médico.</p>
            </div>
          </Card>
        )}

        {/* Conteúdo principal - quando tem provider selecionado */}
        {effectiveProviderId && (
          <>
            {!loading && (
              <SummaryGrid>
                <SummaryCard>
                  <div className="value">{activeDays}</div>
                  <div className="label">Dias ativos</div>
                </SummaryCard>
                <SummaryCard>
                  <div className="value">{totalHours.toFixed(0)}h</div>
                  <div className="label">Horas semanais</div>
                </SummaryCard>
                <SummaryCard>
                  <div className="value">
                    {schedules.filter(s => s.is_active).length > 0
                      ? schedules.filter(s => s.is_active)[0].start_time
                      : '--:--'}
                  </div>
                  <div className="label">Primeiro horário</div>
                </SummaryCard>
              </SummaryGrid>
            )}

            <Card>
              <SectionTitle>
                <Calendar size={20} />
                Horários de Trabalho{selectedProviderName ? ` — ${selectedProviderName}` : ''}
              </SectionTitle>

              {error && (
                <Alert $variant="error">
                  <AlertCircle size={18} />
                  {error}
                </Alert>
              )}

              {success && (
                <Alert $variant="success">
                  <Check size={18} />
                  {success}
                </Alert>
              )}

              {loading ? (
                <LoadingContainer>
                  <Loader2 size={28} />
                  Carregando horários...
                </LoadingContainer>
              ) : (
                <>
                  <ScheduleGrid>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <ScheduleRow key={day.value} $active={schedules[index]?.is_active}>
                        <span className="day-label">{day.label}</span>
                        <input
                          type="time"
                          value={schedules[index]?.start_time || '08:00'}
                          onChange={(e) => {
                            const newSchedules = [...schedules];
                            newSchedules[index] = { ...newSchedules[index], start_time: e.target.value };
                            setSchedules(newSchedules);
                          }}
                          disabled={!schedules[index]?.is_active}
                        />
                        <input
                          type="time"
                          value={schedules[index]?.end_time || '18:00'}
                          onChange={(e) => {
                            const newSchedules = [...schedules];
                            newSchedules[index] = { ...newSchedules[index], end_time: e.target.value };
                            setSchedules(newSchedules);
                          }}
                          disabled={!schedules[index]?.is_active}
                        />
                        <input
                          type="checkbox"
                          checked={schedules[index]?.is_active || false}
                          onChange={(e) => {
                            const newSchedules = [...schedules];
                            newSchedules[index] = { ...newSchedules[index], is_active: e.target.checked };
                            setSchedules(newSchedules);
                          }}
                        />
                      </ScheduleRow>
                    ))}
                  </ScheduleGrid>

                  <SaveButton onClick={handleSave} disabled={saving} $saving={saving}>
                    {saving ? (
                      <>
                        <Loader2 size={18} />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Salvar Horários
                      </>
                    )}
                  </SaveButton>
                </>
              )}
            </Card>
          </>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default MySchedulePage;
