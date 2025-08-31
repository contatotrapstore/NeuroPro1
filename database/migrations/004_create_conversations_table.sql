-- Criar tabela de conversas
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assistant_id VARCHAR(50) NOT NULL REFERENCES public.assistants(id),
    title VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_assistant_id ON public.conversations(assistant_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations" ON public.conversations
    FOR ALL USING (auth.uid() = user_id);

-- Permissões
GRANT ALL PRIVILEGES ON public.conversations TO authenticated;