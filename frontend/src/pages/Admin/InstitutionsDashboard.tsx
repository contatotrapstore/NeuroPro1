import React, { useState, useEffect } from 'react';
import { Building2, Users, Bot, TrendingUp, Calendar, BarChart3, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  overview: {
    total_institutions: number;
    active_institutions: number;
    inactive_institutions: number;
    total_institutional_users: number;
    newest_institution: string;
  };
  institutions_stats: Array<{
    institution_name: string;
    institution_slug: string;
    total_users: number;
    students: number;
    professors: number;
    admins: number;
  }>;
  top_assistants_by_institution: {
    [key: string]: string[];
  };
  monthly_trends: {
    users_growth: number;
    conversations_growth: number;
    institutions_growth: number;
  };
  activity_metrics: {
    conversations_per_period: Array<{
      period: string;
      count: number;
    }>;
    top_institutions_by_usage: Array<{
      name: string;
      slug: string;
      conversations: number;
      users: number;
    }>;
  };
}

export const InstitutionsDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    loadDashboardStats();
  }, [timeRange]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'dashboard',
        time_range: timeRange
      });

      const response = await fetch(`/api/admin/institutions?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-access-token') || ''}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // Dados simulados expandidos para mostrar o dashboard completo
        const mockStats: DashboardStats = {
          overview: {
            total_institutions: 1,
            active_institutions: 1,
            inactive_institutions: 0,
            total_institutional_users: 1,
            newest_institution: 'Academia Brasileira de Psicanálise'
          },
          institutions_stats: [
            {
              institution_name: 'Academia Brasileira de Psicanálise',
              institution_slug: 'abpsi',
              total_users: 1,
              students: 0,
              professors: 0,
              admins: 1
            }
          ],
          top_assistants_by_institution: {
            'abpsi': [
              'Simulador de Psicanálise ABPSI',
              'Supervisor de Casos Clínicos',
              'Consultor Ético Psicanalítico',
              'Acompanhamento de Análise'
            ]
          },
          monthly_trends: {
            users_growth: 100, // 100% pois é nova
            conversations_growth: 0,
            institutions_growth: 100
          },
          activity_metrics: {
            conversations_per_period: [
              { period: 'Semana 1', count: 0 },
              { period: 'Semana 2', count: 0 },
              { period: 'Semana 3', count: 0 },
              { period: 'Semana 4', count: 0 }
            ],
            top_institutions_by_usage: [
              {
                name: 'Academia Brasileira de Psicanálise',
                slug: 'abpsi',
                conversations: 0,
                users: 1
              }
            ]
          }
        };

        setStats(mockStats);
      } else {
        toast.error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com filtros */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Dashboard de Faculdades
          </h2>
          <p className="text-gray-600 mt-1">
            Visão geral do sistema de instituições
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Período:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="quarter">Últimos 3 Meses</option>
          </select>
        </div>
      </div>

      {/* Cards de Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats.overview.total_institutions}
              </p>
              <p className="text-sm text-gray-600">Total de Instituições</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.overview.active_institutions} ativas, {stats.overview.inactive_institutions} inativas
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats.overview.total_institutional_users}
              </p>
              <p className="text-sm text-gray-600">Usuários Institucionais</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 font-medium">
            +{stats.monthly_trends.users_growth}% este mês
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats.activity_metrics.conversations_per_period.reduce((sum, period) => sum + period.count, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Conversas</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-600 font-medium">
            Período: {timeRange === 'week' ? '7 dias' : timeRange === 'month' ? '30 dias' : '90 dias'}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                +{stats.monthly_trends.institutions_growth}%
              </p>
              <p className="text-sm text-gray-600">Crescimento</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Nova: {stats.overview.newest_institution}
          </div>
        </div>
      </div>

      {/* Estatísticas por Instituição */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Usuários por Instituição */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Usuários por Instituição
          </h3>
          <div className="space-y-4">
            {stats.institutions_stats.map((inst) => (
              <div key={inst.institution_slug} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{inst.institution_name}</h4>
                    <p className="text-sm text-gray-600">/{inst.institution_slug}</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {inst.total_users}
                  </span>
                </div>
                <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                  <span>👨‍🎓 {inst.students} estudantes</span>
                  <span>👨‍🏫 {inst.professors} professores</span>
                  <span>👨‍💼 {inst.admins} admins</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Assistentes por Instituição */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Assistentes por Instituição
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.top_assistants_by_institution).map(([slug, assistants]) => {
              const institution = stats.institutions_stats.find(i => i.institution_slug === slug);
              return (
                <div key={slug} className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {institution?.institution_name}
                  </h4>
                  <div className="space-y-1">
                    {assistants.map((assistant, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <Bot className="w-4 h-4 text-purple-600 mr-2" />
                        <span className="text-gray-700">{assistant}</span>
                        {index === 0 && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gráfico de Atividade */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Atividade no Período
        </h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {stats.activity_metrics.conversations_per_period.map((period, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="bg-blue-500 rounded-t w-full"
                style={{
                  height: `${Math.max(period.count * 10, 4)}px`,
                  minHeight: '4px'
                }}
              ></div>
              <span className="text-xs text-gray-600 mt-2 text-center">
                {period.period}
              </span>
              <span className="text-xs font-medium text-gray-900">
                {period.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking de Instituições */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Ranking de Uso
        </h3>
        <div className="space-y-3">
          {stats.activity_metrics.top_institutions_by_usage.map((inst, index) => (
            <div key={inst.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{inst.name}</h4>
                  <p className="text-sm text-gray-600">/{inst.slug}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{inst.conversations}</p>
                <p className="text-xs text-gray-600">{inst.users} usuários</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};