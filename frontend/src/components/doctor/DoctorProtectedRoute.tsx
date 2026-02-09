import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface DoctorProtectedRouteProps {
  children: React.ReactNode;
}

const DoctorProtectedRoute: React.FC<DoctorProtectedRouteProps> = ({ children }) => {
  const { t } = useTranslation();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message={t('common.verifyingAccess')} />;
  }

  if (!user) {
    return <Navigate to="/doctor/login" replace />;
  }

  // Admin pode acessar /doctor/* (environment switcher)
  if (!profile || (profile.role !== 'provider' && profile.role !== 'admin')) {
    return <Navigate to="/doctor/login" replace />;
  }

  return <>{children}</>;
};

export default DoctorProtectedRoute;
