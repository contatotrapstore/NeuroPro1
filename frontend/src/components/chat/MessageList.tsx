import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { AssistantIcon } from '../ui/AssistantIcon';
import { ApiService } from '../../services/api.service';

interface FileAttachment {
  file_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  openai_file_id: string;
  direction?: 'upload' | 'download';
  download_url?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('word') || fileType.includes('doc')) return 'doc';
  if (fileType.includes('text') || fileType.includes('txt') || fileType.includes('md')) return 'txt';
  if (fileType.includes('csv') || fileType.includes('spreadsheet')) return 'csv';
  if (fileType.includes('json')) return 'json';
  return 'file';
}

interface FileAttachmentDisplayProps {
  attachment: FileAttachment;
  isUserMessage: boolean;
}

function FileAttachmentDisplay({ attachment, isUserMessage }: FileAttachmentDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!attachment.openai_file_id) return;

    setIsDownloading(true);
    try {
      const apiService = ApiService.getInstance();
      const blob = await apiService.downloadChatFile(attachment.openai_file_id);

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const iconType = getFileIcon(attachment.file_type);
  const isDownloadable = attachment.direction === 'download' || attachment.openai_file_id;

  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg mt-2 ${
        isUserMessage ? 'bg-white/20' : 'bg-gray-100'
      }`}
    >
      {/* File Icon */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isUserMessage ? 'bg-white/30' : 'bg-blue-100'
        }`}
      >
        {iconType === 'pdf' ? (
          <svg className={`w-6 h-6 ${isUserMessage ? 'text-white' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h1c.55 0 1 .45 1 1s-.45 1-1 1h-1v2H7v-5h1.5c.55 0 1 .45 1 1zm3 0H11v4h-1v-5h2.5c.55 0 1 .45 1 1s-.45 1-1 1zm5 0h-1v1h1v1h-1v2h-1v-5h2v1z"/>
          </svg>
        ) : (
          <svg className={`w-6 h-6 ${isUserMessage ? 'text-white' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
          {attachment.file_name}
        </p>
        <p className={`text-xs ${isUserMessage ? 'text-white/70' : 'text-gray-500'}`}>
          {formatFileSize(attachment.file_size)}
          {attachment.direction === 'upload' && (
            <span className="ml-2">Enviado</span>
          )}
          {attachment.direction === 'download' && (
            <span className="ml-2 text-green-500">Gerado pelo assistente</span>
          )}
        </p>
      </div>

      {/* Download Button */}
      {isDownloadable && (
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`p-2 rounded-lg transition-colors ${
            isUserMessage
              ? 'hover:bg-white/20 text-white'
              : 'hover:bg-gray-200 text-gray-600'
          } ${isDownloading ? 'opacity-50 cursor-wait' : ''}`}
          title="Baixar arquivo"
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: FileAttachment[];
  assistantInfo?: {
    name: string;
    icon: string;
    color_theme: string;
  };
}

function MessageBubble({ role, content, timestamp, attachments, assistantInfo }: MessageBubbleProps) {
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

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((attachment, index) => (
                  <FileAttachmentDisplay
                    key={attachment.file_id || index}
                    attachment={attachment}
                    isUserMessage={isUser}
                  />
                ))}
              </div>
            )}
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
            {assistantInfo?.name || 'Assistente'} esta digitando...
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
      {/* Loading Messages */}
      {state.isLoadingMessages && state.messages.length === 0 && (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neuro-primary"></div>
          </div>
          <p className="text-gray-600">Carregando mensagens...</p>
        </div>
      )}

      {/* Welcome Message */}
      {!state.isLoadingMessages && state.messages.length === 0 && (
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
            Ola! Sou {state.currentConversation.assistants?.name || 'seu assistente'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Como posso te ajudar hoje? Envie uma mensagem para comecarmos nossa conversa.
          </p>
          <p className="text-sm text-blue-500 mt-4">
            Voce pode anexar arquivos (PDF, TXT, MD, DOC, DOCX, CSV, JSON) para eu analisar!
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
          attachments={message.attachments}
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
