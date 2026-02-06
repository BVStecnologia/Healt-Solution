import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface DoctorProtectedRouteProps {
  children: React.ReactNode;
}

const DoctorProtectedRoute: React.FC<DoctorProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Verificando acesso..." />;
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
