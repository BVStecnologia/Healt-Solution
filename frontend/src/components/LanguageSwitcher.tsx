import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useLanguage, Language } from '../context/LanguageContext';
import { theme } from '../styles/GlobalStyle';
import { ChevronDown } from 'lucide-react';

const Container = styled.div`
  position: fixed;
  top: ${theme.spacing.md};
  right: ${theme.spacing.xxl};
  z-index: 999;
`;

const MainButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  background: ${theme.colors.surface};
  padding: 6px 10px;
  border-radius: ${theme.borderRadius.full};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.border};
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover {
    box-shadow: ${theme.shadows.md};
    border-color: ${theme.colors.primary};
  }

  svg.chevron {
    width: 14px;
    height: 14px;
    color: ${theme.colors.textMuted};
    transition: transform ${theme.transitions.fast};
  }

  &[data-open="true"] svg.chevron {
    transform: rotate(180deg);
  }
`;

const FlagIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Dropdown = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.lg};
  border: 1px solid ${theme.colors.border};
  overflow: hidden;
  opacity: ${({ $open }) => $open ? 1 : 0};
  visibility: ${({ $open }) => $open ? 'visible' : 'hidden'};
  transform: ${({ $open }) => $open ? 'translateY(0)' : 'translateY(-8px)'};
  transition: all ${theme.transitions.fast};
`;

const DropdownItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: ${({ $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  cursor: pointer;
  transition: background ${theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) => $active ? theme.colors.primarySoft : theme.colors.surfaceHover};
  }

  span {
    font-size: ${theme.typography.sizes.sm};
    color: ${theme.colors.text};
  }
`;

// Bandeira do Brasil (simplificada)
const BrazilFlag = () => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#009739" width="32" height="32" />
    <polygon fill="#FEDD00" points="16,4 28,16 16,28 4,16" />
    <circle fill="#002776" cx="16" cy="16" r="6" />
    <path fill="#FFFFFF" d="M10.5,16.5 Q16,13 21.5,16.5" strokeWidth="1" stroke="#FFFFFF" fillOpacity="0" />
  </svg>
);

// Bandeira dos EUA (simplificada)
const USAFlag = () => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#BD3D44" width="32" height="32" />
    <rect fill="#FFFFFF" y="2.5" width="32" height="2.5" />
    <rect fill="#FFFFFF" y="7.5" width="32" height="2.5" />
    <rect fill="#FFFFFF" y="12.5" width="32" height="2.5" />
    <rect fill="#FFFFFF" y="17.5" width="32" height="2.5" />
    <rect fill="#FFFFFF" y="22.5" width="32" height="2.5" />
    <rect fill="#FFFFFF" y="27.5" width="32" height="2.5" />
    <rect fill="#192F5D" width="14" height="17" />
  </svg>
);

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
  };

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const CurrentFlag = language === 'pt' ? BrazilFlag : USAFlag;

  return (
    <Container ref={containerRef}>
      <MainButton
        onClick={() => setOpen(!open)}
        data-open={open}
        aria-label="Selecionar idioma"
      >
        <FlagIcon>
          <CurrentFlag />
        </FlagIcon>
        <ChevronDown className="chevron" />
      </MainButton>

      <Dropdown $open={open}>
        <DropdownItem
          $active={language === 'pt'}
          onClick={() => handleLanguageChange('pt')}
        >
          <FlagIcon><BrazilFlag /></FlagIcon>
          <span>Português</span>
        </DropdownItem>
        <DropdownItem
          $active={language === 'en'}
          onClick={() => handleLanguageChange('en')}
        >
          <FlagIcon><USAFlag /></FlagIcon>
          <span>English</span>
        </DropdownItem>
      </Dropdown>
    </Container>
  );
};

export default LanguageSwitcher;
