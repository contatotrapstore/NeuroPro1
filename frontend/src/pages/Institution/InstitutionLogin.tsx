import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { InstitutionLoadingSpinner } from '../../components/ui/InstitutionLoadingSpinner';
import { cn } from '../../utils/cn';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { getInstitutionStaticData } from '../../config/institutions';

export const InstitutionLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const {
    institution,
    verifyAccess,
    loading,
    error,
    isInstitutionUser,
    authenticationComplete,
    institutionLoaded,
    setAuthenticationComplete,
    loadInstitution
  } = useInstitution();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoadStarted, setInitialLoadStarted] = useState(false);

  // Carregar instituição automaticamente quando componente monta
  useEffect(() => {
    if (slug && !initialLoadStarted) {
      console.log(`🔄 InstitutionLogin: Starting institution load for ${slug}`);
      setInitialLoadStarted(true);
      loadInstitution(slug);
    }
  }, [slug, loadInstitution, initialLoadStarted]);

  // Redirecionar se já logado e tem acesso completo
  useEffect(() => {
    if (
      user &&
      institution &&
      institutionLoaded &&
      authenticationComplete &&
      isInstitutionUser
    ) {
      console.log('✅ User authenticated and has access, redirecting to dashboard...');
      navigate(`/i/${slug}`, { replace: true });
    }
  }, [
    user,
    institution,
    institutionLoaded,
    authenticationComplete,
    isInstitutionUser,
    navigate,
    slug
  ]);

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
      // Aguardar o próximo useEffect redirecionar automaticamente
      // navigate será chamado quando authenticationComplete for true

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

  // Mostrar loading spinner apenas durante carregamento inicial da auth
  if (authLoading && !user) {
    console.log('🔄 InstitutionLogin: Loading auth state...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <InstitutionLoadingSpinner size="lg" institution={institution} slug={slug} />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há dados da instituição, tentar carregar dados estáticos
  if (!institution) {
    const staticData = getInstitutionStaticData(slug || '');
    if (staticData) {
      console.log('📦 InstitutionLogin: Using static data for login form');
      return renderLoginForm(staticData);
    }

    // Se não há dados estáticos, mostrar erro
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

  return renderLoginForm(institution);

  // Função para renderizar o formulário de login
  function renderLoginForm(institutionData: any) {
    // Verificação de segurança
    if (!institutionData) {
      console.error('❌ renderLoginForm: institutionData is null or undefined');
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <InstitutionLoadingSpinner size="lg" slug={slug} />
            <p className="mt-4 text-gray-600">Carregando dados da instituição...</p>
          </div>
        </div>
      );
    }

    console.log('✅ renderLoginForm: Rendering with data:', {
      name: institutionData.name,
      hasSettings: !!institutionData.settings,
      hasLogo: !!institutionData.logo_url
    });

    return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: institutionData.settings?.theme?.gradient || `linear-gradient(135deg, ${institutionData.primary_color}15 0%, ${institutionData.primary_color}05 100%)`
      }}
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header com Logo */}
          <div className="text-center mb-8">
            {institutionData.logo_url ? (
              <>
                <img
                  src={institutionData.logo_url}
                  alt={`${institutionData.name} Logo`}
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
                  style={{ backgroundColor: institutionData.primary_color }}
                >
                  <span className="text-white font-bold text-2xl">
                    {institutionData.name.charAt(0)}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {institutionData.name}
                </h1>
              </>
            )}

            <p className="text-gray-600">
              {institutionData.settings?.welcome_message || 'Entre com suas credenciais'}
            </p>

            {institutionData.settings?.subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {institutionData.settings?.subtitle}
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
                  '--tw-ring-color': institutionData.primary_color
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
                  '--tw-ring-color': institutionData.primary_color
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
                backgroundColor: institutionData.primary_color,
                boxShadow: `0 4px 15px ${institutionData.primary_color}30`
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <InstitutionLoadingSpinner size="sm" institution={institution} className="mr-2" />
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
              style={{ color: institutionData.primary_color }}
            >
              Esqueceu sua senha?
            </a>

            <div className="text-sm text-gray-600">
              Não tem acesso?{' '}
              <a
                href={institution?.settings?.contact?.email ? `mailto:${institution?.settings?.contact?.email}` : '#'}
                className="hover:underline transition-colors"
                style={{ color: institutionData.primary_color }}
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
                style={{ color: institutionData.primary_color }}
              >
                NeuroIA Lab
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
    );
  }
};