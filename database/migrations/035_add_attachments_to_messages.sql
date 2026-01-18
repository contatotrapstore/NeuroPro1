-- Adicionar coluna attachments à tabela messages
-- Formato: [{ file_id: "uuid", file_name: "doc.pdf", openai_file_id: "file-xxx", direction: "upload"|"download" }]

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachments JSONB;

-- Índice para buscar mensagens com anexos
CREATE INDEX IF NOT EXISTS idx_messages_has_attachments
    ON public.messages ((attachments IS NOT NULL));

-- Índice GIN para buscar dentro do JSONB (se necessário)
CREATE INDEX IF NOT EXISTS idx_messages_attachments_gin
    ON public.messages USING GIN (attachments);

-- Comentário para documentação
COMMENT ON COLUMN public.messages.attachments IS 'Array de arquivos anexados à mensagem. Formato: [{ file_id, file_name, file_type, file_size, openai_file_id, direction, download_url }]';
