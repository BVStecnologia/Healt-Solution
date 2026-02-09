import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, Clock, CheckCircle } from 'lucide-react';
import { theme } from '../styles/GlobalStyle';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../hooks/useAppointments';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AppointmentCard from '../components/scheduling/AppointmentCard';
import LoadingSpinner from '../components/LoadingSpinner';

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};

  @media (max-width: 480px) {
    flex-direction: column;
    gap: ${theme.spacing.md};
    align-items: stretch;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0;
`;

const Greeting = styled.p`
  color: ${theme.colors.textSecondary};
  margin: ${theme.spacing.xs} 0 0;
  font-size: 14px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.lg};
  background: ${props => props.$color}15;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
  }
`;

const StatInfo = styled.div``;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${theme.colors.text};
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const Section = styled.section`
  margin-bottom: ${theme.spacing.xl};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl};
  color: ${theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${theme.spacing.md};
    opacity: 0.5;
  }

  p {
    margin: 0 0 ${theme.spacing.md};
  }
`;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { appointments, loading } = useAppointments();
  const { t } = useTranslation();

  // Filtrar próximas consultas
  const upcomingAppointments = appointments
    .filter(a =>
      ['pending', 'confirmed'].includes(a.status) &&
      new Date(a.scheduled_at) >= new Date()
    )
    .slice(0, 3);

  // Estatísticas
  const stats = {
    upcoming: upcomingAppointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    total: appointments.length,
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner fullScreen={false} message={t('dashboard.loadingData')} />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader>
        <div>
          <Title>{t('dashboard.title')}</Title>
          <Greeting>
            {t('dashboard.greeting', { name: profile?.first_name })}
          </Greeting>
        </div>
        <Button onClick={() => navigate('/appointments/new')}>
          <Plus size={18} />
          {t('dashboard.newAppointment')}
        </Button>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatIcon $color={theme.colors.primary}>
            <Calendar />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.upcoming}</StatValue>
            <StatLabel>{t('dashboard.scheduledAppointments')}</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color={theme.colors.success}>
            <CheckCircle />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.completed}</StatValue>
            <StatLabel>{t('dashboard.completedAppointments')}</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color={theme.colors.secondary}>
            <Clock />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>{t('dashboard.totalPatientAppointments')}</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      <Section>
        <SectionHeader>
          <SectionTitle>{t('dashboard.upcomingAppointments')}</SectionTitle>
          <Button
            variant="ghost"
            size="small"
            onClick={() => navigate('/appointments')}
          >
            {t('common.all')}
          </Button>
        </SectionHeader>

        {upcomingAppointments.length === 0 ? (
          <Card padding="large">
            <EmptyState>
              <Calendar />
              <p>{t('dashboard.noAppointments')}</p>
              <Button onClick={() => navigate('/appointments/new')}>
                {t('dashboard.newAppointment')}
              </Button>
            </EmptyState>
          </Card>
        ) : (
          upcomingAppointments.map(appointment => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onClick={() => navigate(`/appointments/${appointment.id}`)}
            />
          ))
        )}
      </Section>
    </Layout>
  );
};

export default Dashboard;
