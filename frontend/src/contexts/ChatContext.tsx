import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
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

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
}

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'ADD_CONVERSATION'; payload: Conversation };

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  isTyping: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
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

  // Criar nova conversa
  const createConversation = async (assistantId: string, title?: string): Promise<Conversation | null> => {
    if (!user) return null;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Usuário não autenticado');
      }

      const apiService = ApiService.getInstance();
      const result = await apiService.createConversation(assistantId, title);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conversa');
      }

      dispatch({ type: 'ADD_CONVERSATION', payload: result.data });
      return result.data;

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

  // Selecionar conversa
  const selectConversation = async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Usuário não autenticado');
      }

      // Note: getConversationById method needs to be added to ApiService
      // For now, we'll load all conversations and find the one we need
      const apiService = ApiService.getInstance();
      const result = await apiService.getConversations();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar conversa');
      }

      const conversation = result.data?.find(c => c.id === conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
      await loadMessages(conversationId);

    } catch (error: any) {
      console.error('Erro ao selecionar conversa:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Enviar mensagem
  const sendMessage = async (content: string): Promise<void> => {
    if (!user || !state.currentConversation) return;

    try {
      dispatch({ type: 'SET_TYPING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Adicionar mensagem do usuário otimisticamente
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: state.currentConversation.id,
        role: 'user',
        content,
        created_at: new Date().toISOString()
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Usuário não autenticado');
      }

      const apiService = ApiService.getInstance();
      const result = await apiService.sendMessage(state.currentConversation.id, content);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      // Recarregar mensagens para obter as versões corretas do servidor
      await loadMessages(state.currentConversation.id);

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false });
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
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

      // Note: deleteConversation method needs to be added to ApiService
      // For now, we'll simulate the deletion by just removing from local state
      console.log('TODO: Implement deleteConversation in ApiService for conversation:', conversationId);

      // Recarregar conversas
      await loadConversations();
      
      // Limpar conversa atual se foi deletada
      if (state.currentConversation?.id === conversationId) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: null });
        dispatch({ type: 'SET_MESSAGES', payload: [] });
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