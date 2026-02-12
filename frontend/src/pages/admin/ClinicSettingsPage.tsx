import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Settings, Save, Clock, RefreshCw, Check } from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { callRPC } from '../../lib/supabaseClient';

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================
// STYLED COMPONENTS
// ============================================
const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.6s ease-out;

  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 32px;
    font-weight: 400;
    color: ${theme.colors.text};
    margin: 0 0 8px;
    letter-spacing: 0.5px;
  }

  p {
    color: ${theme.colors.textSecondary};
    margin: 0;
    font-size: 15px;
  }
`;

const Section = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  animation: ${fadeInUp} 0.6s ease-out 0.1s both;
`;

const SectionTitle = styled.h2`
  font-family: ${theme.typography.fontFamilyHeading};
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${theme.colors.primary};
  }
`;

const SectionDescription = styled.p`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  margin: 0 0 24px;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const SettingLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.text};
  min-width: 200px;
`;

const SelectWrapper = styled.div`
  position: relative;
`;

const StyledSelect = styled.select`
  appearance: none;
  padding: 10px 40px 10px 14px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  background: ${theme.colors.surface};
  color: ${theme.colors.text};
  cursor: pointer;
  min-width: 160px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

const SelectChevron = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: ${theme.colors.textSecondary};
`;

const SaveButton = styled.button<{ $saving?: boolean; $saved?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${props => props.$saved ? '#6B8E6B' : theme.colors.primary};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.$saving ? 'wait' : 'pointer'};
  opacity: ${props => props.$saving ? 0.7 : 1};
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: ${theme.colors.textSecondary};
  font-size: 14px;
  gap: 10px;

  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const HintText = styled.span`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  font-style: italic;
`;

// ============================================
// OPTIONS
// ============================================
const HOUR_OPTIONS = [1, 2, 4, 6, 8, 12, 24, 48, 72];

// ============================================
// COMPONENT
// ============================================
const ClinicSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [minBookingHours, setMinBookingHours] = useState<string>('24');
  const [originalValue, setOriginalValue] = useState<string>('24');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const value = await callRPC<string>('get_clinic_setting', { p_key: 'min_booking_hours' });
      const hours = value || '24';
      setMinBookingHours(hours);
      setOriginalValue(hours);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      await callRPC('update_clinic_setting', {
        p_key: 'min_booking_hours',
        p_value: minBookingHours,
      });
      setOriginalValue(minBookingHours);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error saving setting:', err);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = minBookingHours !== originalValue;

  return (
    <AdminLayout>
      <Header>
        <div>
          <h1>{t('clinicSettings.title')}</h1>
          <p>{t('clinicSettings.subtitle')}</p>
        </div>
      </Header>

      {loading ? (
        <LoadingWrapper>
          <RefreshCw size={18} />
          {t('common.loading')}
        </LoadingWrapper>
      ) : (
        <Section>
          <SectionTitle>
            <Clock size={20} />
            {t('clinicSettings.bookingRulesTitle')}
          </SectionTitle>
          <SectionDescription>
            {t('clinicSettings.bookingRulesDescription')}
          </SectionDescription>

          <SettingRow>
            <SettingLabel>{t('clinicSettings.minBookingHours')}</SettingLabel>
            <SelectWrapper>
              <StyledSelect
                value={minBookingHours}
                onChange={(e) => {
                  setMinBookingHours(e.target.value);
                  setSaved(false);
                }}
              >
                {HOUR_OPTIONS.map(h => (
                  <option key={h} value={String(h)}>
                    {h} {h === 1 ? t('clinicSettings.hour') : t('clinicSettings.hours')}
                  </option>
                ))}
              </StyledSelect>
              <SelectChevron>
                <Settings size={14} />
              </SelectChevron>
            </SelectWrapper>

            <SaveButton
              onClick={handleSave}
              disabled={!hasChanges || saving}
              $saving={saving}
              $saved={saved}
            >
              {saved ? <Check /> : <Save />}
              {saved ? t('clinicSettings.saved') : saving ? t('clinicSettings.saving') : t('clinicSettings.save')}
            </SaveButton>

            {!hasChanges && !saved && (
              <HintText>{t('clinicSettings.currentValue', { hours: originalValue })}</HintText>
            )}
          </SettingRow>
        </Section>
      )}
    </AdminLayout>
  );
};

export default ClinicSettingsPage;
