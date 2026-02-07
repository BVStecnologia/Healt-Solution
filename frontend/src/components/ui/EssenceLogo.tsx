import React from 'react';
import styled from 'styled-components';

interface EssenceLogoProps {
  variant?: 'horizontal' | 'vertical';
  color?: 'dark' | 'light';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const SIZES = {
  horizontal: {
    xs: { width: 100, height: 28 },
    sm: { width: 140, height: 40 },
    md: { width: 180, height: 51 },
    lg: { width: 220, height: 62 },
    xl: { width: 300, height: 85 },
  },
  vertical: {
    xs: { width: 80, height: 20 },
    sm: { width: 120, height: 31 },
    md: { width: 160, height: 41 },
    lg: { width: 200, height: 51 },
    xl: { width: 260, height: 67 },
  },
};

const LOGO_SRCS = {
  'horizontal-dark': '/images/logo-vertical.svg',
  'horizontal-light': '/images/logo-vertical-marrom.svg',
  'vertical-dark': '/images/logo-vertical.svg',
  'vertical-light': '/images/logo-vertical-marrom.svg',
};

const LogoImg = styled.img`
  display: block;
  object-fit: contain;
`;

const EssenceLogo: React.FC<EssenceLogoProps> = ({
  variant = 'horizontal',
  color = 'dark',
  size = 'md',
  className,
  onClick,
}) => {
  const dimensions = SIZES[variant][size];
  const src = LOGO_SRCS[`${variant}-${color}`];

  return (
    <LogoImg
      src={src}
      alt="Essence Medical Clinic"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    />
  );
};

export default EssenceLogo;
