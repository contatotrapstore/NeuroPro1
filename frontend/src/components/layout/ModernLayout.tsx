import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils/cn';
import LogoPng from '../../assets/Logo.png';
import { useAuthModal } from '../../hooks/useAuthModal';
import { AuthModal } from '../auth/AuthModal';
import { Button } from '../ui/Button';

interface ModernLayoutProps {
  children: React.ReactNode;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    modalState,
    hideAuthModal,
    switchMode,
    executeIntendedAction,
    showAuthModal
  } = useAuthModal();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'home',
      description: 'Visão geral dos seus assistentes'
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: 'message',
      description: 'Converse com seus assistentes'
    },
    {
      name: 'Loja',
      href: '/store',
      icon: 'store',
      description: 'Explore novos assistentes'
    },
    {
      name: 'Assinaturas',
      href: '/subscriptions',
      icon: 'card',
      description: 'Gerencie suas assinaturas'
    }
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const getCurrentPageName = () => {
    const current = navigationItems.find(item => isActiveRoute(item.href));
    return current?.name || 'NeuroIA Lab';
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

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "sidebar-fixed flex flex-col",
        sidebarOpen && "open"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src={LogoPng} 
                alt="NeuroIA Lab" 
                className="w-full h-full object-contain"
              />
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
                      ? "bg-neuro-primary text-white shadow-md"
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
            {/* TEMPORARIAMENTE DESABILITADO - Problemas com MCP Supabase
            <Link
              to="/store?packages=true"
              className="flex items-center p-3 card-hover border-2 border-amber-200 bg-amber-50 rounded-xl group"
            >
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
                <Icon name="gift" className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-900">
                  Pacotes
                </div>
                <div className="text-xs text-amber-700">
                  Economize até 25%
                </div>
              </div>
              <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full font-medium">
                Oferta
              </span>
            </Link>
            */}
          </div>
        </nav>

        {/* User Profile or Auth Buttons */}
        <div className="p-6 border-t border-gray-100">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-full flex items-center p-3 card-hover rounded-xl overflow-hidden"
              >
                <div className="w-10 h-10 bg-neuro-info rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                  <Icon name="user" className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-full">
                    {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-full">
                    {user?.email}
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
                    to="/profile"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Icon name="user" className="w-4 h-4 mr-3" />
                    <span className="text-sm font-medium">Perfil</span>
                  </Link>
                  
                  {(user?.email === 'admin@neuroia.lab' || user?.user_metadata?.role === 'admin') && (
                    <Link
                      to="/admin"
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
          ) : (
            /* Auth Buttons for non-logged users */
            <div className="space-y-3">
              <Button
                onClick={() => showAuthModal('Acesse sua conta para continuar', undefined, 'login')}
                variant="primary"
                className="w-full"
              >
                Entrar
              </Button>
              <Button
                onClick={() => showAuthModal('Crie sua conta gratuita', undefined, 'register')}
                variant="outline"
                className="w-full"
              >
                Criar Conta
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* BLACK FRIDAY PROMOTIONAL BANNER */}
        {(() => {
          const blackFridayEnd = new Date('2025-12-01T23:59:59-03:00');
          const isActive = new Date() < blackFridayEnd;

          if (!isActive) return null;

          return (
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 overflow-hidden sticky top-0 z-40">
              <div className="relative flex whitespace-nowrap animate-marquee py-3">
                <span className="inline-flex items-center text-white font-bold text-sm px-8">
                  🔥 BLACK FRIDAY: Assinatura Anual por R$ 199,00 - Economize 17%! Válido até 01/12 🔥
                </span>
                <span className="inline-flex items-center text-white font-bold text-sm px-8">
                  🔥 BLACK FRIDAY: Assinatura Anual por R$ 199,00 - Economize 17%! Válido até 01/12 🔥
                </span>
                <span className="inline-flex items-center text-white font-bold text-sm px-8">
                  🔥 BLACK FRIDAY: Assinatura Anual por R$ 199,00 - Economize 17%! Válido até 01/12 🔥
                </span>
                <span className="inline-flex items-center text-white font-bold text-sm px-8">
                  🔥 BLACK FRIDAY: Assinatura Anual por R$ 199,00 - Economize 17%! Válido até 01/12 🔥
                </span>
              </div>
            </div>
          );
        })()}

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
                  to="/chat"
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
            {children}
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

      {/* Auth Modal */}
      <AuthModal
        modalState={modalState}
        onClose={hideAuthModal}
        onModeSwitch={switchMode}
        onSuccess={executeIntendedAction}
      />
    </div>
  );
};

export default ModernLayout;