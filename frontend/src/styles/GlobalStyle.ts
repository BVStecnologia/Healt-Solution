import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    // Cores principais - ShapeUp Identity
    primary: '#315FF2',
    primaryHover: '#2850D9',
    primaryLight: '#567BF0',
    primarySoft: '#EEF2FF',

    // Secundárias
    secondary: '#8C8B8B',
    secondaryHover: '#6B6B6B',

    // Status
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',

    // Neutros
    background: '#FAFBFC',
    surface: '#FFFFFF',
    surfaceHover: '#F8FAFC',
    text: '#333333',
    textSecondary: '#666666',  // Melhorado para WCAG AA (5.9:1)
    textMuted: '#8C8B8B',      // Para elementos decorativos/não-essenciais
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Especiais
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(49, 95, 242, 0.08)',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
  },

  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    xxl: '28px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    primary: '0 4px 14px 0 rgba(49, 95, 242, 0.25)',
    card: '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 24px rgba(0, 0, 0, 0.06)',
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyHeading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

    sizes: {
      xs: '12px',
      sm: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '24px',
      xxxl: '32px',
      display: '40px',
    },

    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
    spring: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

export type Theme = typeof theme;

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
    line-height: ${theme.typography.lineHeights.normal};
    font-size: ${theme.typography.sizes.md};
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-weight: ${theme.typography.weights.semibold};
    line-height: ${theme.typography.lineHeights.tight};
    color: ${theme.colors.text};
  }

  button {
    cursor: pointer;
    font-family: inherit;
    border: none;
    background: none;
  }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    transition: color ${theme.transitions.fast};

    &:hover {
      color: ${theme.colors.primaryHover};
    }
  }

  input, select, textarea {
    font-family: inherit;
    font-size: inherit;
  }

  ::selection {
    background-color: ${theme.colors.primarySoft};
    color: ${theme.colors.primary};
  }

  :focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }

  /* Scrollbar minimalista */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.border};
    border-radius: ${theme.borderRadius.full};

    &:hover {
      background: ${theme.colors.secondary};
    }
  }
`;
