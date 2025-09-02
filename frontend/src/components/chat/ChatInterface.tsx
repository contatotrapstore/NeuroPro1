import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConversationList } from './ConversationList';
import { AssistantSelector } from './AssistantSelector';
import { AssistantIcon } from '../ui/AssistantIcon';
import Logo from '../../assets/Logo.png';

export function ChatInterface() {
  const { state, clearError } = useChat();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAssistantSelector, setShowAssistantSelector] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Lista de Conversas */}
      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
                {state.isLoading && state.conversations.length > 0 && (
                  <div className="w-4 h-4 border-2 border-neuro-primary border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <button
                onClick={() => setShowAssistantSelector(true)}
                className="px-3 py-1.5 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover transition-colors text-sm font-medium"
              >
                Nova Conversa
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ConversationList />
          </div>
        </div>
      )}

      {/* Área Principal do Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Botão Fechar/Abrir Sidebar */}
              {showSidebar ? (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Fechar barra lateral"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Abrir barra lateral"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              
              {state.currentConversation ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: state.currentConversation.assistants?.color_theme || '#2D5A1F' }}>
                    <AssistantIcon 
                      iconType={state.currentConversation.assistants?.icon || '🤖'} 
                      color="white" 
                      size={20} 
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {state.currentConversation.assistants?.name || 'Assistente'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {state.currentConversation.title}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <img 
                    src={Logo} 
                    alt="NeuroIA Lab" 
                    className="w-10 h-10 object-contain" 
                  />
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">NeuroIA Lab</h1>
                    <p className="text-sm text-gray-500">Selecione uma conversa ou inicie uma nova</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botão Voltar - Lado Direito */}
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group flex items-center space-x-2"
              title="Voltar ao Dashboard"
            >
              <svg className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm text-gray-600 group-hover:text-gray-900">Voltar</span>
            </button>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-hidden">
          {state.currentConversation ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <MessageList />
              </div>
              
              <div className="border-t border-gray-200 p-4">
                <MessageInput />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <img 
                    src={Logo} 
                    alt="NeuroIA Lab" 
                    className="w-16 h-16 object-contain" 
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo ao NeuroIA Lab</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Converse com nossos assistentes especializados em psicologia. 
                  Selecione uma conversa existente ou inicie uma nova.
                </p>
                <button
                  onClick={() => setShowAssistantSelector(true)}
                  className="px-6 py-3 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover transition-colors font-medium"
                >
                  Iniciar Nova Conversa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Seleção de Assistente */}
      {showAssistantSelector && (
        <AssistantSelector
          onClose={() => setShowAssistantSelector(false)}
          onSelect={() => setShowAssistantSelector(false)}
        />
      )}

      {/* Loading Overlay - Only for conversation operations */}
      {state.isLoading && state.conversations.length === 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neuro-primary"></div>
            <span className="text-gray-900">Carregando conversas...</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{state.error}</span>
            <button
              onClick={clearError}
              className="ml-4 text-white hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}