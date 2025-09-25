import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Users,
  Bot,
  Settings,
  BarChart3,
  Eye,
  EyeOff,
  UserPlus,
  UserMinus,
  Save,
  RefreshCw,
  Star,
  StarOff,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  MessageSquare,
  Clock,
  Download,
  Filter
} from 'lucide-react';
import { getAuthHeaders } from '../../utils/auth';
import toast from 'react-hot-toast';

interface Institution {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  secondary_color?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  stats: {
    total_users: number;
    total_conversations: number;
    total_assistants: number;
    license_status: string;
    license_expires?: string;
  };
}

interface InstitutionUser {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role: 'admin' | 'subadmin' | 'user';
  is_active: boolean;
  enrolled_at: string;
  last_access?: string;
  created_at?: string;
  last_sign_in_at?: string;
  is_admin?: boolean;
}

interface InstitutionAssistant {
  id: string;
  assistant_id: string;
  name: string;
  custom_name?: string;
  description?: string;
  is_enabled: boolean;
  is_default: boolean;
  display_order: number;
}

interface ReportData {
  institution: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
  };
  period: {
    days: number;
    start_date: string;
    end_date: string;
  };
  overview: {
    total_users: number;
    active_users: number;
    recent_active_users: number;
    user_retention_rate: number;
    total_assistants: number;
    enabled_assistants: number;
    total_conversations: number;
    recent_conversations: number;
    avg_conversations_per_user: number;
    conversation_growth: number;
  };
  assistants: {
    default_assistant?: {
      id: string;
      name: string;
    };
    usage_stats: Array<{
      assistant_id: string;
      name: string;
      count: number;
      percentage: number;
    }>;
    most_used?: {
      assistant_id: string;
      name: string;
      count: number;
      percentage: number;
    };
  };
  timeline: {
    daily_conversations: Array<{
      date: string;
      count: number;
    }>;
  };
  users: {
    breakdown: Array<{
      id: string;
      role: string;
      is_active: boolean;
      enrolled_at: string;
      last_access?: string;
    }>;
  };
  generated_at: string;
}

interface InstitutionDetailModalProps {
  institution: Institution | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'users' | 'assistants' | 'reports';

export const InstitutionDetailModal: React.FC<InstitutionDetailModalProps> = ({
  institution,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [users, setUsers] = useState<InstitutionUser[]>([]);
  const [assistants, setAssistants] = useState<InstitutionAssistant[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('30');

  useEffect(() => {
    if (isOpen && institution) {
      setActiveTab('overview');
      loadInstitutionData();
    }
  }, [isOpen, institution]);

  const loadInstitutionData = async () => {
    if (!institution) return;

    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadAssistants()
      ]);
    } catch (error) {
      console.error('Error loading institution data:', error);
      toast.error('Erro ao carregar dados da instituição');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!institution) return;

    setUserLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin-institution-users?institution_id=${institution.id}`, {
        headers
      });

      const result = await response.json();
      if (result.success) {
        setUsers(result.data.users || []);
      } else {
        console.error('Error loading users:', result.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const loadAssistants = async () => {
    if (!institution) return;

    setAssistantLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin-institution-assistants?institution_id=${institution.id}`, {
        headers
      });

