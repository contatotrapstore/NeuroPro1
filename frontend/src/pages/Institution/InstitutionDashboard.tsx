import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { AssistantIcon } from '../../components/ui/AssistantIcon';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';

export const InstitutionDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);

  // Verificação de segurança do contexto
  const context = useInstitution();
  if (!context) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const {
    institution,
    userAccess,
    availableAssistants,
    getPrimaryAssistant,
    getSimulatorAssistant,
    isInstitutionUser,
    canAccessAssistants
  } = context;

  if (!institution) return null;

  const primaryAssistant = getPrimaryAssistant();
  const simulatorAssistant = getSimulatorAssistant();

  // Check if user can manage users (is admin)
  const canManageUsers = userAccess?.is_admin && userAccess?.permissions?.manage_users;

  // Fetch pending users count if admin
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!canManageUsers || !slug) return;

      try {
        const response = await fetch('/api/institution-rpc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await import('../../services/supabase')).supabase.auth.getSession().then(r => r.data.session?.access_token)}`
          },
          body: JSON.stringify({
            function_name: 'get_institution_pending_count',
            params: [slug]
          })
        });

        const result = await response.json();
        if (result.success && typeof result.data === 'number') {
          setPendingUsersCount(result.data);
        }
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };

    fetchPendingCount();
  }, [canManageUsers, slug]);

  // Função para lidar com ações que exigem autenticação
  const handleAuthRequiredAction = (targetPath: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!user || !isInstitutionUser) {
      // Salvar URL de destino e redirecionar para login
      const returnUrl = encodeURIComponent(targetPath);
      navigate(`/i/${slug}/login?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user can access assistants (is active)
    if (isInstitutionUser && !canAccessAssistants) {
      // User is logged in but not approved, show appropriate message
      return;
    }

    // Se já autenticado e aprovado, navegar normalmente
    navigate(targetPath);
  };

  const stats = [
    {
      title: 'Assistentes Disponíveis',
      value: availableAssistants.length.toString(),
      icon: 'bot',
      description: 'IAs especializadas ativas'
    },
    {
      title: user && isInstitutionUser ? 'Conversas Hoje' : 'Converse com IAs',
      value: user && isInstitutionUser ? '--' : 'Login',
      icon: 'message',
      description: user && isInstitutionUser ? 'Sessões realizadas' : 'Faça login para conversar'
    },
    {
      title: user && isInstitutionUser ? 'Progresso' : 'Especialização',
      value: user && isInstitutionUser ? '--' : 'ABPSI',
      icon: 'trendingUp',
      description: user && isInstitutionUser ? 'Horas de estudo' : 'Psicanálise e formação'
    },
    {
      title: user && isInstitutionUser ? 'Licença' : 'Acesso',
      value: user && isInstitutionUser ? 'Ativa' : 'Público',
      icon: 'shieldCheck',
      description: user && isInstitutionUser ? 'Acesso completo' : 'Navegação livre',
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
      icon: 'messageSquare',
      href: `/i/${slug}/chat`,
      highlight: false
    },
    {
      title: 'Explorar Loja',
      description: 'Descubra novos assistentes disponíveis',
      icon: 'store',
      href: `/i/${slug}/store`,
      highlight: false
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
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
                {user && isInstitutionUser ? (
                  <>
                    {userAccess?.role === 'student' && 'Estudante'}
                    {userAccess?.role === 'professor' && 'Professor'}
                    {userAccess?.role === 'subadmin' && 'Administrador'}
                  </>
                ) : (
                  'Visitante'
                )}
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

      {/* Admin Panel - Only visible for admins */}
      {canManageUsers && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Painel Administrativo
              </h2>
              <p className="text-gray-600 mt-1">
                Gerencie usuários e configurações da instituição
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* User Management */}
            <Link
              to={`/i/${slug}/manage-users`}
              className="block bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="users" className="w-5 h-5 text-blue-600" />
                </div>
                {pendingUsersCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {pendingUsersCount}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                Gerenciar Usuários
              </h3>
              <p className="text-sm text-gray-600">
                {pendingUsersCount > 0
                  ? `${pendingUsersCount} usuário${pendingUsersCount > 1 ? 's' : ''} aguardando aprovação`
                  : 'Aprovar e gerenciar usuários'
                }
              </p>
            </Link>

            {/* Institution Settings */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4 opacity-75">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Icon name="settings" className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Em breve
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                Configurações
              </h3>
              <p className="text-sm text-gray-600">
                Personalizar instituição
              </p>
            </div>

            {/* Analytics */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4 opacity-75">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name="barChart" className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Em breve
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                Analytics
              </h3>
              <p className="text-sm text-gray-600">
                Relatórios e métricas
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <div
            key={index}
            onClick={(e) => handleAuthRequiredAction(action.href, e)}
            className={cn(
              "block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer",
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
          </div>
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
              <div
                key={assistant.id}
                onClick={(e) => handleAuthRequiredAction(`/i/${slug}/chat/${assistant.id}`, e)}
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
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
                <Icon name={user && isInstitutionUser && canAccessAssistants ? "chevronRight" : "lock"} className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
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
          <Icon name={user && isInstitutionUser ? "clock" : "messageSquare"} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {user && isInstitutionUser ?
              (canAccessAssistants ? 'Nenhuma atividade recente' : 'Aguardando Aprovação') :
              'Comece sua jornada'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {user && isInstitutionUser ?
              (canAccessAssistants ?
                'Suas conversas e atividades aparecerão aqui' :
                'Sua conta foi criada e está aguardando aprovação do administrador'
              ) :
              'Faça login para acessar nossos assistentes de IA especializados'
            }
          </p>
          <button
            onClick={(e) => handleAuthRequiredAction(`/i/${slug}/chat`, e)}
            className="inline-flex items-center px-4 py-2 rounded-lg text-white font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: institution.primary_color }}
            disabled={user && isInstitutionUser && !canAccessAssistants}
          >
            <Icon name={user && isInstitutionUser ? (canAccessAssistants ? "messageSquare" : "clock") : "logIn"} className="w-4 h-4 mr-2" />
            {user && isInstitutionUser ? (canAccessAssistants ? 'Iniciar Chat' : 'Aguardar Aprovação') : 'Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  );
};