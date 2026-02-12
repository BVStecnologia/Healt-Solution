import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  Bell,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { theme } from '../../styles/GlobalStyle';
import AdminLayout from '../../components/admin/AdminLayout';
import { ClinicSettingsContent } from './ClinicSettingsPage';
import { NotificationRulesContent } from './NotificationRulesPage';
import { WhatsAppContent } from './WhatsAppPage';
import { FailedMessagesContent } from './FailedMessagesPage';

// ============================================
// TYPES
// ============================================
type TabKey = 'general' | 'notifications' | 'whatsapp' | 'failed-messages';

interface TabConfig {
  key: TabKey;
  labelKey: string;
  icon: React.FC<any>;
}

const TABS: TabConfig[] = [
  { key: 'general', labelKey: 'settings.tabGeneral', icon: Settings },
  { key: 'notifications', labelKey: 'settings.tabNotifications', icon: Bell },
  { key: 'whatsapp', labelKey: 'settings.tabWhatsapp', icon: MessageCircle },
  { key: 'failed-messages', labelKey: 'settings.tabFailedMessages', icon: AlertTriangle },
];

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
  margin-bottom: 28px;
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

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 32px;
  border-bottom: 1px solid ${theme.colors.border};
  overflow-x: auto;
  animation: ${fadeInUp} 0.6s ease-out 0.1s both;

  &::-webkit-scrollbar {
    height: 0;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin-bottom: -1px;

  &:hover {
    color: ${theme.colors.primary};
    background: ${theme.colors.primaryA10};
    border-radius: 8px 8px 0 0;
  }

  svg {
    width: 18px;
    height: 18px;
    opacity: ${props => props.$active ? 1 : 0.6};
  }
`;

const TabContent = styled.div`
  animation: ${fadeInUp} 0.4s ease-out;
`;

// ============================================
// COMPONENT
// ============================================
const AdminSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') as TabKey) || 'general';

  const handleTabChange = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <ClinicSettingsContent />;
      case 'notifications':
        return <NotificationRulesContent />;
      case 'whatsapp':
        return <WhatsAppContent />;
      case 'failed-messages':
        return <FailedMessagesContent />;
      default:
        return <ClinicSettingsContent />;
    }
  };

  return (
    <AdminLayout>
      <Header>
        <h1>{t('settings.tabPageTitle')}</h1>
        <p>{t('settings.tabPageSubtitle')}</p>
      </Header>

      <TabBar>
        {TABS.map(tab => (
          <Tab
            key={tab.key}
            $active={activeTab === tab.key}
            onClick={() => handleTabChange(tab.key)}
          >
            <tab.icon />
            {t(tab.labelKey)}
          </Tab>
        ))}
      </TabBar>

      <TabContent key={activeTab}>
        {renderContent()}
      </TabContent>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
