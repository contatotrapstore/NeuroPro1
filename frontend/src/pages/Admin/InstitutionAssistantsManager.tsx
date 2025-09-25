import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bot,
  Settings,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  Save,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Institution {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  logo_url?: string;
  is_active: boolean;
}

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  icon_url?: string;
  color_theme: string;
  area: string;
  is_active: boolean;
  openai_assistant_id?: string;
}

interface InstitutionAssistant {
  id?: string;
  assistant_id: string;
  institution_id: string;
  custom_name?: string;
  custom_description?: string;
  is_enabled: boolean;
  is_default: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  // Dados do assistente
  assistant?: Assistant;
}

export const InstitutionAssistantsManager: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [institutionAssistants, setInstitutionAssistants] = useState<InstitutionAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [search, setSearch] = useState('');

  // Carregamento inicial
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar assistentes da instituição selecionada
  useEffect(() => {
    if (selectedInstitution) {
      loadInstitutionAssistants();
    }
  }, [selectedInstitution]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Carregar instituições
      const institutionsResponse = await fetch('/api/admin-institutions?action=list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb-access-token') || ''}`
        }
      });
      const institutionsData = await institutionsResponse.json();

      // Carregar assistentes disponíveis
      const assistantsResponse = await fetch('/api/admin-assistants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb-access-token') || ''}`
        }
      });
      const assistantsData = await assistantsResponse.json();

      if (institutionsData.success) {
        setInstitutions(institutionsData.data.institutions || []);
      }

      if (assistantsData.success) {
        setAssistants(assistantsData.data || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutionAssistants = async () => {
    if (!selectedInstitution) return;

    try {
      const response = await fetch(`/api/admin-institution-assistants?institution_id=${selectedInstitution.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb-access-token') || ''}`
        }
      });
      const result = await response.json();

      if (result.success) {
        // Combinar dados dos assistentes disponíveis
        const institutionAssistantsList: InstitutionAssistant[] = assistants.map(assistant => {
          const existingConfig = result.data?.find((ia: any) => ia.assistant_id === assistant.id);

          return {
            id: existingConfig?.id,
            assistant_id: assistant.id,
            institution_id: selectedInstitution.id,
            custom_name: existingConfig?.custom_name || '',
            custom_description: existingConfig?.custom_description || '',
            is_enabled: existingConfig?.is_enabled || false,
            is_default: existingConfig?.is_default || false,
            display_order: existingConfig?.display_order || 999,
            assistant: assistant
          };
        });

        // Ordenar por display_order e depois por nome
        institutionAssistantsList.sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
          return (a.assistant?.name || '').localeCompare(b.assistant?.name || '');
        });

        setInstitutionAssistants(institutionAssistantsList);
        setHasChanges(false);
      } else {
        toast.error('Erro ao carregar assistentes da instituição');
      }
    } catch (error) {
      console.error('Error loading institution assistants:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const updateAssistantConfig = (assistantId: string, updates: Partial<InstitutionAssistant>) => {
    setInstitutionAssistants(prev => prev.map(ia =>
      ia.assistant_id === assistantId
        ? { ...ia, ...updates }
        : ia
    ));
    setHasChanges(true);
  };

  const toggleAssistant = (assistantId: string) => {
    updateAssistantConfig(assistantId, {
      is_enabled: !institutionAssistants.find(ia => ia.assistant_id === assistantId)?.is_enabled
    });
  };

  const setAsDefault = (assistantId: string) => {
    setInstitutionAssistants(prev => prev.map(ia => ({
      ...ia,
      is_default: ia.assistant_id === assistantId ? true : false
    })));
    setHasChanges(true);
  };

  const moveAssistant = (assistantId: string, direction: 'up' | 'down') => {
    const currentIndex = institutionAssistants.findIndex(ia => ia.assistant_id === assistantId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= institutionAssistants.length) return;

    const newList = [...institutionAssistants];
    [newList[currentIndex], newList[newIndex]] = [newList[newIndex], newList[currentIndex]];

    // Atualizar display_order
    newList.forEach((ia, index) => {
      ia.display_order = index;
    });

    setInstitutionAssistants(newList);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!selectedInstitution) return;

    setSaving(true);
    try {
      const enabledAssistants = institutionAssistants.filter(ia => ia.is_enabled);

      const response = await fetch(`/api/admin-institution-assistants?institution_id=${selectedInstitution.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-access-token') || ''}`
        },
        body: JSON.stringify({ assistants: enabledAssistants })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Configurações salvas com sucesso!');
        setHasChanges(false);
        await loadInstitutionAssistants(); // Recarregar dados
      } else {
        toast.error(result.error || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    if (selectedInstitution) {
      loadInstitutionAssistants();
    }
  };

  // Filtrar assistentes por busca
  const filteredAssistants = institutionAssistants.filter(ia =>
    ia.assistant?.name.toLowerCase().includes(search.toLowerCase()) ||
    ia.assistant?.description.toLowerCase().includes(search.toLowerCase()) ||
    ia.custom_name?.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = institutionAssistants.filter(ia => ia.is_enabled).length;
  const defaultAssistant = institutionAssistants.find(ia => ia.is_default);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Gestão de IAs por Instituição
        </h2>
        <p className="text-gray-600">
          Configure quais assistentes estão disponíveis para cada instituição
        </p>
      </div>

      {/* Institution Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Selecionar Instituição
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.filter(i => i.is_active).map(institution => (
            <div
              key={institution.id}
              onClick={() => setSelectedInstitution(institution)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
                ${selectedInstitution?.id === institution.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                {institution.logo_url ? (
                  <img
                    src={institution.logo_url}
                    alt={`${institution.name} Logo`}
                    className="h-12 w-12 rounded-lg object-cover mr-3"
                  />
                ) : (
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold mr-3"
                    style={{ backgroundColor: institution.primary_color }}
                  >
                    {institution.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{institution.name}</h4>
                  <p className="text-sm text-gray-600">/i/{institution.slug}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Institution Configuration */}
      {selectedInstitution && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {selectedInstitution.logo_url ? (
                <img
                  src={selectedInstitution.logo_url}
                  alt={`${selectedInstitution.name} Logo`}
                  className="h-10 w-10 rounded-lg object-cover mr-3"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold mr-3"
                  style={{ backgroundColor: selectedInstitution.primary_color }}
                >
                  {selectedInstitution.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedInstitution.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {enabledCount} assistentes habilitados
                  {defaultAssistant && ` • Padrão: ${defaultAssistant.custom_name || defaultAssistant.assistant?.name}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {hasChanges && (
                <>
                  <button
                    onClick={resetChanges}
                    className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar assistentes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Bot className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total</p>
                  <p className="text-xl font-bold text-blue-900">{assistants.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Habilitados</p>
                  <p className="text-xl font-bold text-green-900">{enabledCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Desabilitados</p>
                  <p className="text-xl font-bold text-yellow-900">{assistants.length - enabledCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assistants List */}
          <div className="space-y-4">
            {filteredAssistants.map((ia, index) => (
              <div
                key={ia.assistant_id}
                className={`
                  p-4 border rounded-lg transition-all
                  ${ia.is_enabled
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {/* Assistant Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                      style={{ backgroundColor: ia.assistant?.color_theme }}
                    >
                      <span className="text-white text-lg">
                        {ia.assistant?.icon || '🤖'}
                      </span>
                    </div>

                    {/* Assistant Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {ia.assistant?.name}
                        </h4>
                        <span className={`
                          px-2 py-1 text-xs rounded-full
                          ${ia.assistant?.area === 'Psicologia' ? 'bg-green-100 text-green-800' :
                            ia.assistant?.area === 'Psicopedagogia' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'}
                        `}>
                          {ia.assistant?.area}
                        </span>
                        {ia.is_default && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Padrão
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {ia.assistant?.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Move buttons */}
                    {ia.is_enabled && (
                      <>
                        <button
                          onClick={() => moveAssistant(ia.assistant_id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveAssistant(ia.assistant_id, 'down')}
                          disabled={index === filteredAssistants.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Set as default */}
                    {ia.is_enabled && !ia.is_default && (
                      <button
                        onClick={() => setAsDefault(ia.assistant_id)}
                        className="px-2 py-1 text-xs text-yellow-600 hover:text-yellow-800 border border-yellow-300 rounded"
                        title="Definir como padrão"
                      >
                        Padrão
                      </button>
                    )}

                    {/* Enable/Disable */}
                    <button
                      onClick={() => toggleAssistant(ia.assistant_id)}
                      className={`
                        p-2 rounded-lg transition-colors
                        ${ia.is_enabled
                          ? 'text-red-600 hover:bg-red-100'
                          : 'text-green-600 hover:bg-green-100'
                        }
                      `}
                      title={ia.is_enabled ? 'Desabilitar' : 'Habilitar'}
                    >
                      {ia.is_enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Custom Configuration (only for enabled assistants) */}
                {ia.is_enabled && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome personalizado (opcional)
                        </label>
                        <input
                          type="text"
                          value={ia.custom_name || ''}
                          onChange={(e) => updateAssistantConfig(ia.assistant_id, { custom_name: e.target.value })}
                          placeholder={ia.assistant?.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição personalizada (opcional)
                        </label>
                        <input
                          type="text"
                          value={ia.custom_description || ''}
                          onChange={(e) => updateAssistantConfig(ia.assistant_id, { custom_description: e.target.value })}
                          placeholder={ia.assistant?.description}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredAssistants.length === 0 && search && (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Nenhum assistente encontrado para "{search}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!selectedInstitution && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <Building2 className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">
                Como usar este painel
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Selecione uma instituição para configurar seus assistentes</li>
                <li>• Habilite/desabilite assistentes individualmente</li>
                <li>• Defina um assistente como padrão</li>
                <li>• Personalize nomes e descrições por instituição</li>
                <li>• Organize a ordem de exibição dos assistentes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};