import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/GlobalStyle';

interface CardProps {
  children: ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const paddingMap = {
  none: '0',
  small: theme.spacing.sm,
  medium: theme.spacing.md,
  large: theme.spacing.lg,
};

const StyledCard = styled.div<{ $padding: string; $hoverable: boolean }>`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  padding: ${props => props.$padding};
  box-shadow: ${theme.shadows.sm};

  ${props =>
    props.$hoverable &&
    `
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: ${theme.shadows.md};
      border-color: ${theme.colors.primaryA40};
    }
  `}
`;

const CardHeader = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text};
`;

const CardContent = styled.div`
  padding: ${theme.spacing.lg};
`;

const CardFooter = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
`;

interface CardComponent extends React.FC<CardProps> {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
}

const Card: CardComponent = ({
  children,
  padding = 'none',
  className,
  onClick,
  hoverable = false,
}) => {
  return (
    <StyledCard
      $padding={paddingMap[padding]}
      $hoverable={hoverable}
      className={className}
      onClick={onClick}
    >
      {children}
    </StyledCard>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
