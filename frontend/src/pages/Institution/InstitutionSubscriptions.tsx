import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInstitution } from '../../contexts/InstitutionContext';
import { AssistantIcon } from '../../components/ui/AssistantIcon';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';

export const InstitutionSubscriptions: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    institution,
    userAccess,
    availableAssistants,
    hasActiveSubscription,
    isCheckingSubscription,
    subscriptionError,
    checkSubscription
  } = useInstitution();

  // Verificar assinatura ao carregar a página
  useEffect(() => {
    if (slug && userAccess?.is_active && !hasActiveSubscription && !isCheckingSubscription) {
      checkSubscription(slug);
    }
  }, [slug, userAccess, hasActiveSubscription, isCheckingSubscription, checkSubscription]);

  if (!institution) return null;

  // Se usuário não está aprovado, mostrar mensagem
  if (!userAccess?.is_active) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="px-6 py-8 text-center">
            <Icon name="clock" className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Aguardando Aprovação
            </h1>
            <p className="text-gray-600">
              Sua conta precisa ser aprovada pelo administrador antes de poder assinar os recursos da instituição.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {hasActiveSubscription ? (
        // Usuário tem assinatura ativa
        <>
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
                    Sua Assinatura Institucional
                  </h1>
                  <p className="text-white/90">
                    {institution.name} - Plano Mensal
                  </p>
                </div>

                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-2">
                    <span className="text-sm font-medium">✓ Ativa</span>
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
                    Detalhes da Assinatura
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Sua assinatura institucional ativa
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Ativa
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Plano</span>
                  <span className="font-medium text-gray-900">Mensal - {institution.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">✓ Ativa</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Valor</span>
                  <span className="font-medium text-gray-900">R$ 47,00/mês</span>
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
                  {[
                    'Acesso a todos os assistentes especializados',
                    'Chat ilimitado com IAs especializadas',
                    'Recursos exclusivos da instituição',
                    'Suporte técnico especializado'
                  ].map((feature, index) => (
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
                  Suporte {institution.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Precisa de ajuda ou tem dúvidas sobre sua assinatura?
                </p>
                <div className="space-y-3">
                  <a
                    href={`mailto:${institution.settings?.contact?.email || 'contato@' + institution.slug + '.org.br'}`}
                    className="flex items-center justify-center px-4 py-3 bg-white rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all group"
                  >
                    <Icon name="mail" className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Contato por E-mail</span>
                  </a>
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
                  Todos os assistentes de IA disponíveis em sua assinatura
                </p>
              </div>
              <Link
                to={`/i/${slug}/chat`}
                className="text-sm font-medium hover:underline"
                style={{ color: institution.primary_color }}
              >
                Usar assistentes →
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
                      {assistant.id === 'asst_9vDTodTAQIJV1mu2xPzXpBs8' && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">
                          Simulador
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        // Usuário não tem assinatura
        <>
          {/* No Subscription */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
            <div className="px-6 py-8 text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#ef4444' }}
              >
                <Icon name="creditCard" className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Assinatura Necessária
              </h1>
              <p className="text-gray-600 mb-6">
                Para acessar os assistentes especializados da {institution.name}, você precisa de uma assinatura ativa.
              </p>

              {subscriptionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">{subscriptionError}</p>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    R$ 47,00
                    <span className="text-sm font-normal text-gray-600">/mês</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Acesso completo • Cancele quando quiser
                  </p>
                </div>
              </div>

              <Link
                to={`/i/${slug}/checkout`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-semibold transition-all transform hover:scale-105"
                style={{ backgroundColor: institution.primary_color }}
              >
                <Icon name="creditCard" className="w-5 h-5 mr-2" />
                Assinar Agora
              </Link>
            </div>
          </div>

          {/* Preview of what they'll get */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                O que você terá com a assinatura
              </h2>
              <p className="text-gray-600">
                Acesso completo a todos os recursos especializados
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                'Acesso a todos os assistentes especializados',
                'Chat ilimitado com IAs especializadas',
                'Recursos exclusivos da instituição',
                'Suporte técnico especializado'
              ].map((feature, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Icon name="check" className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {availableAssistants.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Assistentes Disponíveis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableAssistants.map((assistant) => (
                    <div
                      key={assistant.id}
                      className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 relative"
                    >
                      <AssistantIcon
                        iconType={assistant.icon}
                        className="w-8 h-8 mr-3 flex-shrink-0 opacity-60"
                        color={assistant.color_theme || institution.primary_color}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-700 truncate">
                          {assistant.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {assistant.is_primary && (
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs font-medium">
                              Principal
                            </span>
                          )}
                          {assistant.id === 'asst_9vDTodTAQIJV1mu2xPzXpBs8' && (
                            <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-xs font-medium">
                              Simulador
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                        <Icon name="lock" className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};