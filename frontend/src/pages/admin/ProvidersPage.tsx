import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { UserCog, Plus, Search, Edit2, Trash2, Check, AlertCircle, Stethoscope, Calendar, Clock, X } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { createProvider, getProfileByEmail, promoteToProvider, supabaseAdmin } from '../../lib/adminService';
import { Profile, Provider, ProviderSchedule } from '../../types/database';

interface ProviderWithProfile extends Provider {
  profile: Profile;
}

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 28px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0 0 ${theme.spacing.xs};
  }

  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.lg};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.primaryHover};
    transform: translateY(-1px);
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing.lg};

  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: ${theme.colors.text};
    outline: none;

    &::placeholder {
      color: ${theme.colors.textSecondary};
    }
  }

  svg {
    color: ${theme.colors.textSecondary};
  }
`;

const Table = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.sm};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 100px 150px;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 100px 150px;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  align-items: center;
  transition: background 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${theme.colors.background};
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${theme.colors.text};
`;

const UserEmail = styled.div`
  color: ${theme.colors.textSecondary};
  font-size: 14px;
`;

const Badge = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.$active ? `${theme.colors.success}15` : `${theme.colors.error}15`};
  color: ${props => props.$active ? theme.colors.success : theme.colors.error};
`;

const Actions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const ActionButton = styled.button<{ $variant?: 'danger' | 'info' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${props => {
    if (props.$variant === 'danger') return `${theme.colors.error}15`;
    if (props.$variant === 'info') return `${theme.colors.info}15`;
    return `${theme.colors.primary}15`;
  }};
  color: ${props => {
    if (props.$variant === 'danger') return theme.colors.error;
    if (props.$variant === 'info') return theme.colors.info;
    return theme.colors.primary;
  }};
  border: none;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${props => {
      if (props.$variant === 'danger') return `${theme.colors.error}25`;
      if (props.$variant === 'info') return `${theme.colors.info}25`;
      return `${theme.colors.primary}25`;
    }};
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.md};
`;

