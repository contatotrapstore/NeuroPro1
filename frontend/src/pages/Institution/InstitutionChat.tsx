import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { cn } from '../../utils/cn';
import {
  Send,
  ArrowLeft,
  Bot,
  User,
  RotateCcw,
  Settings,
  Info,
  Sparkles,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

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

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Encontrar assistente atual
  const currentAssistant = availableAssistants.find(a => a.id === assistantId) ||
                          availableAssistants.find(a => a.is_primary) ||
                          availableAssistants[0];

  // Verificar se é simulador
  const isSimulator = currentAssistant?.id === 'asst_9vDTodTAQIJV1mu2xPzXpBs8';

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!institutionLoading && !user) {
      navigate(`/i/${slug}/login`);
    }
  }, [user, institutionLoading, navigate, slug]);

  // Redirecionar se não tem acesso
  useEffect(() => {
    if (user && institution && !isInstitutionUser && !institutionLoading) {
      navigate(`/i/${slug}/login`);
    }
  }, [user, institution, isInstitutionUser, institutionLoading, navigate, slug]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = async () => {
    if (!currentAssistant) return;

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: isSimulator
        ? 'Nova Sessão de Psicanálise'
        : `Nova Conversa - ${currentAssistant.name}`,
      assistant_id: currentAssistant.id,
      messages: [],
      created_at: new Date()
    };

    // Adicionar mensagem de boas-vindas personalizada
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: isSimulator
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
        : `Olá! Sou o **${currentAssistant.name}** da ABPSI.

${currentAssistant.description}

Como posso ajudá-lo hoje?`,
      timestamp: new Date()
    };

    newSession.messages.push(welcomeMessage);
    setCurrentSession(newSession);
    setSessions(prev => [newSession, ...prev]);
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentSession || isLoading || !currentAssistant) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    // Adicionar mensagem do usuário
    setCurrentSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);

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

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, assistantMessage]
      } : null);

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
    if (currentAssistant && !currentSession && !institutionLoading) {
      createNewSession();
    }
  }, [currentAssistant, institutionLoading]);

  if (institutionLoading || !institution || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" color={institution?.primary_color} />
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/i/${slug}`)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
                style={{
                  backgroundColor: isSimulator ? '#c39c49' : currentAssistant.color_theme + '20'
                }}
              >
                {isSimulator ? (
                  <Play className="w-5 h-5" style={{ color: '#c39c49' }} />
                ) : (
                  <Bot className="w-5 h-5" style={{ color: currentAssistant.color_theme }} />
                )}
              </div>
              <div>
                <h1 className="font-bold text-gray-900">
                  {isSimulator ? 'Simulador de Psicanálise ABPSI' : currentAssistant.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {isSimulator ? 'Ambiente de Treinamento' : 'Assistente Especializado'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={createNewSession}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              title="Nova Sessão"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {isSimulator && (
              <button
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                title="Configurações do Simulador"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {currentSession?.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-3xl rounded-2xl px-4 py-3",
                    msg.role === 'user'
                      ? 'text-white ml-12'
                      : 'bg-white text-gray-900 mr-12 shadow-sm'
                  )}
                  style={msg.role === 'user' ? {
                    backgroundColor: institution.primary_color
                  } : {}}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center mb-2 text-sm text-gray-600">
                      {isSimulator ? (
                        <Play className="w-4 h-4 mr-2" style={{ color: '#c39c49' }} />
                      ) : (
                        <Bot className="w-4 h-4 mr-2" style={{ color: currentAssistant.color_theme }} />
                      )}
                      {isSimulator ? 'Paciente Virtual' : currentAssistant.name}
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    {msg.content.split('\n').map((line, index) => (
                      <p key={index} className={cn(
                        msg.role === 'user' ? 'text-white' : 'text-gray-900',
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
                  <div className={cn(
                    "text-xs mt-2",
                    msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                  )}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-3xl rounded-2xl px-4 py-3 bg-white mr-12 shadow-sm">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    {isSimulator ? (
                      <Play className="w-4 h-4 mr-2" style={{ color: '#c39c49' }} />
                    ) : (
                      <Bot className="w-4 h-4 mr-2" style={{ color: currentAssistant.color_theme }} />
                    )}
                    {isSimulator ? 'Paciente Virtual' : currentAssistant.name}
                  </div>
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-gray-600">
                      {isSimulator ? 'Refletindo...' : 'Pensando...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white px-4 py-4">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isSimulator
                      ? "Digite sua intervenção psicanalítica..."
                      : "Digite sua mensagem..."
                  }
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{
                    '--tw-ring-color': institution.primary_color,
                    minHeight: '48px',
                    maxHeight: '120px'
                  } as React.CSSProperties}
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                  style={{
                    backgroundColor: institution.primary_color,
                    color: 'white'
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isSimulator && (
              <div className="mt-3 text-xs text-gray-500 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                Ambiente de simulação - Suas interações ajudam no desenvolvimento de habilidades psicanalíticas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};