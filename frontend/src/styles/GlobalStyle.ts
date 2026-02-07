import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    // Cores principais - Essence Medical Clinic Identity
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primary-hover)',
    primaryLight: 'var(--color-primary-light)',
    primarySoft: 'var(--color-primary-soft)',

    // Alpha variants (pre-defined for dark mode compatibility)
    primaryA10: 'var(--color-primary-a10)',
    primaryA12: 'var(--color-primary-a12)',
    primaryA15: 'var(--color-primary-a15)',
    primaryA20: 'var(--color-primary-a20)',
    primaryA40: 'var(--color-primary-a40)',
    primaryA50: 'var(--color-primary-a50)',
    primarySoftA30: 'var(--color-primary-soft-a30)',
    primarySoftA60: 'var(--color-primary-soft-a60)',

    // Secundárias
    secondary: 'var(--color-secondary)',
    secondaryHover: 'var(--color-secondary-hover)',

    // Status
    success: 'var(--color-success)',
    successLight: 'var(--color-success-light)',
    successA30: 'var(--color-success-a30)',
    warning: 'var(--color-warning)',
    warningLight: 'var(--color-warning-light)',
    error: 'var(--color-error)',
    errorLight: 'var(--color-error-light)',
    errorA10: 'var(--color-error-a10)',
    errorA30: 'var(--color-error-a30)',
    errorA50: 'var(--color-error-a50)',

    // Status badges (theme-aware)
    statusPendingBg: 'var(--color-status-pending-bg)',
    statusPendingText: 'var(--color-status-pending-text)',
    statusPendingBorder: 'var(--color-status-pending-border)',
    statusConfirmedBg: 'var(--color-status-confirmed-bg)',
    statusConfirmedText: 'var(--color-status-confirmed-text)',
    statusConfirmedBorder: 'var(--color-status-confirmed-border)',
    statusCheckedInBg: 'var(--color-status-checkedin-bg)',
    statusCheckedInText: 'var(--color-status-checkedin-text)',
    statusCheckedInBorder: 'var(--color-status-checkedin-border)',
    statusInProgressBg: 'var(--color-status-inprogress-bg)',
    statusInProgressText: 'var(--color-status-inprogress-text)',
    statusInProgressBorder: 'var(--color-status-inprogress-border)',
    statusCompletedBg: 'var(--color-status-completed-bg)',
    statusCompletedText: 'var(--color-status-completed-text)',
    statusCompletedBorder: 'var(--color-status-completed-border)',
    statusCancelledBg: 'var(--color-status-cancelled-bg)',
    statusCancelledText: 'var(--color-status-cancelled-text)',
    statusCancelledBorder: 'var(--color-status-cancelled-border)',
    statusNoShowBg: 'var(--color-status-noshow-bg)',
    statusNoShowText: 'var(--color-status-noshow-text)',
    statusNoShowBorder: 'var(--color-status-noshow-border)',

    info: 'var(--color-info)',
    infoLight: 'var(--color-info-light)',

    // Neutros
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    surfaceHover: 'var(--color-surface-hover)',
    text: 'var(--color-text)',
    textSecondary: 'var(--color-text-secondary)',
    textMuted: 'var(--color-text-muted)',
    border: 'var(--color-border)',
    borderLight: 'var(--color-border-light)',
    borderA30: 'var(--color-border-a30)',
    borderA50: 'var(--color-border-a50)',

    // Especiais
    overlay: 'var(--color-overlay)',
    shadow: 'var(--color-shadow)',
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
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    primary: 'var(--shadow-primary)',
    card: 'var(--shadow-card)',
  },

  typography: {
    fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyHeading: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

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
  /* ===== Light Theme (default) ===== */
  :root {
    /* Primary */
    --color-primary: #92563E;
    --color-primary-hover: #7A4833;
    --color-primary-light: #AF8871;
    --color-primary-soft: #F4E7DE;

    /* Primary alpha */
    --color-primary-a10: rgba(146, 86, 62, 0.063);
    --color-primary-a12: rgba(146, 86, 62, 0.07);
    --color-primary-a15: rgba(146, 86, 62, 0.08);
    --color-primary-a20: rgba(146, 86, 62, 0.125);
    --color-primary-a40: rgba(146, 86, 62, 0.25);
    --color-primary-a50: rgba(146, 86, 62, 0.31);
    --color-primary-soft-a30: rgba(244, 231, 222, 0.19);
    --color-primary-soft-a60: rgba(244, 231, 222, 0.38);

    /* Secondary */
    --color-secondary: #8C8B8B;
    --color-secondary-hover: #6B6B6B;

    /* Status */
    --color-success: #10B981;
    --color-success-light: #D1FAE5;
    --color-success-a30: rgba(16, 185, 129, 0.19);
    --color-warning: #F59E0B;
    --color-warning-light: #FEF3C7;
    --color-error: #EF4444;
    --color-error-light: #FEE2E2;
    --color-error-a10: rgba(239, 68, 68, 0.063);
    --color-error-a30: rgba(239, 68, 68, 0.19);
    --color-error-a50: rgba(239, 68, 68, 0.31);

    /* Status badges */
    --color-status-pending-bg: #FEF3C7;
    --color-status-pending-text: #92400E;
    --color-status-pending-border: #D97706;
    --color-status-confirmed-bg: #D1FAE5;
    --color-status-confirmed-text: #065F46;
    --color-status-confirmed-border: #059669;
    --color-status-checkedin-bg: #DBEAFE;
    --color-status-checkedin-text: #1E40AF;
    --color-status-checkedin-border: #2563EB;
    --color-status-inprogress-bg: #E0E7FF;
    --color-status-inprogress-text: #3730A3;
    --color-status-inprogress-border: #4F46E5;
    --color-status-completed-bg: #F3F4F6;
    --color-status-completed-text: #374151;
    --color-status-completed-border: #6B7280;
    --color-status-cancelled-bg: #FEE2E2;
    --color-status-cancelled-text: #991B1B;
    --color-status-cancelled-border: #DC2626;
    --color-status-noshow-bg: #FECACA;
    --color-status-noshow-text: #7F1D1D;
    --color-status-noshow-border: #B91C1C;

    --color-info: #AF8871;
    --color-info-light: #F4E7DE;

    /* Neutrals */
    --color-background: #FAF8F6;
    --color-surface: #FFFFFF;
    --color-surface-hover: #F5F0EB;
    --color-text: #393939;
    --color-text-secondary: #4C4F54;
    --color-text-muted: #8C8B8B;
    --color-border: #E5E0DB;
    --color-border-light: #F3F0ED;
    --color-border-a30: rgba(229, 224, 219, 0.19);
    --color-border-a50: rgba(229, 224, 219, 0.31);

    /* Specials */
    --color-overlay: rgba(0, 0, 0, 0.5);
    --color-shadow: rgba(146, 86, 62, 0.08);

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    --shadow-primary: 0 4px 14px 0 rgba(146, 86, 62, 0.25);
    --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 24px rgba(0, 0, 0, 0.06);
  }

  /* ===== Dark Theme ===== */
  [data-theme="dark"] {
    /* Primary */
    --color-primary: #C4896B;
    --color-primary-hover: #D49E84;
    --color-primary-light: #A06E55;
    --color-primary-soft: #3D2E24;

    /* Primary alpha */
    --color-primary-a10: rgba(196, 137, 107, 0.1);
    --color-primary-a12: rgba(196, 137, 107, 0.12);
    --color-primary-a15: rgba(196, 137, 107, 0.15);
    --color-primary-a20: rgba(196, 137, 107, 0.2);
    --color-primary-a40: rgba(196, 137, 107, 0.4);
    --color-primary-a50: rgba(196, 137, 107, 0.5);
    --color-primary-soft-a30: rgba(61, 46, 36, 0.3);
    --color-primary-soft-a60: rgba(61, 46, 36, 0.6);

    /* Secondary */
    --color-secondary: #9E9D9D;
    --color-secondary-hover: #B5B4B4;

    /* Status */
    --color-success: #34D399;
    --color-success-light: #064E3B;
    --color-success-a30: rgba(52, 211, 153, 0.19);
    --color-warning: #FBBF24;
    --color-warning-light: #78350F;
    --color-error: #F87171;
    --color-error-light: #7F1D1D;
    --color-error-a10: rgba(248, 113, 113, 0.1);
    --color-error-a30: rgba(248, 113, 113, 0.19);
    --color-error-a50: rgba(248, 113, 113, 0.31);

    /* Status badges */
    --color-status-pending-bg: rgba(251, 191, 36, 0.15);
    --color-status-pending-text: #FDE68A;
    --color-status-pending-border: #D97706;
    --color-status-confirmed-bg: rgba(52, 211, 153, 0.15);
    --color-status-confirmed-text: #6EE7B7;
    --color-status-confirmed-border: #059669;
    --color-status-checkedin-bg: rgba(59, 130, 246, 0.15);
    --color-status-checkedin-text: #93C5FD;
    --color-status-checkedin-border: #3B82F6;
    --color-status-inprogress-bg: rgba(99, 102, 241, 0.15);
    --color-status-inprogress-text: #A5B4FC;
    --color-status-inprogress-border: #6366F1;
    --color-status-completed-bg: rgba(156, 163, 175, 0.12);
    --color-status-completed-text: #9CA3AF;
    --color-status-completed-border: #6B7280;
    --color-status-cancelled-bg: rgba(248, 113, 113, 0.15);
    --color-status-cancelled-text: #FCA5A5;
    --color-status-cancelled-border: #EF4444;
    --color-status-noshow-bg: rgba(248, 113, 113, 0.2);
    --color-status-noshow-text: #FCA5A5;
    --color-status-noshow-border: #DC2626;

    --color-info: #C4896B;
    --color-info-light: #3D2E24;

    /* Neutrals */
    --color-background: #1A1714;
    --color-surface: #252018;
    --color-surface-hover: #302920;
    --color-text: #E8E2DC;
    --color-text-secondary: #B5AFA8;
    --color-text-muted: #8C8580;
    --color-border: #3D3630;
    --color-border-light: #332D27;
    --color-border-a30: rgba(61, 54, 48, 0.3);
    --color-border-a50: rgba(61, 54, 48, 0.5);

    /* Specials */
    --color-overlay: rgba(0, 0, 0, 0.7);
    --color-shadow: rgba(0, 0, 0, 0.3);

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.25);
    --shadow-primary: 0 4px 14px 0 rgba(196, 137, 107, 0.3);
    --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 24px rgba(0, 0, 0, 0.15);
  }

  /* Fontes carregadas via index.html para melhor performance */

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color-scheme: light;
  }

  [data-theme="dark"] {
    color-scheme: dark;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
    line-height: ${theme.typography.lineHeights.normal};
    font-size: ${theme.typography.sizes.md};
    transition: background-color 0.3s ease, color 0.3s ease;
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
