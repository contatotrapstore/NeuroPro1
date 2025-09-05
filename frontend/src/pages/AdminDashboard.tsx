import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  DollarSign, 
  Activity, 
  LogOut,
  Eye,
  Settings,
  BarChart3,
  Bot,
  TrendingUp,
  X,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import { NeuroLabIconMedium } from '../components/icons/NeuroLabLogo';
import { adminService } from '../services/admin.service';
import type { AdminStats, AdminUser } from '../services/admin.service';
import AssistantManager from '../components/admin/AssistantManager';
import { AssistantIcon } from '../components/ui/AssistantIcon';

interface AdminStatsDisplay extends AdminStats {
  conversionRate?: number;
}

type UserData = AdminUser & {
  status?: 'active' | 'inactive';
  lastLogin?: string;
};

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'assistants'>('overview');
  const [stats, setStats] = useState<AdminStatsDisplay>({
    totalUsers: 0,
    activeSubscriptions: 0,
    activePackages: 0,
    recentConversations: 0,
    monthlyRevenue: 0,
    totalActiveRevenue: 0,
    conversionRate: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userAssistants, setUserAssistants] = useState<Array<{
    id: string;
    name: string;
    icon: string;
    hasAccess: boolean;
  }>>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Só verificar se user não é null/undefined
    if (user === undefined) return; // Ainda carregando
    
    // Lista de emails admin
    const adminEmails = ['admin@neuroialab.com', 'gouveiarx@gmail.com', 'pstales@gmail.com'];
    const isAdminEmail = adminEmails.includes(user?.email || '');
    const hasAdminRole = user?.user_metadata?.role === 'admin';
    
    // Verificar se é admin
    if (!user || (!isAdminEmail && !hasAdminRole)) {
      console.log(`❌ AdminDashboard: Access denied for ${user?.email} - redirecting to /admin`);
      navigate('/admin', { replace: true });
      return;
    }

    console.log(`✅ AdminDashboard: Access granted for ${user?.email}`);
    loadDashboardData();
  }, [user]); // Removido 'navigate' da dependência

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Carregar estatísticas reais
      const statsResult = await adminService.getStats();
      if (statsResult.success && statsResult.data) {
        setStats({
          ...statsResult.data,
          conversionRate: Math.round((statsResult.data.activeSubscriptions / statsResult.data.totalUsers) * 100 * 10) / 10
        });
      }

      // Carregar usuários reais
      const usersResult = await adminService.getUsers(1, 20);
      if (usersResult.success && usersResult.data) {
        const usersWithStatus = usersResult.data.map(user => ({
          ...user,
          status: user.email_confirmed_at ? 'active' : 'inactive' as 'active' | 'inactive',
          subscriptions: user.active_subscriptions,
          lastLogin: user.last_sign_in_at || 'Nunca'
        }));
        setUsers(usersWithStatus);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Em caso de erro, manter valores zerados
      setStats({
        totalUsers: 0,
        activeSubscriptions: 0,
        activePackages: 0,
        recentConversations: 0,
        monthlyRevenue: 0,
        totalActiveRevenue: 0,
        conversionRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin');
  };

  const handleManageAssistants = async (user: UserData) => {
    setSelectedUser(user);
    setModalLoading(true);
    setShowModal(true);
    
    try {
      const result = await adminService.getUserAvailableAssistants(user.id);
      if (result.success && result.data) {
        setUserAssistants(result.data);
      }
    } catch (error) {
      console.error('Error loading user assistants:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const toggleAssistantAccess = async (assistantId: string, hasAccess: boolean) => {
    if (!selectedUser) return;

    try {
      const action = hasAccess ? 'remove' : 'add';
      const result = await adminService.manageUserAssistants(
        selectedUser.id, 
        [assistantId], 
        action
      );

      if (result.success) {
        // Atualizar a lista de assistentes no modal
        setUserAssistants(prev => prev.map(assistant => 
          assistant.id === assistantId 
            ? { ...assistant, hasAccess: !hasAccess }
            : assistant
        ));

        // Atualizar a contagem de assinaturas na lista de usuários
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? { 
                ...user, 
                active_subscriptions: hasAccess 
                  ? user.active_subscriptions - 1 
                  : user.active_subscriptions + 1,
                subscriptions: hasAccess 
                  ? user.active_subscriptions - 1 
                  : user.active_subscriptions + 1
              }
            : user
        ));

        // Atualizar o selectedUser também
        setSelectedUser(prev => prev ? {
          ...prev,
          active_subscriptions: hasAccess 
            ? prev.active_subscriptions - 1 
            : prev.active_subscriptions + 1
        } : null);
      }
    } catch (error) {
      console.error('Error toggling assistant access:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserAssistants([]);
    // Não recarregar automaticamente - apenas limpar o estado do modal
  };

  const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }: {
    icon: any;
    title: string;
    value: string | number;
    change?: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: color === 'blue' ? '#2563eb' : color === 'green' ? '#16a34a' : color === 'red' ? '#dc2626' : '#f59e0b' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : color === 'red' ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <Icon className={`h-6 w-6 ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-yellow-600'}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <NeuroLabIconMedium color="#DC2626" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Painel Administrativo - NeuroIA Lab</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Administrador</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', name: 'Visão Geral', icon: BarChart3 },
              { id: 'users', name: 'Usuários', icon: Users },
              { id: 'assistants', name: 'Assistentes', icon: Bot }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                title="Total de Usuários"
                value={stats.totalUsers}
                color="blue"
              />
              <StatCard
                icon={Activity}
                title="Assinaturas Ativas"
                value={stats.activeSubscriptions}
                color="green"
              />
              <StatCard
                icon={DollarSign}
                title="Receita Mensal"
                value={`R$ ${stats.monthlyRevenue?.toFixed(2) || '0.00'}`}
                color="green"
              />
              <StatCard
                icon={TrendingUp}
                title="Receita Ativa"
                value={`R$ ${stats.totalActiveRevenue?.toFixed(2) || '0.00'}`}
                color="blue"
              />
            </div>

          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Gerenciar Usuários</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assinaturas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IAs Disponíveis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name || 'Nome não informado'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.active_subscriptions + user.active_packages}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          {user.availableAssistants && user.availableAssistants.length > 0 ? (
                            user.availableAssistants.slice(0, 3).map((assistant) => (
                              <AssistantIcon 
                                key={assistant.id} 
                                iconType={assistant.icon} 
                                className="w-5 h-5" 
                                title={assistant.name}
                              />
                            ))
                          ) : (
                            <span className="text-gray-400">Nenhuma</span>
                          )}
                          {user.availableAssistants && user.availableAssistants.length > 3 && (
                            <span className="text-xs text-gray-400">+{user.availableAssistants.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin && user.lastLogin !== 'Nunca' 
                          ? new Date(user.lastLogin).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleManageAssistants(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Gerenciar IAs"
                        >
                          <Settings size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Assistants Tab */}
        {activeTab === 'assistants' && (
          <div className="space-y-6">
            <AssistantManager />
          </div>
        )}

        {/* Modal for managing user assistants */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Gerenciar IAs - {selectedUser.name || selectedUser.email}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Adicione ou remova assistentes para este usuário
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                {modalLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-gray-600">Carregando...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userAssistants.map((assistant) => (
                      <div
                        key={assistant.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <AssistantIcon 
                            iconType={assistant.icon} 
                            className="w-8 h-8" 
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {assistant.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            assistant.hasAccess 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {assistant.hasAccess ? 'Com acesso' : 'Sem acesso'}
                          </span>
                          <button
                            onClick={() => toggleAssistantAccess(assistant.id, assistant.hasAccess)}
                            className={`p-2 rounded-full transition-colors ${
                              assistant.hasAccess
                                ? 'text-red-600 hover:bg-red-100'
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={assistant.hasAccess ? 'Remover acesso' : 'Dar acesso'}
                          >
                            {assistant.hasAccess ? <Minus size={16} /> : <Plus size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}