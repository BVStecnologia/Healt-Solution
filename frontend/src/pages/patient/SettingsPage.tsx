import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Sun, Moon, Globe, Info } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import Layout from '../../components/Layout';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageTitle = styled.h1`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 28px;
  font-weight: 400;
  color: ${theme.colors.text};
  margin: 0 0 ${theme.spacing.xl};
`;

const Section = styled.div<{ $delay?: number }>`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.card};
  animation: ${fadeInUp} 0.6s ease-out;
  animation-delay: ${props => props.$delay || 0}ms;
  animation-fill-mode: both;
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 18px;
  font-weight: 400;
  color: ${theme.colors.text};
  margin: 0 0 ${theme.spacing.lg};

  svg {
    width: 20px;
    height: 20px;
    color: ${theme.colors.primary};
  }
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.md} 0;

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.borderLight};
  }
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingLabel = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${theme.colors.text};
  margin-bottom: 4px;
`;

const SettingDescription = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const ThemeSwitch = styled.button<{ $dark: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.full};
  border: 2px solid ${props => props.$dark ? theme.colors.primary : theme.colors.border};
  background: ${props => props.$dark ? theme.colors.primaryA10 : theme.colors.surface};
  color: ${props => props.$dark ? theme.colors.primary : theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${theme.colors.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const LanguageOptions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const LanguageButton = styled.button<{ $active: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.full};
  border: 2px solid ${props => props.$active ? theme.colors.primary : theme.colors.border};
  background: ${props => props.$active ? theme.colors.primaryA10 : theme.colors.surface};
  color: ${props => props.$active ? theme.colors.primary : theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

const InfoBox = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};

  p {
    font-size: 14px;
    color: ${theme.colors.textSecondary};
    line-height: 1.6;
    margin: 0;

    &:not(:last-child) {
      margin-bottom: ${theme.spacing.sm};
    }
  }

  strong {
    color: ${theme.colors.text};
  }
`;

const SettingsPage: React.FC = () => {
  const { themeMode, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <Layout>
      <PageTitle>Configurações</PageTitle>

      <Section $delay={0}>
        <SectionTitle>
          {themeMode === 'dark' ? <Moon /> : <Sun />}
          Aparência
        </SectionTitle>
        <SettingRow>
          <SettingInfo>
            <SettingLabel>Tema</SettingLabel>
            <SettingDescription>
              Alterne entre tema claro e escuro
            </SettingDescription>
          </SettingInfo>
          <ThemeSwitch $dark={themeMode === 'dark'} onClick={toggleTheme}>
            {themeMode === 'dark' ? <Moon /> : <Sun />}
            {themeMode === 'dark' ? 'Escuro' : 'Claro'}
          </ThemeSwitch>
        </SettingRow>
      </Section>

      <Section $delay={100}>
        <SectionTitle>
          <Globe />
          Idioma
        </SectionTitle>
        <SettingRow>
          <SettingInfo>
            <SettingLabel>Idioma da Interface</SettingLabel>
            <SettingDescription>
              Escolha o idioma de exibição do portal
            </SettingDescription>
          </SettingInfo>
          <LanguageOptions>
            <LanguageButton
              $active={language === 'pt'}
              onClick={() => setLanguage('pt', true)}
            >
              Português
            </LanguageButton>
            <LanguageButton
              $active={language === 'en'}
              onClick={() => setLanguage('en', true)}
            >
              English
            </LanguageButton>
          </LanguageOptions>
        </SettingRow>
      </Section>

      <Section $delay={200}>
        <SectionTitle>
          <Info />
          Sobre
        </SectionTitle>
        <InfoBox>
          <p><strong>Essence Medical Clinic</strong></p>
          <p>Portal do Paciente - Gerencie suas consultas, acompanhe seu tratamento e tenha acesso a todas as informações de saúde em um único lugar.</p>
          <p>Versão 1.0</p>
        </InfoBox>
      </Section>
    </Layout>
  );
};

export default SettingsPage;
