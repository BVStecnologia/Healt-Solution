import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import DoctorProtectedRoute from './components/doctor/DoctorProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import LanguageSwitcher from './components/LanguageSwitcher';

// Lazy loading das páginas - Portal do Paciente
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AppointmentsPage = lazy(() => import('./pages/scheduling/AppointmentsPage'));
const NewAppointmentPage = lazy(() => import('./pages/scheduling/NewAppointmentPage'));
const AppointmentDetailPage = lazy(() => import('./pages/scheduling/AppointmentDetailPage'));
const ProfilePage = lazy(() => import('./pages/patient/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/patient/SettingsPage'));

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

const App: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Carregando..." />;
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
            <Dashboard />
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
