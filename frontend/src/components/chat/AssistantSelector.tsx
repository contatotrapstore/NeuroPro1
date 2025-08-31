import { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { PageLoader } from '../ui/LoadingSpinner';
import { supabase } from '../../services/supabase';
import { AssistantIcon } from '../ui/AssistantIcon';

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  monthly_price: number;
  semester_price: number;
  openai_assistant_id?: string;
}

interface AssistantSelectorProps {
  onClose: () => void;
  onSelect: () => void;
}

export function AssistantSelector({ onClose, onSelect }: AssistantSelectorProps) {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [conversationTitle, setConversationTitle] = useState('');
  
  const { createConversation } = useChat();

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar apenas assistentes que o usuário tem acesso
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/assistants/user`, {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`
        }
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao carregar assistentes');
      }

      // A função do banco já retorna apenas assistentes acessíveis, então não é necessário filtrar
      const accessibleAssistants = result.data || [];
      
      if (accessibleAssistants.length === 0) {
        throw new Error('Você não possui assinaturas ativas. Vá para a loja para assinar assistentes.');
      }

      // Mapear os campos do banco para a interface do componente
      const mappedAssistants = accessibleAssistants.map((assistant: any) => ({
        id: assistant.assistant_id,
        name: assistant.assistant_name,
        description: assistant.assistant_description,
        icon: assistant.assistant_icon,
        color_theme: assistant.assistant_color_theme,
        monthly_price: 39.90, // Preço padrão conforme especificação
        semester_price: 199.00, // Preço padrão conforme especificação
        openai_assistant_id: assistant.openai_assistant_id
      }));

      setAssistants(mappedAssistants);
    } catch (error: any) {
      console.error('Erro ao carregar assistentes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssistantSelect = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setConversationTitle(`Chat com ${assistant.name}`);
  };

  const handleCreateConversation = async () => {
    if (!selectedAssistant) return;

    try {
      setLoading(true);
      
      const conversation = await createConversation(
        selectedAssistant.id,
        conversationTitle.trim() || `Chat com ${selectedAssistant.name}`
      );

      if (conversation) {
        onSelect();
        onClose();
      }
    } catch (error: any) {
      console.error('Erro ao criar conversa:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedAssistant ? 'Confirmar Nova Conversa' : 'Escolher Assistente'}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedAssistant 
                  ? 'Configure os detalhes da sua nova conversa'
                  : 'Selecione um assistente especializado para sua conversa'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <PageLoader message="Carregando assistentes..." />
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadAssistants}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : selectedAssistant ? (
            // Confirmation Step
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: selectedAssistant.color_theme }}
                  >
                    <AssistantIcon 
                      iconType={selectedAssistant.icon} 
                      color="white" 
                      size={32} 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedAssistant.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {selectedAssistant.description}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Conversa
                </label>
                <input
                  type="text"
                  value={conversationTitle}
                  onChange={(e) => setConversationTitle(e.target.value)}
                  placeholder={`Chat com ${selectedAssistant.name}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Este será o nome da sua conversa na lista lateral
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedAssistant(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Voltar
                </button>
                <button
                  onClick={handleCreateConversation}
                  disabled={loading || !conversationTitle.trim()}
                  className="flex-1 px-6 py-3 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Criando...' : 'Iniciar Conversa'}
                </button>
              </div>
            </div>
          ) : (
            // Assistant Selection
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  onClick={() => handleAssistantSelect(assistant)}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-neuro-primary hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: assistant.color_theme }}
                    >
                      <AssistantIcon 
                        iconType={assistant.icon} 
                        color="white" 
                        size={24} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-neuro-primary transition-colors">
                        {assistant.name}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {assistant.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      R$ {assistant.monthly_price.toFixed(2)}/mês
                    </div>
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full group-hover:border-neuro-primary transition-colors flex items-center justify-center">
                      <div className="w-3 h-3 bg-neuro-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}