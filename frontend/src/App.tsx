import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import DoctorProtectedRoute from './components/doctor/DoctorProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import LanguageSwitcher from './components/LanguageSwitcher';

// Lazy loading das páginas - Portal do Paciente
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AppointmentsPage = lazy(() => import('./pages/scheduling/AppointmentsPage'));
const NewAppointmentPage = lazy(() => import('./pages/scheduling/NewAppointmentPage'));
const AppointmentDetailPage = lazy(() => import('./pages/scheduling/AppointmentDetailPage'));
const ProfilePage = lazy(() => import('./pages/patient/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/patient/SettingsPage'));
const PatientDocumentsPage = lazy(() => import('./pages/patient/PatientDocumentsPage'));

// Lazy loading das páginas - Painel Admin
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CalendarPage = lazy(() => import('./pages/admin/CalendarPage'));
const WhatsAppPage = lazy(() => import('./pages/admin/WhatsAppPage'));
const AdminAppointmentsPage = lazy(() => import('./pages/admin/AdminAppointmentsPage'));
const PatientsPage = lazy(() => import('./pages/admin/PatientsPage'));
const PatientProfilePage = lazy(() => import('./pages/admin/PatientProfilePage'));
const ProvidersPage = lazy(() => import('./pages/admin/ProvidersPage'));
const AdminsPage = lazy(() => import('./pages/admin/AdminsPage'));
const MySchedulePage = lazy(() => import('./pages/admin/MySchedulePage'));
const NotificationRulesPage = lazy(() => import('./pages/admin/NotificationRulesPage'));
const FailedMessagesPage = lazy(() => import('./pages/admin/FailedMessagesPage'));
const ServicesPage = lazy(() => import('./pages/admin/ServicesPage'));
const AttendantsPage = lazy(() => import('./pages/admin/AttendantsPage'));
const HandoffSessionsPage = lazy(() => import('./pages/admin/HandoffSessionsPage'));

// Smart redirect: admins/providers vão para sua área, pacientes ficam no dashboard
// ?as=patient permite admin/provider visualizar o portal do paciente
const HomeDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const viewAsPatient = searchParams.get('as') === 'patient';

  if (!viewAsPatient) {
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile?.role === 'provider') return <Navigate to="/doctor" replace />;
  }

  return <Dashboard />;
};

const App: React.FC = () => {
  const { t } = useTranslation();
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message={t('common.loading')} />;
  }

  return (
    <>
      <LanguageSwitcher />
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rotas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <HomeDashboard />
          </ProtectedRoute>
        } />

        <Route path="/appointments" element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        } />

        <Route path="/appointments/new" element={
          <ProtectedRoute>
            <NewAppointmentPage />
          </ProtectedRoute>
        } />

        <Route path="/appointments/:id" element={
          <ProtectedRoute>
            <AppointmentDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />

        <Route path="/documents" element={
          <ProtectedRoute>
            <PatientDocumentsPage />
          </ProtectedRoute>
        } />

        {/* Rotas Admin - Públicas */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Rotas Admin - Protegidas */}
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/calendar" element={
          <AdminProtectedRoute>
            <CalendarPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/whatsapp" element={
          <AdminProtectedRoute>
            <WhatsAppPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/appointments" element={
          <AdminProtectedRoute>
            <AdminAppointmentsPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/patients" element={
          <AdminProtectedRoute>
            <PatientsPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/patients/:id" element={
          <AdminProtectedRoute>
            <PatientProfilePage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/providers" element={
          <AdminProtectedRoute>
            <ProvidersPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/admins" element={
          <AdminProtectedRoute>
            <AdminsPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/my-schedule" element={
          <AdminProtectedRoute>
            <MySchedulePage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/notifications" element={
          <AdminProtectedRoute>
            <NotificationRulesPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/failed-messages" element={
          <AdminProtectedRoute>
            <FailedMessagesPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/services" element={
          <AdminProtectedRoute>
            <ServicesPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/attendants" element={
          <AdminProtectedRoute>
            <AttendantsPage />
          </AdminProtectedRoute>
        } />

        <Route path="/admin/handoff" element={
          <AdminProtectedRoute>
            <HandoffSessionsPage />
          </AdminProtectedRoute>
        } />

        {/* Rotas Médico - Públicas */}
        <Route path="/doctor/login" element={<AdminLoginPage />} />

        {/* Rotas Médico - Protegidas */}
        <Route path="/doctor" element={
          <DoctorProtectedRoute>
            <AdminDashboard />
          </DoctorProtectedRoute>
        } />

        <Route path="/doctor/calendar" element={
          <DoctorProtectedRoute>
            <CalendarPage />
          </DoctorProtectedRoute>
        } />

        <Route path="/doctor/appointments" element={
          <DoctorProtectedRoute>
            <AdminAppointmentsPage />
          </DoctorProtectedRoute>
        } />

        <Route path="/doctor/my-schedule" element={
          <DoctorProtectedRoute>
            <MySchedulePage />
          </DoctorProtectedRoute>
        } />

        <Route path="/doctor/notifications" element={
          <DoctorProtectedRoute>
            <NotificationRulesPage />
          </DoctorProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
};

export default App;
