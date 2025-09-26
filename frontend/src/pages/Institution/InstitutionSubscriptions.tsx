import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInstitution } from '../../contexts/InstitutionContext';
import { AssistantIcon } from '../../components/ui/AssistantIcon';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';

export const InstitutionSubscriptions: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { institution, userAccess, availableAssistants } = useInstitution();

  if (!institution) return null;

  const subscriptionInfo = {
    plan: 'Institucional ABPSI',
    status: 'Ativa',
    startDate: userAccess?.joined_at,
    expiresAt: null, // Licença institucional não expira
    features: [
      'Acesso a todos os assistentes ABPSI',
      'Simulador de Psicanálise',
      'Conversas ilimitadas',
      'Suporte técnico prioritário',
      'Materiais didáticos exclusivos'
    ]
  };

  return (
    <div className="space-y-8">
      {/* Subscription Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="px-8 py-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${institution.primary_color} 0%, ${institution.secondary_color || institution.primary_color} 100%)`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Sua Licença Institucional
              </h1>
              <p className="text-white/90">
                {subscriptionInfo.plan} - Academia Brasileira de Psicanálise
              </p>
            </div>

            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-2">
                <span className="text-sm font-medium">✓ {subscriptionInfo.status}</span>
              </div>
              <p className="text-xs text-white/70">
                Acesso completo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Detalhes da Licença
              </h2>
              <p className="text-gray-600 mt-1">
                Sua licença institucional ativa
              </p>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Ativa
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Plano</span>
              <span className="font-medium text-gray-900">{subscriptionInfo.plan}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">✓ {subscriptionInfo.status}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Data de Início</span>
              <span className="font-medium text-gray-900">
                {subscriptionInfo.startDate 
                  ? new Date(subscriptionInfo.startDate).toLocaleDateString('pt-BR')
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Vencimento</span>
              <span className="font-medium text-gray-900">
                Licença permanente
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Assistentes</span>
              <span className="font-medium text-gray-900">
                {availableAssistants.length} disponíveis
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recursos Inclusos
            </h3>
            <div className="space-y-3">
              {subscriptionInfo.features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <Icon name="check-circle" className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Suporte
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Precisa de ajuda ou tem dúvidas sobre sua licença?
            </p>
            <div className="space-y-2">
              <a
                href={`mailto:${institution.settings?.contact?.email || 'contato@abpsi.org.br'}`}
                className="block w-full text-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon name="mail" className="w-4 h-4 mr-2 inline" />
                Contato por E-mail
              </a>
              {institution?.settings?.contact?.phone && (
                <a
                  href={`tel:${institution?.settings?.contact?.phone}`}
                  className="block w-full text-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icon name="phone" className="w-4 h-4 mr-2 inline" />
                  {institution?.settings?.contact?.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Assistants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Assistentes Inclusos
            </h2>
            <p className="text-gray-600 mt-1">
              Todos os assistentes de IA disponíveis em sua licença
            </p>
          </div>
          <Link
            to={`/i/${slug}/store`}
            className="text-sm font-medium hover:underline"
            style={{ color: institution.primary_color }}
          >
            Explorar todos →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableAssistants.map((assistant) => (
            <div
              key={assistant.id}
              className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <AssistantIcon
                iconType={assistant.icon}
                className="w-10 h-10 mr-4 flex-shrink-0"
                color={assistant.color_theme || institution.primary_color}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {assistant.name}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  {assistant.is_primary && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                      Principal
                    </span>
                  )}
                  {assistant.is_simulator && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">
                      Simulador
                    </span>
                  )}
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                    ✓ Incluso
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Institution Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4 mb-6">
          {institution.logo_url && (
            <img
              src={institution.logo_url}
              alt={`${institution.name} Logo`}
              className="h-16 w-auto"
            />
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {institution.name}
            </h2>
            <p className="text-gray-600">
              {institution.settings?.subtitle || 'Formação, Supervisão e Prática'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Contato</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>{institution.settings?.contact?.email || 'contato@abpsi.org.br'}</p>
              {institution?.settings?.contact?.phone && (
                <p>{institution?.settings?.contact?.phone}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Website</h3>
            <a
              href={institution.settings?.contact?.website || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
              style={{ color: institution.primary_color }}
            >
              {institution.settings?.contact?.website || 'https://abpsi.org.br'}
            </a>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Endereço</h3>
            <p className="text-sm text-gray-600">
              {institution.settings?.contact?.address || 'São Paulo - SP'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};