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
        className="px-4 py-3 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: primaryColor }}
      >
        <Icon name="send" className="w-4 h-4" />
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
    loading: institutionLoading
  } = useInstitution();

  // Estados do chat
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAssistantSelector, setShowAssistantSelector] = useState(false);

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

  const createNewSession = useCallback(async (selectedAssistantId?: string) => {
    const targetAssistant = selectedAssistantId
      ? availableAssistants.find(a => a.id === selectedAssistantId)
      : currentAssistant;

    if (!targetAssistant) return;

    const isTargetSimulator = targetAssistant.id === 'asst_9vDTodTAQIJV1mu2xPzXpBs8';
    const sessionTitle = isTargetSimulator
      ? 'Nova Sessão de Psicanálise'
      : `Nova Conversa - ${targetAssistant.name}`;

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

  const sendMessage = async () => {
    if (!message.trim() || !currentSession || isLoading || !currentAssistant) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    // Adicionar mensagem do usuário
    const updatedSessionWithUser = currentSession ? {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updated_at: new Date()
    } : null;

    setCurrentSession(updatedSessionWithUser);

    // Update the session in the sessions array
    if (updatedSessionWithUser) {
      setSessions(prev => prev.map(s =>
        s.id === updatedSessionWithUser.id ? updatedSessionWithUser : s
      ));
    }

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

      const updatedSessionWithAssistant = currentSession ? {
        ...currentSession,
        messages: [...currentSession.messages, assistantMessage],
        updated_at: new Date()
      } : null;

      setCurrentSession(updatedSessionWithAssistant);

      // Update the session in the sessions array
      if (updatedSessionWithAssistant) {
        setSessions(prev => prev.map(s =>
          s.id === updatedSessionWithAssistant.id ? updatedSessionWithAssistant : s
        ));
      }

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
                onClick={() => setShowAssistantSelector(true)}
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
                  <button
                    key={session.id}
                    onClick={() => setCurrentSession(session)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      isActive
                        ? "text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    style={isActive ? { backgroundColor: institution.primary_color } : {}}
                  >
                    <div className="flex items-center space-x-3">
                      <AssistantIcon
                        iconType={sessionAssistant?.icon || 'bot'}
                        className="w-8 h-8 flex-shrink-0"
                        color={sessionAssistant?.color_theme || institution.primary_color}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isActive ? "text-white" : "text-gray-900"
                        )}>
                          {session.title}
                        </p>
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