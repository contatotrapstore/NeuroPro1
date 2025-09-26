import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { Icon } from '../ui/Icon';
import { InstitutionLoadingSpinner } from '../ui/InstitutionLoadingSpinner';
import { cn } from '../../utils/cn';
import { getInstitutionStaticData } from '../../config/institutions';

interface InstitutionPublicLayoutProps {
  children?: React.ReactNode;
}

const InstitutionPublicLayout: React.FC<InstitutionPublicLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { institution, loading, error } = useInstitution();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items para usuários públicos
  const publicNavigationItems = [
    {
      name: 'Dashboard',
      href: `/i/${slug}`,
      icon: 'home',
      description: 'Conheça nossos serviços',
      isPublic: true
    },
    {
      name: 'Loja',
      href: `/i/${slug}/store`,
      icon: 'store',
      description: 'Explore nossos assistentes',
      isPublic: true
    },
    {
      name: 'Chat',
      href: `/i/${slug}/chat`,
      icon: 'message',
      description: 'Conversar (Login necessário)',
      isPublic: false,
      requiresAuth: true
    },
    {
      name: 'Assinaturas',
      href: `/i/${slug}/subscriptions`,
      icon: 'card',
      description: 'Gerenciar acesso (Login necessário)',
      isPublic: false,
      requiresAuth: true
    }
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const getCurrentPageName = () => {
    const current = publicNavigationItems.find(item => isActiveRoute(item.href));
    return current?.name || institution?.name || 'Portal';
  };

  const handleAuthRequiredClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    // Salvar a URL de destino e redirecionar para login
    const returnUrl = encodeURIComponent(href);
    navigate(`/i/${slug}/login?returnUrl=${returnUrl}`);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = () => {
      if (sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sidebarOpen]);

  // Se não há dados da instituição, tentar carregar dados estáticos
  const displayInstitution = institution || (slug ? getInstitutionStaticData(slug) : null);

  if (loading && !displayInstitution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <InstitutionLoadingSpinner size="lg" institution={displayInstitution} slug={slug} />
          <p className="mt-4 text-gray-600">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (error && !displayInstitution) {
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
              {error || 'Não foi possível carregar os dados da instituição.'}
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

  if (!displayInstitution) return null;

  return (
    <div
      className="min-h-screen bg-gradient-mesh"
      style={{
        '--institution-primary': displayInstitution.primary_color,
        '--institution-secondary': displayInstitution.secondary_color || displayInstitution.primary_color,
        '--institution-accent': displayInstitution.primary_color + '20'
      } as React.CSSProperties}
    >
      {/* CSS Variables for Institution Theming */}
      <style>{`
        :root {
          --institution-primary: ${displayInstitution.primary_color};
          --institution-secondary: ${displayInstitution.secondary_color || displayInstitution.primary_color};
          --institution-accent: ${displayInstitution.primary_color}20;
          --institution-hover: ${displayInstitution.primary_color}10;
        }

        .institution-bg-primary { background-color: var(--institution-primary); }
        .institution-text-primary { color: var(--institution-primary); }
        .institution-border-primary { border-color: var(--institution-primary); }
        .institution-hover:hover { background-color: var(--institution-hover); }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              {displayInstitution.logo_url ? (
                <img
                  src={displayInstitution.logo_url}
                  alt={`${displayInstitution.name} Logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div
                  className="w-full h-full rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: displayInstitution.primary_color }}
                >
                  <span className="text-white font-bold text-xl">
                    {displayInstitution.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{displayInstitution.name}</h2>
              <p className="text-xs text-gray-500">Portal Acadêmico</p>
            </div>
          </div>

          {/* Close button - Mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            {publicNavigationItems.map((item) => {
              const active = isActiveRoute(item.href);

              if (item.isPublic) {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center p-3 rounded-xl transition-all duration-200 group",
                      active
                        ? "text-white shadow-md institution-bg-primary"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center mr-3",
                      active
                        ? "text-white"
                        : "text-gray-500 group-hover:text-gray-700"
                    )}>
                      <Icon name={item.icon as any} className={cn("w-4 h-4", active ? "text-white" : "")} />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.name}
                      </div>
                      <div className={cn(
                        "text-xs",
                        active ? "text-white/80" : "text-gray-500"
                      )}>
                        {item.description}
                      </div>
                    </div>

                    {active && (
                      <Icon name="chevronRight" className="w-4 h-4" />
                    )}
                  </Link>
                );
              } else {
                return (
                  <button
                    key={item.name}
                    onClick={(e) => handleAuthRequiredClick(item.href, e)}
                    className="w-full flex items-center p-3 rounded-xl transition-all duration-200 group text-gray-400 hover:bg-gray-50 cursor-not-allowed opacity-60"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-gray-400">
                      <Icon name={item.icon as any} className="w-4 h-4" />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.description}
                      </div>
                    </div>

                    <Icon name="lock" className="w-3 h-3 text-gray-400" />
                  </button>
                );
              }
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={(e) => handleAuthRequiredClick(`/i/${slug}/chat/asst_9vDTodTAQIJV1mu2xPzXpBs8`, e)}
              className="w-full flex items-center p-3 card-hover border-2 rounded-xl group opacity-60 cursor-not-allowed"
              style={{
                borderColor: displayInstitution.primary_color + '40',
                backgroundColor: displayInstitution.primary_color + '10'
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                style={{ backgroundColor: displayInstitution.primary_color }}
              >
                <Icon name="play" className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div
                  className="text-sm font-medium"
                  style={{ color: displayInstitution.primary_color }}
                >
                  Simulador
                </div>
                <div className="text-xs text-gray-600">
                  Login necessário
                </div>
              </div>
              <Icon name="lock" className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </nav>

        {/* Login/Register Section */}
        <div className="p-6 border-t border-gray-100">
          <div className="space-y-3">
            <Link
              to={`/i/${slug}/login`}
              className="w-full flex items-center justify-center p-3 rounded-xl text-white font-semibold transition-all hover:shadow-md"
              style={{ backgroundColor: displayInstitution.primary_color }}
            >
              <Icon name="log-in" className="w-4 h-4 mr-2" />
              Entrar
            </Link>
            <Link
              to={`/i/${slug}/login?mode=register`}
              className="w-full flex items-center justify-center p-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon name="user-plus" className="w-4 h-4 mr-2" />
              Cadastrar-se
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen bg-gray-50">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(true);
                }}
                className="lg:hidden p-2 card-hover rounded-xl"
              >
                <Icon name="menu" className="w-5 h-5 text-gray-700" />
              </button>

              {/* Page Title */}
              <div className="flex-1 lg:flex-none">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 font-display">
                  {getCurrentPageName()}
                </h1>
              </div>

              {/* Header Actions */}
              <div className="flex items-center space-x-3">
                <Link
                  to={`/i/${slug}/login`}
                  className="hidden sm:flex items-center px-4 py-2 rounded-xl text-white font-medium transition-all hover:shadow-md"
                  style={{ backgroundColor: displayInstitution.primary_color }}
                >
                  <Icon name="log-in" className="w-4 h-4 mr-2" />
                  <span className="text-sm">Entrar</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="container-app">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default InstitutionPublicLayout;