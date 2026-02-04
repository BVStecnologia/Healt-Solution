import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Chrome } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: ${theme.spacing.lg};
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xxl};
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: ${theme.spacing.xxl};
  animation: ${fadeIn} 0.5s ease-out;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};

  .icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, #2850D9 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto ${theme.spacing.md};

    svg {
      width: 32px;
      height: 32px;
      color: white;
    }
  }

  h1 {
    font-size: ${theme.typography.sizes.xxl};
    font-weight: ${theme.typography.weights.bold};
    color: ${theme.colors.text};
    margin: 0 0 ${theme.spacing.xs};
  }

  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: ${theme.typography.sizes.sm};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: ${theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textMuted};

  svg {
    width: 18px;
    height: 18px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 14px 14px 46px;
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.sizes.md};
  color: ${theme.colors.text};
  background: ${theme.colors.surface};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: ${theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  padding: 4px;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: ${theme.colors.text};
  }
`;

const ErrorMessage = styled.div`
  background: ${theme.colors.errorLight};
  border: 1px solid ${theme.colors.error}30;
  color: ${theme.colors.error};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.sizes.sm};
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 14px ${theme.spacing.lg};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, #2850D9 100%);
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.sizes.md};
  font-weight: ${theme.typography.weights.semibold};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.sm};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px -10px ${theme.colors.primary};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: ${theme.spacing.lg};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.sm};

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin: ${theme.spacing.md} 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${theme.colors.border};
  }

  span {
    color: ${theme.colors.textMuted};
    font-size: ${theme.typography.sizes.sm};
  }
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 14px ${theme.spacing.lg};
  background: white;
  color: ${theme.colors.text};
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.sizes.md};
  font-weight: ${theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};

  &:hover:not(:disabled) {
    background: ${theme.colors.background};
    border-color: ${theme.colors.textMuted};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      // Verificar se é admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Erro ao verificar usuário');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        setError('Acesso negado. Apenas administradores podem acessar este painel.');
        setLoading(false);
        return;
      }

      navigate('/admin');
    } catch (err) {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { error: signInError } = await signInWithGoogle();
      if (signInError) {
        setError('Erro ao fazer login com Google');
        setGoogleLoading(false);
        return;
      }
      // O redirecionamento será feito pelo OAuth
      // A verificação de admin será feita no AdminProtectedRoute
    } catch (err) {
      setError('Erro ao fazer login com Google');
      setGoogleLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Logo>
          <div className="icon">
            <Shield />
          </div>
          <h1>ShapeUp Admin</h1>
          <p>Painel Administrativo</p>
        </Logo>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <InputGroup>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <InputIcon>
              <Mail />
            </InputIcon>
          </InputGroup>

          <InputGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <InputIcon>
              <Lock />
            </InputIcon>
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </PasswordToggle>
          </InputGroup>

          <SubmitButton type="submit" disabled={loading || googleLoading}>
            {loading ? <Spinner /> : (
              <>
                Entrar
                <ArrowRight />
              </>
            )}
          </SubmitButton>
        </Form>

        <Divider>
          <span>ou</span>
        </Divider>

        <GoogleButton
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? <Spinner /> : (
            <>
              <GoogleIcon />
              Continuar com Google
            </>
          )}
        </GoogleButton>

        <BackLink href="/login">
          Voltar para o Portal do Paciente
        </BackLink>
      </Card>
    </Container>
  );
};

export default AdminLoginPage;
