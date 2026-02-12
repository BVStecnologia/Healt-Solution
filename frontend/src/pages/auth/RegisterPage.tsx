import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, CheckCircle, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { theme } from '../../styles/GlobalStyle';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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
`;

/* ═══════════════════════════════
   FORM
   ═══════════════════════════════ */

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.md};
  ${stagger(2)}
`;

const InputGroup = styled.div<{ $index?: number }>`
  position: relative;
  ${p => p.$index !== undefined && stagger(p.$index + 2)}
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

const SmallInput = styled(Input)`
  padding-left: 14px;
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

const SuccessMessage = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.sizes.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  animation: ${fadeUp} 0.3s ease-out;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
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
  ${stagger(6)}

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

const Footer = styled.div`
  text-align: center;
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  ${stagger(7)}

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

const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const registerSchema = z.object({
    firstName: z.string().min(1, t('register.firstNameRequired')).max(50),
    lastName: z.string().min(1, t('register.lastNameRequired')).max(50),
    email: z.string().min(1, t('register.emailRequired')).email(t('register.emailInvalid')),
    password: z.string().min(6, t('register.passwordTooShort')),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: t('register.passwordMismatch'),
    path: ['confirmPassword'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = registerSchema.safeParse({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const preferredLang = language as 'pt' | 'en';
      const { error: signUpError } = await signUp(result.data.email, result.data.password, result.data.firstName, result.data.lastName, preferredLang);

      if (signUpError) {
        setError(t('register.error'));
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(t('register.error'));
    } finally {
      setLoading(false);
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
              <UserPlus size={14} />
              {t('register.title')}
            </WelcomeTag>
            <WelcomeTitle>{t('register.title')}</WelcomeTitle>
            <WelcomeSubtitle>{t('register.subtitle')}</WelcomeSubtitle>
          </WelcomeSection>

          <Card>
            <Logo>
              <EssenceLogo variant="horizontal" size="sm" color="dark" />
            </Logo>

            {success ? (
              <SuccessMessage>
                <CheckCircle />
                {t('register.success')}
              </SuccessMessage>
            ) : (
              <Form onSubmit={handleSubmit}>
                {error && <ErrorMessage>{error}</ErrorMessage>}

                <NameRow>
                  <InputGroup>
                    <Input
                      type="text"
                      placeholder={t('register.firstName')}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                    />
                    <InputIcon>
                      <User />
                    </InputIcon>
                  </InputGroup>

                  <InputGroup>
                    <SmallInput
                      type="text"
                      placeholder={t('register.lastName')}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                    />
                  </InputGroup>
                </NameRow>

                <InputGroup $index={1}>
                  <Input
                    type="email"
                    placeholder={t('register.email')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <InputIcon>
                    <Mail />
                  </InputIcon>
                </InputGroup>

                <InputGroup $index={2}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('register.password')}
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

                <InputGroup $index={3}>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('register.confirmPassword')}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  <InputIcon>
                    <Lock />
                  </InputIcon>
                  <PasswordToggle
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </PasswordToggle>
                </InputGroup>

                <SubmitButton type="submit" disabled={loading} $loading={loading}>
                  {loading ? <Spinner /> : (
                    <>
                      {t('register.submit')}
                      <ArrowRight />
                    </>
                  )}
                </SubmitButton>
              </Form>
            )}

            <Footer>
              <p>
                {t('register.hasAccount')} <a href="/login">{t('register.login')}</a>
              </p>
            </Footer>
          </Card>
        </ContentWrapper>
      </RightPanel>
    </Container>
  );
};

export default RegisterPage;
