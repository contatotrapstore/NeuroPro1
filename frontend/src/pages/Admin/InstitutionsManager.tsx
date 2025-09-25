import React, { useState, useEffect } from 'react';
import { Building2, Users, Bot, Eye, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/auth';

interface Institution {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  stats: {
    total_users: number;
    total_conversations: number;
    license_status: string;
    license_expires?: string;
  };
}

export const InstitutionsManager: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadInstitutions = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (search) {
        params.append('search', search);
      }

      if (statusFilter !== 'all') {
        params.append('status_filter', statusFilter);
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin-institutions-simple?${params}`, {
        method: 'GET',
        headers
      });

      const result = await response.json();

      if (result.success) {
        setInstitutions(result.data.institutions || []);
        setTotalPages(result.data.pagination?.pages || 1);
        setCurrentPage(page);
      } else {
        toast.error('Erro ao carregar instituições');
      }
    } catch (error) {
      console.error('Error loading institutions:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadInstitutions(1);
      } else {
        setCurrentPage(1);
        loadInstitutions(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, statusFilter]);

  const getStatusBadge = (institution: Institution) => {
    if (!institution.is_active) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Inativa
        </span>
      );
    }

    // Simplified status based on license_status from API
    const status = institution.stats.license_status;

    if (status === 'unlimited') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Ativa (Ilimitada)
        </span>
      );
    }

    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Ativa
      </span>
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      loadInstitutions(newPage);
    }
  };

  const viewInstitution = (institution: Institution) => {
    // Implementar visualização detalhada da instituição
    window.open(`/i/${institution.slug}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Módulo Faculdades
              </h2>
              <p className="text-gray-600 mt-1">
                Gerencie instituições de ensino e suas configurações
              </p>
            </div>

          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Institutions List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando instituições...</p>
            </div>
          ) : institutions.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma instituição encontrada
              </h3>
              <p className="text-gray-600">
                {search || statusFilter !== 'all'
                  ? 'Ajuste os filtros para ver mais resultados'
                  : 'Crie sua primeira instituição para começar'
                }
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instituição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuários
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criada em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {institutions.map((institution) => (
                  <tr key={institution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {institution.logo_url ? (
                          <img
                            src={institution.logo_url}
                            alt={`${institution.name} Logo`}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: institution.primary_color }}
                          >
                            {institution.name.charAt(0)}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {institution.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            /i/{institution.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(institution)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="w-4 h-4 mr-1" />
                        {institution.stats.total_users}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {institution.stats.total_conversations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(institution.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewInstitution(institution)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded mr-2"
                        title="Visualizar instituição"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {institutions.filter(i => i.is_active).length}
              </p>
              <p className="text-sm text-gray-600">Instituições Ativas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {institutions.reduce((sum, i) => sum + i.stats.total_users, 0)}
              </p>
              <p className="text-sm text-gray-600">Total de Usuários</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <Bot className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {institutions.reduce((sum, i) => sum + i.stats.total_conversations, 0)}
              </p>
              <p className="text-sm text-gray-600">Total de Conversas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};