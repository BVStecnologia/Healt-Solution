import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Leaf } from 'lucide-react';
import { theme } from '../styles/GlobalStyle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabaseClient';

/* ═══════════════════════════════
   ANIMATIONS
   ═══════════════════════════════ */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const float = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(6px, -10px) rotate(1deg); }
  66% { transform: translate(-4px, 6px) rotate(-1deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const breathe = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.12; }
  50% { transform: scale(1.08); opacity: 0.2; }
`;

const stagger = (i: number) => css`
  animation: ${fadeUp} 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.15 + i * 0.08}s both;
`;

/* ═══════════════════════════════
   LAYOUT
   ═══════════════════════════════ */

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
  background: ${theme.colors.background};
`;

const LeftPanel = styled.div`
  flex: 1.15;
  display: none;
  position: relative;
  overflow: hidden;

  @media (min-width: ${theme.breakpoints.lg}) {
    display: block;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.15) 0%,
      rgba(0, 0, 0, 0.2) 50%,
      rgba(0, 0, 0, 0.55) 100%
    );
    z-index: 1;
  }
`;

const LeftImage = styled.div`
  position: absolute;
  inset: 0;
  background: url('/images/login-doctor.png');
  background-size: cover;
  background-position: center;
  animation: ${fadeIn} 1.2s ease-out;
`;

const LeftOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 60px;
`;

const OverlayBrand = styled.div`
  ${stagger(0)}

  h2 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 48px;
    font-weight: 400;
    color: #FFFFFF;
    letter-spacing: 2px;
    margin-bottom: 8px;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 0, 0, 0.3);
  }

  span {
    display: block;
    font-size: 14px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 4px;
    text-transform: uppercase;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
  }
`;

const OverlayQuote = styled.p`
  ${stagger(1)}
  margin-top: 32px;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  max-width: 380px;
  font-style: italic;
  border-left: 2px solid rgba(196, 137, 107, 0.7);
  padding-left: 20px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
`;

/* ═══════════════════════════════
   RIGHT PANEL
   ═══════════════════════════════ */

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.lg};
  position: relative;
  overflow-y: auto;

  @media (min-width: ${theme.breakpoints.lg}) {
    padding: ${theme.spacing.xxl} ${theme.spacing.xxxl};
  }
`;

/* Decorative background elements */
const Orb = styled.div<{ $size: number; $top: string; $right: string; $delay: number }>`
  position: absolute;
  width: ${p => p.$size}px;
  height: ${p => p.$size}px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${theme.colors.primaryA20} 0%,
    transparent 70%
  );
  top: ${p => p.$top};
  right: ${p => p.$right};
  animation: ${breathe} ${p => 6 + p.$delay}s ease-in-out infinite;
  animation-delay: ${p => p.$delay}s;
  pointer-events: none;
  z-index: 0;
`;

const FloatingLeaf = styled(Leaf)`
  position: absolute;
  color: ${theme.colors.primaryA20};
  animation: ${float} 12s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
`;

/* ═══════════════════════════════
   WELCOME HEADER
   ═══════════════════════════════ */

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
  ${stagger(0)}
`;

const WelcomeTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primaryA10};
  border: 1px solid ${theme.colors.primaryA20};
  color: ${theme.colors.primary};
  font-size: 11px;
  font-weight: ${theme.typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: ${theme.spacing.md};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const WelcomeTitle = styled.h1`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 28px;
  font-weight: 400;
  color: ${theme.colors.text};
  margin-bottom: ${theme.spacing.sm};
  line-height: 1.2;
  letter-spacing: 0.5px;

  @media (min-width: ${theme.breakpoints.md}) {
    font-size: 32px;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: ${theme.typography.sizes.md};
  line-height: 1.6;
  color: ${theme.colors.textMuted};
  max-width: 340px;
  margin: 0 auto;
`;

/* ═══════════════════════════════
   CARD
   ═══════════════════════════════ */

const Card = styled.div`
  width: 100%;
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xxl};
  border: 1px solid ${theme.colors.borderLight};
  box-shadow: ${theme.shadows.card};
  padding: ${theme.spacing.xl} ${theme.spacing.lg};
  ${stagger(1)}
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${theme.colors.primary} 50%,
      transparent 100%
    );
    opacity: 0.6;
  }

  @media (min-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing.xxl};
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 28px;
    font-weight: 400;
    color: ${theme.colors.primary};
    margin: 0 0 2px;
    letter-spacing: 1px;
  }

  p {
    color: ${theme.colors.textMuted};
    margin: 0;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-weight: ${theme.typography.weights.medium};
  }