const ModalContent = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 600px;
  box-shadow: ${theme.shadows.lg};
  max-height: 90vh;
  overflow-y: auto;

  h2 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 20px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0 0 ${theme.spacing.lg};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};

  label {
    display: block;
    font-weight: 500;
    color: ${theme.colors.text};
    margin-bottom: ${theme.spacing.xs};
  }

  input, select, textarea {
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    font-size: 14px;
    color: ${theme.colors.text};
    transition: border-color 0.2s ease;
    box-sizing: border-box;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: ${theme.colors.primary};
    }
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }

  select {
    background: ${theme.colors.surface};
    cursor: pointer;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  label {
    margin: 0;
    cursor: pointer;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.lg};
`;

const Button = styled.button<{ $variant?: 'secondary' }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${props => props.$variant === 'secondary' ? 'transparent' : theme.colors.primary};
  color: ${props => props.$variant === 'secondary' ? theme.colors.text : 'white'};
  border: 1px solid ${props => props.$variant === 'secondary' ? theme.colors.border : 'transparent'};
  border-radius: ${theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$variant === 'secondary' ? theme.colors.background : theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  padding: 60px 40px;
  text-align: center;
  color: ${theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${theme.spacing.md};
    opacity: 0.5;
  }

  p {
    margin: 0;
  }
`;

const Alert = styled.div<{ $variant?: 'error' | 'success' | 'info' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  background: ${props => {
    if (props.$variant === 'error') return `${theme.colors.error}15`;
    if (props.$variant === 'info') return `${theme.colors.info}15`;
    return `${theme.colors.success}15`;
  }};
  color: ${props => {
    if (props.$variant === 'error') return theme.colors.error;
    if (props.$variant === 'info') return theme.colors.info;
    return theme.colors.success;
  }};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  font-size: 14px;
`;

const ScheduleSection = styled.div`
  margin-top: ${theme.spacing.lg};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: ${theme.colors.text};
    margin: 0 0 ${theme.spacing.md};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }
`;

const ScheduleGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const ScheduleRow = styled.div<{ $active?: boolean }>`
  display: grid;
  grid-template-columns: 100px 1fr 1fr 40px;
  gap: ${theme.spacing.sm};
  align-items: center;
  padding: ${theme.spacing.sm};
  background: ${props => props.$active ? `${theme.colors.primary}08` : theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  opacity: ${props => props.$active ? 1 : 0.6};

  .day-label {
    font-weight: 500;
    color: ${theme.colors.text};
  }

  input[type="time"] {
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    font-size: 13px;
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
`;

const SPECIALTIES = [
  'Clínico Geral',
  'Cardiologista',
  'Dermatologista',
  'Endocrinologista',
  'Ginecologista',
  'Neurologista',
  'Nutricionista',
  'Ortopedista',
  'Pediatra',
  'Psicólogo',
  'Psiquiatra',
  'Urologista',
  'Outro'
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

interface ScheduleItem {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderWithProfile | null>(null);
  const [selectedProviderForSchedule, setSelectedProviderForSchedule] = useState<ProviderWithProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialty: '',
    bio: '',
    is_active: true
  });
  const [schedules, setSchedules] = useState<ScheduleItem[]>(
    DAYS_OF_WEEK.map(day => ({
      day_of_week: day.value,
      start_time: '08:00',
      end_time: '18:00',
      is_active: day.value >= 1 && day.value <= 5, // Segunda a Sexta por padrão
    }))
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data: providersData, error: providersError } = await supabaseAdmin
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (providersError) throw providersError;

      if (!providersData || providersData.length === 0) {
        setProviders([]);
        setLoading(false);
        return;
      }

      const userIds = providersData.map(p => p.user_id);
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const combined = providersData.map(provider => ({
        ...provider,
        profile: profilesData?.find(p => p.id === provider.user_id) || {
          id: provider.user_id,
          email: '',
          first_name: 'Desconhecido',
          last_name: '',
          role: 'provider' as const,
          phone: null,
          patient_type: null,
          last_visit_at: null,
          labs_completed_at: null,
          created_at: '',
          updated_at: ''
        }
      }));

      setProviders(combined);
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (provider?: ProviderWithProfile) => {
    setTempPassword('');
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        email: provider.profile.email,
        first_name: provider.profile.first_name,
        last_name: provider.profile.last_name,
        phone: provider.profile.phone || '',
        specialty: provider.specialty,
        bio: provider.bio || '',
        is_active: provider.is_active
      });
    } else {
      setEditingProvider(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        specialty: '',
        bio: '',
        is_active: true
      });
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProvider(null);
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      specialty: '',
      bio: '',
      is_active: true
    });
    setError('');
    setTempPassword('');
  };

  const handleOpenScheduleModal = async (provider: ProviderWithProfile) => {
    setSelectedProviderForSchedule(provider);
    setError('');
    setSuccess('');

    // Carregar horários existentes
    try {
      const { data, error } = await supabaseAdmin
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', provider.id);

      if (error) throw error;

      if (data && data.length > 0) {
        // Mesclar com os dias padrão
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
        // Horários padrão
        setSchedules(
          DAYS_OF_WEEK.map(day => ({
            day_of_week: day.value,
            start_time: '08:00',
            end_time: '18:00',
            is_active: day.value >= 1 && day.value <= 5,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading schedules:', err);
    }

    setShowScheduleModal(true);
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedProviderForSchedule(null);
  };

  const handleSaveSchedules = async () => {
    if (!selectedProviderForSchedule) return;

    setSaving(true);
    setError('');

    try {
      // Deletar horários existentes
      await supabaseAdmin
        .from('provider_schedules')
        .delete()
        .eq('provider_id', selectedProviderForSchedule.id);

      // Inserir novos horários (apenas os ativos)
      const activeSchedules = schedules
        .filter(s => s.is_active)
        .map(s => ({
          provider_id: selectedProviderForSchedule.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          slot_duration: 30,
          is_active: true,
        }));

      if (activeSchedules.length > 0) {
        const { error } = await supabaseAdmin
          .from('provider_schedules')
          .insert(activeSchedules);

        if (error) throw error;
      }

      setSuccess('Horários salvos com sucesso!');
      setTimeout(() => {
        handleCloseScheduleModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.specialty) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    setError('');
    setTempPassword('');

    try {
      if (editingProvider) {
        // Atualizar médico existente
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProvider.user_id);

        if (profileError) throw profileError;

        const { error: providerError } = await supabaseAdmin
          .from('providers')
          .update({
            specialty: formData.specialty,
            bio: formData.bio || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProvider.id);

        if (providerError) throw providerError;
        setSuccess('Médico atualizado com sucesso!');
      } else {
        // Verificar se o email já existe
        const existingProfile = await getProfileByEmail(formData.email);

        if (existingProfile) {
          // Usuário existe - verificar se já é provider
          const { data: existingProvider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', existingProfile.id)
            .single();

          if (existingProvider) {
            setError('Este usuário já é um médico cadastrado.');
            setSaving(false);
            return;
          }

          // Promover para provider
          await promoteToProvider(existingProfile.id, {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            specialty: formData.specialty,
            bio: formData.bio,
            is_active: formData.is_active,
          });

          setSuccess('Usuário promovido a médico com sucesso!');
        } else {
          // Criar novo usuário e provider
          const result = await createProvider({
            email: formData.email,
            password: '', // Será gerada automaticamente
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: 'provider',
            specialty: formData.specialty,
            bio: formData.bio,
            is_active: formData.is_active,
          });

          setTempPassword(result.tempPassword);
          setSuccess(`Médico criado com sucesso!`);
          await fetchProviders();
          // Não fecha o modal - deixa aberto para mostrar a senha temporária
          setSaving(false);
          return;
        }
      }

      await fetchProviders();

      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar médico');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (provider: ProviderWithProfile) => {
    if (!window.confirm(`Remover Dr(a). ${provider.profile.first_name} ${provider.profile.last_name}?`)) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('providers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', provider.id);

      if (error) throw error;
      await fetchProviders();
    } catch (err) {
      console.error('Error deactivating provider:', err);
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.profile.first_name.toLowerCase().includes(search.toLowerCase()) ||
    provider.profile.last_name.toLowerCase().includes(search.toLowerCase()) ||
    provider.profile.email.toLowerCase().includes(search.toLowerCase()) ||
    provider.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <AdminLayout>
      <Header>
        <div>
          <h1>Médicos</h1>
          <p>Gerencie os médicos e profissionais de saúde</p>
        </div>
        <AddButton onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Adicionar Médico
        </AddButton>
      </Header>

      <SearchBar>
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, email ou especialidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchBar>

      <Table>
        <TableHeader>
          <div>Nome</div>
          <div>Email</div>
          <div>Especialidade</div>
          <div>Status</div>
          <div>Ações</div>
        </TableHeader>

        {loading ? (
          <EmptyState>
            <p>Carregando...</p>
          </EmptyState>
        ) : filteredProviders.length === 0 ? (
          <EmptyState>
            <Stethoscope />
            <p>Nenhum médico encontrado</p>
          </EmptyState>
        ) : (
          filteredProviders.map(provider => (
            <TableRow key={provider.id}>
              <UserInfo>
                <Avatar>{getInitials(provider.profile.first_name, provider.profile.last_name)}</Avatar>
                <div>
                  <UserName>Dr(a). {provider.profile.first_name} {provider.profile.last_name}</UserName>
                </div>
              </UserInfo>
              <UserEmail>{provider.profile.email}</UserEmail>
              <div>{provider.specialty}</div>
              <div>
                <Badge $active={provider.is_active}>
                  {provider.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <Actions>
                <ActionButton $variant="info" onClick={() => handleOpenScheduleModal(provider)} title="Horários">
                  <Clock size={14} />
                </ActionButton>
                <ActionButton onClick={() => handleOpenModal(provider)} title="Editar">
                  <Edit2 size={14} />
                </ActionButton>
                <ActionButton $variant="danger" onClick={() => handleDelete(provider)} title="Desativar">
                  <Trash2 size={14} />
                </ActionButton>
              </Actions>
            </TableRow>
          ))
        )}
      </Table>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>
              <UserCog size={20} />
              {editingProvider ? 'Editar Médico' : 'Adicionar Médico'}
            </h2>

            {error && (
              <Alert $variant="error">
                <AlertCircle size={16} />
                {error}
              </Alert>
            )}

            {success && (
              <Alert $variant="success">
                <Check size={16} />
                {success}
              </Alert>
            )}

            {tempPassword && (
              <Alert $variant="info">
                <AlertCircle size={16} />
                <div>
                  <strong>Senha temporária gerada:</strong><br />
                  <code style={{ fontSize: '16px', fontWeight: 'bold' }}>{tempPassword}</code><br />
                  <small>Anote esta senha! O médico deve alterá-la no primeiro acesso.</small>
                </div>
              </Alert>
            )}

            <FormGroup>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingProvider}
                placeholder="email@exemplo.com"
              />
              {!editingProvider && (
                <small style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                  Se o email não existir, uma nova conta será criada automaticamente.
                </small>
              )}
            </FormGroup>

            <FormGroup>
              <label>Nome *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Nome"
              />
            </FormGroup>

            <FormGroup>
              <label>Sobrenome *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Sobrenome"
              />
            </FormGroup>

            <FormGroup>
              <label>Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </FormGroup>

            <FormGroup>
              <label>Especialidade *</label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              >
                <option value="">Selecione...</option>
                {SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </FormGroup>

            <FormGroup>
              <label>Bio / Descrição</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Breve descrição profissional..."
              />
            </FormGroup>

            <FormGroup>
              <CheckboxGroup>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active">Médico ativo (disponível para agendamentos)</label>
              </CheckboxGroup>
            </FormGroup>

            <ModalActions>
              <Button $variant="secondary" onClick={handleCloseModal}>
                {tempPassword ? 'Fechar' : 'Cancelar'}
              </Button>
              {!tempPassword && (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Modal de Horários */}
      {showScheduleModal && selectedProviderForSchedule && (
        <Modal onClick={handleCloseScheduleModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>
              <Calendar size={20} />
              Horários de Trabalho
            </h2>
            <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.lg }}>
              Dr(a). {selectedProviderForSchedule.profile.first_name} {selectedProviderForSchedule.profile.last_name}
            </p>

            {error && (
              <Alert $variant="error">
                <AlertCircle size={16} />
                {error}
              </Alert>
            )}

            {success && (
              <Alert $variant="success">
                <Check size={16} />
                {success}
              </Alert>
            )}

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

            <ModalActions>
              <Button $variant="secondary" onClick={handleCloseScheduleModal}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSchedules} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Horários'}
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default ProvidersPage;
