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
    <div className="space-y-6 p-6">
      {/* Subscription Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="px-6 py-8 text-white"
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
                <div key={index} className="flex items-start group hover:bg-gray-50 -mx-3 px-3 py-2 rounded-lg transition-colors">
                  <Icon name="checkCircle" className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl border-2 p-6"
            style={{
              borderColor: `${institution.primary_color}20`,
              background: `linear-gradient(135deg, ${institution.primary_color}05 0%, ${institution.primary_color}10 100%)`
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Suporte ABPSI
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Precisa de ajuda ou tem dúvidas sobre sua licença institucional?
            </p>
            <div className="space-y-3">
              <a
                href={`mailto:${institution.settings?.contact?.email || 'contato@abpsi.org.br'}`}
                className="flex items-center justify-center px-4 py-3 bg-white rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <Icon name="mail" className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Contato por E-mail</span>
              </a>
              {institution?.settings?.contact?.phone && (
                <a
                  href={`tel:${institution?.settings?.contact?.phone}`}
                  className="flex items-center justify-center px-4 py-3 bg-white rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  <Icon name="phone" className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{institution?.settings?.contact?.phone}</span>
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
              className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <AssistantIcon
                iconType={assistant.icon}
                className="w-8 h-8 mr-3 flex-shrink-0"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="px-6 py-4 text-white"
          style={{
            background: `linear-gradient(135deg, ${institution.primary_color} 0%, ${institution.secondary_color || institution.primary_color} 100%)`
          }}
        >
          <div className="flex items-center space-x-4">
            {institution.logo_url && (
              <img
                src={institution.logo_url}
                alt={`${institution.name} Logo`}
                className="h-12 w-auto opacity-90"
              />
            )}
            <div>
              <h2 className="text-lg font-bold">
                {institution.name}
              </h2>
              <p className="text-white/80 text-sm">
                {institution.settings?.subtitle || 'Formação, Supervisão e Prática'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Icon name="mail" className="w-4 h-4 mr-2" style={{ color: institution.primary_color }} />
                Contato
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="break-words">{institution.settings?.contact?.email || 'contato@abpsi.org.br'}</p>
                {institution?.settings?.contact?.phone && (
                  <p>{institution?.settings?.contact?.phone}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Icon name="globe" className="w-4 h-4 mr-2" style={{ color: institution.primary_color }} />
                Website
              </h3>
              <a
                href={institution.settings?.contact?.website || 'https://abpsi.org.br'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline transition-colors inline-flex items-center"
                style={{ color: institution.primary_color }}
              >
                {institution.settings?.contact?.website || 'https://abpsi.org.br'}
                <Icon name="externalLink" className="w-3 h-3 ml-1" />
              </a>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Icon name="mapPin" className="w-4 h-4 mr-2" style={{ color: institution.primary_color }} />
                Localização
              </h3>
              <p className="text-sm text-gray-600">
                {institution.settings?.contact?.address || 'São Paulo - SP'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};