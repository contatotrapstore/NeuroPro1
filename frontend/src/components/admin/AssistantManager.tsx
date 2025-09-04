import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  MessageSquare
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import type { AdminAssistant } from '../../services/admin.service';
import { AssistantIcon } from '../ui/AssistantIcon';

export default function AssistantManager() {
  const [assistants, setAssistants] = useState<AdminAssistant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    setLoading(true);
    try {
      const result = await adminService.getAssistants();
      if (result.success && result.data) {
        setAssistants(result.data);
      }
    } catch (error) {
      console.error('Error loading assistants:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando assistentes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Assistentes de IA</h2>
          <span className="text-sm text-gray-500">
            {assistants.filter(a => a.is_active).length} de {assistants.length} ativos
          </span>
        </div>
      </div>

      {/* Lista de assistentes */}
      <div className="grid gap-4">
        {assistants.map((assistant) => (
          <div
            key={assistant.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all"
          >
            <div className="p-6">
              {/* Cabeçalho do card */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <AssistantIcon iconType={assistant.icon} className="w-12 h-12" />
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{assistant.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        assistant.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {assistant.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="mb-4">
                <p className="text-gray-600 text-sm">{assistant.description}</p>
              </div>

              {/* Preços */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500">Preço Mensal</label>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(assistant.monthly_price)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500">Preço Semestral</label>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(assistant.semester_price)}
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              {assistant.stats && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {assistant.stats.activeSubscriptions}
                      </div>
                      <div className="text-xs text-gray-500">Assinantes</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(assistant.stats.monthlyRevenue)}
                      </div>
                      <div className="text-xs text-gray-500">Receita/mês</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {assistant.stats.recentConversations}
                      </div>
                      <div className="text-xs text-gray-500">Conversas/mês</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}