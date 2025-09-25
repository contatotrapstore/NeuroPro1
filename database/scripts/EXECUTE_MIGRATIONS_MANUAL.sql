-- ==========================================
-- SCRIPT DE EXECUÇÃO MANUAL DAS MIGRATIONS
-- Sistema de Instituições/Faculdades - NeuroIA Lab
-- Data: 24/01/2025
-- Autor: Claude Code
-- ==========================================

-- IMPORTANTE: Execute este script no Supabase Dashboard > SQL Editor
-- OU use o Supabase CLI: supabase db reset && supabase db push

-- ==========================================
-- PASSO 1: VERIFICAR ESTADO ATUAL
-- ==========================================

SELECT 'Estado atual do banco de dados' as status;

-- Verificar tabelas existentes
SELECT COUNT(*) as total_tables,
       STRING_AGG(table_name, ', ') as tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'institution%';

-- =====================================================
-- MIGRATION 015: Criar tabela de instituições
-- =====================================================

-- Criar tabela de instituições
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#0E1E03',
    secondary_color VARCHAR(7) DEFAULT '#1A3A0F',
    accent_color VARCHAR(7) DEFAULT '#2D5A1F',
    domain VARCHAR(255) UNIQUE,
    custom_message TEXT,
    default_assistant_id VARCHAR(100),
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_institutions_slug ON public.institutions(slug);
CREATE INDEX IF NOT EXISTS idx_institutions_domain ON public.institutions(domain);
CREATE INDEX IF NOT EXISTS idx_institutions_is_active ON public.institutions(is_active);
CREATE INDEX IF NOT EXISTS idx_institutions_created_at ON public.institutions(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_institutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_institutions_updated_at ON public.institutions;
CREATE TRIGGER trigger_institutions_updated_at
    BEFORE UPDATE ON public.institutions
    FOR EACH ROW
    EXECUTE FUNCTION update_institutions_updated_at();

-- Permissões iniciais
GRANT SELECT ON public.institutions TO anon;
GRANT SELECT ON public.institutions TO authenticated;
GRANT ALL PRIVILEGES ON public.institutions TO service_role;

-- =====================================================
-- MIGRATION 016: Criar tabela de usuários institucionais
-- =====================================================

-- Criar tabela de usuários por instituição
CREATE TABLE IF NOT EXISTS public.institution_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'professor', 'subadmin')),
    registration_number VARCHAR(50),
    department VARCHAR(100),
    semester INTEGER,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(institution_id, user_id),
    CHECK(semester IS NULL OR semester > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_institution_users_institution_id ON public.institution_users(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_users_user_id ON public.institution_users(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_users_role ON public.institution_users(role);
CREATE INDEX IF NOT EXISTS idx_institution_users_is_active ON public.institution_users(is_active);

-- Foreign Keys
ALTER TABLE public.institution_users
DROP CONSTRAINT IF EXISTS fk_institution_users_institution;
ALTER TABLE public.institution_users
ADD CONSTRAINT fk_institution_users_institution
FOREIGN KEY (institution_id)
REFERENCES public.institutions(id)
ON DELETE CASCADE;

ALTER TABLE public.institution_users
DROP CONSTRAINT IF EXISTS fk_institution_users_user;
ALTER TABLE public.institution_users
ADD CONSTRAINT fk_institution_users_user
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_institution_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institution_users_updated_at ON public.institution_users;
CREATE TRIGGER trigger_institution_users_updated_at
    BEFORE UPDATE ON public.institution_users
    FOR EACH ROW
    EXECUTE FUNCTION update_institution_users_updated_at();

-- Permissões
GRANT SELECT ON public.institution_users TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_users TO service_role;

-- =====================================================
-- MIGRATION 017: Criar tabela de assistentes por instituição
-- =====================================================

-- Criar tabela de assistentes por instituição
CREATE TABLE IF NOT EXISTS public.institution_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL,
    assistant_id VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    custom_name VARCHAR(100),
    custom_description TEXT,
    display_order INTEGER DEFAULT 0,
    usage_limit INTEGER,
    monthly_usage_limit INTEGER,
    knowledge_base_url TEXT,
    custom_instructions TEXT,
    is_default BOOLEAN DEFAULT false,
    enabled_by UUID,
    enabled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disabled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(institution_id, assistant_id),
    CHECK(usage_limit IS NULL OR usage_limit > 0),
    CHECK(monthly_usage_limit IS NULL OR monthly_usage_limit > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_institution_assistants_institution_id ON public.institution_assistants(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_assistants_assistant_id ON public.institution_assistants(assistant_id);
CREATE INDEX IF NOT EXISTS idx_institution_assistants_is_enabled ON public.institution_assistants(is_enabled);
CREATE INDEX IF NOT EXISTS idx_institution_assistants_is_default ON public.institution_assistants(is_default);

-- Foreign Keys
ALTER TABLE public.institution_assistants
DROP CONSTRAINT IF EXISTS fk_institution_assistants_institution;
ALTER TABLE public.institution_assistants
ADD CONSTRAINT fk_institution_assistants_institution
FOREIGN KEY (institution_id)
REFERENCES public.institutions(id)
ON DELETE CASCADE;

-- Nota: FK para assistants será adicionada após verificar se a tabela existe
-- ALTER TABLE public.institution_assistants
-- ADD CONSTRAINT fk_institution_assistants_assistant
-- FOREIGN KEY (assistant_id)
-- REFERENCES public.assistants(id)
-- ON DELETE CASCADE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_institution_assistants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institution_assistants_updated_at ON public.institution_assistants;
CREATE TRIGGER trigger_institution_assistants_updated_at
    BEFORE UPDATE ON public.institution_assistants
    FOR EACH ROW
    EXECUTE FUNCTION update_institution_assistants_updated_at();

-- Trigger para garantir apenas uma IA padrão por instituição
CREATE OR REPLACE FUNCTION ensure_single_default_assistant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE public.institution_assistants
        SET is_default = false, updated_at = NOW()
        WHERE institution_id = NEW.institution_id
        AND id != NEW.id
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_assistant ON public.institution_assistants;
CREATE TRIGGER trigger_ensure_single_default_assistant
    BEFORE INSERT OR UPDATE ON public.institution_assistants
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_assistant();

-- Permissões
GRANT SELECT ON public.institution_assistants TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_assistants TO service_role;

-- =====================================================
-- MIGRATION 018: Criar tabela de anúncios institucionais
-- =====================================================

-- Criar tabela de anúncios da instituição
CREATE TABLE IF NOT EXISTS public.institution_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL,
    type VARCHAR(20) DEFAULT 'announcement' CHECK (type IN ('announcement', 'news', 'warning', 'maintenance')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    banner_color VARCHAR(7) DEFAULT '#0E1E03',
    position VARCHAR(20) DEFAULT 'top' CHECK (position IN ('top', 'sidebar', 'modal', 'footer')),
    priority INTEGER DEFAULT 1,
    is_pinned BOOLEAN DEFAULT false,
    target_roles TEXT[] DEFAULT '{"student", "professor", "subadmin"}',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_institution_announcements_institution_id ON public.institution_announcements(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_announcements_type ON public.institution_announcements(type);
CREATE INDEX IF NOT EXISTS idx_institution_announcements_published_at ON public.institution_announcements(published_at);
CREATE INDEX IF NOT EXISTS idx_institution_announcements_expires_at ON public.institution_announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_institution_announcements_is_pinned ON public.institution_announcements(is_pinned);

-- Foreign Keys
ALTER TABLE public.institution_announcements
DROP CONSTRAINT IF EXISTS fk_announcements_institution;
ALTER TABLE public.institution_announcements
ADD CONSTRAINT fk_announcements_institution
FOREIGN KEY (institution_id)
REFERENCES public.institutions(id)
ON DELETE CASCADE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_institution_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institution_announcements_updated_at ON public.institution_announcements;
CREATE TRIGGER trigger_institution_announcements_updated_at
    BEFORE UPDATE ON public.institution_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_institution_announcements_updated_at();

-- Permissões
GRANT SELECT ON public.institution_announcements TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_announcements TO service_role;

-- =====================================================
-- MIGRATION 019: Criar tabela de métricas do dashboard
-- =====================================================

-- Criar tabela de métricas do dashboard institucional
CREATE TABLE IF NOT EXISTS public.institution_dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    active_users_today INTEGER DEFAULT 0,
    active_users_week INTEGER DEFAULT 0,
    active_users_month INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    messages_today INTEGER DEFAULT 0,
    messages_week INTEGER DEFAULT 0,
    messages_month INTEGER DEFAULT 0,
    top_assistants JSONB DEFAULT '[]',
    top_users JSONB DEFAULT '[]',
    usage_by_role JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_institution_id ON public.institution_dashboard_metrics(institution_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_last_updated ON public.institution_dashboard_metrics(last_updated);

-- Foreign Key
ALTER TABLE public.institution_dashboard_metrics
DROP CONSTRAINT IF EXISTS fk_metrics_institution;
ALTER TABLE public.institution_dashboard_metrics
ADD CONSTRAINT fk_metrics_institution
FOREIGN KEY (institution_id)
REFERENCES public.institutions(id)
ON DELETE CASCADE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_dashboard_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dashboard_metrics_updated_at ON public.institution_dashboard_metrics;
CREATE TRIGGER trigger_dashboard_metrics_updated_at
    BEFORE UPDATE ON public.institution_dashboard_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_metrics_updated_at();

-- Permissões
GRANT SELECT ON public.institution_dashboard_metrics TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_dashboard_metrics TO service_role;

-- =====================================================
-- MIGRATION 020: Setup RLS policies para instituições
-- =====================================================

-- Habilitar RLS nas tabelas institucionais
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Policies para institutions (acesso público limitado)
DROP POLICY IF EXISTS "Institutions are publicly readable" ON public.institutions;
CREATE POLICY "Institutions are publicly readable"
ON public.institutions FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Policies para institution_users
DROP POLICY IF EXISTS "Users can view their own institution data" ON public.institution_users;
CREATE POLICY "Users can view their own institution data"
ON public.institution_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Subadmins can view all users in their institution" ON public.institution_users;
CREATE POLICY "Subadmins can view all users in their institution"
ON public.institution_users FOR SELECT
TO authenticated
USING (
    institution_id IN (
        SELECT institution_id FROM public.institution_users
        WHERE user_id = auth.uid() AND role = 'subadmin' AND is_active = true
    )
);

-- Policies para institution_assistants
DROP POLICY IF EXISTS "Institution assistants are readable by institution users" ON public.institution_assistants;
CREATE POLICY "Institution assistants are readable by institution users"
ON public.institution_assistants FOR SELECT
TO authenticated
USING (
    institution_id IN (
        SELECT institution_id FROM public.institution_users
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- Policies para institution_announcements
DROP POLICY IF EXISTS "Institution announcements are readable by institution users" ON public.institution_announcements;
CREATE POLICY "Institution announcements are readable by institution users"
ON public.institution_announcements FOR SELECT
TO authenticated
USING (
    institution_id IN (
        SELECT institution_id FROM public.institution_users
        WHERE user_id = auth.uid() AND is_active = true
    )
    AND (expires_at IS NULL OR expires_at > NOW())
    AND published_at <= NOW()
);

-- Policies para institution_dashboard_metrics
DROP POLICY IF EXISTS "Subadmins can view institution metrics" ON public.institution_dashboard_metrics;
CREATE POLICY "Subadmins can view institution metrics"
ON public.institution_dashboard_metrics FOR SELECT
TO authenticated
USING (
    institution_id IN (
        SELECT institution_id FROM public.institution_users
        WHERE user_id = auth.uid() AND role = 'subadmin' AND is_active = true
    )
);

-- =====================================================
-- MIGRATION 022: Adicionar Academia Brasileira de Psicanálise
-- =====================================================

-- Inserir Academia Brasileira de Psicanálise
INSERT INTO public.institutions (
    id,
    name,
    slug,
    logo_url,
    primary_color,
    secondary_color,
    accent_color,
    domain,
    custom_message,
    default_assistant_id,
    contact_email,
    phone,
    address,
    website_url,
    is_active,
    created_at,
    updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'Academia Brasileira de Psicanálise',
    'abpsi',
    '/assets/logos/ABPSI.png',
    '#D8B565',
    '#E6C67A',
    '#F2D68F',
    'abpsi.neuroialab.com.br',
    'Bem-vindo à Academia Brasileira de Psicanálise! Acesse nossos assistentes de IA especializados em psicanálise e desenvolvimento profissional.',
    'asst_9vDTodTAQIJV1mu2xPzXpBs8',
    'contato@abpsi.com.br',
    '(11) 3456-7890',
    'São Paulo - SP',
    'https://abpsi.com.br',
    true,
    now(),
    now()
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    custom_message = EXCLUDED.custom_message,
    contact_email = EXCLUDED.contact_email,
    updated_at = now();

-- Configurar APENAS o Simulador de Psicanálise para ABPSI
INSERT INTO public.institution_assistants (
    institution_id,
    assistant_id,
    is_enabled,
    is_default,
    display_order,
    created_at,
    updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'asst_9vDTodTAQIJV1mu2xPzXpBs8',
    true,
    true,
    1,
    now(),
    now()
) ON CONFLICT (institution_id, assistant_id) DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    is_default = EXCLUDED.is_default,
    display_order = EXCLUDED.display_order,
    updated_at = now();

-- Criar anúncios de boas-vindas
INSERT INTO public.institution_announcements (
    institution_id,
    type,
    title,
    content,
    summary,
    banner_color,
    position,
    priority,
    is_pinned,
    published_at,
    created_at,
    updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'announcement',
    'Bem-vindos à Academia Brasileira de Psicanálise!',
    'Estamos felizes em recebê-los em nossa plataforma digital. Aqui vocês terão acesso aos melhores assistentes de IA especializados em psicanálise para apoiar seus estudos e práticas profissionais.',
    'Plataforma digital da Academia agora disponível com assistentes de IA especializados.',
    '#D8B565',
    'top',
    1,
    true,
    now(),
    now(),
    now()
) ON CONFLICT DO NOTHING;

-- Inserir métricas iniciais
INSERT INTO public.institution_dashboard_metrics (
    institution_id,
    total_users,
    total_conversations,
    total_messages,
    active_users_today,
    last_updated,
    created_at,
    updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    0,
    0,
    0,
    0,
    now(),
    now(),
    now()
) ON CONFLICT (institution_id) DO UPDATE SET
    last_updated = now(),
    updated_at = now();

-- =====================================================
-- FIM DAS MIGRATIONS - SISTEMA INSTITUCIONAL PRONTO
-- =====================================================

-- Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'institution%';