-- Criar tabela de instituições para sistema multi-tenant
-- Data: 2025-01-24
-- Descrição: Sistema de faculdades/instituições começando com Academia Brasileira de Psicanálise (ABPSI)

CREATE TABLE public.institutions (
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

-- Criar índices para performance
CREATE INDEX idx_institutions_slug ON public.institutions(slug);
CREATE INDEX idx_institutions_is_active ON public.institutions(is_active);
CREATE INDEX idx_institutions_created_at ON public.institutions(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_institutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_institutions_updated_at
    BEFORE UPDATE ON public.institutions
    FOR EACH ROW
    EXECUTE FUNCTION update_institutions_updated_at();

-- Permissões
GRANT SELECT ON public.institutions TO anon;
GRANT SELECT ON public.institutions TO authenticated;
GRANT ALL PRIVILEGES ON public.institutions TO service_role;

-- Comentários para documentação
COMMENT ON TABLE public.institutions IS 'Tabela de instituições para sistema multi-tenant';
COMMENT ON COLUMN public.institutions.slug IS 'URL slug único para identificar a instituição (ex: abpsi)';
COMMENT ON COLUMN public.institutions.name IS 'Nome completo da instituição';
COMMENT ON COLUMN public.institutions.logo_url IS 'URL do logo da instituição para branding';
COMMENT ON COLUMN public.institutions.primary_color IS 'Cor primária da instituição em hexadecimal';
COMMENT ON COLUMN public.institutions.settings IS 'Configurações específicas da instituição em JSON';
COMMENT ON COLUMN public.institutions.max_users IS 'Limite máximo de usuários (NULL = ilimitado)';