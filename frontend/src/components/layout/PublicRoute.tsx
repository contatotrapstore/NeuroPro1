import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
  requiresAuthForAction?: boolean;
}

/**
 * PublicRoute - Permite acesso público a páginas, mas pode exigir login para ações específicas
 *
 * Diferente do ProtectedRoute:
 * - Sempre permite visualização da página
 * - Não redireciona para login automaticamente
 * - Componentes filhos podem verificar se user existe para bloquear ações
 */
const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  requiresAuthForAction = false
}) => {
  const { loading } = useAuth();

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

  // Sempre renderiza os children - o controle de autenticação fica nos componentes
  return <>{children}</>;
};

export default PublicRoute;