import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  MessageCircle,
  Plus,
  RefreshCw,
  Trash2,
  Phone,
  CheckCircle,
  XCircle,
  QrCode,
  Wifi,
  WifiOff,
  Smartphone,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';

// Animações
const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.xl};

  h1 {
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

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger'; $loading?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:active {
    transform: scale(0.97);
  }

  ${props => props.$variant === 'primary' && css`
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
    color: white;
    border: none;
    box-shadow: 0 2px 8px rgba(146, 86, 62, 0.25);

    &:hover {
      box-shadow: 0 4px 16px rgba(146, 86, 62, 0.35);
      transform: translateY(-1px);
    }
  `}

  ${props => props.$variant === 'secondary' && css`
    background: ${theme.colors.surface};
    color: ${theme.colors.text};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.background};
      border-color: ${theme.colors.primary}50;
    }
  `}

  ${props => props.$variant === 'danger' && css`
    background: transparent;
    color: ${theme.colors.error};
    border: 1px solid ${theme.colors.error}30;

    &:hover {
      background: ${theme.colors.error}10;
      border-color: ${theme.colors.error}50;
    }
  `}

  svg {
    width: 18px;
    height: 18px;
    ${props => props.$loading && css`
      animation: ${spin} 1s linear infinite;
    `}
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${theme.spacing.lg};
`;

const InstanceCard = styled.div<{ $connected?: boolean }>`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.card};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${fadeIn} 0.4s ease-out;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;

  ${props => props.$connected && css`
    border-color: #10B98130;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #10B981, #34D399);
    }
  `}

  &:hover {
    box-shadow: ${theme.shadows.lg};
    transform: translateY(-2px);
  }
`;

const InstanceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
`;

const InstanceName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  svg {
    width: 20px;
    height: 20px;
    color: #25D366;
  }
`;

const Status = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: 6px 12px;
  border-radius: ${theme.borderRadius.full};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: ${props => props.$connected ? '#10B98115' : '#EF444415'};
  color: ${props => props.$connected ? '#10B981' : '#EF4444'};
  transition: all 0.3s ease;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    ${props => props.$connected && css`
      animation: ${pulse} 2s ease-in-out infinite;
      box-shadow: 0 0 8px currentColor;
    `}
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const InstanceBody = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const PhoneNumber = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  background: linear-gradient(135deg, #10B98108 0%, #10B98115 100%);
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid #10B98120;

  .phone-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    border-radius: ${theme.borderRadius.md};
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

    svg {
      width: 22px;
      height: 22px;
      color: white;
    }
  }

  .phone-details {
    flex: 1;

    .label {
      font-size: 12px;
      font-weight: 500;
      color: ${theme.colors.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .number {
      font-size: 18px;
      font-weight: 600;
      color: ${theme.colors.text};
      font-family: 'SF Mono', 'Consolas', monospace;
      letter-spacing: 1px;
    }
  }
`;

const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${theme.spacing.xl};
  background: linear-gradient(145deg, #FAFAFA 0%, #F5F5F5 100%);
  border-radius: ${theme.borderRadius.lg};
  border: 2px dashed ${theme.colors.border};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: ${theme.colors.primary};
    border-radius: 0 0 4px 4px;
  }
`;

const QRCodePlaceholder = styled.div`
  width: 200px;
  height: 200px;
  background: #f0f0f0;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing.md};

  svg {
    width: 64px;
    height: 64px;
    color: ${theme.colors.textMuted};
  }
`;

const QRCodeImage = styled.img`
  width: 200px;
  height: 200px;
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.md};
  filter: grayscale(100%);
`;

const QRCodeText = styled.p`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  text-align: center;
  margin: 0;
