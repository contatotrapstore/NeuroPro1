import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { AssistantIcon } from '../components/ui/AssistantIcon';
import { AssistantManager } from './Admin/AssistantManager';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    name?: string;
    profession?: string;
  };
}

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  assistant_id: string;
  status: string;
  subscription_type: string;
  package_type: string;
  expires_at: string;
  created_at: string;
  users?: {
    email: string;
    user_metadata: any;
  };
  assistants?: {
    name: string;
    icon: string;
  };
}

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'assistants' | 'assistant-manager' | 'subscriptions'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<{
    serviceKeyConfigured: boolean;
    isAdmin: boolean;
    debugInfo?: any;
  } | null>(null);

  // Lista de emails admin autorizados (mesma do backend)
  const ADMIN_EMAILS = [
    'admin@neuroialab.com',
    'admin@neuroia.lab',
    'gouveiarx@gmail.com',
    'psitales@gmail.com'
  ];

  // Verificar se é admin
  const hasAdminRole = user?.user_metadata?.role === 'admin';
  const isInAdminList = user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;
  const isAdmin = hasAdminRole || isInAdminList;

  useEffect(() => {
    checkAdminConfig();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'assistants') loadAssistants();
    if (activeTab === 'subscriptions') loadSubscriptions();
  }, [activeTab]);

  const checkAdminConfig = async () => {
    if (!user || !isAdmin) return;

    try {
      const result = await apiService.get('/admin/debug');
      
      if (result.success) {
        setConfigStatus({
          serviceKeyConfigured: result.data.systemConfig.serviceKeyConfigured,
          isAdmin: result.data.finalAccess.isAdmin,
          debugInfo: result.data
        });
      }
    } catch (error) {
      console.log('Debug endpoint não disponível:', error);
      // Se o debug falhar, assume configuração ok
      setConfigStatus({
        serviceKeyConfigured: true,
        isAdmin: isAdmin,
        debugInfo: null
      });
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get('/admin/users');
      
      if (result.success) {
        setUsers(result.data || []);
      } else {
        setError(result.error || 'Erro ao carregar usuários');
      }
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadAssistants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getAssistants();
      
      if (result.success) {
        setAssistants(result.data || []);
      } else {
        setError(result.error || 'Erro ao carregar assistentes');
      }
    } catch (error: any) {
      console.error('Erro ao carregar assistentes:', error);
      setError('Erro ao carregar assistentes');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get('/admin/subscriptions');
      
      if (result.success) {
        setSubscriptions(result.data || []);
      } else {
        setError(result.error || 'Erro ao carregar assinaturas');
      }
    } catch (error: any) {
      console.error('Erro ao carregar assinaturas:', error);
      setError('Erro ao carregar assinaturas');
    } finally {
      setLoading(false);
    }
  };

  const toggleAssistant = async (assistantId: string, isActive: boolean) => {
    try {
      const result = await apiService.put(`/admin/assistants/${assistantId}`, {
        is_active: !isActive
      });
      
      if (result.success) {
        const updatedAssistants = assistants.map(assistant =>
          assistant.id === assistantId ? { ...assistant, is_active: !isActive } : assistant
        );
        setAssistants(updatedAssistants);
        toast.success(`Assistente ${!isActive ? 'ativado' : 'desativado'} com sucesso!`);
      } else {
        console.error('API Error:', result);
        
        // Handle specific errors
        if (result.error?.includes('Service Role Key')) {
          toast.error('Erro de configuração: Service Role Key não configurada');
          setError('⚠️ Service Role Key não configurada. Verifique o arquivo .env e as variáveis do Vercel.');
        } else if (result.error?.includes('Acesso negado')) {
          toast.error('Acesso negado: Privilégios de administrador necessários');
        } else {
          toast.error(result.error || 'Erro ao atualizar assistente');
        }
      }
    } catch (error: any) {
      console.error('Erro ao atualizar assistente:', error);
      
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Erro de rede: Verifique sua conexão');
      } else {
        toast.error('Erro inesperado ao atualizar assistente');
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar o painel administrativo.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Usuários', icon: '👥' },
    { id: 'assistants', label: 'Assistentes', icon: '🤖' },
    { id: 'assistant-manager', label: 'Gerenciar IAs', icon: '⚙️' },
    { id: 'subscriptions', label: 'Assinaturas', icon: '💳' }
  ];

  const stats = {
    totalUsers: users.length,
    totalAssistants: assistants.length,
    activeAssistants: assistants.filter(a => a.is_active).length,
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'active').length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-4">⚙️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Painel Administrativo
        </h1>
        <p className="text-xl text-gray-600">
          Gerencie usuários, assistentes e assinaturas da plataforma
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 text-lg mr-2">❌</div>
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-neuro-primary text-neuro-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total de Usuários</p>
                      <p className="text-3xl font-bold">{stats.totalUsers}</p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Assistentes Ativos</p>
                      <p className="text-3xl font-bold">{stats.activeAssistants}/{stats.totalAssistants}</p>
                    </div>
                    <div className="text-4xl">🤖</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Assinaturas Ativas</p>
                      <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
                    </div>
                    <div className="text-4xl">💳</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Receita Mensal</p>
                      <p className="text-3xl font-bold">R$ 0</p>
                    </div>
                    <div className="text-4xl">💰</div>
                  </div>
                </div>
              </div>

              {/* Service Role Key Warning */}
              {configStatus && !configStatus.serviceKeyConfigured && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-red-600 text-lg mr-2">🚨</div>
                    <div>
                      <h3 className="font-semibold text-red-800">Service Role Key Não Configurada</h3>
                      <p className="text-red-700 text-sm">
                        O painel admin não consegue fazer alterações sem a Service Role Key. 
                        <br />
                        <strong>Siga o guia:</strong> SETUP_ADMIN_COMPLETO.md
                      </p>
                      <div className="mt-2">
                        <button 
                          onClick={() => window.open('https://supabase.com/dashboard/project/avgoyfartmzepdgzhroc/settings/api', '_blank')}
                          className="text-red-600 underline text-sm hover:text-red-800"
                        >
                          Acessar Configurações do Supabase →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="text-yellow-600 text-lg mr-2">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Status da Configuração</h3>
                    <p className="text-yellow-700 text-sm">
                      {configStatus ? (
                        <>
                          <strong>Admin:</strong> {configStatus.isAdmin ? '✅ Ativo' : '❌ Inativo'} • 
                          <strong> Service Key:</strong> {configStatus.serviceKeyConfigured ? '✅ Configurada' : '❌ Não configurada'}
                          <br />
                          <strong>Email:</strong> {user?.email} 
                          {configStatus.debugInfo && (
                            <span className="text-xs block mt-1">
                              Debug disponível no console do navegador (F12)
                            </span>
                          )}
                        </>
                      ) : (
                        'Verificando configuração...'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Usuários Cadastrados</h2>
                <div className="text-sm text-gray-600">{stats.totalUsers} usuários</div>
              </div>

              {loading ? (
                <PageLoader message="Carregando usuários..." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Profissão</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cadastro</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.user_metadata?.name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.user_metadata?.profession || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm">
                            <button className="text-neuro-primary hover:text-neuro-primary-hover">
                              Ver Detalhes
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

          {/* Assistants Tab */}
          {activeTab === 'assistants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Gerenciar Assistentes</h2>
                <div className="text-sm text-gray-600">{stats.activeAssistants}/{stats.totalAssistants} ativos</div>
              </div>

              {loading ? (
                <PageLoader message="Carregando assistentes..." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {assistants.map((assistant) => (
                    <div key={assistant.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: assistant.color_theme }}
                          >
                            <AssistantIcon iconType={assistant.icon} color="white" size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{assistant.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{assistant.description}</p>
                          </div>
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={assistant.is_active}
                            onChange={() => toggleAssistant(assistant.id, assistant.is_active)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neuro-primary"></div>
                        </label>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Mensal:</span>
                          <span className="font-semibold">R$ {assistant.monthly_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Semestral:</span>
                          <span className="font-semibold">R$ {assistant.semester_price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assistant Manager Tab */}
          {activeTab === 'assistant-manager' && <AssistantManager />}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Assinaturas</h2>
                <div className="text-sm text-gray-600">{stats.activeSubscriptions} ativas</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="text-blue-600 text-lg mr-2">ℹ️</div>
                  <div>
                    <h3 className="font-semibold text-blue-800">Funcionalidade em Desenvolvimento</h3>
                    <p className="text-blue-700 text-sm">
                      A gestão de assinaturas será implementada após a integração com o sistema de pagamentos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}