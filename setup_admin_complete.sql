-- Script completo para configurar o painel administrativo NeuroIA Lab
-- Execute este script no SQL Editor do Supabase Dashboard

BEGIN;

-- ==================================================
-- 1. MIGRAÇÕES DO BANCO DE DADOS
-- ==================================================

-- Migration 010: Add area field to assistants table
ALTER TABLE public.assistants 
ADD COLUMN IF NOT EXISTS area VARCHAR(20) DEFAULT 'Psicologia';

CREATE INDEX IF NOT EXISTS idx_assistants_area ON public.assistants(area);

UPDATE public.assistants 
SET area = 'Psicopedagogia' 
WHERE id = 'psicopedia' OR name = 'PsicopedIA';

UPDATE public.assistants 
SET area = 'Psicologia' 
WHERE area IS NULL OR (id != 'psicopedia' AND name != 'PsicopedIA');

-- Drop constraint if exists and recreate
ALTER TABLE public.assistants DROP CONSTRAINT IF EXISTS chk_assistants_area;
ALTER TABLE public.assistants 
ADD CONSTRAINT chk_assistants_area 
CHECK (area IN ('Psicologia', 'Psicopedagogia', 'Fonoaudiologia'));

ALTER TABLE public.assistants 
ALTER COLUMN area SET NOT NULL;

-- Migration 011: Enhance assistants table for full admin management
ALTER TABLE public.assistants 
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS icon_type VARCHAR(10) DEFAULT 'svg',
ADD COLUMN IF NOT EXISTS full_description TEXT,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS openai_assistant_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS specialization VARCHAR(100),
ADD COLUMN IF NOT EXISTS subscription_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_conversations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for icon_type if not exists
DO $$ 
BEGIN 
    ALTER TABLE public.assistants ADD CONSTRAINT chk_assistants_icon_type CHECK (icon_type IN ('svg', 'image', 'emoji'));
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assistants_order ON public.assistants(order_index);
CREATE INDEX IF NOT EXISTS idx_assistants_created_by ON public.assistants(created_by);
CREATE INDEX IF NOT EXISTS idx_assistants_updated_at ON public.assistants(updated_at);
CREATE INDEX IF NOT EXISTS idx_assistants_area_active ON public.assistants(area, is_active);
CREATE INDEX IF NOT EXISTS idx_assistants_openai_id ON public.assistants(openai_assistant_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assistants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_assistants_updated_at ON public.assistants;
CREATE TRIGGER trigger_assistants_updated_at
  BEFORE UPDATE ON public.assistants
  FOR EACH ROW
  EXECUTE FUNCTION update_assistants_updated_at();

-- Update existing assistants with proper mapping
UPDATE public.assistants SET openai_assistant_id = id WHERE openai_assistant_id IS NULL;

-- Set order_index for existing assistants
WITH ordered_assistants AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.assistants
  WHERE order_index = 0
)
UPDATE public.assistants 
SET order_index = oa.rn
FROM ordered_assistants oa
WHERE public.assistants.id = oa.id;

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'activate', 'deactivate')),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('assistant', 'user', 'subscription')),
    entity_id VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at);

-- ==================================================
-- 2. CONFIGURAÇÃO DO SUPABASE STORAGE
-- ==================================================

-- Create bucket for assistant icons (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assistant-icons', 
  'assistant-icons', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
) 
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 3. POLÍTICAS DE SEGURANÇA (RLS)
-- ==================================================

-- Grant permissions
GRANT SELECT, UPDATE ON public.assistants TO authenticated;
GRANT ALL PRIVILEGES ON public.assistants TO service_role;
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL PRIVILEGES ON public.admin_audit_log TO service_role;

-- Enable RLS for audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_audit_log_select_policy" ON public.admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_log_insert_policy" ON public.admin_audit_log;

-- Policy: Admins can view all audit logs
CREATE POLICY "admin_audit_log_select_policy" ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'admin@neuroia.lab'
        OR auth.users.user_metadata->>'role' = 'admin'
      )
    )
  );

-- Policy: Only system can insert audit logs
CREATE POLICY "admin_audit_log_insert_policy" ON public.admin_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Storage policies for assistant icons
DROP POLICY IF EXISTS "Admin can upload assistant icons" ON storage.objects;
DROP POLICY IF EXISTS "Public can view assistant icons" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update assistant icons" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete assistant icons" ON storage.objects;

