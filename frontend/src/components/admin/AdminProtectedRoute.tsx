import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { t } = useTranslation();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message={t('common.verifyingAccess')} />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'provider')) {
    return <Navigate to="/admin/login" replace />;
  }

  // Provider acessando /admin → redirecionar para /doctor
  if (profile.role === 'provider') {
    return <Navigate to="/doctor" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
