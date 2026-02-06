import React from 'react';
import styled from 'styled-components';
import { Sun, Moon } from 'lucide-react';
import { theme } from '../styles/GlobalStyle';
import { useTheme } from '../context/ThemeContext';

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  flex-shrink: 0;

  &:hover {
    background: ${theme.colors.primaryA10};
    color: ${theme.colors.primary};
  }

  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: rotate(15deg);
  }
`;

const ThemeToggle: React.FC = () => {
  const { themeMode, toggleTheme } = useTheme();

  return (
    <ToggleButton
      onClick={toggleTheme}
      title={themeMode === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
    >
      {themeMode === 'light' ? <Moon /> : <Sun />}
    </ToggleButton>
  );
};

export default ThemeToggle;
