-- ==========================================
-- SCRIPT CORRIGIDO PARA CONFIGURAÇÃO COMPLETA DO SISTEMA ABPSI
-- Sistema de Instituições/Faculdades - NeuroIA Lab
-- Data: 24/01/2025
-- Autor: Claude Code
-- ==========================================

-- IMPORTANTE: Execute este script no Supabase Dashboard > SQL Editor
-- Este script foi corrigido para funcionar com a estrutura real do banco

-- ==========================================
-- PASSO 1: VERIFICAR ESTADO ATUAL
-- ==========================================

SELECT 'Verificando estado atual do banco de dados' as status;

-- Verificar tabelas existentes
SELECT COUNT(*) as total_institution_tables,
       STRING_AGG(table_name, ', ') as existing_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'institution%';

-- =====================================================
-- PASSO 2: CRIAR TODAS AS TABELAS INSTITUCIONAIS
-- =====================================================

-- 2.1 Criar tabela de instituições
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL slug ex: 'abpsi'
    name VARCHAR(255) NOT NULL, -- Nome completo ex: 'Academia Brasileira de Psicanálise'
    logo_url TEXT, -- URL do logo da instituição
    primary_color VARCHAR(7) DEFAULT '#000000', -- Cor primária hex ex: '#c39c49'
    secondary_color VARCHAR(7), -- Cor secundária opcional
    settings JSONB DEFAULT '{}', -- Configurações específicas da instituição
    max_users INTEGER DEFAULT NULL, -- Limite de usuários (NULL = ilimitado)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT institutions_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT institutions_primary_color_format CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT institutions_secondary_color_format CHECK (secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_institutions_slug ON public.institutions(slug);
CREATE INDEX IF NOT EXISTS idx_institutions_is_active ON public.institutions(is_active);
CREATE INDEX IF NOT EXISTS idx_institutions_created_at ON public.institutions(created_at DESC);

-- 2.2 Criar tabela de usuários por instituição
CREATE TABLE IF NOT EXISTS public.institution_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'professor', 'subadmin')),
    registration_number VARCHAR(50),
    department VARCHAR(100),
    semester INTEGER,
    is_active BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(institution_id, user_id),
    CHECK(semester IS NULL OR semester > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_institution_users_institution_id ON public.institution_users(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_users_user_id ON public.institution_users(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_users_role ON public.institution_users(role);
CREATE INDEX IF NOT EXISTS idx_institution_users_is_active ON public.institution_users(is_active);

-- 2.3 Criar tabela de assistentes por instituição
CREATE TABLE IF NOT EXISTS public.institution_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL,
    assistant_id VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    custom_name VARCHAR(100),
    custom_description TEXT,
    display_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(institution_id, assistant_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_institution_assistants_institution_id ON public.institution_assistants(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_assistants_assistant_id ON public.institution_assistants(assistant_id);
CREATE INDEX IF NOT EXISTS idx_institution_assistants_is_enabled ON public.institution_assistants(is_enabled);

-- =====================================================
-- PASSO 3: CONFIGURAR FOREIGN KEYS
-- =====================================================

-- FK para institution_users
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

-- FK para institution_assistants
ALTER TABLE public.institution_assistants
DROP CONSTRAINT IF EXISTS fk_institution_assistants_institution;
ALTER TABLE public.institution_assistants
ADD CONSTRAINT fk_institution_assistants_institution
FOREIGN KEY (institution_id)
REFERENCES public.institutions(id)
ON DELETE CASCADE;

-- =====================================================
-- PASSO 4: CONFIGURAR TRIGGERS
-- =====================================================

-- Trigger para updated_at em institutions
CREATE OR REPLACE FUNCTION update_institutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institutions_updated_at ON public.institutions;
CREATE TRIGGER trigger_institutions_updated_at
    BEFORE UPDATE ON public.institutions
    FOR EACH ROW
    EXECUTE FUNCTION update_institutions_updated_at();

-- Trigger para updated_at em institution_users
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

-- Trigger para updated_at em institution_assistants
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

-- =====================================================
-- PASSO 5: CONFIGURAR RLS POLICIES
-- =====================================================

-- Habilitar RLS nas tabelas institucionais
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_assistants ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- PASSO 6: CONFIGURAR PERMISSÕES
-- =====================================================

-- Permissões para institutions
GRANT SELECT ON public.institutions TO anon;
GRANT SELECT ON public.institutions TO authenticated;
GRANT ALL PRIVILEGES ON public.institutions TO service_role;

-- Permissões para institution_users
GRANT SELECT ON public.institution_users TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_users TO service_role;

-- Permissões para institution_assistants
GRANT SELECT ON public.institution_assistants TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_assistants TO service_role;

-- =====================================================
-- PASSO 7: INSERIR DADOS DA ABPSI
-- =====================================================

-- Inserir Academia Brasileira de Psicanálise
INSERT INTO public.institutions (
    slug,
    name,
    logo_url,
    primary_color,
    secondary_color,
    settings,
    max_users,
    is_active
) VALUES (
    'abpsi',
    'Academia Brasileira de Psicanálise',
    '/assets/institutions/abpsi/logo.png',
    '#c39c49',
    '#8b6914',
    '{
        "welcome_message": "Bem-vindo à Academia Brasileira de Psicanálise",
        "subtitle": "Formação, Supervisão e Prática Psicanalítica",
        "features": [
            "psychoanalysis_simulator",
            "unlimited_sessions",
            "specialized_content"
        ],
        "theme": {
            "font_family": "Inter, system-ui, sans-serif",
            "border_radius": "8px",
            "gradient": "linear-gradient(135deg, #c39c49 0%, #8b6914 100%)"
        },
        "contact": {
            "email": "contato@abpsi.org.br",
            "phone": "+55 11 9999-9999",
            "website": "https://abpsi.org.br"
        }
    }',
    NULL,
    true
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Configurar APENAS o Simulador de Psicanálise para ABPSI
INSERT INTO public.institution_assistants (
    institution_id,
    assistant_id,
    custom_name,
    custom_description,
    is_enabled,
    is_default,
    display_order
) VALUES (
    (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
    'asst_9vDTodTAQIJV1mu2xPzXpBs8', -- Simulador de Psicanálise
    'Simulador de Psicanálise ABPSI',
    'Simulador interativo especializado para prática de sessões psicanalíticas da Academia Brasileira de Psicanálise. Desenvolva suas habilidades terapêuticas em um ambiente seguro e controlado.',
    true,
    true,
    1
) ON CONFLICT (institution_id, assistant_id) DO UPDATE SET
    custom_name = EXCLUDED.custom_name,
    custom_description = EXCLUDED.custom_description,
    is_enabled = EXCLUDED.is_enabled,
    is_default = EXCLUDED.is_default,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- =====================================================
-- PASSO 8: VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'Configuração completa! Verificando dados...' as status;

-- Verificar instituição ABPSI
SELECT
    'INSTITUIÇÃO ABPSI' as verificacao,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ CRIADA COM SUCESSO'
        WHEN COUNT(*) = 0 THEN '❌ NÃO ENCONTRADA'
        ELSE '⚠️ DUPLICADA'
    END as status,
    COUNT(*) as total
FROM public.institutions
WHERE slug = 'abpsi';

-- Verificar assistente configurado
SELECT
    'ASSISTENTE SIMULADOR' as verificacao,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ CONFIGURADO CORRETAMENTE'
        WHEN COUNT(*) = 0 THEN '❌ NÃO CONFIGURADO'
        ELSE '⚠️ DUPLICADO'
    END as status,
    COUNT(*) as total
FROM public.institution_assistants ia
JOIN public.institutions i ON ia.institution_id = i.id
WHERE i.slug = 'abpsi'
  AND ia.assistant_id = 'asst_9vDTodTAQIJV1mu2xPzXpBs8'
  AND ia.is_enabled = true;

-- Verificar RLS policies
SELECT
    'POLICIES RLS' as verificacao,
    COUNT(*) as total_policies
FROM pg_policies
WHERE tablename IN ('institutions', 'institution_users', 'institution_assistants');

-- Status final
SELECT
    '🎉 SISTEMA ABPSI PRONTO!' as resultado,
    'Execute o próximo script para criar usuário de teste' as proximo_passo;

-- ==========================================
-- FIM DO SCRIPT
-- INSTRUÇÕES FINAIS:
--
-- 1. Execute este script completo no Supabase Dashboard
-- 2. Verifique se todos os status mostram ✅
-- 3. Execute o próximo script para criar usuário de teste
-- 4. Teste o acesso em: http://localhost:3000/i/abpsi
-- ==========================================