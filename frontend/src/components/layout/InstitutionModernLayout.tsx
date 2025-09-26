import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { Icon } from '../ui/Icon';
import { InstitutionLoadingSpinner } from '../ui/InstitutionLoadingSpinner';
import { cn } from '../../utils/cn';

interface InstitutionModernLayoutProps {
  children?: React.ReactNode;
}

const InstitutionModernLayout: React.FC<InstitutionModernLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { slug } = useParams<{ slug: string }>();
  const { user, signOut } = useAuth();
  const {
    institution,
    userAccess,
    loading,
    error,
    canAccessAdminPanel,
    authenticationComplete,
    institutionLoaded
  } = useInstitution();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate(`/i/${slug}/login`);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Navigation items baseados no sistema principal, mas adaptados para instituição
  const navigationItems = [
    {
      name: 'Dashboard',
      href: `/i/${slug}`,
      icon: 'home',
      description: 'Visão geral da sua área'
    },
    {
      name: 'Chat',
      href: `/i/${slug}/chat`,
      icon: 'message',
      description: 'Converse com assistentes'
    },
    {
      name: 'Loja',
      href: `/i/${slug}/store`,
      icon: 'store',
      description: 'Explore assistentes'
    },
    {
      name: 'Assinaturas',
      href: `/i/${slug}/subscriptions`,
      icon: 'card',
      description: 'Gerencie seu acesso'
    }
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const getCurrentPageName = () => {
    const current = navigationItems.find(item => isActiveRoute(item.href));
    return current?.name || institution?.name || 'Portal';
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

  // Redirect to login if not authenticated or no access (melhorado para evitar loops)
  useEffect(() => {
    // Só redirecionar se não está carregando E alguma verificação foi completada
    if (!loading && institutionLoaded && user && !authenticationComplete) {
      console.log('⚠️ Layout: User not authenticated for institution, redirecting to login...');
      navigate(`/i/${slug}/login`);
    }
  }, [user, institutionLoaded, authenticationComplete, loading, navigate, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <InstitutionLoadingSpinner size="lg" institution={institution} slug={slug} />
          <p className="mt-4 text-gray-600">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (error || !institution || !user || !authenticationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-10 text-center border border-red-200">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acesso Negado
            </h1>
            <p className="text-gray-600 mb-8">
              {error || 'Você não tem acesso a este portal institucional.'}
            </p>
            <button
              onClick={() => navigate(`/i/${slug}/login`)}
              className="inline-block px-6 py-3 text-white rounded-lg transition-colors"
              style={{ backgroundColor: institution?.primary_color || '#c39c49' }}
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-mesh"
      style={{
        '--institution-primary': institution.primary_color,
        '--institution-secondary': institution.secondary_color || institution.primary_color,
        '--institution-accent': institution.primary_color + '20'
      } as React.CSSProperties}
    >
      {/* CSS Variables for Institution Theming */}
      <style>{`
        :root {
          --institution-primary: ${institution.primary_color};
          --institution-secondary: ${institution.secondary_color || institution.primary_color};
          --institution-accent: ${institution.primary_color}20;
          --institution-hover: ${institution.primary_color}10;
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
              {institution.logo_url ? (
                <img
                  src={institution.logo_url}
                  alt={`${institution.name} Logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div
                  className="w-full h-full rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: institution.primary_color }}
                >
                  <span className="text-white font-bold text-xl">
                    {institution.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{institution.name}</h2>
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
            {navigationItems.map((item) => {
              const active = isActiveRoute(item.href);
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
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link
              to={`/i/${slug}/chat/asst_9vDTodTAQIJV1mu2xPzXpBs8`}
              className="flex items-center p-3 card-hover border-2 rounded-xl group"
              style={{
                borderColor: institution.primary_color + '40',
                backgroundColor: institution.primary_color + '10'
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                style={{ backgroundColor: institution.primary_color }}
              >
                <Icon name="play" className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div
                  className="text-sm font-medium"
                  style={{ color: institution.primary_color }}
                >
                  Simulador
                </div>
                <div className="text-xs text-gray-600">
                  Prática psicanalítica
                </div>
              </div>
              <span
                className="text-xs text-white px-2 py-1 rounded-full font-medium"
                style={{ backgroundColor: institution.primary_color }}
              >
                ABPSI
              </span>
            </Link>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-6 border-t border-gray-100">
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-full flex items-center p-3 card-hover rounded-xl overflow-hidden"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0"
                style={{ backgroundColor: institution.primary_color }}
              >
                <Icon name="user" className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate max-w-full">
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-full">
                  {userAccess?.role === 'student' && 'Estudante'}
                  {userAccess?.role === 'professor' && 'Professor'}
                  {userAccess?.role === 'subadmin' && 'Administrador'}
                </div>
              </div>

              <Icon
                name={profileDropdownOpen ? "chevronUp" : "chevronDown"}
                className="w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2"
              />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 card-base rounded-xl overflow-hidden shadow-lg">
                <div className="p-2 space-y-1">
                  <Link
                    to={`/i/${slug}/profile`}
                    className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Icon name="user" className="w-4 h-4 mr-3" />
                    <span className="text-sm font-medium">Perfil</span>
                  </Link>

                  {canAccessAdminPanel && (
                    <Link
                      to={`/i/${slug}/admin`}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Icon name="shield" className="w-4 h-4 mr-3" />
                      <span className="text-sm font-medium">Admin</span>
                    </Link>
                  )}

                  <hr className="border-gray-200" />

                  <button
                    onClick={() => {
                      handleSignOut();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-700 hover:text-red-600"
                  >
                    <Icon name="logOut" className="w-4 h-4 mr-3" />
                    <span className="text-sm font-medium">Sair</span>
                  </button>
                </div>
              </div>
            )}
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
                {/* Quick Chat Access */}
                <Link
                  to={`/i/${slug}/chat`}
                  className="hidden sm:flex items-center px-4 py-2 card-hover rounded-xl text-gray-700 hover:text-gray-900"
                >
                  <Icon name="message" className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Chat</span>
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

      {/* Click outside to close dropdown */}
      {profileDropdownOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default InstitutionModernLayout;