import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Verificando acesso..." />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
