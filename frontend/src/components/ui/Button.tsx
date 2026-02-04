import React, { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/GlobalStyle';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantStyles = {
  primary: css`
    background: ${theme.colors.primary};
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: ${theme.colors.primaryHover};
    }
  `,
  secondary: css`
    background: ${theme.colors.secondary};
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: #475569;
    }
  `,
  outline: css`
    background: transparent;
    color: ${theme.colors.primary};
    border: 1px solid ${theme.colors.primary};

    &:hover:not(:disabled) {
      background: ${theme.colors.primary}10;
    }
  `,
  danger: css`
    background: ${theme.colors.error};
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: #dc2626;
    }
  `,
  ghost: css`
    background: transparent;
    color: ${theme.colors.text};
    border: none;

    &:hover:not(:disabled) {
      background: ${theme.colors.border};
    }
  `,
};

const sizeStyles = {
  small: css`
    padding: 6px 12px;
    font-size: 13px;
  `,
  medium: css`
    padding: 10px 20px;
    font-size: 14px;
  `,
  large: css`
    padding: 14px 28px;
    font-size: 16px;
  `,
};

const StyledButton = styled.button<{
  $variant: ButtonProps['variant'];
  $size: ButtonProps['size'];
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  width: ${props => (props.$fullWidth ? '100%' : 'auto')};

  ${props => variantStyles[props.$variant || 'primary']}
  ${props => sizeStyles[props.$size || 'medium']}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${theme.colors.primary}40;
  }
`;

const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  isLoading = false,
  disabled,
  ...props
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </StyledButton>
  );
};

export default Button;
