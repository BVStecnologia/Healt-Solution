import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Leaf } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import EssenceLogo from '../../components/ui/EssenceLogo';

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

const accentReveal = keyframes`
  from { width: 0; opacity: 0; }
  to { width: 48px; opacity: 1; }
`;

const glowPulse = keyframes`
  0%, 100% { opacity: 0.6; filter: blur(0px); }
  50% { opacity: 1; filter: blur(1px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
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
  background: #FFFFFF;
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
      rgba(80, 70, 60, 0.05) 0%,
      rgba(60, 50, 40, 0.10) 30%,
      rgba(40, 30, 22, 0.45) 55%,
      rgba(30, 22, 16, 0.75) 75%,
      rgba(20, 14, 10, 0.92) 100%
    );
    z-index: 1;
  }
`;

const LeftImage = styled.div`
  position: absolute;
  inset: 0;
  background: url('/images/brand-bg-spheres.jpg');
  background-size: cover;
  background-position: center;
  animation: ${fadeIn} 1.2s ease-out;
  filter: sepia(0.5) saturate(1.6) brightness(0.55) hue-rotate(-5deg);
`;

const LeftOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 56px;
`;

const AccentLine = styled.div`
  height: 2px;
  width: 48px;
  background: linear-gradient(90deg, #C4896B, #92563E);
  margin-bottom: 24px;
  animation: ${accentReveal} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
  border-radius: 1px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -2px -4px;
    background: linear-gradient(90deg, rgba(196, 137, 107, 0.5), rgba(146, 86, 62, 0.3));
    filter: blur(6px);
    border-radius: 2px;
    animation: ${glowPulse} 3s ease-in-out infinite;
  }
`;

const OverlayBrand = styled.div`
  ${stagger(0)}

  h2 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 58px;
    font-weight: 400;
    color: #FFFFFF;
    letter-spacing: 4px;
    margin-bottom: 10px;
    line-height: 1;
    text-shadow:
      0 2px 20px rgba(0, 0, 0, 0.9),
      0 4px 40px rgba(0, 0, 0, 0.5),
      0 0 80px rgba(0, 0, 0, 0.3);
  }

  span {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: rgba(220, 190, 170, 0.95);
    letter-spacing: 7px;
    text-transform: uppercase;
    text-shadow:
      0 1px 12px rgba(0, 0, 0, 0.8),
      0 0 30px rgba(0, 0, 0, 0.4);
  }
`;

const OverlayQuote = styled.p`
  ${stagger(1)}
  margin-top: 32px;
  font-size: 15px;
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.88);
  max-width: 400px;
  font-style: italic;
  border-left: 2px solid rgba(196, 137, 107, 0.6);
  padding-left: 20px;
  text-shadow:
    0 1px 12px rgba(0, 0, 0, 0.9),
    0 2px 24px rgba(0, 0, 0, 0.5);
  font-weight: 400;
  letter-spacing: 0.3px;
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

const RightDecorativeLines = styled.div`
  position: absolute;
  left: -15%;
  right: -15%;
  top: 50%;
  transform: translateY(-50%);
  height: 360px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.28;
  overflow: hidden;
  mask-image: radial-gradient(ellipse 70% 80% at center, black 20%, transparent 65%);
  -webkit-mask-image: radial-gradient(ellipse 70% 80% at center, black 20%, transparent 65%);

  img {
    width: 130%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
`;

const LeftDecorativeLines = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40%;
  pointer-events: none;
  z-index: 3;
  opacity: 0.5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
  }
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
  margin-bottom: ${theme.spacing.lg};
  ${stagger(0)}
`;

const WelcomeTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: ${theme.borderRadius.full};
  background: rgba(146, 86, 62, 0.08);
  border: 1px solid rgba(146, 86, 62, 0.15);
  color: #92563E;
  font-size: 11px;
  font-weight: ${theme.typography.weights.semibold};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: ${theme.spacing.md};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const WelcomeTitle = styled.h1`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 28px;
  font-weight: 400;
  color: #2D2420;
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
  color: #8C8B8B;
  max-width: 340px;
  margin: 0 auto;
