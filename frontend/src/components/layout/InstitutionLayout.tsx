import React from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import { useInstitution, useInstitutionAuth } from '../../contexts/InstitutionContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface InstitutionLayoutProps {
  children?: React.ReactNode;
}

export const InstitutionLayout: React.FC<InstitutionLayoutProps> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const { institution, loading, error } = useInstitution();
  const { authChecked } = useInstitutionAuth(slug);

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !institution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-10 text-center border border-red-200">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Instituição não encontrada
            </h1>
            <p className="text-gray-600 mb-8">
              A instituição "{slug}" não foi encontrada ou não está ativa.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voltar ao Início
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!institution) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: institution?.settings?.theme?.gradient || `linear-gradient(135deg, ${institution.primary_color}10 0%, ${institution.primary_color}05 100%)`,
      }}
    >
      {/* Custom CSS Variables */}
      <style>{`
        :root {
          --institution-primary: ${institution.primary_color};
          --institution-secondary: ${institution.secondary_color || institution.primary_color};
          --institution-gradient: ${institution?.settings?.theme?.gradient || `linear-gradient(135deg, ${institution.primary_color} 0%, ${institution.secondary_color || institution.primary_color} 100%)`};
        }

        .institution-gradient {
          background: var(--institution-gradient);
        }

        .institution-bg {
          background-color: var(--institution-primary);
        }

        .institution-text {
          color: var(--institution-primary);
        }

        .institution-border {
          border-color: var(--institution-primary);
        }

        .institution-shadow {
          box-shadow: 0 4px 15px var(--institution-primary)30;
        }

        .institution-hover:hover {
          background-color: var(--institution-primary);
          color: white;
        }

        .glass-card-institution {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* Header */}
      <header className="glass-card-institution border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Logo da Instituição */}
              {institution.logo_url ? (
                <img
                  src={institution.logo_url}
                  alt={`${institution.name} Logo`}
                  className="h-10 w-auto"
                  onError={(e) => {
                    // Fallback para texto se imagem falhar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const span = document.createElement('span');
                    span.className = 'text-2xl font-bold institution-text';
                    span.textContent = institution.name.charAt(0);
                    target.parentNode?.insertBefore(span, target);
                  }}
                />
              ) : (
                <div className="h-10 w-10 institution-bg rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {institution.name.charAt(0)}
                  </span>
                </div>
              )}

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {institution.name}
                </h1>
                {institution?.settings?.subtitle && (
                  <p className="text-sm text-gray-600">
                    {institution?.settings?.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href={`/i/${institution.slug}`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Início
              </a>
              <a
                href={`/i/${institution.slug}/chat`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Chat
              </a>
              <a
                href={`/i/${institution.slug}/subscription`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Licença
              </a>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="institution-hover px-4 py-2 rounded-lg border institution-border transition-all">
                Minha Conta
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      {!institution?.settings?.branding?.show_neurolab_footer === false && (
        <footer className="glass-card-institution border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                {institution?.settings?.contact?.email && (
                  <a
                    href={`mailto:${institution?.settings?.contact?.email}`}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {institution?.settings?.contact?.email}
                  </a>
                )}
                {institution?.settings?.contact?.phone && (
                  <a
                    href={`tel:${institution?.settings?.contact?.phone}`}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {institution?.settings?.contact?.phone}
                  </a>
                )}
                {institution?.settings?.contact?.website && (
                  <a
                    href={institution?.settings?.contact?.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Website
                  </a>
                )}
              </div>

              <div className="text-center md:text-right">
                <p className="text-sm text-gray-600 mb-2">
                  © 2025 {institution.name}. Todos os direitos reservados.
                </p>
                <p className="text-xs text-gray-500">
                  Powered by{' '}
                  <a
                    href="https://neuroialab.com.br"
                    className="institution-text hover:underline"
                  >
                    NeuroIA Lab
                  </a>
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};