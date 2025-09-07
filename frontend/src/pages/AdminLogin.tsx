import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { isAdminUser } from '../config/admin';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar se há erro vindo do state (redirecionamento de AdminProtectedRoute)
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location.state]);

  // Watch for auth state changes and navigate when admin is authenticated
  useEffect(() => {
    if (user && !loading) {
      if (isAdminUser(user.email, user.user_metadata)) {
        console.log(`🚀 Navigating admin user ${user.email} to dashboard`);
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Clear any invalid tokens before login
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase.auth.') || key.includes('supabase')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));

      const result = await signIn(email, password);
      
      // Verificar se é admin usando função centralizada
      if (isAdminUser(result.user?.email, result.user?.user_metadata)) {
        console.log(`✅ Admin access granted for: ${result.user?.email}`);
        // Navigation will be handled by useEffect watching auth state
      } else {
        setError('Acesso negado. Esta área é restrita a administradores.');
        // Fazer logout se não for admin
        await signOut();
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-red-500/20 to-red-400/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl mb-6 shadow-2xl shadow-red-600/30 animate-glow-pulse">
            <Shield className="text-white" size={48} />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-600 bg-clip-text text-transparent mb-3">
            Admin Panel
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Acesso restrito a administradores
          </p>
        </div>
      </div>

      <div className="relative mt-10 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up z-10">
        <Card className="backdrop-blur-xl bg-white/80 border border-red-600/20 shadow-2xl shadow-red-600/10">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-shake">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Email do Administrador"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@neuroialab.com"
                  required
                  className="transition-all duration-200 focus:scale-105"
                />

                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha administrativa"
                    required
                    className="pr-10 transition-all duration-200 focus:scale-105"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 disabled:transform-none disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verificando acesso...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Shield className="mr-2" size={20} />
                    Acessar Painel Admin
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Somente administradores autorizados podem acessar esta área.
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                ← Voltar ao site principal
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;