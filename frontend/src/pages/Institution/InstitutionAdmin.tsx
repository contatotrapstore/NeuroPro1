import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { InstitutionLoadingSpinner } from '../../components/ui/InstitutionLoadingSpinner';
import { institutionApi, InstitutionStats, InstitutionUser } from '../../services/institutionApi';
import {
  ArrowLeft,
  Users,
  MessageCircle,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  BarChart3,
  Clock,
  UserCheck,
  Bot,
  Activity,
  FileText,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';


export const InstitutionAdmin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    institution,
    userAccess,
    isInstitutionUser,
    loading: institutionLoading
  } = useInstitution();

  // Estados
  const [stats, setStats] = useState<InstitutionStats | null>(null);
  const [users, setUsers] = useState<InstitutionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports'>('dashboard');

  // Verificar acesso de admin
  const isAdmin = userAccess?.is_admin || userAccess?.role === 'subadmin';

  // Redirecionar se não é admin
  useEffect(() => {
    if (!institutionLoading && !isAdmin) {
      navigate(`/i/${slug}`);
    }
  }, [isAdmin, institutionLoading, navigate, slug]);

  // Carregar dados do dashboard
  useEffect(() => {
    if (institution && isAdmin) {
      loadDashboardData();
    }
  }, [institution, isAdmin]);

  const loadDashboardData = async () => {
    if (!slug) return;

    setLoading(true);
    try {
      // Load real data from API
      const [statsData, usersData] = await Promise.all([
        institutionApi.getInstitutionStats(slug),
        institutionApi.getInstitutionUsers(slug)
      ]);

      setStats(statsData);
      setUsers(usersData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: 'users' | 'conversations' | 'usage') => {
    if (!slug) return;

    try {
      toast.loading(`Gerando relatório de ${type}...`);

      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'users':
          blob = await institutionApi.exportUsersReport(slug);
          filename = `usuarios_${institution?.name}_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'conversations':
          blob = await institutionApi.exportConversationsReport(slug);
          filename = `conversas_${institution?.name}_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'usage':
          // For now, use conversations report as usage report
          blob = await institutionApi.exportConversationsReport(slug);
          filename = `uso_${institution?.name}_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          throw new Error('Tipo de relatório inválido');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Relatório exportado com sucesso!');

    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error('Erro ao gerar relatório');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      student: 'bg-blue-100 text-blue-800',
      professor: 'bg-green-100 text-green-800',
      subadmin: 'bg-purple-100 text-purple-800'
    };

    const labels = {
      student: 'Estudante',
      professor: 'Professor',
      subadmin: 'Admin'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  if (institutionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <InstitutionLoadingSpinner size="lg" institution={institution} />
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 mb-6">
            Você precisa ser administrador para acessar este painel.
          </p>
          <button
            onClick={() => navigate(`/i/${slug}`)}
            className="px-6 py-3 text-white rounded-lg"
            style={{ backgroundColor: institution?.primary_color }}
          >
            Voltar ao Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
                    className="h-10 w-auto mr-4"
                  />
                ) : (
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center mr-4"
                    style={{ backgroundColor: institution?.primary_color }}
                  >
                    <span className="text-white font-bold text-lg">
                      {institution?.name.charAt(0)}
                    </span>
                  </div>
                )}

                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Painel Administrativo
                  </h1>
                  <p className="text-sm text-gray-600">
                    {institution?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Bem-vindo, {user?.email}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Usuários ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Relatórios
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: institution?.primary_color }}>
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_users}
                    </p>
                    <p className="text-sm text-gray-600">Total de Usuários</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <UserCheck className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.active_users}
                    </p>
                    <p className="text-sm text-gray-600">Usuários Ativos</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_conversations}
                    </p>
                    <p className="text-sm text-gray-600">Total Conversas</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.avg_messages_per_conversation.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Mensagens por Conversa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Institution Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Status da Instituição
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium text-green-800">Licença Ativa</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Plano: Premium Ilimitado
                  </p>
                  <p className="text-sm text-gray-600">
                    Assistentes especializados em Psicanálise ✨
                  </p>
                  <p className="text-sm text-gray-600">
                    Usuários ativos: {stats.active_users} de {stats.total_users}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/i/${slug}/subscription`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>

            {/* Most Used Assistant */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Assistente Mais Usado
              </h3>
              <div className="flex items-center">
                <Bot className="w-12 h-12 text-gray-400 mr-4" />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {stats.most_used_assistant.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {stats.most_used_assistant.usage_count} conversas
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Usuários da Instituição
              </h2>
              <p className="text-gray-600 mt-1">
                Visualização dos usuários cadastrados (somente leitura)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastrado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.email || 'Email não disponível'}
                          </div>
                          {user.registration_number && (
                            <div className="text-sm text-gray-500">
                              Mat: {user.registration_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department || '-'}
                        {user.role === 'student' && user.semester && (
                          <div className="text-xs text-gray-500">
                            {user.semester}º Semestre
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        -
                        <div className="text-xs text-gray-500">
                          Em desenvolvimento
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.enrolled_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-600">
                  Os usuários aparecerão aqui quando se cadastrarem na instituição.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Relatórios Disponíveis
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <FileText className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    Relatório de Usuários
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Lista completa de usuários com estatísticas de uso
                  </p>
                  <button
                    onClick={() => exportReport('users')}
                    className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <Activity className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    Relatório de Atividade
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Conversas e uso dos assistentes por período
                  </p>
                  <button
                    onClick={() => exportReport('conversations')}
                    className="flex items-center px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <TrendingUp className="w-8 h-8 text-purple-600 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    Relatório de Uso
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Métricas detalhadas de uso da plataforma
                  </p>
                  <button
                    onClick={() => exportReport('usage')}
                    className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};