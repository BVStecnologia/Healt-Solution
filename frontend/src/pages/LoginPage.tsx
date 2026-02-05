import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { theme } from '../styles/GlobalStyle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';

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
  background: linear-gradient(135deg, ${theme.colors.background} 0%, #F4E7DE 100%);
`;

const LeftPanel = styled.div`
  flex: 1;
  display: none;
  background: url('/images/login-doctor.png');
  background-size: cover;
  background-position: center;

  @media (min-width: ${theme.breakpoints.lg}) {
    display: block;
  }
`;

const WelcomeText = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.lg};
  animation: ${fadeIn} 0.5s ease-out;

  h1 {
    font-size: ${theme.typography.sizes.xxl};
    font-weight: ${theme.typography.weights.bold};
    color: ${theme.colors.text};
    margin-bottom: ${theme.spacing.sm};
    line-height: 1.2;
  }

  p {
    font-size: ${theme.typography.sizes.md};
    line-height: 1.5;
    color: ${theme.colors.textSecondary};
    max-width: 360px;
    margin: 0 auto;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.lg};
  overflow-y: auto;

  @media (min-width: ${theme.breakpoints.lg}) {
    padding: ${theme.spacing.xxl};
  }

  > div {
    width: 100%;
    max-width: 420px;
  }
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xxl};
  box-shadow: ${theme.shadows.card};
  padding: ${theme.spacing.xl} ${theme.spacing.lg};
  animation: ${fadeIn} 0.5s ease-out;

  @media (min-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing.xxl};
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};

  h1 {
    font-size: ${theme.typography.sizes.xxl};
    font-weight: ${theme.typography.weights.bold};
    color: ${theme.colors.primary};
    margin: 0 0 ${theme.spacing.xs};
    letter-spacing: -0.5px;
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
  transition: color ${theme.transitions.fast};

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
  transition: all ${theme.transitions.normal};

  &:hover {
    border-color: ${theme.colors.secondary};
  }

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};

    & + ${InputIcon}, & ~ ${InputIcon} {
      color: ${theme.colors.primary};
    }
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
  border-radius: ${theme.borderRadius.sm};
  transition: all ${theme.transitions.fast};

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: ${theme.colors.text};
    background: ${theme.colors.borderLight};
  }
`;

const ErrorMessage = styled.div`
  background: ${theme.colors.errorLight};
  border: 1px solid ${theme.colors.error}30;
  color: ${theme.colors.error};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.sizes.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 14px ${theme.spacing.lg};
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.sizes.md};
  font-weight: ${theme.typography.weights.semibold};
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.sm};

  &:hover:not(:disabled) {
    background: ${theme.colors.primaryHover};
    box-shadow: ${theme.shadows.primary};
    transform: translateY(-1px);
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
    transition: transform ${theme.transitions.fast};
  }

  &:hover:not(:disabled) svg {
    transform: translateX(3px);
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin: ${theme.spacing.lg} 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${theme.colors.border};
  }

  span {
    color: ${theme.colors.textMuted};
    font-size: ${theme.typography.sizes.xs};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const GoogleButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  padding: 14px ${theme.spacing.lg};
  background: ${theme.colors.surface};
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.sizes.md};
  font-weight: ${theme.typography.weights.medium};
  color: ${theme.colors.text};
  cursor: pointer;
  transition: all ${theme.transitions.normal};

  &:hover:not(:disabled) {
    background: ${theme.colors.surfaceHover};
    border-color: ${theme.colors.secondary};
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

const Footer = styled.div`
  text-align: center;
  margin-top: ${theme.spacing.xl};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.borderLight};

  p {
    color: ${theme.colors.textSecondary};
    font-size: ${theme.typography.sizes.sm};

    a {
      color: ${theme.colors.primary};
      font-weight: ${theme.typography.weights.medium};

      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const ForgotPassword = styled.a`
  display: block;
  text-align: right;
  font-size: ${theme.typography.sizes.sm};
  color: ${theme.colors.textSecondary};
  margin-top: -${theme.spacing.sm};

  &:hover {
    color: ${theme.colors.primary};
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
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();
  const { t, syncFromDatabase } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(t('login.error'));
        return;
      }

      // Sincronizar idioma do perfil do usuário após login
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      if (loggedUser) {
        await syncFromDatabase(loggedUser.id);
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { error: googleError } = await signInWithGoogle();

      if (googleError) {
        setError(t('login.errorGoogle'));
      }
    } catch (err) {
      setError(t('login.errorGoogle'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Container>
      <LeftPanel />

      <RightPanel>
        <div>
          <WelcomeText>
            <h1>{t('login.welcome')}</h1>
            <p>{t('login.subtitle')}</p>
          </WelcomeText>
          <Card>
          <Logo>
            <h1>Essence</h1>
            <p>Medical Clinic</p>
          </Logo>

          <Form onSubmit={handleSubmit}>
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <InputGroup>
              <Input
                type="email"
                placeholder={t('login.email')}
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
                placeholder={t('login.password')}
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

            <ForgotPassword href="/forgot-password">
              {t('login.forgot')}
            </ForgotPassword>

            <SubmitButton type="submit" disabled={loading} $loading={loading}>
              {loading ? <Spinner /> : (
                <>
                  {t('login.submit')}
                  <ArrowRight />
                </>
              )}
            </SubmitButton>
          </Form>

          <Divider>
            <span>{t('login.or')}</span>
          </Divider>

          <GoogleButton
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            $loading={googleLoading}
          >
            {googleLoading ? <Spinner /> : (
              <>
                <svg viewBox="0 0 24 24">
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
                Google
              </>
            )}
          </GoogleButton>

          <Footer>
            <p>
              {t('login.noAccount')} <a href="/register">{t('login.register')}</a>
            </p>
          </Footer>
        </Card>
        </div>
      </RightPanel>
    </Container>
  );
};

export default LoginPage;
