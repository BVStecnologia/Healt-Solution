import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { Mail, Lock, Eye, EyeOff, Shield, Stethoscope, ArrowRight } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(146, 86, 62, 0.4);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(146, 86, 62, 0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 20% 80%, rgba(146, 86, 62, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(175, 136, 113, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, #2D2420 0%, #3D322B 50%, #4A3C33 100%);
  padding: ${theme.spacing.lg};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
  }
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  padding: 48px 40px;
  animation: ${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  backdrop-filter: blur(10px);

  @media (max-width: 480px) {
    padding: 32px 24px;
    margin: 0 16px;
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: 0.1s;
  animation-fill-mode: both;

  .icon-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 20px;
  }

  .icon {
    width: 72px;
    height: 72px;
    background: linear-gradient(145deg, ${theme.colors.primary} 0%, #7A4833 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    box-shadow:
      0 10px 30px -10px rgba(146, 86, 62, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);

    svg {
      width: 36px;
      height: 36px;
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    &::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 24px;
      background: linear-gradient(145deg, ${theme.colors.primary}, #7A4833);
      opacity: 0.3;
      z-index: -1;
      animation: ${pulse} 2s ease-in-out infinite;
    }
  }

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 28px;
    font-weight: 800;
    color: #3D322B;
    margin: 0 0 6px;
    letter-spacing: -0.5px;
  }

  p {
    color: #64748b;
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: ${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: 0.2s;
  animation-fill-mode: both;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  transition: color 0.2s ease;
  pointer-events: none;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 16px 16px 52px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 15px;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.25s ease;
  font-weight: 500;

  &:hover {
    border-color: #cbd5e1;
    background: #fff;
  }

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    background: #fff;
    box-shadow: 0 0 0 4px rgba(146, 86, 62, 0.1);

    & + ${InputIcon} {
      color: ${theme.colors.primary};
    }
  }

  &::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: #64748b;
    background: #f1f5f9;
  }
`;

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '!';
    width: 20px;
    height: 20px;
    background: #dc2626;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, #7A4833 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    background-size: 200% 100%;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -8px rgba(146, 86, 62, 0.5);

    &::before {
      opacity: 1;
      animation: ${shimmer} 1.5s infinite;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
    transition: transform 0.2s ease;
  }

  &:hover:not(:disabled) svg {
    transform: translateX(4px);
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  animation: ${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: 0.3s;
  animation-fill-mode: both;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
  }

  span {
    color: #94a3b8;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 16px 24px;
  background: white;
  color: #1e293b;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  animation: ${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: 0.35s;
  animation-fill-mode: both;

  &:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
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

const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 24px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
  animation: ${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: 0.4s;
  animation-fill-mode: both;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();
  const { syncFromDatabase: syncThemeFromDatabase } = useTheme();
  const { syncFromDatabase: syncLanguageFromDatabase } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isDoctorLogin = location.pathname.startsWith('/doctor');

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

      if (!profile || (profile.role !== 'admin' && profile.role !== 'provider')) {
        await supabase.auth.signOut();
        setError('Acesso negado. Apenas administradores e médicos podem acessar este painel.');
        setLoading(false);
        return;
      }

      // Sincronizar tema e idioma do DB
      await Promise.all([
        syncThemeFromDatabase(user.id),
        syncLanguageFromDatabase(user.id),
      ]);

      // Smart redirect: provider → /doctor, admin → /admin
      navigate(profile.role === 'provider' ? '/doctor' : '/admin');
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
    } catch (err) {
      setError('Erro ao fazer login com Google');
      setGoogleLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Logo>
          <div className="icon-wrapper">
            <div className="icon">
              {isDoctorLogin ? <Stethoscope /> : <Shield />}
            </div>
          </div>
          <h1>Essence Clinic</h1>
          <p>{isDoctorLogin ? 'Portal do Médico' : 'Painel Administrativo'}</p>
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
