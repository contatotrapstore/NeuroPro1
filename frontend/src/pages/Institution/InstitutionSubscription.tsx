import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { InstitutionLoadingSpinner } from '../../components/ui/InstitutionLoadingSpinner';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Calendar,
  Users,
  Bot,
  Infinity,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  Globe
} from 'lucide-react';

interface LicenseInfo {
  plan_type: string;
  status: 'active' | 'expired' | 'expiring';
  valid_from: string;
  valid_until?: string;
  max_users?: number;
  max_assistants?: number;
  monthly_fee: number;
  features: string[];
  usage_stats: {
    current_users: number;
    conversations_this_month: number;
    total_conversations: number;
    avg_sessions_per_user: number;
  };
}

export const InstitutionSubscription: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    institution,
    userAccess,
    isInstitutionUser,
    loading: institutionLoading
  } = useInstitution();

  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar informações da licença
  useEffect(() => {
    if (institution && isInstitutionUser) {
      loadLicenseInfo();
    }
  }, [institution, isInstitutionUser]);

  const loadLicenseInfo = async () => {
    setLoading(true);
    try {
      // Simular dados (na implementação real, viria da API)
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockLicenseInfo: LicenseInfo = {
        plan_type: 'unlimited',
        status: 'active',
        valid_from: '2025-01-24',
        valid_until: undefined, // Ilimitado
        max_users: undefined, // Ilimitado
        max_assistants: undefined, // Ilimitado
        monthly_fee: 0, // Gratuito para configuração inicial
        features: [
          'unlimited_users',
          'unlimited_assistants',
          'psychoanalysis_simulator',
          'advanced_analytics',
          'custom_branding',
          'priority_support',
          'data_export',
          'custom_reports'
        ],
        usage_stats: {
          current_users: 1,
          conversations_this_month: 0,
          total_conversations: 0,
          avg_sessions_per_user: 0
        }
      };

      setLicenseInfo(mockLicenseInfo);

    } catch (error) {
      console.error('Error loading license info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      expiring: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const labels = {
      active: 'Ativa',
      expired: 'Expirada',
      expiring: 'Expirando'
    };

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles]}`}>
        <Shield className="w-4 h-4 mr-2" />
        {labels[status as keyof typeof labels]}
      </div>
    );
  };

  const getFeatureLabel = (feature: string) => {
    const labels: { [key: string]: string } = {
      unlimited_users: 'Usuários Ilimitados',
      unlimited_assistants: 'Assistentes Ilimitados',
      psychoanalysis_simulator: 'Simulador de Psicanálise',
      advanced_analytics: 'Analytics Avançado',
      custom_branding: 'Marca Personalizada',
      priority_support: 'Suporte Prioritário',
      data_export: 'Exportação de Dados',
      custom_reports: 'Relatórios Personalizados'
    };
    return labels[feature] || feature;
  };

  if (institutionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <InstitutionLoadingSpinner size="lg" institution={institution} slug={slug} />
          <p className="mt-4 text-gray-600">Carregando informações da licença...</p>
        </div>
      </div>
    );
  }

  if (!isInstitutionUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          <button
            onClick={() => navigate(`/i/${slug}/login`)}
            className="px-6 py-3 text-white rounded-lg"
            style={{ backgroundColor: institution?.primary_color }}
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/i/${slug}`)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center">
              {institution?.logo_url ? (
                <img
                  src={institution.logo_url}
                  alt={`${institution.name} Logo`}
                  className="h-12 w-auto mr-4"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center mr-4"
                  style={{ backgroundColor: institution?.primary_color }}
                >
                  <span className="text-white font-bold text-lg">
                    {institution?.name.charAt(0)}
                  </span>
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Status da Licença
                </h1>
                <p className="text-gray-600">
                  {institution?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {licenseInfo && (
          <div className="space-y-8">
            {/* License Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-l-4" style={{ borderLeftColor: institution?.primary_color }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Plano {licenseInfo.plan_type === 'unlimited' ? 'Ilimitado' : licenseInfo.plan_type}
                  </h2>
                  {getStatusBadge(licenseInfo.status)}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold" style={{ color: institution?.primary_color }}>
                    {licenseInfo.monthly_fee === 0 ? 'GRATUITO' : `R$ ${licenseInfo.monthly_fee.toFixed(2)}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {licenseInfo.monthly_fee === 0 ? 'Configuração inicial' : 'por mês'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Detalhes da Licença</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Válida desde:</span>
                      <span className="ml-2 font-medium">
                        {new Date(licenseInfo.valid_from).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {licenseInfo.valid_until ? (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-600">Válida até:</span>
                        <span className="ml-2 font-medium">
                          {new Date(licenseInfo.valid_until).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Infinity className="w-4 h-4 mr-2 text-green-500" />
                        <span className="text-green-600 font-medium">Sem data de expiração</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Limites</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Usuários:</span>
                      <span className="ml-2 font-medium">
                        {licenseInfo.max_users ? licenseInfo.max_users : 'Ilimitado ✨'}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Bot className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Assistentes:</span>
                      <span className="ml-2 font-medium">
                        {licenseInfo.max_assistants ? licenseInfo.max_assistants : 'Ilimitado ✨'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Recursos Inclusos
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {licenseInfo.features.map((feature) => (
                  <div key={feature} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{getFeatureLabel(feature)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Estatísticas de Uso
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: institution?.primary_color }} />
                  <p className="text-2xl font-bold text-gray-900">
                    {licenseInfo.usage_stats.current_users}
                  </p>
                  <p className="text-sm text-gray-600">Usuários Ativos</p>
                </div>

                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: institution?.primary_color }} />
                  <p className="text-2xl font-bold text-gray-900">
                    {licenseInfo.usage_stats.conversations_this_month}
                  </p>
                  <p className="text-sm text-gray-600">Conversas Este Mês</p>
                </div>

                <div className="text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: institution?.primary_color }} />
                  <p className="text-2xl font-bold text-gray-900">
                    {licenseInfo.usage_stats.total_conversations}
                  </p>
                  <p className="text-sm text-gray-600">Total de Conversas</p>
                </div>

                <div className="text-center">
                  <Bot className="w-8 h-8 mx-auto mb-2" style={{ color: institution?.primary_color }} />
                  <p className="text-2xl font-bold text-gray-900">
                    {licenseInfo.usage_stats.avg_sessions_per_user.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Média por Usuário</p>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Suporte e Contato
              </h3>
              <p className="text-gray-600 mb-6">
                Precisa de ajuda ou tem dúvidas sobre sua licença? Entre em contato conosco.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {institution?.contact_email && (
                  <a
                    href={`mailto:${institution.contact_email}`}
                    className="flex items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <Mail className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{institution.contact_email}</p>
                    </div>
                  </a>
                )}

                {institution?.phone && (
                  <a
                    href={`tel:${institution.phone}`}
                    className="flex items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <Phone className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Telefone</p>
                      <p className="text-sm text-gray-600">{institution.phone}</p>
                    </div>
                  </a>
                )}

                {institution?.website_url && (
                  <a
                    href={institution.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <Globe className="w-5 h-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Website</p>
                      <p className="text-sm text-gray-600">Visitar site</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};