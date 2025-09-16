import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neuro-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // If route requires authentication but user is not logged in
  if (requireAuth && !user) {
    // Redirect to login page with return URL
    return (
      <Navigate 
        to="/auth/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // If user is logged in but trying to access auth pages
  if (!requireAuth && user) {
    // Exceção especial para reset de senha: permitir acesso se há tokens na URL
    if (location.pathname === '/auth/reset-password') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      const hasResetTokens =
        (hashParams.get('access_token') && hashParams.get('refresh_token')) ||
        (queryParams.get('access_token') && queryParams.get('refresh_token'));

      // Se há tokens válidos, permitir acesso à página de reset
      if (hasResetTokens) {
        return <>{children}</>;
      }
    }

    // Caso contrário, redirecionar para dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;