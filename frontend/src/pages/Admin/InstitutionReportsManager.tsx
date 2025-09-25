import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  Users,
  Bot,
  MessageSquare,
  Activity,
  TrendingUp,
  Clock,
  Search,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/auth';

interface Institution {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  logo_url?: string;
  is_active: boolean;
}

interface ReportData {
  institution_id: string;
  institution_name: string;
  institution_slug: string;
  period: string;
  stats: {
    total_users: number;
    active_users: number;
    new_users: number;
    total_conversations: number;
    conversations_growth: number;
    most_used_assistant: string;
    avg_session_duration: number;
    user_retention: number;
    total_sessions: number;
    assistants_usage: Array<{
      name: string;
      usage_count: number;
      percentage: number;
    }>;
    daily_activity: Array<{
      date: string;
      conversations: number;
      active_users: number;
    }>;
    user_activity_distribution: {
      very_active: number; // 10+ conversations
      active: number; // 3-9 conversations
      occasional: number; // 1-2 conversations
      inactive: number; // 0 conversations
    };
  };
  audit_logs: Array<{
    timestamp: string;
    event_type: string;
    user_id: string;
    user_email: string;
    action: string;
    details: string;
    ip_address?: string;
  }>;
}

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';
type ReportType = 'summary' | 'detailed' | 'audit';

