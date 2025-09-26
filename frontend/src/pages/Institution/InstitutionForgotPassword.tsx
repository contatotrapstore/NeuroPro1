import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { InstitutionLoadingSpinner } from '../../components/ui/InstitutionLoadingSpinner';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { getInstitutionStaticData } from '../../config/institutions';

export const InstitutionForgotPassword: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { institution, loading, loadInstitution } = useInstitution();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [initialLoadStarted, setInitialLoadStarted] = useState(false);

  // Load institution automatically when component mounts
  useEffect(() => {
    if (slug && !initialLoadStarted) {
      console.log(`🔄 InstitutionForgotPassword: Starting institution load for ${slug}`);
      setInitialLoadStarted(true);
      loadInstitution(slug);
    }
  }, [slug, loadInstitution, initialLoadStarted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Por favor, insira seu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      await resetPassword(email);
      setSent(true);
      toast.success('Link de recuperação enviado com sucesso!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError('Erro ao enviar email. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading if institution is being loaded
  if (loading && !institution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <InstitutionLoadingSpinner size="lg" slug={slug} />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Try to get static data if institution is not loaded
  let institutionData = institution;
  if (!institutionData) {
    const staticData = getInstitutionStaticData(slug || '');
    if (staticData) {
      institutionData = staticData;
    }
  }

  // If no institution data, show error
  if (!institutionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-10 text-center border border-red-200">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center">
              <Icon name="xCircle" className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Instituição não encontrada
            </h1>
            <p className="text-gray-600 mb-8">
              Não foi possível carregar os dados da instituição.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (sent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: institutionData.settings?.theme?.gradient || `linear-gradient(135deg, ${institutionData.primary_color}15 0%, ${institutionData.primary_color}05 100%)`
        }}
      >
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: institutionData.primary_color }}
              >
                <Icon name="mail" className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Enviado!
              </h1>
              <p className="text-gray-600">
                Enviamos um link para redefinir sua senha para{' '}
                <strong style={{ color: institutionData.primary_color }}>{email}</strong>.
                Verifique sua caixa de entrada e spam.
              </p>
            </div>

            {/* Next Steps */}
            <div
              className="rounded-lg p-4 mb-6 border"
              style={{
                backgroundColor: institutionData.primary_color + '10',
                borderColor: institutionData.primary_color + '40'
              }}
            >
              <h3 className="font-medium mb-2" style={{ color: institutionData.primary_color }}>
                Próximos passos:
              </h3>
              <ol className="text-sm space-y-1 list-decimal list-inside" style={{ color: institutionData.primary_color }}>
                <li>Verifique sua caixa de entrada</li>
                <li>Clique no link de recuperação</li>
                <li>Defina sua nova senha</li>
                <li>Faça login com suas novas credenciais</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/i/${slug}/login`)}
                className="w-full px-6 py-3 rounded-xl text-white font-semibold transition-all transform hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: institutionData.primary_color,
                  boxShadow: `0 4px 15px ${institutionData.primary_color}30`
                }}
              >
                Voltar para Login
              </button>

              <p className="text-center text-sm text-gray-500">
                Não recebeu o email?{' '}
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                  className="hover:underline transition-colors"
                  style={{ color: institutionData.primary_color }}
                >
                  Tentar novamente
                </button>
              </p>
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

  // Main form
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: institutionData.settings?.theme?.gradient || `linear-gradient(135deg, ${institutionData.primary_color}15 0%, ${institutionData.primary_color}05 100%)`
      }}
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Recuperar Senha
                </h1>
              </>
            ) : (
              <>
                <div
                  className="h-16 w-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: institutionData.primary_color }}
                >
                  <Icon name="lock" className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Recuperar Senha
                </h1>
                <h2 className="text-lg font-medium text-gray-700 mb-4">
                  {institutionData.name}
                </h2>
              </>
            )}

            <p className="text-gray-600">
              Digite seu email para receber um link de recuperação
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <Icon name="xCircle" className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Institucional
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <p className="text-xs text-gray-500 mt-1">
                Digite o email usado para acessar a {institutionData.name}
              </p>
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
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enviando...</span>
                </div>
              ) : (
                'Enviar Link de Recuperação'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(`/i/${slug}/login`)}
              className="text-sm hover:underline transition-colors flex items-center justify-center mx-auto"
              style={{ color: institutionData.primary_color }}
            >
              <Icon name="arrowLeft" className="w-4 h-4 mr-2" />
              Voltar para Login
            </button>
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
};