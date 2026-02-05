import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit2, Trash2, Check, AlertCircle, Eye, Calendar, FileText } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { Profile, PatientType } from '../../types/database';

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

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};

  h3 {
    font-size: 28px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0 0 ${theme.spacing.xs};
  }

  p {
    font-size: 13px;
    color: ${theme.colors.textSecondary};
    margin: 0;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  flex-wrap: wrap;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  flex: 1;
  min-width: 250px;

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

const FilterSelect = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: 14px;
  color: ${theme.colors.text};
  cursor: pointer;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
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

  @media (max-width: 900px) {
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

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const Avatar = styled.div<{ type?: PatientType | null }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => {
    switch (props.type) {
      case 'vip': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'trt': return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
      case 'hormone': return 'linear-gradient(135deg, #ec4899, #db2777)';
      case 'new': return 'linear-gradient(135deg, #10b981, #059669)';
      default: return `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`;
    }
  }};
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

const Badge = styled.span<{ type?: PatientType | null }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.type) {
      case 'vip': return '#fef3c7';
      case 'trt': return '#ede9fe';
      case 'hormone': return '#fce7f3';
      case 'new': return '#d1fae5';
      default: return `${theme.colors.primary}15`;
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'vip': return '#d97706';
      case 'trt': return '#7c3aed';
      case 'hormone': return '#db2777';
      case 'new': return '#059669';
      default: return theme.colors.primary;
    }
  }};
`;

const Actions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const ActionButton = styled.button<{ variant?: 'danger' | 'info' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${props => {
    if (props.variant === 'danger') return `${theme.colors.error}15`;
    if (props.variant === 'info') return `${theme.colors.info}15`;
    return `${theme.colors.primary}15`;
  }};
  color: ${props => {
    if (props.variant === 'danger') return theme.colors.error;
    if (props.variant === 'info') return theme.colors.info;
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
      if (props.variant === 'danger') return `${theme.colors.error}25`;
      if (props.variant === 'info') return `${theme.colors.info}25`;
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
  max-width: 500px;
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

  input, select {
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    font-size: 14px;
    color: ${theme.colors.text};
    transition: border-color 0.2s ease;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: ${theme.colors.primary};
    }
  }

  select {
    background: ${theme.colors.surface};
    cursor: pointer;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.lg};
`;

const Button = styled.button<{ variant?: 'secondary' }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${props => props.variant === 'secondary' ? 'transparent' : theme.colors.primary};
  color: ${props => props.variant === 'secondary' ? theme.colors.text : 'white'};
  border: 1px solid ${props => props.variant === 'secondary' ? theme.colors.border : 'transparent'};
  border-radius: ${theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.variant === 'secondary' ? theme.colors.background : theme.colors.primaryHover};
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