`;

const InstanceActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: ${theme.spacing.xxxl};
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  border: 2px dashed ${theme.colors.border};

  > svg {
    width: 64px;
    height: 64px;
    color: ${theme.colors.textMuted};
    margin-bottom: ${theme.spacing.md};
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${theme.colors.text};
    margin: 0 0 ${theme.spacing.sm};
  }

  p {
    color: ${theme.colors.textSecondary};
    margin: 0 0 ${theme.spacing.lg};
  }

  button svg {
    width: 18px;
    height: 18px;
    color: white;
  }
`;

const Modal = styled.div<{ $open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$open ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 400px;
  box-shadow: ${theme.shadows.xl};
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0 0 ${theme.spacing.lg};
`;

const Input = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: 14px;
  margin-bottom: ${theme.spacing.md};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  justify-content: flex-end;
`;

interface Instance {
  id: string;
  name: string;
  instanceName: string;
  phoneNumber: string | null;
  status: 'connected' | 'disconnected' | 'qr_code';
  qrCode: string | null;
}

const EVOLUTION_API_URL = 'http://localhost:8082';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY || 'sua_chave_evolution_aqui';

const WhatsAppPage: React.FC = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadInstances();
  }, []);

  // Polling para atualizar status quando há instâncias desconectadas
  useEffect(() => {
    const hasDisconnected = instances.some(i => i.status !== 'connected');
    if (!hasDisconnected || instances.length === 0) return;

    const interval = setInterval(() => {
      instances.forEach(inst => {
        if (inst.status !== 'connected') {
          refreshInstance(inst.instanceName);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [instances]);

  const loadInstances = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedInstances: Instance[] = (data || []).map((inst: any) => ({
          id: inst.id || inst.name,
          name: inst.name || inst.instanceName,
          instanceName: inst.name || inst.instanceName,
          phoneNumber: inst.ownerJid || inst.number || null,
          status: inst.connectionStatus === 'open' ? 'connected' : 'disconnected',
          qrCode: null,
        }));
        setInstances(formattedInstances);
      }
    } catch (error) {
      console.error('Error loading instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          instanceName: newInstanceName.toLowerCase().replace(/\s+/g, '_'),
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      if (response.ok) {
        setModalOpen(false);
        setNewInstanceName('');
        loadInstances();
        // Buscar QR code
        setTimeout(() => getQRCode(newInstanceName.toLowerCase().replace(/\s+/g, '_')), 2000);
      }
    } catch (error) {
      console.error('Error creating instance:', error);
    } finally {
      setCreating(false);
    }
  };

  const getQRCode = async (instanceName: string) => {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.base64 || data.qrcode?.base64) {
          setInstances(prev => prev.map(inst =>
            inst.instanceName === instanceName
              ? { ...inst, qrCode: data.base64 || data.qrcode?.base64, status: 'qr_code' }
              : inst
          ));
        }
      }
    } catch (error) {
      console.error('Error getting QR code:', error);
    }
  };

  const refreshInstance = async (instanceName: string) => {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const isConnected = data.instance?.state === 'open' || data.state === 'open';

        setInstances(prev => prev.map(inst =>
          inst.instanceName === instanceName
            ? {
                ...inst,
                status: isConnected ? 'connected' : 'disconnected',
                phoneNumber: data.instance?.owner || data.ownerJid || inst.phoneNumber,
              }
            : inst
        ));

        if (!isConnected) {
          getQRCode(instanceName);
        }
      }
    } catch (error) {
      console.error('Error refreshing instance:', error);
    }
  };

  const deleteInstance = async (instanceName: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta instância?')) return;

    try {
      await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      setInstances(prev => prev.filter(inst => inst.instanceName !== instanceName));
    } catch (error) {
      console.error('Error deleting instance:', error);
    }
  };

  const disconnectInstance = async (instanceName: string) => {
    try {
      await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      refreshInstance(instanceName);
    } catch (error) {
      console.error('Error disconnecting instance:', error);
    }
  };

  return (
    <AdminLayout>
      <Header>
        <div>
          <h1>WhatsApp</h1>
          <p>Gerencie suas instâncias do WhatsApp</p>
        </div>
        <Button $variant="primary" onClick={() => setModalOpen(true)}>
          <Plus />
          Nova Instância
        </Button>
      </Header>

      <Grid>
        {instances.length === 0 && !loading ? (
          <EmptyState>
            <MessageCircle />
            <h3>Nenhuma instância configurada</h3>
            <p>Crie uma nova instância para conectar seu WhatsApp</p>
            <Button $variant="primary" onClick={() => setModalOpen(true)}>
              <Plus />
              Criar Instância
            </Button>
          </EmptyState>
        ) : (
          instances.map(instance => {
            // Formatar número de telefone (remover @s.whatsapp.net)
            const formatPhone = (phone: string | null) => {
              if (!phone) return '';
              const cleaned = phone.replace('@s.whatsapp.net', '').replace('@c.us', '');
              // Formato brasileiro: +55 (48) 9 8384-4402
              if (cleaned.startsWith('55') && cleaned.length >= 12) {
                const ddd = cleaned.slice(2, 4);
                const rest = cleaned.slice(4);
                if (rest.length === 9) {
                  return `+55 (${ddd}) ${rest.slice(0,1)} ${rest.slice(1,5)}-${rest.slice(5)}`;
                }
                return `+55 (${ddd}) ${rest.slice(0,4)}-${rest.slice(4)}`;
              }
              return `+${cleaned}`;
            };

            return (
            <InstanceCard key={instance.id} $connected={instance.status === 'connected'}>
              <InstanceHeader>
                <InstanceName>
                  <MessageCircle />
                  {instance.name}
                </InstanceName>
                <Status $connected={instance.status === 'connected'}>
                  {instance.status === 'connected' ? <Wifi /> : <WifiOff />}
                  {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                </Status>
              </InstanceHeader>

              <InstanceBody>
                {instance.status === 'connected' && instance.phoneNumber ? (
                  <PhoneNumber>
                    <div className="phone-icon">
                      <Smartphone />
                    </div>
                    <div className="phone-details">
                      <div className="label">Número conectado</div>
                      <div className="number">{formatPhone(instance.phoneNumber)}</div>
                    </div>
                  </PhoneNumber>
                ) : instance.qrCode ? (
                  <QRCodeContainer>
                    <QRCodeImage src={instance.qrCode.startsWith('data:') ? instance.qrCode : `data:image/png;base64,${instance.qrCode}`} alt="QR Code" />
                    <QRCodeText>Escaneie o QR Code com seu WhatsApp</QRCodeText>
                  </QRCodeContainer>
                ) : (
                  <QRCodeContainer>
                    <QRCodePlaceholder>
                      <QrCode />
                    </QRCodePlaceholder>
                    <QRCodeText>Clique em atualizar para gerar o QR Code</QRCodeText>
                  </QRCodeContainer>
                )}
              </InstanceBody>

              <InstanceActions>
                <Button $variant="secondary" onClick={() => refreshInstance(instance.instanceName)}>
                  <RefreshCw />
                  Atualizar
                </Button>
                {instance.status === 'connected' ? (
                  <Button $variant="danger" onClick={() => disconnectInstance(instance.instanceName)}>
                    <XCircle />
                    Desconectar
                  </Button>
                ) : (
                  <Button $variant="danger" onClick={() => deleteInstance(instance.instanceName)}>
                    <Trash2 />
                    Excluir
                  </Button>
                )}
              </InstanceActions>
            </InstanceCard>
            );
          })
        )}
      </Grid>

      <Modal $open={modalOpen} onClick={() => setModalOpen(false)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalTitle>Nova Instância WhatsApp</ModalTitle>
          <Input
            type="text"
            placeholder="Nome da instância (ex: principal)"
            value={newInstanceName}
            onChange={e => setNewInstanceName(e.target.value)}
          />
          <ModalActions>
            <Button $variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button $variant="primary" onClick={createInstance} disabled={creating}>
              {creating ? 'Criando...' : 'Criar'}
            </Button>
          </ModalActions>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
};

export default WhatsAppPage;