-- Policy: Admin can upload assistant icons
CREATE POLICY "Admin can upload assistant icons" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assistant-icons' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email = 'admin@neuroia.lab' 
    OR raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy: Admin can update assistant icons
CREATE POLICY "Admin can update assistant icons" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'assistant-icons' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email = 'admin@neuroia.lab' 
    OR raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy: Admin can delete assistant icons
CREATE POLICY "Admin can delete assistant icons" ON storage.objects
FOR DELETE USING (
  bucket_id = 'assistant-icons' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email = 'admin@neuroia.lab' 
    OR raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy: Public can view assistant icons
CREATE POLICY "Public can view assistant icons" ON storage.objects
FOR SELECT USING (bucket_id = 'assistant-icons');

-- ==================================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- ==================================================

COMMENT ON COLUMN public.assistants.area IS 'Área de especialização do assistente (Psicologia, Psicopedagogia, Fonoaudiologia)';
COMMENT ON COLUMN public.assistants.icon_url IS 'URL of uploaded custom icon image';
COMMENT ON COLUMN public.assistants.icon_type IS 'Type of icon: svg, image, or emoji';
COMMENT ON COLUMN public.assistants.full_description IS 'Detailed description for admin panel';
COMMENT ON COLUMN public.assistants.features IS 'JSON array of assistant features';
COMMENT ON COLUMN public.assistants.order_index IS 'Display order in lists';
COMMENT ON COLUMN public.assistants.created_by IS 'Admin who created this assistant';
COMMENT ON COLUMN public.assistants.updated_by IS 'Admin who last updated this assistant';
COMMENT ON COLUMN public.assistants.openai_assistant_id IS 'OpenAI Assistant API ID';
COMMENT ON COLUMN public.assistants.specialization IS 'Specialization area description';
COMMENT ON COLUMN public.assistants.subscription_count IS 'Number of active subscriptions';
COMMENT ON COLUMN public.assistants.total_conversations IS 'Total number of conversations';
COMMENT ON COLUMN public.assistants.last_used_at IS 'Timestamp of last usage';

COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all administrative actions';

COMMIT;

-- ==================================================
-- VERIFICAÇÕES FINAIS
-- ==================================================

-- Verificar se todas as colunas foram criadas
DO $$
DECLARE
    column_exists INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.columns 
    WHERE table_name = 'assistants' 
    AND column_name IN ('area', 'icon_url', 'icon_type', 'features', 'order_index');
    
    IF column_exists = 5 THEN
        RAISE NOTICE '✅ Todas as colunas da tabela assistants foram criadas com sucesso!';
    ELSE
        RAISE NOTICE '❌ Algumas colunas podem não ter sido criadas. Verifique o log de erros.';
    END IF;
    
    -- Verificar audit log
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.tables 
    WHERE table_name = 'admin_audit_log';
    
    IF column_exists = 1 THEN
        RAISE NOTICE '✅ Tabela admin_audit_log criada com sucesso!';
    ELSE
        RAISE NOTICE '❌ Tabela admin_audit_log não foi criada. Verifique o log de erros.';
    END IF;
    
    -- Verificar bucket
    SELECT COUNT(*) INTO column_exists
    FROM storage.buckets 
    WHERE id = 'assistant-icons';
    
    IF column_exists = 1 THEN
        RAISE NOTICE '✅ Bucket assistant-icons configurado com sucesso!';
    ELSE
        RAISE NOTICE '❌ Bucket assistant-icons não foi criado. Configure manualmente.';
    END IF;
END $$;

-- Mostrar estatísticas finais
SELECT 
    'assistants' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN area = 'Psicologia' THEN 1 END) as psicologia,
    COUNT(CASE WHEN area = 'Psicopedagogia' THEN 1 END) as psicopedagogia,
    COUNT(CASE WHEN area = 'Fonoaudiologia' THEN 1 END) as fonoaudiologia
FROM public.assistants;

RAISE NOTICE '🎉 Setup do painel administrativo concluído com sucesso!';
RAISE NOTICE '📝 Próximos passos:';
RAISE NOTICE '1. Configure as variáveis de ambiente no frontend';
RAISE NOTICE '2. Faça login com admin@neuroia.lab';
RAISE NOTICE '3. Acesse /admin -> Gerenciar IAs';
RAISE NOTICE '4. Teste upload de ícones e criação de assistentes';