export const InstitutionReportsManager: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    setLoading(true);
    console.log('🔄 InstitutionReportsManager: Loading institutions...');

    try {
      const headers = await getAuthHeaders();
      console.log('🔑 Auth headers:', headers);

      const response = await fetch('/api/admin-institutions-simple?action=list', { headers });
      console.log('📡 Response status:', response.status);

      const result = await response.json();
      console.log('📊 Institutions result:', result);

      if (result.success) {
        console.log('✅ Loaded institutions:', result.data.institutions?.length || 0);
        setInstitutions(result.data.institutions || []);
      } else {
        console.error('❌ Failed to load institutions:', result.error);
        toast.error(`Erro ao carregar instituições: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 Error loading institutions:', error);
      toast.error(`Erro ao conectar com o servidor: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('✅ InstitutionReportsManager: Institution loading complete');
    }
  };

  const toggleInstitutionSelection = (institutionId: string) => {
    setSelectedInstitutions(prev =>
      prev.includes(institutionId)
        ? prev.filter(id => id !== institutionId)
        : [...prev, institutionId]
    );
  };

  const selectAllInstitutions = () => {
    const activeInstitutions = institutions.filter(i => i.is_active).map(i => i.id);
    setSelectedInstitutions(activeInstitutions);
  };

  const clearSelection = () => {
    setSelectedInstitutions([]);
  };

  const generateReport = async () => {
    if (selectedInstitutions.length === 0) {
      toast.error('Selecione pelo menos uma instituição');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/reports/institutions', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          institution_ids: selectedInstitutions,
          report_type: reportType,
          period: reportPeriod,
          date_range: dateRange,
          include_audit: reportType === 'audit' || reportType === 'detailed'
        })
      });

      const result = await response.json();

      if (result.success) {
        setReportData(result.data || []);
        toast.success(`Relatório gerado com sucesso para ${selectedInstitutions.length} instituição(ões)`);
      } else {
        toast.error(result.error || 'Erro ao gerar relatório');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format: 'json' | 'csv' | 'pdf') => {
    if (reportData.length === 0) {
      toast.error('Gere um relatório antes de exportar');
      return;
    }

    try {
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          data: reportData,
          format,
          report_type: reportType,
          period: reportPeriod
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-instituicoes-${reportPeriod}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success(`Relatório exportado como ${format.toUpperCase()}`);
      } else {
        toast.error('Erro ao exportar relatório');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(search.toLowerCase()) ||
    inst.slug.toLowerCase().includes(search.toLowerCase())
  );

  const getReportTypeLabel = (type: ReportType) => {
    const labels = {
      summary: 'Resumo Executivo',
      detailed: 'Relatório Detalhado',
      audit: 'Auditoria e Logs'
    };
    return labels[type];
  };

  const getPeriodLabel = (period: ReportPeriod) => {
    const labels = {
      week: 'Última Semana',
      month: 'Último Mês',
      quarter: 'Último Trimestre',
      year: 'Último Ano'
    };
    return labels[period];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Sistema de Relatórios e Auditoria
            </h2>
            <p className="text-gray-600">
              Relatórios detalhados e logs de auditoria por instituição
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadInstitutions}
              disabled={loading}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="summary">Resumo Executivo</option>
              <option value="detailed">Relatório Detalhado</option>
              <option value="audit">Auditoria e Logs</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Último Ano</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Institution Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Selecionar Instituições ({selectedInstitutions.length} selecionadas)
          </h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={selectAllInstitutions}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
            >
              Selecionar Todas
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-50"
            >
              Limpar Seleção
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar instituições..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Institutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredInstitutions.map(institution => (
            <div
              key={institution.id}
              onClick={() => institution.is_active && toggleInstitutionSelection(institution.id)}
              className={`
                p-4 border rounded-lg cursor-pointer transition-all
                ${!institution.is_active ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                ${selectedInstitutions.includes(institution.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
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
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {institution.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    /i/{institution.slug}
                  </p>
                  {!institution.is_active && (
                    <p className="text-xs text-red-500">Inativa</p>
                  )}
                </div>

                {selectedInstitutions.includes(institution.id) && (
                  <div className="ml-2">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredInstitutions.length === 0 && search && (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Nenhuma instituição encontrada para "{search}"
            </p>
          </div>
        )}
      </div>

      {/* Generate Report */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Gerar Relatório
            </h3>
            <p className="text-sm text-gray-600">
              {getReportTypeLabel(reportType)} • {getPeriodLabel(reportPeriod)}
              {selectedInstitutions.length > 0 && ` • ${selectedInstitutions.length} instituição(ões)`}
            </p>
          </div>

          <button
            onClick={generateReport}
            disabled={generating || selectedInstitutions.length === 0}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Gerando...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Resultados do Relatório
              </h3>
              <p className="text-sm text-gray-600">
                {reportData.length} instituição(ões) • Gerado em {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportReport('json')}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-1" />
                JSON
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="flex items-center px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </button>
            </div>
          </div>

          {/* Report Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Usuários</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {reportData.reduce((sum, r) => sum + r.stats.total_users, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <MessageSquare className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Conversas</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.reduce((sum, r) => sum + r.stats.total_conversations, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Bot className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Instituições</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {reportData.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">Avg. Sessões</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {Math.round(reportData.reduce((sum, r) => sum + r.stats.total_sessions, 0) / reportData.length)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Institution Reports */}
          <div className="space-y-6">
            {reportData.map((report, index) => (
              <div key={report.institution_id} className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {report.institution_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    /{report.institution_slug} • Período: {report.period}
                  </p>
                </div>

                <div className="p-4">
                  {reportType === 'summary' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{report.stats.total_users}</p>
                        <p className="text-sm text-gray-600">Usuários Totais</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{report.stats.active_users}</p>
                        <p className="text-sm text-gray-600">Usuários Ativos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{report.stats.total_conversations}</p>
                        <p className="text-sm text-gray-600">Conversas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{report.stats.avg_session_duration}min</p>
                        <p className="text-sm text-gray-600">Duração Média</p>
                      </div>
                    </div>
                  )}

                  {reportType === 'audit' && (
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-900">Logs de Auditoria Recentes</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhes</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {report.audit_logs.slice(0, 5).map((log, logIndex) => (
                              <tr key={logIndex}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {log.user_email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {log.action}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {log.details}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {reportData.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">
                Como usar o Sistema de Relatórios
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Resumo Executivo:</strong> Métricas principais e KPIs essenciais</li>
                <li>• <strong>Relatório Detalhado:</strong> Análise completa com gráficos e tendências</li>
                <li>• <strong>Auditoria e Logs:</strong> Histórico de ações e eventos do sistema</li>
                <li>• Selecione as instituições desejadas e configure o período</li>
                <li>• Exporte os resultados em JSON, CSV ou PDF</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};