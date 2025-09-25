-- Criar tabela de subadmins das instituições
-- Autor: Claude Code
-- Data: 2025-01-24
-- Descrição: Define usuários com permissões administrativas específicas dentro das instituições

CREATE TABLE public.institution_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}', -- permissões específicas do admin
    granted_by UUID REFERENCES auth.users(id), -- quem concedeu as permissões
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(institution_id, user_id)
);

-- Criar índices para performance
CREATE INDEX idx_institution_admins_institution_id ON public.institution_admins(institution_id);
CREATE INDEX idx_institution_admins_user_id ON public.institution_admins(user_id);
CREATE INDEX idx_institution_admins_is_active ON public.institution_admins(is_active);
CREATE INDEX idx_institution_admins_granted_by ON public.institution_admins(granted_by);

-- Índice composto para queries frequentes
CREATE INDEX idx_institution_admins_institution_active ON public.institution_admins(institution_id, is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_institution_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_institution_admins_updated_at
    BEFORE UPDATE ON public.institution_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_institution_admins_updated_at();

-- Trigger para automaticamente adicionar entrada em institution_users
CREATE OR REPLACE FUNCTION sync_institution_admin_to_users()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Adicionar/atualizar na tabela institution_users com role subadmin
        INSERT INTO public.institution_users (institution_id, user_id, role, is_active)
        VALUES (NEW.institution_id, NEW.user_id, 'subadmin', NEW.is_active)
        ON CONFLICT (institution_id, user_id)
        DO UPDATE SET
            role = 'subadmin',
            is_active = NEW.is_active,
            updated_at = NOW();

        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Atualizar status na tabela institution_users
        UPDATE public.institution_users
        SET
            role = CASE WHEN NEW.is_active THEN 'subadmin' ELSE role END,
            is_active = NEW.is_active,
            updated_at = NOW()
        WHERE institution_id = NEW.institution_id AND user_id = NEW.user_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Remover role subadmin mas manter usuário como student
        UPDATE public.institution_users
        SET
            role = 'student',
            updated_at = NOW()
        WHERE institution_id = OLD.institution_id AND user_id = OLD.user_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_institution_admin_to_users
    AFTER INSERT OR UPDATE OR DELETE ON public.institution_admins
    FOR EACH ROW
    EXECUTE FUNCTION sync_institution_admin_to_users();

-- View para facilitar consultas com dados do usuário
CREATE VIEW public.institution_admins_detailed AS
SELECT
    ia.*,
    i.name as institution_name,
    i.slug as institution_slug,
    u.email as admin_email,
    COALESCE((u.raw_user_meta_data->>'name'), u.email) as admin_name,
    u.last_sign_in_at as admin_last_login,
    gb.email as granted_by_email,
    COALESCE((gb.raw_user_meta_data->>'name'), gb.email) as granted_by_name
FROM public.institution_admins ia
JOIN public.institutions i ON ia.institution_id = i.id
JOIN auth.users u ON ia.user_id = u.id
LEFT JOIN auth.users gb ON ia.granted_by = gb.id;

-- Função para verificar se usuário é admin de uma instituição
CREATE OR REPLACE FUNCTION is_institution_admin(user_uuid UUID, institution_slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.institution_admins ia
        JOIN public.institutions i ON ia.institution_id = i.id
        WHERE ia.user_id = user_uuid
            AND i.slug = institution_slug
            AND ia.is_active = true
            AND i.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter permissões de um admin
CREATE OR REPLACE FUNCTION get_institution_admin_permissions(user_uuid UUID, institution_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT ia.permissions INTO result
    FROM public.institution_admins ia
    JOIN public.institutions i ON ia.institution_id = i.id
    WHERE ia.user_id = user_uuid
        AND i.slug = institution_slug
        AND ia.is_active = true
        AND i.is_active = true;

    RETURN COALESCE(result, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões padrão para novos subadmins
INSERT INTO public.institution_admins (institution_id, user_id, permissions) VALUES
ON CONFLICT DO NOTHING; -- Placeholder, será populado via aplicação

-- Permissões
GRANT SELECT ON public.institution_admins TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_admins TO service_role;
GRANT SELECT ON public.institution_admins_detailed TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_admins_detailed TO service_role;
GRANT EXECUTE ON FUNCTION is_institution_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_institution_admin TO service_role;
GRANT EXECUTE ON FUNCTION get_institution_admin_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION get_institution_admin_permissions TO service_role;

-- Comentários para documentação
COMMENT ON TABLE public.institution_admins IS 'Subadmins com permissões administrativas específicas nas instituições';
COMMENT ON COLUMN public.institution_admins.permissions IS 'Permissões específicas em JSON (ex: {"manage_users": true, "view_reports": true})';
COMMENT ON COLUMN public.institution_admins.granted_by IS 'ID do usuário que concedeu as permissões administrativas';
COMMENT ON COLUMN public.institution_admins.granted_at IS 'Data quando as permissões foram concedidas';

COMMENT ON VIEW public.institution_admins_detailed IS 'View com dados completos de subadmins incluindo informações dos usuários';
COMMENT ON FUNCTION is_institution_admin IS 'Verifica se um usuário é admin de uma instituição específica';
COMMENT ON FUNCTION get_institution_admin_permissions IS 'Retorna as permissões de um admin para uma instituição';

-- Exemplo de estrutura de permissões em JSON:
-- {
--   "manage_users": true,        -- Gerenciar usuários da instituição
--   "view_reports": true,        -- Ver relatórios e estatísticas
--   "manage_assistants": false,  -- Gerenciar assistentes disponíveis
--   "manage_settings": false     -- Alterar configurações da instituição
-- }