import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { cn } from '../../utils/cn';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export const InstitutionLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const { institution, loadInstitution, verifyAccess, loading, error } = useInstitution();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);

  // Carregar instituição ao montar componente
  useEffect(() => {
    if (slug && !institution) {
      loadInstitution(slug);
    }
  }, [slug, institution, loadInstitution]);

  // Redirecionar se já logado e tem acesso (prevenir loop infinito)
  useEffect(() => {
    const checkAccess = async () => {
      if (user && institution && slug && !hasCheckedAccess && !authLoading && !loading) {
        console.log('🔍 Checking user access to institution...');
        setHasCheckedAccess(true);

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            console.log('🎫 Session found, verifying access...');
            const hasAccess = await verifyAccess(session.access_token, slug);
            if (hasAccess) {
              console.log('✅ Access verified, redirecting...');
              navigate(`/i/${slug}`, { replace: true });
            } else {
              console.log('❌ Access denied, staying on login page');
            }
          } else {
            console.log('❌ No session found');
          }
        } catch (error) {
          console.error('Error checking access:', error);
        }
      }
    };

    // Reset hasCheckedAccess when user changes
    if (!user) {
      setHasCheckedAccess(false);
    }

    checkAccess();
  }, [user, institution, slug, verifyAccess, navigate, hasCheckedAccess, authLoading, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!slug || !institution) {
      toast.error('Instituição não carregada');
      return;
    }

    setIsSubmitting(true);

    try {
      // Primeiro, fazer login normal
      const authResult = await signIn(formData.email, formData.password);

      if (!authResult.session?.access_token) {
        throw new Error('Sessão não criada');
      }

      // Verificar se usuário tem acesso à instituição
      const hasAccess = await verifyAccess(authResult.session.access_token, slug);

      if (!hasAccess) {
        toast.error('Você não tem acesso a esta instituição');
        return;
      }

      toast.success(`Bem-vindo à ${institution.name}!`);
      navigate(`/i/${slug}`, { replace: true });

    } catch (error: any) {
      console.error('Institution login error:', error);

      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else if (error.message.includes('não tem acesso')) {
        toast.error('Você não tem acesso a esta instituição');
      } else {
        toast.error('Erro no login. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
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
              {error}
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: institution.settings.theme?.gradient || `linear-gradient(135deg, ${institution.primary_color}15 0%, ${institution.primary_color}05 100%)`
      }}
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header com Logo */}
          <div className="text-center mb-8">
            {institution.logo_url ? (
              <>
                <img
                  src={institution.logo_url}
                  alt={`${institution.name} Logo`}
                  className="h-24 w-auto mx-auto mb-6"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </>
            ) : (
              <>
                <div
                  className="h-16 w-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: institution.primary_color }}
                >
                  <span className="text-white font-bold text-2xl">
                    {institution.name.charAt(0)}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {institution.name}
                </h1>
              </>
            )}

            <p className="text-gray-600">
              {institution.settings.welcome_message || 'Entre com suas credenciais'}
            </p>

            {institution.settings.subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {institution.settings.subtitle}
              </p>
            )}
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 transition-all",
                  "focus:border-transparent"
                )}
                style={{
                  '--tw-ring-color': institution.primary_color
                } as React.CSSProperties}
                placeholder="seu.email@exemplo.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 transition-all",
                  "focus:border-transparent"
                )}
                style={{
                  '--tw-ring-color': institution.primary_color
                } as React.CSSProperties}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-3 px-4 rounded-xl text-white font-semibold transition-all transform",
                "hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                "disabled:hover:translate-y-0 disabled:hover:shadow-none"
              )}
              style={{
                backgroundColor: institution.primary_color,
                boxShadow: `0 4px 15px ${institution.primary_color}30`
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <a
              href="/auth/forgot-password"
              className="text-sm hover:underline transition-colors"
              style={{ color: institution.primary_color }}
            >
              Esqueceu sua senha?
            </a>

            <div className="text-sm text-gray-600">
              Não tem acesso?{' '}
              <a
                href={institution.settings.contact?.email ? `mailto:${institution.settings.contact.email}` : '#'}
                className="hover:underline transition-colors"
                style={{ color: institution.primary_color }}
              >
                Entre em contato
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Powered by{' '}
              <a
                href="https://neuroialab.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: institution.primary_color }}
              >
                NeuroIA Lab
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};