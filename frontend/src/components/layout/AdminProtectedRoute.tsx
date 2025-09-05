import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Lista de emails admin
  const adminEmails = ['admin@neuroialab.com', 'gouveiarx@gmail.com', 'pstales@gmail.com'];

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões de administrador...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, redirect to admin login
  if (!user) {
    console.log('❌ No user found, redirecting to admin login');
    return (
      <Navigate 
        to="/admin" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if user is admin (by email or metadata)
  const isAdminEmail = adminEmails.includes(user.email || '');
  const hasAdminRole = user.user_metadata?.role === 'admin';

  // If user is not admin, redirect with error message
  if (!isAdminEmail && !hasAdminRole) {
    console.log(`❌ Admin access denied for: ${user.email} - not in admin list and no admin role`);
    console.log('🔍 User metadata:', user.user_metadata);
    return (
      <Navigate 
        to="/admin" 
        state={{ error: 'Acesso negado. Esta área é restrita a administradores.' }} 
        replace 
      />
    );
  }

  // Admin access granted - render the protected component
  console.log(`✅ Admin route access granted for: ${user.email}`);
  console.log(`🔍 AdminProtectedRoute: Verification completed`, { 
    isAdminEmail, 
    hasAdminRole, 
    userEmail: user.email,
    userMetadata: user.user_metadata 
  });
  
  return <>{children}</>;
};

export default AdminProtectedRoute;