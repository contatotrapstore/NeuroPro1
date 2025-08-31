import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';

export function MessageInput() {
  const { state, sendMessage } = useChat();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || state.isLoading || state.isTyping) {
      return;
    }

    const messageToSend = message.trim();
    setMessage('');
    
    await sendMessage(messageToSend);
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

  const isDisabled = state.isLoading || state.isTyping || !state.currentConversation;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex items-start space-x-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isDisabled 
                ? 'Aguarde...' 
                : 'Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)'
            }
            disabled={isDisabled}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            style={{ maxHeight: '120px', minHeight: '48px' }}
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled || !message.trim()}
          className="h-12 w-12 mt-0 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0 flex items-center justify-center"
          style={{ marginTop: '0px' }}
        >
          {state.isTyping ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>

      {/* Character count and hints */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <div className="flex space-x-4">
          <span>Enter para enviar</span>
          <span>Shift+Enter para quebra de linha</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {message.length > 0 && (
            <span className={message.length > 1000 ? 'text-red-500' : ''}>
              {message.length}/1000
            </span>
          )}
        </div>
      </div>
    </div>
  );
}