import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChatInterface } from '../components/chat/ChatInterface';
import { ChatProvider, useChat } from '../contexts/ChatContext';

function ChatPageContent() {
  const { assistantId } = useParams<{ assistantId: string }>();
  const { createConversation, state } = useChat();
  const [hasTriedToCreate, setHasTriedToCreate] = useState(false);

  useEffect(() => {
    // Se temos um assistantId na URL e não há conversa ativa, criar uma nova conversa
    if (assistantId && !state.currentConversation && !state.isLoading && !hasTriedToCreate) {
      setHasTriedToCreate(true);
      createConversation(assistantId, `Chat com assistente`)
        .then(() => {
          console.log('Conversa criada com sucesso');
        })
        .catch((error) => {
          console.error('Erro ao criar conversa:', error);
          // Permitir tentar novamente após 5 segundos em caso de erro de rede
          setTimeout(() => {
            setHasTriedToCreate(false);
          }, 5000);
        });
    }
  }, [assistantId, state.currentConversation, state.isLoading, hasTriedToCreate]);

  return (
    <div className="h-screen overflow-hidden">
      <ChatInterface />
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
}