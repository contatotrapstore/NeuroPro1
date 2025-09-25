-- Criar tabela de assistentes por instituição
-- Autor: Claude Code
-- Data: 2025-01-24
-- Descrição: Define quais assistentes estão disponíveis para cada instituição com customizações

CREATE TABLE public.institution_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    assistant_id VARCHAR(50) NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
    custom_name VARCHAR(255), -- nome personalizado pela instituição
    custom_description TEXT, -- descrição personalizada
    custom_prompt TEXT, -- prompt personalizado para o assistente
    is_simulator BOOLEAN DEFAULT false, -- indica se é um simulador (ex: psicanálise)
    is_primary BOOLEAN DEFAULT false, -- indica se é o assistente principal da instituição
    display_order INTEGER DEFAULT 0, -- ordem de exibição
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}', -- configurações específicas do assistente para a instituição
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(institution_id, assistant_id)
);

-- Criar índices para performance
CREATE INDEX idx_institution_assistants_institution_id ON public.institution_assistants(institution_id);
CREATE INDEX idx_institution_assistants_assistant_id ON public.institution_assistants(assistant_id);
CREATE INDEX idx_institution_assistants_is_active ON public.institution_assistants(is_active);
CREATE INDEX idx_institution_assistants_is_simulator ON public.institution_assistants(is_simulator);
CREATE INDEX idx_institution_assistants_display_order ON public.institution_assistants(display_order);

-- Índice composto para queries frequentes
CREATE INDEX idx_institution_assistants_institution_active ON public.institution_assistants(institution_id, is_active);
CREATE INDEX idx_institution_assistants_institution_order ON public.institution_assistants(institution_id, display_order);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_institution_assistants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_institution_assistants_updated_at
    BEFORE UPDATE ON public.institution_assistants
    FOR EACH ROW
    EXECUTE FUNCTION update_institution_assistants_updated_at();

-- View para facilitar consultas com dados completos do assistente
CREATE VIEW public.institution_assistants_detailed AS
SELECT
    ia.*,
    i.name as institution_name,
    i.slug as institution_slug,
    a.name as assistant_original_name,
    a.description as assistant_original_description,
    a.icon as assistant_icon,
    a.color_theme as assistant_color,
    a.openai_assistant_id,
    a.area as assistant_area,
    COALESCE(ia.custom_name, a.name) as display_name,
    COALESCE(ia.custom_description, a.description) as display_description
FROM public.institution_assistants ia
JOIN public.institutions i ON ia.institution_id = i.id
JOIN public.assistants a ON ia.assistant_id = a.id;

-- Função para obter assistentes disponíveis para uma instituição
CREATE OR REPLACE FUNCTION get_institution_available_assistants(institution_slug TEXT)
RETURNS TABLE (
    assistant_id VARCHAR,
    name VARCHAR,
    description TEXT,
    icon VARCHAR,
    color_theme VARCHAR,
    is_simulator BOOLEAN,
    is_primary BOOLEAN,
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ia.assistant_id,
        COALESCE(ia.custom_name, a.name)::VARCHAR as name,
        COALESCE(ia.custom_description, a.description) as description,
        a.icon,
        a.color_theme,
        ia.is_simulator,
        ia.is_primary,
        ia.display_order
    FROM public.institution_assistants ia
    JOIN public.institutions i ON ia.institution_id = i.id
    JOIN public.assistants a ON ia.assistant_id = a.id
    WHERE i.slug = institution_slug
        AND ia.is_active = true
        AND a.is_active = true
        AND i.is_active = true
    ORDER BY ia.display_order ASC, ia.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT SELECT ON public.institution_assistants TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_assistants TO service_role;
GRANT SELECT ON public.institution_assistants_detailed TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_assistants_detailed TO service_role;
GRANT EXECUTE ON FUNCTION get_institution_available_assistants TO authenticated;
GRANT EXECUTE ON FUNCTION get_institution_available_assistants TO service_role;

-- Comentários para documentação
COMMENT ON TABLE public.institution_assistants IS 'Define quais assistentes estão disponíveis para cada instituição';
COMMENT ON COLUMN public.institution_assistants.custom_name IS 'Nome personalizado do assistente para a instituição';
COMMENT ON COLUMN public.institution_assistants.custom_description IS 'Descrição personalizada do assistente';
COMMENT ON COLUMN public.institution_assistants.custom_prompt IS 'Prompt personalizado para contexto institucional';
COMMENT ON COLUMN public.institution_assistants.is_simulator IS 'Indica se é um simulador (ex: psicanálise roleplay)';
COMMENT ON COLUMN public.institution_assistants.is_primary IS 'Indica se é o assistente principal/destacado';
COMMENT ON COLUMN public.institution_assistants.display_order IS 'Ordem de exibição na interface';
COMMENT ON COLUMN public.institution_assistants.settings IS 'Configurações específicas em JSON';

COMMENT ON VIEW public.institution_assistants_detailed IS 'View com dados completos de assistentes institucionais';
COMMENT ON FUNCTION get_institution_available_assistants IS 'Retorna assistentes ativos disponíveis para uma instituição';