import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useInstitution } from '../../contexts/InstitutionContext';
import { AssistantIcon } from '../../components/ui/AssistantIcon';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';

export const InstitutionDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    institution,
    userAccess,
    availableAssistants,
    getPrimaryAssistant,
    getSimulatorAssistant
  } = useInstitution();

  if (!institution) return null;

  const primaryAssistant = getPrimaryAssistant();
  const simulatorAssistant = getSimulatorAssistant();

  const stats = [
    {
      title: 'Assistentes Disponíveis',
      value: availableAssistants.length.toString(),
      icon: 'bot',
      description: 'IAs especializadas ativas'
    },
    {
      title: 'Conversas Hoje',
      value: '--',
      icon: 'message',
      description: 'Sessões realizadas'
    },
    {
      title: 'Progresso',
      value: '--',
      icon: 'trending-up',
      description: 'Horas de estudo'
    },
    {
      title: 'Licença',
      value: 'Ativa',
      icon: 'shield-check',
      description: 'Acesso completo',
      isStatus: true
    }
  ];

  const quickActions = [
    {
      title: 'Simulador ABPSI',
      description: 'Simulador de Psicanálise para prática clínica',
      icon: 'play',
      href: `/i/${slug}/chat/asst_9vDTodTAQIJV1mu2xPzXpBs8`,
      highlight: true,
      tags: ['Neurose Obsessiva', 'Histeria', 'Borderline']
    },
    {
      title: 'Chat Principal',
      description: 'Converse com assistentes especializados',
      icon: 'message-square',
      href: `/i/${slug}/chat`,
      highlight: false
    },
    {
      title: 'Explorar Loja',
      description: 'Descubra novos assistentes disponíveis',
      icon: 'store',
      href: `/i/${slug}/store`,
      highlight: false
    },
    {
      title: 'Biblioteca',
      description: 'Materiais didáticos e recursos',
      icon: 'book-open',
      href: `/i/${slug}/library`,
      highlight: false
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
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
                {institution.settings?.welcome_message || `Bem-vindo à ${institution.name}`}
              </h1>
              <p className="text-white/90">
                {institution.settings?.subtitle || 'Portal de Inteligência Artificial'}
              </p>
            </div>

            {institution.logo_url && (
              <div className="hidden sm:block">
                <img
                  src={institution.logo_url}
                  alt={`${institution.name} Logo`}
                  className="h-16 w-auto opacity-90"
                />
              </div>
            )}
          </div>

          {/* User Status Badge */}
          <div className="mt-4 flex items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2">
              <Icon name="user" className="w-4 h-4" />
              <span className="text-sm font-medium">
                {userAccess?.role === 'student' && 'Estudante'}
                {userAccess?.role === 'professor' && 'Professor'}
                {userAccess?.role === 'subadmin' && 'Administrador'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: institution.primary_color + '15',
                  color: institution.primary_color
                }}
              >
                <Icon name={stat.icon as any} className="w-6 h-6" />
              </div>
              {stat.isStatus && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  ✓ Ativa
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.href}
            className={cn(
              "block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:-translate-y-0.5",
              action.highlight && "ring-2 ring-offset-2"
            )}
            style={action.highlight ? {
              ringColor: institution.primary_color + '40',
              backgroundColor: institution.primary_color + '05'
            } : {}}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: action.highlight
                    ? institution.primary_color
                    : institution.primary_color + '15',
                  color: action.highlight ? 'white' : institution.primary_color
                }}
              >
                <Icon name={action.icon as any} className="w-6 h-6" />
              </div>

              {action.highlight && (
                <span
                  className="text-xs text-white px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: institution.primary_color }}
                >
                  Destaque
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {action.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {action.description}
            </p>

            {action.tags && (
              <div className="flex flex-wrap gap-2">
                {action.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="text-xs px-2 py-1 rounded-full border"
                    style={{
                      borderColor: institution.primary_color + '40',
                      backgroundColor: institution.primary_color + '10',
                      color: institution.primary_color
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Available Assistants */}
      {availableAssistants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Assistentes Disponíveis
              </h2>
              <p className="text-gray-600 mt-1">
                Suas IAs especializadas em psicanálise
              </p>
            </div>
            <Link
              to={`/i/${slug}/store`}
              className="text-sm font-medium hover:underline"
              style={{ color: institution.primary_color }}
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableAssistants.slice(0, 6).map((assistant) => (
              <Link
                key={assistant.id}
                to={`/i/${slug}/chat/${assistant.id}`}
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex-shrink-0 mr-4">
                  <AssistantIcon
                    iconType={assistant.icon}
                    className="w-10 h-10"
                    color={assistant.color_theme || institution.primary_color}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {assistant.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {assistant.description}
                  </p>
                  {assistant.is_primary && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                      Principal
                    </span>
                  )}
                  {assistant.is_simulator && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                      Simulador
                    </span>
                  )}
                </div>
                <Icon name="chevron-right" className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Atividade Recente
        </h2>

        <div className="text-center py-12">
          <Icon name="clock" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma atividade recente
          </h3>
          <p className="text-gray-600 mb-6">
            Suas conversas e atividades aparecerão aqui
          </p>
          <Link
            to={`/i/${slug}/chat`}
            className="inline-flex items-center px-4 py-2 rounded-lg text-white font-medium hover:shadow-md transition-all"
            style={{ backgroundColor: institution.primary_color }}
          >
            <Icon name="message-square" className="w-4 h-4 mr-2" />
            Iniciar Chat
          </Link>
        </div>
      </div>
    </div>
  );
};