      const result = await response.json();
      if (result.success) {
        setAssistants(result.data.assistants || []);
      } else {
        console.error('Error loading assistants:', result.error);
      }
    } catch (error) {
      console.error('Error loading assistants:', error);
    } finally {
      setAssistantLoading(false);
    }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const headers = await getAuthHeaders();
      const action = currentActive ? 'deactivate' : 'activate';

      const response = await fetch(`/api/admin-institution-user-subscriptions?institution_id=${institution?.id}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          action: action
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Assinatura ${action === 'activate' ? 'ativada' : 'desativada'} com sucesso`);
        await loadUsers();
      } else {
        toast.error(result.error || 'Erro ao alterar assinatura do usuário');
      }
    } catch (error) {
      console.error('Error toggling user subscription:', error);
      toast.error('Erro ao alterar assinatura do usuário');
    }
  };

  const toggleAssistantEnabled = async (assistantId: string, currentEnabled: boolean) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin-institution-toggle-assistant', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institution_id: institution?.id,
          assistant_id: assistantId,
          is_enabled: !currentEnabled
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Assistente ${!currentEnabled ? 'habilitado' : 'desabilitado'} com sucesso`);
        await loadAssistants();
      } else {
        toast.error(result.error || 'Erro ao alterar assistente');
      }
    } catch (error) {
      console.error('Error toggling assistant:', error);
      toast.error('Erro ao alterar assistente');
    }
  };

  const setAssistantAsDefault = async (assistantId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin-institution-toggle-assistant', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institution_id: institution?.id,
          assistant_id: assistantId,
          set_as_default: true
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Assistente definido como padrão');
        await loadAssistants();
      } else {
        toast.error(result.error || 'Erro ao definir assistente padrão');
      }
    } catch (error) {
      console.error('Error setting default assistant:', error);
      toast.error('Erro ao definir assistente padrão');
    }
  };

  const fetchReports = async () => {
    if (!institution?.id) return;

    setReportLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin-institution-reports?institution_id=${institution.id}&period=${reportPeriod}`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
      } else {
        toast.error(result.error || 'Erro ao carregar relatórios');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setReportLoading(false);
    }
  };

  if (!isOpen || !institution) return null;

  const tabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: Building2 },
    { id: 'users' as TabType, label: 'Usuários', icon: Users },
    { id: 'assistants' as TabType, label: 'Assistentes', icon: Bot },
    { id: 'reports' as TabType, label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {institution.logo_url ? (
              <img
                src={institution.logo_url}
                alt={`${institution.name} Logo`}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: institution.primary_color }}
              >
                {institution.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {institution.name}
              </h2>
              <p className="text-gray-600">
                /i/{institution.slug} • {institution.stats.total_users} usuários
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-gray-900">
                        {institution.stats.total_users}
                      </p>
                      <p className="text-sm text-gray-600">Usuários Ativos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Bot className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-gray-900">
                        {institution.stats.total_assistants}
                      </p>
                      <p className="text-sm text-gray-600">Assistentes</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-gray-900">
                        {institution.stats.total_conversations}
                      </p>
                      <p className="text-sm text-gray-600">Conversas</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Settings className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-lg font-bold text-gray-900">
                        {institution.stats.license_status === 'unlimited' ? 'Ilimitada' : 'Ativa'}
                      </p>
                      <p className="text-sm text-gray-600">Licença</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Institution Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Detalhes da Instituição</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">ID</p>
                    <p className="text-sm text-gray-900 font-mono">{institution.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Slug</p>
                    <p className="text-sm text-gray-900">{institution.slug}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cor Primária</p>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: institution.primary_color }}
                      ></div>
                      <p className="text-sm text-gray-900">{institution.primary_color}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Criada em</p>
                    <p className="text-sm text-gray-900">
                      {new Date(institution.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Usuários da Instituição</h3>
                <button
                  onClick={loadUsers}
                  disabled={userLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={userLoading ? 'animate-spin' : ''} />
                  <span>Atualizar</span>
                </button>
              </div>

              {userLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Carregando usuários...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="text-gray-600">
                    Esta instituição ainda não possui usuários cadastrados.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Acesso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assinatura
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || user.email?.split('@')[0] || 'Usuário'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {user.user_id.slice(0, 8)}...
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'subadmin' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.last_access
                              ? new Date(user.last_access).toLocaleDateString('pt-BR')
                              : 'Nunca'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Assinatura Ativa' : 'Sem Assinatura'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleUserActive(user.user_id, user.is_active)}
                              className={`p-1 rounded hover:bg-gray-100 ${
                                user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                              }`}
                              title={user.is_active ? 'Desativar assinatura' : 'Ativar assinatura'}
                            >
                              {user.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assistants' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Assistentes da Instituição</h3>
                <button
                  onClick={loadAssistants}
                  disabled={assistantLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={assistantLoading ? 'animate-spin' : ''} />
                  <span>Atualizar</span>
                </button>
              </div>

              {assistantLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Carregando assistentes...</p>
                </div>
              ) : assistants.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum assistente configurado
                  </h3>
                  <p className="text-gray-600">
                    Configure os assistentes disponíveis para esta instituição.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assistants.map((assistant) => (
                    <div
                      key={assistant.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Bot size={20} className={`${assistant.is_enabled ? 'text-green-600' : 'text-gray-400'}`} />
                          {assistant.is_default && (
                            <Star size={16} className="text-yellow-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {assistant.custom_name || assistant.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {assistant.assistant_id}
                          </p>
                          {assistant.description && (
                            <p className="text-xs text-gray-400 mt-1">
                              {assistant.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status indicators only - no controls for institutions */}
                        <div className="flex items-center space-x-1 text-xs">
                          {assistant.is_default && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                              <Star size={12} className="mr-1" />
                              Padrão
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                            assistant.is_enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {assistant.is_enabled ? (
                              <>
                                <Eye size={12} className="mr-1" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <EyeOff size={12} className="mr-1" />
                                Inativo
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              {/* Period Selector */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Período:</label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 90 dias</option>
                  </select>
                </div>
                <button
                  onClick={fetchReports}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 inline mr-2 ${reportLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              {reportLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Carregando relatórios...</p>
                </div>
              ) : reportData ? (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-xs text-gray-500">Total</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {reportData.overview.total_users}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Usuários cadastrados</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="w-5 h-5 text-green-600" />
                        <span className="text-xs text-gray-500">Ativos</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {reportData.overview.recent_active_users}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Usuários ativos ({reportData.overview.user_retention_rate}%)</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <span className="text-xs text-gray-500">Conversas</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {reportData.overview.total_conversations}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Total de conversas</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        <span className="text-xs text-gray-500">Média</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {reportData.overview.avg_conversations_per_user}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Conversas/usuário</p>
                    </div>
                  </div>

                  {/* Assistant Usage */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Bot className="w-5 h-5 mr-2 text-blue-600" />
                      Uso de Assistentes
                    </h4>
                    {reportData.assistants.usage_stats.length > 0 ? (
                      <div className="space-y-3">
                        {reportData.assistants.usage_stats.map((assistant, index) => (
                          <div key={assistant.assistant_id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-700">
                                {index + 1}. {assistant.name}
                              </span>
                              {reportData.assistants.default_assistant?.id === assistant.assistant_id && (
                                <Star className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="bg-gray-200 rounded-full h-2 w-32">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${assistant.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {assistant.count} ({assistant.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhum dado de uso disponível</p>
                    )}
                  </div>

                  {/* Daily Activity Chart */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                      Atividade Diária (Últimos 7 dias)
                    </h4>
                    {reportData.timeline.daily_conversations.length > 0 ? (
                      <div className="space-y-2">
                        {reportData.timeline.daily_conversations.map((day) => {
                          const maxCount = Math.max(...reportData.timeline.daily_conversations.map(d => d.count), 1);
                          const percentage = (day.count / maxCount) * 100;
                          const date = new Date(day.date);
                          const formattedDate = date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short'
                          });

                          return (
                            <div key={day.date} className="flex items-center space-x-3">
                              <span className="text-xs text-gray-600 w-16">{formattedDate}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-6">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                                  style={{ width: `${Math.max(percentage, 5)}%` }}
                                >
                                  <span className="text-xs text-white font-medium">
                                    {day.count}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhum dado de atividade disponível</p>
                    )}
                  </div>

                  {/* Additional Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Crescimento de Conversas</h5>
                      <div className="flex items-center space-x-2">
                        {reportData.overview.conversation_growth > 0 ? (
                          <>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <span className="text-lg font-semibold text-green-600">
                              +{reportData.overview.conversation_growth}
                            </span>
                          </>
                        ) : reportData.overview.conversation_growth < 0 ? (
                          <>
                            <TrendingDown className="w-5 h-5 text-red-500" />
                            <span className="text-lg font-semibold text-red-600">
                              {reportData.overview.conversation_growth}
                            </span>
                          </>
                        ) : (
                          <>
                            <Activity className="w-5 h-5 text-gray-500" />
                            <span className="text-lg font-semibold text-gray-600">0</span>
                          </>
                        )}
                        <span className="text-xs text-gray-500">vs. dia anterior</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Assistentes Habilitados</h5>
                      <div className="flex items-center space-x-2">
                        <Bot className="w-5 h-5 text-blue-500" />
                        <span className="text-lg font-semibold text-gray-900">
                          {reportData.overview.enabled_assistants} / {reportData.overview.total_assistants}
                        </span>
                        <span className="text-xs text-gray-500">assistentes</span>
                      </div>
                    </div>
                  </div>

                  {/* Report Footer */}
                  <div className="text-xs text-gray-500 text-center pt-4 border-t">
                    Relatório gerado em: {new Date(reportData.generated_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Selecione um período e clique em "Atualizar" para gerar o relatório
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};