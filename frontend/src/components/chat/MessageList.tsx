import { useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { AssistantIcon } from '../ui/AssistantIcon';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  assistantInfo?: {
    name: string;
    icon: string;
    color_theme: string;
  };
}

function MessageBubble({ role, content, timestamp, assistantInfo }: MessageBubbleProps) {
  const isUser = role === 'user';
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
              style={{ backgroundColor: assistantInfo?.color_theme || '#10B981' }}
            >
              <AssistantIcon 
                iconType={assistantInfo?.icon || '🤖'} 
                color="white" 
                size={16} 
              />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`${isUser ? 'mr-2' : 'ml-2'}`}>
          <div
            className={`px-4 py-2 rounded-lg ${
              isUser
                ? 'bg-neuro-primary text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            <div className="text-sm whitespace-pre-wrap break-words">
              {content}
            </div>
          </div>
          
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ assistantInfo }: { assistantInfo?: { name: string; icon: string; color_theme: string } }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-end space-x-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
          style={{ backgroundColor: assistantInfo?.color_theme || '#10B981' }}
        >
          <AssistantIcon 
            iconType={assistantInfo?.icon || '🤖'} 
            color="white" 
            size={16} 
          />
        </div>
        
        <div className="ml-2">
          <div className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            {assistantInfo?.name || 'Assistente'} está digitando...
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageList() {
  const { state } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, state.isTyping]);

  if (!state.currentConversation) {
    return null;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Welcome Message */}
      {state.messages.length === 0 && (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: state.currentConversation.assistants?.color_theme || '#10B981' }}
            >
              <AssistantIcon 
                iconType={state.currentConversation.assistants?.icon || '🤖'} 
                color="white" 
                size={32} 
              />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Olá! Sou {state.currentConversation.assistants?.name || 'seu assistente'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Como posso te ajudar hoje? Envie uma mensagem para começarmos nossa conversa.
          </p>
        </div>
      )}

      {/* Messages */}
      {state.messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.created_at}
          assistantInfo={state.currentConversation?.assistants}
        />
      ))}

      {/* Typing Indicator */}
      {state.isTyping && (
        <TypingIndicator assistantInfo={state.currentConversation?.assistants} />
      )}

      {/* Scroll to bottom reference */}
      <div ref={messagesEndRef} />
    </div>
  );
}