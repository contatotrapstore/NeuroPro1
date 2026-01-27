-- Create error_logs table for monitoring system errors
-- Date: 2025-10-22
-- Descrição: Tabela para armazenar logs de erros para diagnóstico e monitoramento

CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL, -- 'openai', 'asaas', 'supabase', etc.
    error_type VARCHAR(100), -- error code or category
    error_message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    assistant_id VARCHAR(50) REFERENCES public.assistants(id) ON DELETE SET NULL,
    metadata JSONB, -- additional error details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_error_logs_service ON public.error_logs(service);
CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_service_created ON public.error_logs(service, created_at DESC);

-- RLS (Row Level Security) - Only admins can view error logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Política: Service role (backend) pode inserir
CREATE POLICY "Service role can insert error logs" ON public.error_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Política: Apenas admins podem ver logs (via service_role queries)
CREATE POLICY "Service role can view all error logs" ON public.error_logs
    FOR SELECT
    TO service_role
    USING (true);

-- Permissões
GRANT INSERT ON public.error_logs TO service_role;
GRANT SELECT ON public.error_logs TO service_role;

-- Função para limpar logs antigos (manter apenas últimos 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.error_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE public.error_logs IS 'Logs de erros do sistema para diagnóstico e monitoramento';
COMMENT ON COLUMN public.error_logs.service IS 'Serviço que gerou o erro (openai, asaas, supabase, etc.)';
COMMENT ON COLUMN public.error_logs.error_type IS 'Tipo ou código do erro';
COMMENT ON COLUMN public.error_logs.metadata IS 'Detalhes adicionais do erro em formato JSON';
COMMENT ON FUNCTION cleanup_old_error_logs() IS 'Remove logs de erro com mais de 30 dias';

-- Log da migração
DO $$
BEGIN
    RAISE NOTICE 'Migration 028: Tabela error_logs criada com sucesso';
    RAISE NOTICE '  - Índices criados para performance';
    RAISE NOTICE '  - RLS habilitado (apenas service_role)';
    RAISE NOTICE '  - Função cleanup_old_error_logs() disponível';
END $$;
