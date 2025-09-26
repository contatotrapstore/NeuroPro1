import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

interface InstitutionUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'subadmin';
  is_active: boolean;
  created_at: string;
  last_access: string | null;
}

export const InstitutionUsersManagement: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { institution, userAccess } = useInstitution();

  const [users, setUsers] = useState<InstitutionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if user can manage users
  const canManageUsers = userAccess?.is_admin && userAccess?.permissions?.manage_users;

  // Fetch users from RPC function
  const fetchUsers = useCallback(async () => {
    if (!slug || !canManageUsers) return;

    setLoading(true);
    try {
      const response = await fetch('/api/institution-rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../../services/supabase')).supabase.auth.getSession().then(r => r.data.session?.access_token)}`
        },
        body: JSON.stringify({
          function_name: 'get_institution_users',
          params: [slug]
        })
      });

      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
      } else {
        toast.error(result.error || 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [slug, canManageUsers]);

  // Approve user
  const approveUser = async (userId: string) => {
    if (!slug || actionLoading) return;

    setActionLoading(userId);
    try {
      const response = await fetch('/api/institution-rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../../services/supabase')).supabase.auth.getSession().then(r => r.data.session?.access_token)}`
        },
        body: JSON.stringify({
          function_name: 'approve_institution_user',
          params: [slug, userId]
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Usuário aprovado com sucesso!');
        // Update local state
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, is_active: true } : u
        ));
      } else {
        toast.error(result.error || 'Erro ao aprovar usuário');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Erro ao aprovar usuário');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject/deactivate user
  const rejectUser = async (userId: string) => {
    if (!slug || actionLoading) return;

    setActionLoading(userId);
    try {
      const response = await fetch('/api/institution-rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../../services/supabase')).supabase.auth.getSession().then(r => r.data.session?.access_token)}`
        },
        body: JSON.stringify({
          function_name: 'reject_institution_user',
          params: [slug, userId]
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Usuário desativado com sucesso!');
        // Update local state
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, is_active: false } : u
        ));
      } else {
        toast.error(result.error || 'Erro ao desativar usuário');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Erro ao desativar usuário');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users
  const filteredUsers = users.filter(user => {
    switch (filter) {
      case 'pending':
        return !user.is_active;
      case 'active':
        return user.is_active;
      case 'inactive':
        return !user.is_active;
      default:
        return true;
    }
  });

  // Get stats
  const stats = {
    total: users.length,
    pending: users.filter(u => !u.is_active).length,
    active: users.filter(u => u.is_active).length,
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Icon name="lock" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h1>
          <p className="text-gray-600">
            Você não tem permissão para gerenciar usuários desta instituição.
          </p>
        </div>
      </div>
    );
  }

  if (!institution) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gerenciar Usuários
              </h1>
              <p className="text-gray-600 mt-1">
                {institution.name}
              </p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Icon name={loading ? "loader" : "refresh"} className={cn("w-4 h-4", loading && "animate-spin")} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Icon name="users" className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aguardando Aprovação</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Icon name="clock" className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Icon name="userCheck" className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Todos', count: stats.total },
                { key: 'pending', label: 'Pendentes', count: stats.pending },
                { key: 'active', label: 'Ativos', count: stats.active }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2",
                    filter === filterOption.key
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  style={filter === filterOption.key ? { backgroundColor: institution.primary_color } : {}}
                >
                  <span>{filterOption.label}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs",
                    filter === filterOption.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-600"
                  )}>
                    {filterOption.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando usuários...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Icon name="users" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-600">
                  {filter === 'pending'
                    ? 'Não há usuários aguardando aprovação.'
                    : filter === 'active'
                    ? 'Não há usuários ativos.'
                    : 'Não há usuários cadastrados.'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastrado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acesso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role === 'student' ? 'Estudante' : user.role === 'teacher' ? 'Professor' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        )}>
                          <Icon
                            name={user.is_active ? "check" : "clock"}
                            className="w-3 h-3 mr-1"
                          />
                          {user.is_active ? 'Ativo' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_access
                          ? new Date(user.last_access).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {!user.is_active && (
                            <button
                              onClick={() => approveUser(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 flex items-center space-x-1"
                            >
                              {actionLoading === user.id ? (
                                <Icon name="loader" className="w-4 h-4 animate-spin" />
                              ) : (
                                <Icon name="check" className="w-4 h-4" />
                              )}
                              <span>Aprovar</span>
                            </button>
                          )}
                          {user.is_active && (
                            <button
                              onClick={() => rejectUser(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1"
                            >
                              {actionLoading === user.id ? (
                                <Icon name="loader" className="w-4 h-4 animate-spin" />
                              ) : (
                                <Icon name="userX" className="w-4 h-4" />
                              )}
                              <span>Desativar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};