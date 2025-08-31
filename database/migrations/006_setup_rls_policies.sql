-- Configurar Row Level Security (RLS) para todas as tabelas

-- Habilitar RLS nas tabelas principais
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela assistants (leitura pública)
CREATE POLICY "Assistants are viewable by everyone" ON public.assistants
  FOR SELECT USING (is_active = true);

-- Políticas para a tabela user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Políticas para a tabela user_packages
CREATE POLICY "Users can view their own packages" ON public.user_packages
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own packages" ON public.user_packages
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own packages" ON public.user_packages
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Políticas para a tabela conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
  FOR DELETE USING (auth.uid()::text = user_id);

-- Políticas para a tabela messages
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = messages.conversation_id 
      AND auth.uid()::text = conversations.user_id
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = messages.conversation_id 
      AND auth.uid()::text = conversations.user_id
    )
  );

-- Políticas administrativas (apenas para service_role)
CREATE POLICY "Service role can manage all assistants" ON public.assistants
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all subscriptions" ON public.user_subscriptions
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all packages" ON public.user_packages
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all conversations" ON public.conversations
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all messages" ON public.messages
  FOR ALL USING (current_setting('role') = 'service_role');

-- Índices para melhorar performance das consultas com RLS
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_user_id ON public.user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Comentários para documentação
COMMENT ON POLICY "Assistants are viewable by everyone" ON public.assistants 
IS 'Permite que todos vejam assistentes ativos';

COMMENT ON POLICY "Users can view their own subscriptions" ON public.user_subscriptions 
IS 'Usuários só podem ver suas próprias assinaturas';

COMMENT ON POLICY "Users can view their own packages" ON public.user_packages 
IS 'Usuários só podem ver seus próprios pacotes';

COMMENT ON POLICY "Users can view their own conversations" ON public.conversations 
IS 'Usuários só podem ver suas próprias conversas';

COMMENT ON POLICY "Users can view messages from their conversations" ON public.messages 
IS 'Usuários só podem ver mensagens de suas próprias conversas';