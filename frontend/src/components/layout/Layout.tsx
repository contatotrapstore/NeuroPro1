import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';
import LogoPng from '../../assets/Logo.png';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-neuro-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-90">
                <img 
                  src={LogoPng} 
                  alt="NeuroIA Lab" 
                  className="h-8 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/dashboard"
                  className="hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/chat"
                  className="hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Chat
                </Link>
                <Link
                  to="/store"
                  className="hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Loja
                </Link>
                <Link
                  to="/subscriptions"
                  className="hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Assinaturas
                </Link>
              </div>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Desktop User Menu */}
              <div className="hidden md:block relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user?.user_metadata?.name || 'Usuário'}</p>
                      <p className="text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Perfil
                    </Link>
                    {(user?.email === 'admin@neuroia.lab' || user?.user_metadata?.role === 'admin') && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md hover:bg-neuro-primary-hover"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <Link
                  to="/dashboard"
                  className="block hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/chat"
                  className="block hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  to="/store"
                  className="block hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Loja
                </Link>
                <Link
                  to="/subscriptions"
                  className="block hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Assinaturas
                </Link>
                <div className="border-t border-neuro-primary-light pt-4 mt-4">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.user_metadata?.name || 'Usuário'}</p>
                    <p className="text-xs text-gray-300">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Perfil
                  </Link>
                  {(user?.email === 'admin@neuroia.lab' || user?.user_metadata?.role === 'admin') && (
                    <Link
                      to="/admin"
                      className="block hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left hover:bg-neuro-primary-hover px-3 py-2 rounded-md text-base font-medium flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Click outside to close dropdowns */}
      {(profileDropdownOpen || mobileMenuOpen) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setProfileDropdownOpen(false);
            setMobileMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Layout;