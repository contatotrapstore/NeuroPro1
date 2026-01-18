-- Criar tabela para armazenar referências de arquivos do chat
-- Suporta upload de PDFs pelos usuários e download de PDFs gerados pelos assistentes

CREATE TABLE public.chat_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,

    -- Metadados do arquivo
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,

    -- Referências externas
    openai_file_id VARCHAR(100),
    supabase_path TEXT,

    -- Tipo: 'upload' (usuário enviou) ou 'download' (assistente gerou)
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('upload', 'download')),

    -- Status do processamento
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_chat_files_user_id ON public.chat_files(user_id);
CREATE INDEX idx_chat_files_conversation_id ON public.chat_files(conversation_id);
CREATE INDEX idx_chat_files_message_id ON public.chat_files(message_id);
CREATE INDEX idx_chat_files_openai_file_id ON public.chat_files(openai_file_id);
CREATE INDEX idx_chat_files_created_at ON public.chat_files(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.chat_files ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios arquivos
CREATE POLICY "Users can view own files" ON public.chat_files
    FOR SELECT USING (user_id = auth.uid());

-- Usuários podem inserir seus próprios arquivos
CREATE POLICY "Users can insert own files" ON public.chat_files
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios arquivos
CREATE POLICY "Users can update own files" ON public.chat_files
    FOR UPDATE USING (user_id = auth.uid());

-- Service role tem acesso total (para a API)
CREATE POLICY "Service role full access" ON public.chat_files
    FOR ALL TO service_role USING (true);

-- Permissões
GRANT ALL PRIVILEGES ON public.chat_files TO authenticated;
GRANT ALL PRIVILEGES ON public.chat_files TO service_role;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_chat_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_files_updated_at
    BEFORE UPDATE ON public.chat_files
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_files_updated_at();