`;

/* ═══════════════════════════════
   CARD
   ═══════════════════════════════ */

const Card = styled.div`
  width: 100%;
  background: white;
  border-radius: ${theme.borderRadius.xxl};
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
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
      #92563E 50%,
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
  margin-bottom: ${theme.spacing.lg};

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 28px;
    font-weight: 400;
    color: #92563E;
    margin: 0 0 2px;
    letter-spacing: 1px;
  }

  p {
    color: #8C8B8B;
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
  color: #8C8B8B;
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
  border: 1.5px solid #e8e4e0;
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.sizes.md};
  color: #2D2420;
  background: #FAF8F6;
  transition: all 0.25s ease;

  &:hover {
    border-color: #d4cec8;
  }

  &:focus {
    outline: none;
    border-color: #92563E;
    box-shadow: 0 0 0 3px rgba(146, 86, 62, 0.1), 0 2px 8px rgba(146, 86, 62, 0.08);
    background: white;
  }

  &:focus ~ ${InputIcon} {
    color: #92563E;
    transform: translateY(-50%) scale(1.05);
  }

  &::placeholder {
    color: #b0a9a2;
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
  color: #8C8B8B;
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
    color: #92563E;
  }
`;

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #dc2626;
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
  color: #8C8B8B;
  margin-top: -${theme.spacing.xs};
  transition: color 0.2s ease;
  ${stagger(4)}
  text-decoration: none;

  &:hover {
    color: #92563E;
  }
`;

/* ═══════════════════════════════
   BUTTONS
   ═══════════════════════════════ */

const SubmitButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 15px ${theme.spacing.lg};
  background: linear-gradient(135deg, #92563E 0%, #7A4833 100%);
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
    box-shadow: 0 8px 24px rgba(146, 86, 62, 0.35);

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
  margin: ${theme.spacing.md} 0;
  ${stagger(6)}

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e8e4e0;
  }

  span {
    color: #8C8B8B;
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
  background: white;
  border: 1.5px solid #e8e4e0;
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.typography.sizes.md};
  font-weight: ${theme.typography.weights.medium};
  color: #2D2420;
  cursor: pointer;
  transition: all 0.25s ease;
  ${stagger(7)}

  &:hover:not(:disabled) {
    background: #FAF8F6;
    border-color: #d4cec8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
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
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  ${stagger(8)}

  p {
    color: #8C8B8B;
    font-size: ${theme.typography.sizes.sm};

    a {
      color: #92563E;
      font-weight: ${theme.typography.weights.semibold};
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        opacity: 0.8;
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
      <LeftPanel>
        <LeftImage />
        <LeftDecorativeLines>
          <img src="/images/lines/lines3-dourado.svg" alt="" />
        </LeftDecorativeLines>
        <LeftOverlay>
          <AccentLine />
          <OverlayBrand>
            <EssenceLogo variant="horizontal" size="xl" color="light" />
          </OverlayBrand>
          <OverlayQuote>
            Your health begins with your essence. Balance is the new beauty.
          </OverlayQuote>
        </LeftOverlay>
      </LeftPanel>

      <RightPanel>
        <RightDecorativeLines>
          <img src="/images/lines/lines2-marrom.svg" alt="" />
        </RightDecorativeLines>

        <ContentWrapper>
          <WelcomeSection>
            <WelcomeTag>
              <Leaf size={14} />
              Portal do Paciente
            </WelcomeTag>
            <WelcomeTitle>{t('login.welcome')}</WelcomeTitle>
            <WelcomeSubtitle>{t('login.subtitle')}</WelcomeSubtitle>
          </WelcomeSection>

          <Card>
            <Logo>
              <EssenceLogo variant="horizontal" size="sm" color="dark" />
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

              <SubmitButton type="submit" disabled={loading || googleLoading} $loading={loading}>
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
              disabled={loading || googleLoading}
              $loading={googleLoading}
            >
              {googleLoading ? <Spinner /> : (
                <>
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
