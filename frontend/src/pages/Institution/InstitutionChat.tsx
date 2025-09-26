import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { InstitutionLoadingSpinner } from '../../components/ui/InstitutionLoadingSpinner';
import { AssistantIcon } from '../../components/ui/AssistantIcon';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

// Components internos
interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  assistantInfo?: {
    name: string;
    icon: string;
    color_theme: string;
  };
  institution: any;
}

function MessageBubble({ role, content, timestamp, assistantInfo, institution }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-medium">
              U
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: assistantInfo?.color_theme || institution.primary_color }}
            >
              <AssistantIcon
                iconType={assistantInfo?.icon || 'bot'}
                color="white"
                className="w-4 h-4"
              />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`${isUser ? 'mr-2' : 'ml-2'}`}>
          <div
            className={`px-4 py-2 rounded-2xl ${
              isUser
                ? 'text-white'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
            style={isUser ? { backgroundColor: institution.primary_color } : {}}
          >
            {!isUser && assistantInfo && (
              <p className="text-xs font-medium text-gray-500 mb-1">
                {assistantInfo.name}
              </p>
            )}
            <div className="whitespace-pre-wrap text-sm">
              {content.split('\n').map((line, index) => (
                <p key={index} className={cn(
                  line.startsWith('**') && line.endsWith('**') ? 'font-bold' : '',
                  line.startsWith('---') ? 'border-t pt-2 mt-2 text-xs text-gray-500' : ''
                )}>
                  {line.startsWith('**') && line.endsWith('**') ?
                    line.slice(2, -2) :
                    line
                  }
                </p>
              ))}
            </div>
          </div>
          <p className={`text-xs mt-1 ${isUser ? 'text-right text-gray-500' : 'text-gray-500'}`}>
            {timestamp}
          </p>
        </div>
      </div>
    </div>
  );
}

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  placeholder: string;
  primaryColor: string;
}

function MessageInput({ message, setMessage, onSendMessage, isLoading, placeholder, primaryColor }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔘 MessageInput handleSubmit:', {
      hasMessage: !!message.trim(),
      isLoading,
      onSendMessage: typeof onSendMessage
    });

    if (!message.trim() || isLoading) return;
    onSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-3">
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{
            '--tw-ring-color': primaryColor,
            minHeight: '48px',
            maxHeight: '120px'
          } as React.CSSProperties}
          rows={1}
        />
      </div>
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="px-5 py-3 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        style={{ backgroundColor: primaryColor }}
      >
        <Icon name="send" className="w-5 h-5" />
        <span className="hidden sm:inline">Enviar</span>
      </button>
    </form>
  );
}

interface AssistantSelectorModalProps {
  onClose: () => void;
  onSelect: (assistantId: string) => void;
  assistants: any[];
  institution: any;
}

function AssistantSelectorModal({ onClose, onSelect, assistants, institution }: AssistantSelectorModalProps) {
  const handleSelect = (assistantId: string) => {
    onSelect(assistantId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Selecionar Assistente
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Escolha um assistente para iniciar uma nova conversa
          </p>
        </div>

        <div className="p-6">
          <div className="grid gap-4">
            {assistants.map((assistant) => {
              const isSimulator = assistant.id === 'asst_9vDTodTAQIJV1mu2xPzXpBs8';
              return (
                <button
                  key={assistant.id}
                  onClick={() => handleSelect(assistant.id)}
                  className="flex items-start p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
                >
                  <AssistantIcon
                    iconType={assistant.icon}
                    className="w-12 h-12 mr-4 flex-shrink-0"
                    color={assistant.color_theme || institution.primary_color}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {assistant.name}
                      </h3>
                      {assistant.is_primary && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                          Principal
                        </span>
                      )}
                      {isSimulator && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">
                          Simulador
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {assistant.description}
                    </p>
                  </div>
                  <Icon name="chevron-right" className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NewSessionModalProps {
  onClose: () => void;
  onConfirm: (title: string, assistantId: string) => void;
  assistants: any[];
  selectedAssistantId: string | null;
  institution: any;
}

function NewSessionModal({ onClose, onConfirm, assistants, selectedAssistantId, institution }: NewSessionModalProps) {
  const [customTitle, setCustomTitle] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState(selectedAssistantId || assistants[0]?.id || '');

  const targetAssistant = assistants.find(a => a.id === selectedAssistant);
  const isSimulator = targetAssistant?.id === 'asst_9vDTodTAQIJV1mu2xPzXpBs8';

  // Gerar sugestão automática de nome
  const generateSuggestedTitle = () => {
    if (!targetAssistant) return '';

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    const timeStr = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isSimulator) {
      return `Sessão Psicanálise ${dateStr} ${timeStr}`;
    }
    return `${targetAssistant.name} - ${dateStr} ${timeStr}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = customTitle.trim() || generateSuggestedTitle();
    onConfirm(finalTitle, selectedAssistant);
    onClose();
  };

  const suggestedTitle = generateSuggestedTitle();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Nova Conversa
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Personalize sua nova sessão de chat
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Seleção de Assistente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assistente
              </label>
              <select
                value={selectedAssistant}
                onChange={(e) => setSelectedAssistant(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': institution.primary_color } as React.CSSProperties}
              >
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nome Personalizado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Conversa
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={suggestedTitle}
                maxLength={50}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': institution.primary_color } as React.CSSProperties}
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para usar sugestão automática
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">Preview:</p>
              <div className="flex items-center space-x-2">
                <AssistantIcon
                  iconType={targetAssistant?.icon || 'bot'}
                  className="w-5 h-5"
                  color={targetAssistant?.color_theme || institution.primary_color}
                />
                <span className="font-medium text-gray-900">
                  {customTitle.trim() || suggestedTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
              style={{ backgroundColor: institution.primary_color }}
            >
              Criar Conversa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// DeleteConfirmModal Component
interface DeleteConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
  sessionTitle: string;
  institution: any;
}

function DeleteConfirmModal({ onClose, onConfirm, sessionTitle, institution }: DeleteConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Excluir Conversa
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <Icon name="trash2" className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Tem certeza que deseja excluir esta conversa?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {sessionTitle}
            </p>
            <p className="text-xs text-gray-500">
              Todas as mensagens desta conversa serão perdidas permanentemente
            </p>
          </div>

          {/* Botões */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Sim, Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  assistant_id: string;
  messages: Message[];
  created_at: Date;
  updated_at: Date;
}

export const InstitutionChat: React.FC = () => {
  const { slug, assistantId } = useParams<{ slug: string; assistantId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    institution,
    userAccess,
    availableAssistants,
    isInstitutionUser,
    canAccessAssistants,
    loading: institutionLoading
  } = useInstitution();

  // Estados do chat
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAssistantSelector, setShowAssistantSelector] = useState(false);

  // Novos estados para gerenciamento avançado de sessões
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedAssistantForNew, setSelectedAssistantForNew] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Encontrar assistente atual
  const currentAssistant = availableAssistants.find(a => a.id === assistantId) ||
                          availableAssistants.find(a => a.is_primary) ||
                          availableAssistants[0];

  // Verificar se é simulador
  const isSimulator = currentAssistant?.id === 'asst_9vDTodTAQIJV1mu2xPzXpBs8';

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  // Helper functions for localStorage
  const getStorageKey = () => `institution_chat_${slug}_${user?.id}`;

  const loadSessionsFromStorage = (): ChatSession[] => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      // Convert string dates back to Date objects
      return parsed.map((session: any) => ({
        ...session,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error loading sessions from storage:', error);
      return [];
    }
  };

  const saveSessionsToStorage = (sessionsToSave: ChatSession[]) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(sessionsToSave));
    } catch (error) {
      console.error('Error saving sessions to storage:', error);
    }
  };

  // Load sessions from localStorage on mount
  useEffect(() => {
    if (!user || !slug) return;

    const savedSessions = loadSessionsFromStorage();
    if (savedSessions.length > 0) {
      setSessions(savedSessions);
      console.log(`📦 Loaded ${savedSessions.length} saved sessions for ${slug}`);

      // If there's an assistantId in URL, try to restore that session
      if (assistantId) {
        const existingSession = savedSessions.find(s => s.assistant_id === assistantId);
        if (existingSession) {
          setCurrentSession(existingSession);
          console.log(`🔄 Restored session for assistant ${assistantId}`);
        }
      }
    }
  }, [user, slug, assistantId]);

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (!user || !slug) return;

    if (sessions.length > 0) {
      saveSessionsToStorage(sessions);
      console.log(`💾 Saved ${sessions.length} sessions to storage`);
    }
  }, [sessions, user, slug]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = useCallback(async (selectedAssistantId?: string, customTitle?: string) => {
    const targetAssistant = selectedAssistantId
      ? availableAssistants.find(a => a.id === selectedAssistantId)
      : currentAssistant;

    if (!targetAssistant) return;

    const isTargetSimulator = targetAssistant.id === 'asst_9vDTodTAQIJV1mu2xPzXpBs8';

    // Usar título personalizado se fornecido, caso contrário usar títulos padrão
    let sessionTitle;
    if (customTitle) {
      sessionTitle = customTitle;
    } else {
      sessionTitle = isTargetSimulator
        ? 'Nova Sessão de Psicanálise'
        : `Nova Conversa - ${targetAssistant.name}`;
    }

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: sessionTitle,
      assistant_id: targetAssistant.id,
      messages: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    // Adicionar mensagem de boas-vindas personalizada
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: isTargetSimulator
        ? `Olá! Bem-vindo ao **Simulador de Psicanálise da ABPSI**.

Sou seu paciente virtual e estou aqui para ajudá-lo a praticar suas habilidades psicanalíticas em um ambiente seguro e controlado.

**Como funciona:**
• Você atua como psicanalista em formação
• Eu assumo diferentes perfis de pacientes/analisandos
• Posso simular diferentes estruturas clínicas (neurose, psicose, perversão, etc.)
• Ofereço feedback construtivo sobre sua técnica

**Para começar, você pode:**
• Me perguntar sobre meu histórico
• Iniciar uma sessão com "Conte-me sobre você"
• Solicitar um cenário específico (ex: "Simule uma estrutura obsessiva")

Qual abordagem gostaria de usar hoje?`
        : `Olá! Sou o **${targetAssistant.name}** da ABPSI.

${targetAssistant.description}

Como posso ajudá-lo hoje?`,
      timestamp: new Date()
    };

    newSession.messages.push(welcomeMessage);
    setCurrentSession(newSession);
    setSessions(prev => [newSession, ...prev]);

    // Navegar para a nova conversa se não estamos já nela
    if (selectedAssistantId && selectedAssistantId !== assistantId) {
      navigate(`/i/${slug}/chat/${selectedAssistantId}`);
    }
  }, [availableAssistants, currentAssistant, assistantId, slug, navigate]);

  // Função para excluir uma sessão
  const deleteSession = useCallback((sessionId: string) => {
    // Remover da lista de sessões
    setSessions(prev => {
      const updatedSessions = prev.filter(s => s.id !== sessionId);
      // Salvar no localStorage
      saveSessionsToStorage(updatedSessions);
      return updatedSessions;
    });

    // Se a sessão excluída é a atual, limpar a sessão atual
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      // Navegar para o chat principal (sem assistente específico)
      navigate(`/i/${slug}/chat`);
    }

    // Fechar modais
    setShowDeleteConfirm(false);
    setSessionToDelete(null);

    console.log('🗑️ Sessão excluída:', sessionId);
  }, [currentSession, slug, navigate]);

  // Função para confirmar exclusão de sessão
  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessionToDelete(sessionId);
    setShowDeleteConfirm(true);
  }, []);

  // Handler para criar nova sessão com título personalizado
  const handleCreateNewSession = useCallback((title: string, assistantId: string) => {
    createNewSession(assistantId, title);
    setShowNewSessionModal(false);
    setSelectedAssistantForNew(null);
  }, [createNewSession]);

  // Handler para abrir modal de nova sessão
  const handleOpenNewSessionModal = useCallback((assistantId?: string) => {
    setSelectedAssistantForNew(assistantId || null);
    setShowNewSessionModal(true);
  }, []);

  const sendMessage = async () => {
    if (!message.trim() || !currentSession || isLoading || !currentAssistant) {
      console.log('❌ sendMessage blocked:', {
        hasMessage: !!message.trim(),
        hasSession: !!currentSession,
        isLoading,
        hasAssistant: !!currentAssistant
      });
      return;
    }

    console.log('✅ Sending message:', message.trim());

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    // Adicionar mensagem do usuário de forma mais segura
    const updatedSessionWithUser = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updated_at: new Date()
    };

    setCurrentSession(updatedSessionWithUser);

    // Update the session in the sessions array
    setSessions(prev => prev.map(s =>
      s.id === updatedSessionWithUser.id ? updatedSessionWithUser : s
    ));

    setMessage('');
    setIsLoading(true);

    try {
      // Simular resposta da IA (aqui você integraria com a API real)
      await new Promise(resolve => setTimeout(resolve, 1500));

      let assistantResponse = '';

      if (isSimulator) {
        // Respostas específicas do simulador
        const responses = [
          "Hmm... *pausa longa* É interessante você mencionar isso. Me faz lembrar de quando eu era criança e minha mãe sempre dizia... *hesita*",
          "Eu tenho pensado muito nisso que você falou na última sessão. Na verdade, tenho tido uns sonhos estranhos...",
          "*olha para o lado* Não sei se consigo falar sobre isso hoje. Está muito difícil... Você acha que é importante mesmo?",
          "Doutor, posso te fazer uma pergunta? Você já passou por algo parecido? *transferência*",
          "*resistência* Não vejo como isso vai me ajudar. Já tentei terapia antes e nunca funcionou...",
        ];
        assistantResponse = responses[Math.floor(Math.random() * responses.length)];

        // Adicionar feedback técnico ocasionalmente
        if (Math.random() > 0.7) {
          assistantResponse += "\n\n---\n**💡 Feedback Técnico:** Note a manifestação de resistência/transferência nesta fala. Como você manejaria isso na técnica psicanalítica?";
        }
      } else {
        assistantResponse = `Obrigado pela sua questão sobre "${userMessage.content.substring(0, 50)}${userMessage.content.length > 50 ? '...' : ''}".

Como especialista da ABPSI, posso orientá-lo com base na teoria e prática psicanalítica. Vou elaborar uma resposta detalhada considerando os aspectos técnicos e teóricos relevantes.

*Esta é uma resposta simulada - na implementação real, isso seria processado pela IA especializada.*`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };

      // Usar a sessão atualizada mais recente
      const latestSession = sessions.find(s => s.id === currentSession.id) || currentSession;

      const updatedSessionWithAssistant = {
        ...latestSession,
        messages: [...latestSession.messages, assistantMessage],
        updated_at: new Date()
      };

      setCurrentSession(updatedSessionWithAssistant);

      // Update the session in the sessions array
      setSessions(prev => prev.map(s =>
        s.id === updatedSessionWithAssistant.id ? updatedSessionWithAssistant : s
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Iniciar nova sessão automaticamente se não existir
  useEffect(() => {
    if (currentAssistant && !currentSession && !institutionLoading && assistantId) {
      createNewSession(assistantId);
    }
  }, [currentAssistant, institutionLoading, assistantId, currentSession, createNewSession]);

  if (institutionLoading || !institution || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <InstitutionLoadingSpinner size="lg" institution={institution} />
          <p className="mt-4 text-gray-600">Carregando chat...</p>
        </div>
      </div>
    );
  }

  if (!isInstitutionUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          <button
            onClick={() => navigate(`/i/${slug}/login`)}
            className="px-6 py-3 text-white rounded-lg"
            style={{ backgroundColor: institution.primary_color }}
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user is inactive and cannot access assistants
  if (isInstitutionUser && !canAccessAssistants) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-orange-200">
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: '#f59e0b' }}
            >
              <Icon name="clock" className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Aguardando Aprovação
            </h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Sua conta foi criada com sucesso! No momento, ela está aguardando aprovação do administrador da {institution.name}.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Você receberá um email quando sua conta for ativada. Enquanto isso, você pode explorar outras seções do portal.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/i/${slug}`)}
                className="w-full px-6 py-3 rounded-xl text-white font-semibold transition-all"
                style={{ backgroundColor: institution.primary_color }}
              >
                Voltar ao Dashboard
              </button>
              <p className="text-xs text-gray-400">
                Precisa de ajuda? Entre em contato com o administrador da instituição.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentAssistant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Assistente não encontrado
          </h1>
          <button
            onClick={() => navigate(`/i/${slug}`)}
            className="px-6 py-3 text-white rounded-lg"
            style={{ backgroundColor: institution.primary_color }}
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Lista de Conversas */}
      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
                {isLoading && sessions.length > 0 && (
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                       style={{ borderColor: institution.primary_color }}></div>
                )}
              </div>
              <button
                onClick={() => handleOpenNewSessionModal()}
                className="px-3 py-1.5 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                style={{ backgroundColor: institution.primary_color }}
              >
                Nova Conversa
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Lista de Conversas */}
            <div className="p-2 space-y-1">
              {sessions.map((session) => {
                const sessionAssistant = availableAssistants.find(a => a.id === session.assistant_id);
                const isActive = currentSession?.id === session.id;

                return (
                  <div
                    key={session.id}
                    className={cn(
                      "w-full rounded-lg transition-colors group relative",
                      isActive
                        ? "text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    style={isActive ? { backgroundColor: institution.primary_color } : {}}
                  >
                    <button
                      onClick={() => setCurrentSession(session)}
                      className="w-full text-left p-3 flex-1"
                    >
                      <div className="flex items-center space-x-3">
                        <AssistantIcon
                          iconType={sessionAssistant?.icon || 'bot'}
                          className="w-8 h-8 flex-shrink-0"
                          color={sessionAssistant?.color_theme || institution.primary_color}
                        />
                        <div className="flex-1 min-w-0 pr-8"> {/* Add padding-right for buttons */}
                          {editingSessionId === session.id ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => {
                                // Save the edited title
                                if (editingTitle.trim()) {
                                  setSessions(prev => prev.map(s =>
                                    s.id === session.id
                                      ? { ...s, title: editingTitle.trim() }
                                      : s
                                  ));
                                  saveSessionsToStorage(sessions.map(s =>
                                    s.id === session.id
                                      ? { ...s, title: editingTitle.trim() }
                                      : s
                                  ));
                                }
                                setEditingSessionId(null);
                                setEditingTitle('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                } else if (e.key === 'Escape') {
                                  setEditingSessionId(null);
                                  setEditingTitle('');
                                }
                              }}
                              className="text-sm font-medium bg-transparent border-none outline-none ring-1 ring-white/50 rounded px-1 text-white placeholder-white/70 w-full"
                              autoFocus
                            />
                          ) : (
                            <p className={cn(
                              "text-sm font-medium truncate",
                              isActive ? "text-white" : "text-gray-900"
                            )}>
                              {session.title}
                            </p>
                          )}
                          <p className={cn(
                            "text-xs truncate",
                            isActive ? "text-white/80" : "text-gray-500"
                          )}>
                            {sessionAssistant?.name || 'Assistente'}
                          </p>
                          <p className={cn(
                            "text-xs",
                            isActive ? "text-white/70" : "text-gray-400"
                          )}>
                            {session.updated_at.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Action buttons */}
                    <div className="absolute right-2 top-2 flex space-x-1 opacity-60 hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(session.id);
                          setEditingTitle(session.title);
                        }}
                        className={cn(
                          "p-1.5 rounded hover:bg-black/10 transition-colors",
                          isActive ? "text-white/90 hover:text-white" : "text-gray-600 hover:text-gray-800"
                        )}
                        title="Editar nome"
                      >
                        <Icon name="edit2" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className={cn(
                          "p-1.5 rounded hover:bg-red-500/20 transition-colors",
                          isActive ? "text-white/90 hover:text-red-200" : "text-gray-600 hover:text-red-600"
                        )}
                        title="Excluir conversa"
                      >
                        <Icon name="trash2" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {sessions.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <Icon name="messageSquare" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma conversa ainda</p>
                  <p className="text-xs">Inicie uma nova conversa</p>
                </div>
              )}
            </div>
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
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={showSidebar ? "Fechar barra lateral" : "Abrir barra lateral"}
              >
                <Icon name={showSidebar ? "chevronLeft" : "menu"} className="w-5 h-5" />
              </button>

              {currentSession ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: currentAssistant?.color_theme || institution.primary_color }}>
                    <AssistantIcon
                      iconType={currentAssistant?.icon || 'bot'}
                      color="white"
                      className="w-5 h-5"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {currentAssistant?.name || 'Assistente'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {currentSession.title}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {institution.logo_url ? (
                    <img
                      src={institution.logo_url}
                      alt={institution.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: institution.primary_color }}
                    >
                      <span className="text-white font-bold">
                        {institution.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">{institution.name}</h1>
                    <p className="text-sm text-gray-500">Selecione uma conversa ou inicie uma nova</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botão Voltar */}
            <Link
              to={`/i/${slug}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group flex items-center space-x-2"
              title="Voltar ao Dashboard"
            >
              <Icon name="arrowLeft" className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">Voltar</span>
            </Link>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-hidden">
          {currentSession ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {/* Mensagens */}
                <div className="p-4 space-y-4">
                  {currentSession.messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      timestamp={msg.timestamp.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      assistantInfo={msg.role === 'assistant' ? {
                        name: currentAssistant?.name || 'Assistente',
                        icon: currentAssistant?.icon || 'bot',
                        color_theme: currentAssistant?.color_theme || institution.primary_color
                      } : undefined}
                      institution={institution}
                    />
                  ))}

                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="flex max-w-xs lg:max-w-md items-end space-x-2">
                        <div className="flex-shrink-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: currentAssistant?.color_theme || institution.primary_color }}
                          >
                            <AssistantIcon
                              iconType={currentAssistant?.icon || 'bot'}
                              color="white"
                              className="w-4 h-4"
                            />
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                            <div className="flex items-center space-x-2">
                              <InstitutionLoadingSpinner size="sm" institution={institution} />
                              <span className="text-gray-600 text-sm">
                                {isSimulator ? 'Refletindo...' : 'Pensando...'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-gray-200 p-4">
                <MessageInput
                  message={message}
                  setMessage={setMessage}
                  onSendMessage={sendMessage}
                  isLoading={isLoading}
                  placeholder={
                    isSimulator
                      ? "Digite sua intervenção psicanalítica..."
                      : "Digite sua mensagem..."
                  }
                  primaryColor={institution.primary_color}
                />
                {isSimulator && (
                  <div className="mt-3 text-xs text-gray-500 flex items-center">
                    <Icon name="info" className="w-3 h-3 mr-1" />
                    Ambiente de simulação - Suas interações ajudam no desenvolvimento de habilidades psicanalíticas
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  {institution.logo_url ? (
                    <img
                      src={institution.logo_url}
                      alt={institution.name}
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: institution.primary_color }}
                    >
                      <span className="text-white font-bold text-2xl">
                        {institution.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Bem-vindo ao Chat da {institution.name}
                </h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Converse com nossos assistentes especializados em psicanálise.
                  Selecione uma conversa existente ou inicie uma nova.
                </p>
                <button
                  onClick={() => setShowAssistantSelector(true)}
                  className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
                  style={{ backgroundColor: institution.primary_color }}
                >
                  Iniciar Nova Conversa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova Sessão */}
      {showNewSessionModal && (
        <NewSessionModal
          onClose={() => setShowNewSessionModal(false)}
          onConfirm={handleCreateNewSession}
          assistants={availableAssistants}
          selectedAssistantId={selectedAssistantForNew}
          institution={institution}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && sessionToDelete && (
        <DeleteConfirmModal
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => deleteSession(sessionToDelete)}
          sessionTitle={sessions.find(s => s.id === sessionToDelete)?.title || 'Conversa'}
          institution={institution}
        />
      )}

      {/* Modal de Seleção de Assistente */}
      {showAssistantSelector && (
        <AssistantSelectorModal
          onClose={() => setShowAssistantSelector(false)}
          onSelect={createNewSession}
          assistants={availableAssistants}
          institution={institution}
        />
      )}
    </div>
  );
};