import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, CheckCircle } from 'lucide-react';
import { theme } from '../styles/GlobalStyle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  border: 1px solid ${theme.colors.errorA30};
  color: ${theme.colors.error};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.sizes.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const SuccessMessage = styled.div`
  background: ${theme.colors.successLight};
  border: 1px solid ${theme.colors.successA30};
  color: ${theme.colors.success};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.sizes.sm};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      // Passa o idioma atual da interface como preferência do paciente
      const preferredLang = language as 'pt' | 'en';
      const { error: signUpError } = await signUp(email, password, firstName, lastName, preferredLang);

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
      <LeftPanel />

      <RightPanel>
        <div>
          <WelcomeText>
            <h1>{t('register.title')}</h1>
            <p>{t('register.subtitle')}</p>
          </WelcomeText>
          <Card>
            <Logo>
              <h1>Essence</h1>
              <p>Medical Clinic</p>
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
                    <Input
                      type="text"
                      placeholder={t('register.lastName')}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                      style={{ paddingLeft: '14px' }}
                    />
                  </InputGroup>
                </NameRow>

                <InputGroup>
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

                <InputGroup>
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

                <InputGroup>
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
        </div>
      </RightPanel>
    </Container>
  );
};

export default RegisterPage;