`;

/* ═══════════════════════════════
   FORM
   ═══════════════════════════════ */

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const InputGroup = styled.div<{ $index: number }>`
  position: relative;
  ${p => stagger(p.$index + 2)}
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textMuted};
  transition: color 0.25s ease, transform 0.25s ease;
  z-index: 1;

  svg {
    width: 17px;
    height: 17px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 15px 15px 46px;
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.sizes.md};
  color: ${theme.colors.text};
  background: ${theme.colors.background};
  transition: all 0.25s ease;

  &:hover {
    border-color: ${theme.colors.secondary};
  }

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primaryA10}, 0 2px 8px ${theme.colors.primaryA10};
    background: ${theme.colors.surface};
  }

  &:focus ~ ${InputIcon} {
    color: ${theme.colors.primary};
    transform: translateY(-50%) scale(1.05);
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
    font-weight: 300;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  padding: 4px;
  border-radius: ${theme.borderRadius.sm};
  transition: all 0.2s ease;
  z-index: 1;

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const ErrorMessage = styled.div`
  background: ${theme.colors.errorLight};
  border: 1px solid ${theme.colors.errorA30};
  color: ${theme.colors.error};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.sizes.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  animation: ${fadeUp} 0.3s ease-out;
`;

const ForgotPassword = styled.a`
  display: block;
  text-align: right;
  font-size: ${theme.typography.sizes.xs};
  color: ${theme.colors.textMuted};
  margin-top: -${theme.spacing.xs};
  transition: color 0.2s ease;
  ${stagger(4)}

  &:hover {
    color: ${theme.colors.primary};
  }
`;

/* ═══════════════════════════════
   BUTTONS
   ═══════════════════════════════ */

const SubmitButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 15px ${theme.spacing.lg};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%);
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.sizes.md};
  font-weight: ${theme.typography.weights.semibold};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.sm};
  position: relative;
  overflow: hidden;
  letter-spacing: 0.3px;
  ${stagger(5)}

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s ease-in-out infinite;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${theme.colors.primaryA40};

    &::before {
      opacity: 1;
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
    width: 17px;
    height: 17px;
    transition: transform 0.3s ease;
  }

  &:hover:not(:disabled) svg {
    transform: translateX(4px);
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

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin: ${theme.spacing.lg} 0;
  ${stagger(6)}

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${theme.colors.border};
  }

  span {
    color: ${theme.colors.textMuted};
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: ${theme.typography.weights.medium};
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
  transition: all 0.25s ease;
  ${stagger(7)}

  &:hover:not(:disabled) {
    background: ${theme.colors.surfaceHover};
    border-color: ${theme.colors.secondary};
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.sm};
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
  ${stagger(8)}

  p {
    color: ${theme.colors.textMuted};
    font-size: ${theme.typography.sizes.sm};

    a {
      color: ${theme.colors.primary};
      font-weight: ${theme.typography.weights.semibold};
      transition: all 0.2s ease;

      &:hover {
        text-decoration: none;
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryLight});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }
  }
`;

/* ═══════════════════════════════
   COMPONENT
   ═══════════════════════════════ */

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();
  const { t, syncFromDatabase } = useLanguage();
  const { syncFromDatabase: syncThemeFromDatabase } = useTheme();
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
        await syncThemeFromDatabase(loggedUser.id);
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
      <LeftPanel>
        <LeftImage />
        <LeftOverlay>
          <OverlayBrand>
            <h2>Essence</h2>
            <span>Medical Clinic</span>
          </OverlayBrand>
          <OverlayQuote>
            Cuidando da sua saúde com excelência e dedicação, proporcionando bem-estar e qualidade de vida.
          </OverlayQuote>
        </LeftOverlay>
      </LeftPanel>

      <RightPanel>
        {/* Decorative orbs */}
        <Orb $size={280} $top="-80px" $right="-60px" $delay={0} />
        <Orb $size={180} $top="60%" $right="70%" $delay={2} />
        <Orb $size={120} $top="80%" $right="10%" $delay={4} />
        <FloatingLeaf size={40} style={{ top: '12%', right: '8%', opacity: 0.15 }} />
        <FloatingLeaf size={24} style={{ top: '75%', right: '85%', opacity: 0.1, animationDelay: '3s' }} />

        <ContentWrapper>
          <WelcomeSection>
            <WelcomeTag>
              <Leaf size={12} />
              Portal do Paciente
            </WelcomeTag>
            <WelcomeTitle>{t('login.welcome')}</WelcomeTitle>
            <WelcomeSubtitle>{t('login.subtitle')}</WelcomeSubtitle>
          </WelcomeSection>

          <Card>
            <Logo>
              <h1>Essence</h1>
              <p>Medical Clinic</p>
            </Logo>

            <Form onSubmit={handleSubmit}>
              {error && <ErrorMessage>{error}</ErrorMessage>}

              <InputGroup $index={0}>
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

              <InputGroup $index={1}>
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
        </ContentWrapper>
      </RightPanel>
    </Container>
  );
};

export default LoginPage;
