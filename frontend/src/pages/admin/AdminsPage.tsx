import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Shield, Plus, Search, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { Profile } from '../../types/database';

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
  grid-template-columns: 1fr 1fr 1fr 120px;
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
  grid-template-columns: 1fr 1fr 1fr 120px;
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
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover});
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

const Actions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const ActionButton = styled.button<{ variant?: 'danger' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${props => props.variant === 'danger' ? `${theme.colors.error}15` : `${theme.colors.primary}15`};
  color: ${props => props.variant === 'danger' ? theme.colors.error : theme.colors.primary};
  border: none;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${props => props.variant === 'danger' ? `${theme.colors.error}25` : `${theme.colors.primary}25`};
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

  input {
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

const AdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('first_name');

      if (error) throw error;
      setAdmins(data || []);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (admin?: Profile) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        phone: admin.phone || ''
      });
    } else {
      setEditingAdmin(null);
      setFormData({ email: '', first_name: '', last_name: '', phone: '' });
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormData({ email: '', first_name: '', last_name: '', phone: '' });
    setError('');
  };

  const handleSave = async () => {
    if (!formData.email || !formData.first_name || !formData.last_name) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingAdmin) {
        // Update existing admin
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAdmin.id);

        if (error) throw error;
        setSuccess('Administrador atualizado com sucesso!');
      } else {
        // Check if email already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('email', formData.email)
          .single();

        if (existingUser) {
          // User exists, just update role to admin
          const { error } = await supabase
            .from('profiles')
            .update({
              role: 'admin',
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);

          if (error) throw error;
          setSuccess('Usuário promovido a administrador!');
        } else {
          setError('Email não encontrado. O usuário precisa se registrar primeiro.');
          setSaving(false);
          return;
        }
      }

      await fetchAdmins();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar administrador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: Profile) => {
    if (!window.confirm(`Remover ${admin.first_name} ${admin.last_name} como administrador?`)) {
      return;
    }

    try {
      // Demote to patient instead of deleting
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'patient', updated_at: new Date().toISOString() })
        .eq('id', admin.id);

      if (error) throw error;
      await fetchAdmins();
    } catch (err) {
      console.error('Error removing admin:', err);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.first_name.toLowerCase().includes(search.toLowerCase()) ||
    admin.last_name.toLowerCase().includes(search.toLowerCase()) ||
    admin.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <AdminLayout>
      <Header>
        <div>
          <h1>Administradores</h1>
          <p>Gerencie os administradores do sistema</p>
        </div>
        <AddButton onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Adicionar Admin
        </AddButton>
      </Header>

      <SearchBar>
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchBar>

      <Table>
        <TableHeader>
          <div>Nome</div>
          <div>Email</div>
          <div>Telefone</div>
          <div>Ações</div>
        </TableHeader>

        {loading ? (
          <EmptyState>
            <p>Carregando...</p>
          </EmptyState>
        ) : filteredAdmins.length === 0 ? (
          <EmptyState>
            <Shield />
            <p>Nenhum administrador encontrado</p>
          </EmptyState>
        ) : (
          filteredAdmins.map(admin => (
            <TableRow key={admin.id}>
              <UserInfo>
                <Avatar>{getInitials(admin.first_name, admin.last_name)}</Avatar>
                <div>
                  <UserName>{admin.first_name} {admin.last_name}</UserName>
                </div>
              </UserInfo>
              <UserEmail>{admin.email}</UserEmail>
              <div>{admin.phone || '-'}</div>
              <Actions>
                <ActionButton onClick={() => handleOpenModal(admin)}>
                  <Edit2 size={14} />
                </ActionButton>
                <ActionButton variant="danger" onClick={() => handleDelete(admin)}>
                  <Trash2 size={14} />
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
              <Shield size={20} />
              {editingAdmin ? 'Editar Administrador' : 'Adicionar Administrador'}
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
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingAdmin}
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
    </AdminLayout>
  );
};

export default AdminsPage;
