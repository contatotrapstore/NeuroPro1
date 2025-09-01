import { useChat } from '../../contexts/ChatContext';
import { useState, memo } from 'react';
import { AssistantIcon } from '../ui/AssistantIcon';
import { ConversationListSkeleton } from '../ui/SkeletonLoader';

interface ConversationItemProps {
  conversation: any;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const ConversationItem = memo(function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const formatDate = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return messageDate.toLocaleDateString('pt-BR', {
        weekday: 'short'
      });
    } else {
      return messageDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja deletar esta conversa?')) {
      onDelete();
    }
    setShowDeleteMenu(false);
  };

  return (
    <div
      className={`group relative p-3 cursor-pointer transition-colors ${
        isActive
          ? 'bg-green-50 border-r-2 border-neuro-primary'
          : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: conversation.assistants?.color_theme || '#10B981' }}
        >
          <AssistantIcon 
            iconType={conversation.assistants?.icon || '🤖'} 
            color="white" 
            size={20} 
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {conversation.title}
            </h3>
            
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">
                {formatDate(conversation.updated_at)}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteMenu(!showDeleteMenu);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 truncate">
            {conversation.assistants?.name || 'Assistente'}
          </p>
        </div>
      </div>

      {/* Delete Menu */}
      {showDeleteMenu && (
        <div className="absolute top-2 right-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <button
            onClick={handleDeleteClick}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            Deletar conversa
          </button>
        </div>
      )}
    </div>
  );
});

export function ConversationList() {
  const { state, selectConversation, deleteConversation } = useChat();

  // Mostrar skeleton durante carregamento
  if (state.isLoading && state.conversations.length === 0) {
    return <ConversationListSkeleton />;
  }

  if (state.conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 text-4xl mb-3">💬</div>
        <p className="text-gray-600 text-sm">
          Nenhuma conversa ainda.
          <br />
          Inicie uma nova conversa para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {state.conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={state.currentConversation?.id === conversation.id}
          onClick={() => selectConversation(conversation.id)}
          onDelete={() => deleteConversation(conversation.id)}
        />
      ))}
    </div>
  );
}