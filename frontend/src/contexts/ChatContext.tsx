import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useConversationsCache } from '../hooks/useLocalStorage';
import { ApiService } from '../services/api.service';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
  thread_id: string;
  created_at: string;
  updated_at: string;
  assistants?: {
    name: string;
    icon: string;
    color_theme: string;
  };
}

interface ChatError {
  type?: 'SUBSCRIPTION_EXPIRED' | 'NO_SUBSCRIPTION' | 'GENERIC';
  message: string;
  assistantId?: string;
  subscriptionId?: string;
  daysExpired?: number;
  expiredAt?: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  isTransitioning: boolean;
  error: string | ChatError | null;
  isTyping: boolean;
}

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MESSAGES'; payload: boolean }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | ChatError | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'CLEAR_MESSAGES' };

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isLoadingMessages: false,
  isTransitioning: false,
  error: null,
  isTyping: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_LOADING_MESSAGES':
      return { ...state, isLoadingMessages: action.payload };
    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], isTyping: false, isLoadingMessages: false };
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'ADD_CONVERSATION':
      return { 
        ...state, 
        conversations: [action.payload, ...state.conversations],
        currentConversation: action.payload 
      };
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  createConversation: (assistantId: string, title?: string) => Promise<Conversation | null>;
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();
  const [cache, setCache] = useConversationsCache();
  
  // Refs para cancelamento e debounce
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageAbortControllerRef = useRef<AbortController | null>(null);
  const selectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Criar nova conversa
  const createConversation = async (assistantId: string, title?: string): Promise<Conversation | null> => {
    if (!user) return null;

    try {
      // Cancelar operações pendentes
      cancelPendingOperations();
      
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Limpar mensagens antes de criar nova conversa
      dispatch({ type: 'CLEAR_MESSAGES' });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Usuário não autenticado');
      }

      const apiService = ApiService.getInstance();
      const result = await apiService.createConversation(assistantId, title);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conversa');
      }

      const newConversation = result.data;
      
      // Adicionar conversa à lista e selecionar automaticamente
      dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
      
      // Não há mensagens para carregar ainda, então não fazer chamada desnecessária
      console.log(`✅ Nova conversa criada e selecionada: ${newConversation.title}`);
      
      return newConversation;

    } catch (error: any) {
      console.error('Erro ao criar conversa:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Carregar conversas do usuário
  const loadConversations = async (): Promise<void> => {
    if (!user) return;

    // Carregar cache imediatamente se for do mesmo usuário
    if (cache.userId === user.id && cache.conversations.length > 0) {
      dispatch({ type: 'SET_CONVERSATIONS', payload: cache.conversations });
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Usuário não autenticado');
      }

      const apiService = ApiService.getInstance();
      const result = await apiService.getConversations();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar conversas');
      }

      // Atualizar estado e cache
      dispatch({ type: 'SET_CONVERSATIONS', payload: result.data });
      setCache({
        conversations: result.data,
        lastUpdated: new Date().toISOString(),
        userId: user.id
      });

    } catch (error: any) {
      console.error('Erro ao carregar conversas:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      
      // Se falhou e não temos cache, continuar com estado vazio
      if (cache.userId !== user.id || cache.conversations.length === 0) {
        dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Função para cancelar operações pendentes
  const cancelPendingOperations = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (messageAbortControllerRef.current) {
      messageAbortControllerRef.current.abort();
    }
    if (selectTimeoutRef.current) {
      clearTimeout(selectTimeoutRef.current);
    }
  };

  // Selecionar conversa
  const selectConversation = async (conversationId: string): Promise<void> => {
    if (!user || state.isTransitioning) return;

    // Cancelar timeout anterior
    if (selectTimeoutRef.current) {
      clearTimeout(selectTimeoutRef.current);
    }

    // Se é a mesma conversa, não fazer nada
    if (state.currentConversation?.id === conversationId) return;

    try {
      // Cancelar operações pendentes
      cancelPendingOperations();
      
      dispatch({ type: 'SET_TRANSITIONING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Limpar mensagens imediatamente ao trocar conversa
      dispatch({ type: 'CLEAR_MESSAGES' });

      // Primeiro, tentar encontrar a conversa no estado atual
      let conversation = state.conversations.find(c => c.id === conversationId);
      
      // Se não encontrou na lista atual, tentar recarregar as conversas
      if (!conversation) {
        console.log('Conversa não encontrada no estado atual, recarregando...');
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado' });
          return;
        }

        const apiService = ApiService.getInstance();
        const result = await apiService.getConversations();
        
        if (!result.success) {
          dispatch({ type: 'SET_ERROR', payload: result.error || 'Erro ao carregar conversas' });
          return;
        }

        // Atualizar as conversas no estado
        dispatch({ type: 'SET_CONVERSATIONS', payload: result.data || [] });
        
        // Tentar encontrar a conversa novamente
        conversation = result.data?.find(c => c.id === conversationId);
        
        if (!conversation) {
          dispatch({ type: 'SET_ERROR', payload: 'Conversa não encontrada' });
          return;
        }
      }

      // Selecionar a conversa
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
      
      // Carregar mensagens da conversa com novo AbortController
      abortControllerRef.current = new AbortController();
      await loadMessages(conversationId);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao selecionar conversa:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    } finally {
      dispatch({ type: 'SET_TRANSITIONING', payload: false });
    }
  };

  // Enviar mensagem com validações
  const sendMessage = async (content: string): Promise<void> => {
    // Validações básicas
    if (!user || !state.currentConversation || state.isTransitioning || state.isTyping) {
      return;
    }

    // Salvar referência da conversa atual para validar se mudou durante o processo
    const currentConversationId = state.currentConversation.id;

    try {
      // Cancelar operações de mensagens pendentes
      if (messageAbortControllerRef.current) {
        messageAbortControllerRef.current.abort();
      }

      dispatch({ type: 'SET_TYPING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Adicionar mensagem do usuário otimisticamente
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: currentConversationId,
        role: 'user',
        content,
        created_at: new Date().toISOString()
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se ainda estamos na mesma conversa antes de enviar
      if (state.currentConversation?.id !== currentConversationId) {
        console.log('Conversa mudou durante o envio, cancelando...');
        return;
      }

      // Criar novo AbortController para esta operação
      messageAbortControllerRef.current = new AbortController();

      const apiService = ApiService.getInstance();
      const result = await apiService.sendMessage(currentConversationId, content);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      // Verificar novamente se ainda estamos na mesma conversa
      if (state.currentConversation?.id !== currentConversationId) {
        console.log('Conversa mudou após envio, não atualizando UI...');
        return;
      }

      // Use os dados da resposta da API em vez de recarregar todas as mensagens
      if (result.data) {
        // Remover a mensagem temporária do usuário se existir
        dispatch({ type: 'SET_MESSAGES', payload: state.messages.filter(m => !m.id.startsWith('temp-')) });
        
        // Adicionar as mensagens reais da resposta
        if (result.data.userMessage) {
          dispatch({ type: 'ADD_MESSAGE', payload: result.data.userMessage });
        }
        if (result.data.assistantMessage) {
          dispatch({ type: 'ADD_MESSAGE', payload: result.data.assistantMessage });
        }
      } else {
        // Fallback: recarregar mensagens se não temos dados na resposta
        console.log('Sem dados na resposta, recarregando mensagens...');
        await loadMessages(currentConversationId);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao enviar mensagem:', error);

        // Verificar se é erro de expiração da API
        if (error.response?.status === 403) {
          const errorData = error.response.data;

          if (errorData?.error_code === 'SUBSCRIPTION_EXPIRED') {
            // Erro específico de assinatura expirada
            dispatch({
              type: 'SET_ERROR',
              payload: {
                type: 'SUBSCRIPTION_EXPIRED',
                message: errorData.message,
                assistantId: errorData.assistant_id,
                subscriptionId: errorData.subscription_id,
                daysExpired: errorData.days_expired,
                expiredAt: errorData.expired_at
              }
            });
            return;
          } else if (errorData?.error_code === 'NO_SUBSCRIPTION') {
            // Erro de não ter assinatura
            dispatch({
              type: 'SET_ERROR',
              payload: {
                type: 'NO_SUBSCRIPTION',
                message: errorData.message,
                assistantId: errorData.assistant_id
              }
            });
            return;
          }
        }

        // Erro genérico
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    } finally {
      // Só limpar typing se ainda estamos na mesma conversa
      if (state.currentConversation?.id === currentConversationId) {
        dispatch({ type: 'SET_TYPING', payload: false });
      }
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: true });
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Usuário não autenticado');
      }

      const apiService = ApiService.getInstance();
      const result = await apiService.getMessages(conversationId);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar mensagens');
      }

      dispatch({ type: 'SET_MESSAGES', payload: result.data || [] });

    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: false });
    }
  };

  // Deletar conversa
  const deleteConversation = async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Usuário não autenticado');
      }

      // Chamar API para deletar a conversa
      const apiService = ApiService.getInstance();
      const result = await apiService.deleteConversation(conversationId);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar conversa');
      }

      console.log(`✅ Conversa ${conversationId} deletada com sucesso`);

      // Atualizar estado local imediatamente
      const updatedConversations = state.conversations.filter(c => c.id !== conversationId);
      dispatch({ type: 'SET_CONVERSATIONS', payload: updatedConversations });
      
      // Limpar conversa atual se foi a deletada
      if (state.currentConversation?.id === conversationId) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
        dispatch({ type: 'CLEAR_MESSAGES' });
      }

      // Atualizar cache também
      if (cache.userId === user.id) {
        setCache({
          conversations: updatedConversations,
          lastUpdated: new Date().toISOString(),
          userId: user.id
        });
      }

    } catch (error: any) {
      console.error('Erro ao deletar conversa:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Limpar erro
  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Carregar conversas quando usuário fizer login
  useEffect(() => {
    if (user) {
      // Carregar imediatamente sem delay
      loadConversations();
    } else {
      // Limpar conversas quando usuário sair
      dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    }
  }, [user]);

  const value: ChatContextType = {
    state,
    createConversation,
    loadConversations,
    selectConversation,
    sendMessage,
    loadMessages,
    deleteConversation,
    clearError,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}