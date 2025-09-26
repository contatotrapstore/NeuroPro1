import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { InstitutionLoadingSpinner } from '../ui/InstitutionLoadingSpinner';

interface InstitutionProtectedRouteProps {
  children: React.ReactNode;
}

const InstitutionProtectedRoute: React.FC<InstitutionProtectedRouteProps> = ({
  children
}) => {
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    institution,
    userAccess,
    loading,
    authenticationComplete,
    isInstitutionUser
  } = useInstitution();

  useEffect(() => {
    // Se não está carregando e não tem usuário, redirecionar para login
    if (!loading && !user) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/i/${slug}/login?returnUrl=${returnUrl}`, { replace: true });
      return;
    }

    // Se tem usuário mas não completou autenticação na instituição, aguardar
    if (user && !loading && (!authenticationComplete || !isInstitutionUser)) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/i/${slug}/login?returnUrl=${returnUrl}`, { replace: true });
      return;
    }
  }, [user, loading, authenticationComplete, isInstitutionUser, navigate, slug, location]);

  // Mostrar loading enquanto verifica autenticação
  if (loading || (user && !authenticationComplete)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <InstitutionLoadingSpinner size="lg" institution={institution} slug={slug} />
          <p className="mt-4 text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não tem usuário ou não tem acesso à instituição, não renderizar
  if (!user || !authenticationComplete || !isInstitutionUser) {
    return null;
  }

  // Se tudo ok, renderizar o conteúdo protegido
  return <>{children}</>;
};

export default InstitutionProtectedRoute;