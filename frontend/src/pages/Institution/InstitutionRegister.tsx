import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { InstitutionLoadingSpinner } from '../../components/ui/InstitutionLoadingSpinner';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { getInstitutionStaticData } from '../../config/institutions';

interface RegistrationFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  registration_number: string;
  department: string;
  semester?: number;
  phone?: string;
}

export const InstitutionRegister: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { institution, loading, loadInstitution } = useInstitution();

  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    registration_number: '',
    department: '',
    semester: undefined,
    phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [initialLoadStarted, setInitialLoadStarted] = useState(false);

  // Load institution automatically when component mounts
  useEffect(() => {
    if (slug && !initialLoadStarted) {
      console.log(`🔄 InstitutionRegister: Starting institution load for ${slug}`);
      setInitialLoadStarted(true);
      loadInstitution(slug);
    }
  }, [slug, loadInstitution, initialLoadStarted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, registration_number, department } = formData;

    if (!name || !email || !password || !confirmPassword || !registration_number || !department) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return false;
    }

    if (name.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return false;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido');
      return false;
    }

    if (registration_number.length < 3) {
      setError('Número de matrícula deve ter pelo menos 3 caracteres');
      return false;
    }

    if (formData.semester && (formData.semester < 1 || formData.semester > 12)) {
      setError('Semestre deve ser entre 1 e 12');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);

      // Create user account with additional metadata
      // Note: All new users are created as students and need admin approval
      const result = await signUp(formData.email, formData.password, formData.name, {
        phone: formData.phone,
        institution_slug: slug,
        institution_registration_number: formData.registration_number,
        institution_department: formData.department,
        institution_semester: formData.semester,
        institution_role: 'student' // Always create as student
      });

      // Check if email confirmation is required
      if (result?.needsConfirmation) {
        setNeedsEmailConfirmation(true);
      }

      setSuccess(true);
      toast.success(`Bem-vindo à ${institution?.name}!`);

    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message?.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else if (error.message?.includes('email_confirmation_required')) {
        setNeedsEmailConfirmation(true);
        setSuccess(true);
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
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
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: institutionData.settings?.theme?.gradient || `linear-gradient(135deg, ${institutionData.primary_color}15 0%, ${institutionData.primary_color}05 100%)`
        }}
      >
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: institutionData.primary_color }}
              >
                <Icon name="checkCircle" className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {needsEmailConfirmation ? 'Confirme seu Email!' : 'Conta Criada!'}
              </h2>

              {needsEmailConfirmation ? (
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    Enviamos um link de confirmação para{' '}
                    <strong style={{ color: institutionData.primary_color }}>{formData.email}</strong>
                  </p>
                  <div
                    className="rounded-lg p-4 border"
                    style={{
                      backgroundColor: institutionData.primary_color + '10',
                      borderColor: institutionData.primary_color + '40'
                    }}
                  >
                    <p className="text-sm font-medium mb-2" style={{ color: institutionData.primary_color }}>
                      Próximos passos:
                    </p>
                    <ol className="text-sm space-y-1 list-decimal list-inside" style={{ color: institutionData.primary_color }}>
                      <li>Verifique sua caixa de entrada</li>
                      <li>Clique no link de confirmação</li>
                      <li>Faça login com suas credenciais</li>
                      <li>Complete seu perfil institucional</li>
                    </ol>
                  </div>
                  <p className="text-xs text-gray-400">
                    Não recebeu o email? Verifique a pasta de spam ou lixo eletrônico
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    Sua conta foi criada com sucesso na {institutionData.name}!
                  </p>
                  <div
                    className="rounded-lg p-4 border"
                    style={{
                      backgroundColor: '#fbbf2415',
                      borderColor: '#fbbf2440'
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                      ⏳ Aguardando aprovação do administrador
                    </p>
                    <p className="text-sm mt-2" style={{ color: '#f59e0b' }}>
                      Seu acesso será liberado após a aprovação. Você receberá um email quando isso acontecer.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <button
                  onClick={() => {
                    if (needsEmailConfirmation) {
                      navigate(`/i/${slug}/login`);
                    } else {
                      navigate(`/i/${slug}/pending-approval`);
                    }
                  }}
                  className="w-full px-6 py-3 rounded-xl text-white font-semibold transition-all transform hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    backgroundColor: institutionData.primary_color,
                    boxShadow: `0 4px 15px ${institutionData.primary_color}30`
                  }}
                >
                  {needsEmailConfirmation ? 'Ir para Login' : 'Ver Status da Aprovação'}
                </button>
              </div>
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
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            {institutionData.logo_url ? (
              <>
                <img
                  src={institutionData.logo_url}
                  alt={`${institutionData.name} Logo`}
                  className="h-20 w-auto mx-auto mb-6"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Cadastro na {institutionData.name}
                </h1>
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
                <h2 className="text-xl font-semibold text-gray-800">
                  Cadastro de Novo Usuário
                </h2>
              </>
            )}

            <p className="text-gray-600">
              Crie sua conta para acessar os recursos da instituição
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
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': institutionData.primary_color } as React.CSSProperties}
                  placeholder="Seu nome completo"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': institutionData.primary_color } as React.CSSProperties}
                  placeholder="seu.email@exemplo.com"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': institutionData.primary_color } as React.CSSProperties}
                  placeholder="(11) 99999-9999"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuário
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600">
                  Estudante
                  <p className="text-xs text-gray-500 mt-1">
                    Todos os novos usuários são registrados como estudantes. Para alteração de tipo, contate a administração.
                  </p>
                </div>
              </div>
            </div>

            {/* Institution Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informações Institucionais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Matrícula *
                  </label>
                  <input
                    id="registration_number"
                    name="registration_number"
                    type="text"
                    required
                    value={formData.registration_number}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': institutionData.primary_color } as React.CSSProperties}
                    placeholder="Ex: 123456"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento/Curso *
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': institutionData.primary_color } as React.CSSProperties}
                    placeholder={formData.role === 'student' ? 'Ex: Psicologia' : 'Ex: Departamento de Psicologia'}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                    Semestre Atual (Opcional)
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': institutionData.primary_color } as React.CSSProperties}
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione o semestre</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(sem => (
                      <option key={sem} value={sem}>{sem}º Semestre</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Senha de Acesso
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': institutionData.primary_color } as React.CSSProperties}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div className="relative">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Senha *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': institutionData.primary_color } as React.CSSProperties}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
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
                  <span>Criando conta...</span>
                </div>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Já tem uma conta?
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/i/${slug}/login`)}
              className="text-sm hover:underline transition-colors"
              style={{ color: institutionData.primary_color }}
            >
              Fazer Login
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