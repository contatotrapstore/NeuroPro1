-- Criar tabela de relação usuários-instituições
-- Data: 2025-01-24
-- Descrição: Relaciona usuários com instituições definindo papéis e permissões

CREATE TABLE public.institution_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'student', -- student, teacher, subadmin
    permissions JSONB DEFAULT '{}', -- permissões específicas do usuário
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(institution_id, user_id),
    CONSTRAINT institution_users_role_check CHECK (role IN ('student', 'teacher', 'subadmin'))
);

-- Criar índices para performance
CREATE INDEX idx_institution_users_institution_id ON public.institution_users(institution_id);
CREATE INDEX idx_institution_users_user_id ON public.institution_users(user_id);
CREATE INDEX idx_institution_users_role ON public.institution_users(role);
CREATE INDEX idx_institution_users_is_active ON public.institution_users(is_active);
CREATE INDEX idx_institution_users_joined_at ON public.institution_users(joined_at DESC);

-- Índice composto para queries frequentes
CREATE INDEX idx_institution_users_institution_active ON public.institution_users(institution_id, is_active);
CREATE INDEX idx_institution_users_user_active ON public.institution_users(user_id, is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_institution_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_institution_users_updated_at
    BEFORE UPDATE ON public.institution_users
    FOR EACH ROW
    EXECUTE FUNCTION update_institution_users_updated_at();

-- View para facilitar consultas com dados do usuário
CREATE VIEW public.institution_users_detailed AS
SELECT
    iu.*,
    i.name as institution_name,
    i.slug as institution_slug,
    i.logo_url as institution_logo,
    i.primary_color as institution_color,
    u.email as user_email,
    u.email_confirmed_at,
    u.last_sign_in_at,
    COALESCE((u.raw_user_meta_data->>'name'), u.email) as user_name
FROM public.institution_users iu
JOIN public.institutions i ON iu.institution_id = i.id
JOIN auth.users u ON iu.user_id = u.id;

-- Permissões
GRANT SELECT ON public.institution_users TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_users TO service_role;
GRANT SELECT ON public.institution_users_detailed TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_users_detailed TO service_role;

-- Comentários para documentação
COMMENT ON TABLE public.institution_users IS 'Relação entre usuários e instituições com papéis e permissões';
COMMENT ON COLUMN public.institution_users.role IS 'Papel do usuário na instituição: student, teacher, subadmin';
COMMENT ON COLUMN public.institution_users.permissions IS 'Permissões específicas do usuário em JSON';
COMMENT ON COLUMN public.institution_users.joined_at IS 'Data quando o usuário se juntou à instituição';

COMMENT ON VIEW public.institution_users_detailed IS 'View com dados completos de usuários e instituições para facilitar consultas';