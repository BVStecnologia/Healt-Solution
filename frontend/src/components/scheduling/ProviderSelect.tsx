import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { User, Check } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import type { Provider } from '../../types/database';
import { getSpecialtyKey } from '../../constants/treatments';

interface ProviderSelectProps {
  providers: Provider[];
  selectedId: string | null;
  onSelect: (provider: Provider) => void;
  loading?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.text};
  margin-bottom: ${theme.spacing.xs};
`;

const ProviderCard = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${props => props.$selected ? theme.colors.primaryA10 : theme.colors.surface};
  border: 2px solid ${props => props.$selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

const Avatar = styled.div<{ $selected: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$selected ? theme.colors.primary : theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$selected ? 'white' : theme.colors.textSecondary};

  svg {
    width: 24px;
    height: 24px;
  }
`;

const Info = styled.div`
  flex: 1;
`;

const Name = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${theme.colors.text};
`;

const Specialty = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const CheckIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const EmptyState = styled.div`
  padding: ${theme.spacing.lg};
  text-align: center;
  color: ${theme.colors.textSecondary};
  font-size: 14px;
`;

const ProviderSelect: React.FC<ProviderSelectProps> = ({
  providers,
  selectedId,
  onSelect,
  loading = false,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return <EmptyState>{t('booking.loadingProviders')}</EmptyState>;
  }

  if (providers.length === 0) {
    return <EmptyState>{t('booking.noProviders')}</EmptyState>;
  }

  return (
    <Container>
      <Label>{t('booking.selectProvider')}</Label>
      {providers.map(provider => {
        const isSelected = provider.id === selectedId;
        const name = provider.profile
          ? `${t('common.drPrefix')} ${provider.profile.first_name} ${provider.profile.last_name}`
          : t('providers.unknown');

        return (
          <ProviderCard
            key={provider.id}
            $selected={isSelected}
            onClick={() => onSelect(provider)}
            type="button"
          >
            <Avatar $selected={isSelected}>
              <User />
            </Avatar>
            <Info>
              <Name>{name}</Name>
              <Specialty>{t(getSpecialtyKey(provider.specialty))}</Specialty>
            </Info>
            {isSelected && (
              <CheckIcon>
                <Check />
              </CheckIcon>
            )}
          </ProviderCard>
        );
      })}
    </Container>
  );
};

export default ProviderSelect;