const Alert = styled.div<{ variant?: 'error' | 'success' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  background: ${props => props.variant === 'error' ? `${theme.colors.error}15` : `${theme.colors.success}15`};
  color: ${props => props.variant === 'error' ? theme.colors.error : theme.colors.success};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  font-size: 14px;
`;

const DetailSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: ${theme.colors.textSecondary};
    margin: 0 0 ${theme.spacing.md};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${theme.spacing.xs} 0;

  span:first-child {
    color: ${theme.colors.textSecondary};
  }

  span:last-child {
    font-weight: 500;
    color: ${theme.colors.text};
  }
`;

const PATIENT_TYPES: { value: PatientType; label: string }[] = [
  { value: 'new', label: 'Novo Paciente' },
  { value: 'general', label: 'Geral' },
  { value: 'trt', label: 'TRT' },
  { value: 'hormone', label: 'Hormonal' },
  { value: 'vip', label: 'VIP' }
];

const PatientsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Profile | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    patient_type: 'new' as PatientType
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Abrir modal de edição se vier da URL
  useEffect(() => {
    const editPatientId = searchParams.get('edit');
    if (editPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === editPatientId);
      if (patient) {
        handleOpenModal(patient);
        // Limpar parâmetro da URL
        searchParams.delete('edit');
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, patients, setSearchParams]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (patient?: Profile) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        email: patient.email,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone || '',
        patient_type: patient.patient_type || 'general'
      });
    } else {
      setEditingPatient(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        patient_type: 'new'
      });
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      patient_type: 'new'
    });
    setError('');
  };

  const handleViewPatient = (patient: Profile) => {
    navigate(`/admin/patients/${patient.id}`);
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingPatient) {
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            patient_type: formData.patient_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPatient.id);

        if (error) throw error;
        setSuccess('Paciente atualizado com sucesso!');
      } else {
        if (!formData.email) {
          setError('Email é obrigatório para novos pacientes');
          setSaving(false);
          return;
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email)
          .single();

        if (existingUser) {
          setError('Este email já está cadastrado.');
          setSaving(false);
          return;
        }

        setError('O paciente precisa se registrar no sistema primeiro.');
        setSaving(false);
        return;
      }

      await fetchPatients();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar paciente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (patient: Profile) => {
    if (!window.confirm(`Tem certeza que deseja desativar ${patient.first_name} ${patient.last_name}?`)) {
      return;
    }

    // For now, we'll just show an alert - typically you'd implement soft delete
    alert('Funcionalidade de desativação em desenvolvimento.');
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch =
      patient.first_name.toLowerCase().includes(search.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(search.toLowerCase()) ||
      patient.email.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || patient.patient_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getPatientTypeLabel = (type: PatientType | null) => {
    const found = PATIENT_TYPES.find(t => t.value === type);
    return found ? found.label : 'Geral';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Calculate stats
  const stats = {
    total: patients.length,
    new: patients.filter(p => p.patient_type === 'new').length,
    trt: patients.filter(p => p.patient_type === 'trt').length,
    vip: patients.filter(p => p.patient_type === 'vip').length
  };

  return (
    <AdminLayout>
      <Header>
        <div>
          <h1>Pacientes</h1>
          <p>Gerencie os pacientes cadastrados no sistema</p>
        </div>
      </Header>

      <Stats>
        <StatCard>
          <h3>{stats.total}</h3>
          <p>Total de Pacientes</p>
        </StatCard>
        <StatCard>
          <h3>{stats.new}</h3>
          <p>Novos Pacientes</p>
        </StatCard>
        <StatCard>
          <h3>{stats.trt}</h3>
          <p>Pacientes TRT</p>
        </StatCard>
        <StatCard>
          <h3>{stats.vip}</h3>
          <p>Pacientes VIP</p>
        </StatCard>
      </Stats>

      <FiltersRow>
        <SearchBar>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchBar>
        <FilterSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">Todos os tipos</option>
          {PATIENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </FilterSelect>
      </FiltersRow>

      <Table>
        <TableHeader>
          <div>Nome</div>
          <div>Email</div>
          <div>Telefone</div>
          <div>Tipo</div>
          <div>Ações</div>
        </TableHeader>

        {loading ? (
          <EmptyState>
            <p>Carregando...</p>
          </EmptyState>
        ) : filteredPatients.length === 0 ? (
          <EmptyState>
            <Users />
            <p>Nenhum paciente encontrado</p>
          </EmptyState>
        ) : (
          filteredPatients.map(patient => (
            <TableRow key={patient.id}>
              <UserInfo>
                <Avatar type={patient.patient_type}>
                  {getInitials(patient.first_name, patient.last_name)}
                </Avatar>
                <div>
                  <UserName>{patient.first_name} {patient.last_name}</UserName>
                </div>
              </UserInfo>
              <UserEmail>{patient.email}</UserEmail>
              <div>{patient.phone || '-'}</div>
              <div>
                <Badge type={patient.patient_type}>
                  {getPatientTypeLabel(patient.patient_type)}
                </Badge>
              </div>
              <Actions>
                <ActionButton variant="info" onClick={() => handleViewPatient(patient)}>
                  <Eye size={14} />
                </ActionButton>
                <ActionButton onClick={() => handleOpenModal(patient)}>
                  <Edit2 size={14} />
                </ActionButton>
              </Actions>
            </TableRow>
          ))
        )}
      </Table>

      {showModal && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>
              <Users size={20} />
              {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
            </h2>

            {error && (
              <Alert variant="error">
                <AlertCircle size={16} />
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <Check size={16} />
                {success}
              </Alert>
            )}

            <FormGroup>
              <label>Email {!editingPatient && '*'}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingPatient}
                placeholder="email@exemplo.com"
              />
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
              <label>Tipo de Paciente</label>
              <select
                value={formData.patient_type}
                onChange={(e) => setFormData({ ...formData, patient_type: e.target.value as PatientType })}
              >
                {PATIENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </FormGroup>

            <ModalActions>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {showDetailModal && viewingPatient && (
        <Modal onClick={() => setShowDetailModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>
              <Users size={20} />
              Detalhes do Paciente
            </h2>

            <DetailSection>
              <h3>Informações Pessoais</h3>
              <DetailRow>
                <span>Nome</span>
                <span>{viewingPatient.first_name} {viewingPatient.last_name}</span>
              </DetailRow>
              <DetailRow>
                <span>Email</span>
                <span>{viewingPatient.email}</span>
              </DetailRow>
              <DetailRow>
                <span>Telefone</span>
                <span>{viewingPatient.phone || '-'}</span>
              </DetailRow>
              <DetailRow>
                <span>Tipo</span>
                <Badge type={viewingPatient.patient_type}>
                  {getPatientTypeLabel(viewingPatient.patient_type)}
                </Badge>
              </DetailRow>
            </DetailSection>

            <DetailSection>
              <h3>Histórico</h3>
              <DetailRow>
                <span>Cadastrado em</span>
                <span>{formatDate(viewingPatient.created_at)}</span>
              </DetailRow>
              <DetailRow>
                <span>Última visita</span>
                <span>{formatDate(viewingPatient.last_visit_at)}</span>
              </DetailRow>
              <DetailRow>
                <span>Exames (labs)</span>
                <span>{formatDate(viewingPatient.labs_completed_at)}</span>
              </DetailRow>
            </DetailSection>

            <ModalActions>
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                setShowDetailModal(false);
                handleOpenModal(viewingPatient);
              }}>
                Editar
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default PatientsPage;
