import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';

interface FileAttachment {
  file_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  openai_file_id: string;
  direction?: 'upload' | 'download';
}

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.doc', '.docx', '.csv', '.json'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function MessageInput() {
  const { state, sendMessage, uploadFile } = useChat();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedAttachment, setUploadedAttachment] = useState<FileAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setUploadError(null);

    // Validate file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(`Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Arquivo muito grande. Tamanho máximo: 20MB');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const attachment = await uploadFile(file);
      if (attachment) {
        setUploadedAttachment(attachment);
      } else {
        setUploadError('Erro ao fazer upload do arquivo');
        setSelectedFile(null);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao fazer upload');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedAttachment(null);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!message.trim() && !uploadedAttachment) || state.isTyping || isUploading) {
      return;
    }

    const messageToSend = message.trim();
    const attachmentsToSend = uploadedAttachment ? [uploadedAttachment] : undefined;

    setMessage('');
    setSelectedFile(null);
    setUploadedAttachment(null);
    setUploadError(null);

    await sendMessage(messageToSend || 'Analise este arquivo.', attachmentsToSend);
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

  const isDisabled = state.isTyping || state.isTransitioning || !state.currentConversation || isUploading;

  return (
    <div className="w-full">
      {/* File Preview */}
      {(selectedFile || uploadError) && (
        <div className="mb-3">
          {uploadError ? (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : selectedFile && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                {/* File Icon */}
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                    {isUploading && (
                      <span className="ml-2 text-blue-600">
                        Enviando...
                      </span>
                    )}
                    {uploadedAttachment && (
                      <span className="ml-2 text-green-600">
                        Pronto
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-start space-x-3">
        {/* File Upload Button */}
        <div className="flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isDisabled}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || !!selectedFile}
            className="h-12 w-12 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            title="Anexar arquivo (PDF, TXT, MD, DOC, DOCX, CSV, JSON)"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              state.isTransitioning
                ? 'Carregando conversa...'
                : isUploading
                ? 'Enviando arquivo...'
                : isDisabled
                ? 'Aguarde...'
                : selectedFile
                ? 'Adicione uma mensagem sobre o arquivo ou pressione Enter para enviar...'
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
          disabled={isDisabled || (!message.trim() && !uploadedAttachment)}
          className="h-12 w-12 mt-0 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0 flex items-center justify-center"
          style={{ marginTop: '0px' }}
        >
          {state.isTyping || isUploading ? (
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
          <span className="text-blue-500">Clique no clipe para anexar arquivos</span>
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
