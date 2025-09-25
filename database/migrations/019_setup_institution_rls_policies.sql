-- Configurar Row Level Security (RLS) para sistema de instituições
-- Autor: Claude Code
-- Data: 2025-01-24
-- Descrição: Políticas de segurança para isolamento de dados entre instituições

-- ==========================================
-- 1. HABILITAR RLS NAS NOVAS TABELAS
-- ==========================================

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_subscriptions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. POLÍTICAS PARA INSTITUTIONS
-- ==========================================

-- Qualquer pessoa pode ver instituições ativas (para descobrir slugs válidos)
CREATE POLICY "Public can view active institutions" ON public.institutions
    FOR SELECT
    USING (is_active = true);

-- Service role pode gerenciar todas as instituições
CREATE POLICY "Service role can manage all institutions" ON public.institutions
    FOR ALL
    USING (current_setting('role') = 'service_role');

-- ==========================================
-- 3. POLÍTICAS PARA INSTITUTION_USERS
-- ==========================================

-- Usuários podem ver suas próprias associações com instituições
CREATE POLICY "Users can view their institution memberships" ON public.institution_users
    FOR SELECT
    USING (auth.uid() = user_id);

-- Subadmins podem ver usuários da sua instituição
CREATE POLICY "Institution admins can view institution users" ON public.institution_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.institution_admins ia
            WHERE ia.institution_id = institution_users.institution_id
                AND ia.user_id = auth.uid()
                AND ia.is_active = true
        )
    );

-- Subadmins podem gerenciar usuários da sua instituição (exceto outros admins)
CREATE POLICY "Institution admins can manage non-admin users" ON public.institution_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.institution_admins ia
            WHERE ia.institution_id = institution_users.institution_id
                AND ia.user_id = auth.uid()
                AND ia.is_active = true
                AND (ia.permissions->>'manage_users')::boolean = true
        )
        AND institution_users.role IN ('student', 'teacher')
    );

-- Service role pode gerenciar tudo
CREATE POLICY "Service role can manage all institution users" ON public.institution_users
    FOR ALL
    USING (current_setting('role') = 'service_role');

-- ==========================================
-- 4. POLÍTICAS PARA INSTITUTION_ASSISTANTS
-- ==========================================

-- Usuários podem ver assistentes das instituições que pertencem
CREATE POLICY "Institution members can view institution assistants" ON public.institution_assistants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.institution_users iu
            WHERE iu.institution_id = institution_assistants.institution_id
                AND iu.user_id = auth.uid()
                AND iu.is_active = true
        )
        AND is_active = true
    );

-- Subadmins podem gerenciar assistentes da sua instituição
CREATE POLICY "Institution admins can manage institution assistants" ON public.institution_assistants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.institution_admins ia
            WHERE ia.institution_id = institution_assistants.institution_id
                AND ia.user_id = auth.uid()
                AND ia.is_active = true
                AND (ia.permissions->>'manage_assistants')::boolean = true
        )
    );

-- Service role pode gerenciar tudo
CREATE POLICY "Service role can manage all institution assistants" ON public.institution_assistants
    FOR ALL
    USING (current_setting('role') = 'service_role');

-- ==========================================
-- 5. POLÍTICAS PARA INSTITUTION_ADMINS
-- ==========================================

-- Subadmins podem ver outros admins da mesma instituição
CREATE POLICY "Institution admins can view other institution admins" ON public.institution_admins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.institution_admins ia
            WHERE ia.institution_id = institution_admins.institution_id
                AND ia.user_id = auth.uid()
                AND ia.is_active = true
        )
    );

-- Apenas service role pode modificar admins (por segurança)
CREATE POLICY "Only service role can manage institution admins" ON public.institution_admins
    FOR ALL
    USING (current_setting('role') = 'service_role');

-- ==========================================
-- 6. POLÍTICAS PARA INSTITUTION_SUBSCRIPTIONS
-- ==========================================

-- Subadmins podem ver licenças da sua instituição
CREATE POLICY "Institution admins can view institution subscriptions" ON public.institution_subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.institution_admins ia
            WHERE ia.institution_id = institution_subscriptions.institution_id
                AND ia.user_id = auth.uid()
                AND ia.is_active = true
        )
    );

-- Service role pode gerenciar tudo
CREATE POLICY "Service role can manage all institution subscriptions" ON public.institution_subscriptions
    FOR ALL
    USING (current_setting('role') = 'service_role');

-- ==========================================
-- 7. ATUALIZAR POLÍTICAS EXISTENTES PARA SUPORTAR INSTITUIÇÕES
-- ==========================================

-- Adicionar política para conversas de usuários institucionais
CREATE POLICY "Institution users can view conversations" ON public.conversations
    FOR SELECT
    USING (
        auth.uid()::text = user_id
        OR EXISTS (
            -- Subadmins podem ver conversas dos usuários da sua instituição se têm permissão
            SELECT 1 FROM public.institution_admins ia
            JOIN public.institution_users iu ON ia.institution_id = iu.institution_id
            WHERE ia.user_id = auth.uid()
                AND iu.user_id::text = conversations.user_id
                AND ia.is_active = true
                AND iu.is_active = true
                AND (ia.permissions->>'view_conversations')::boolean = true
        )
    );

-- Política similar para mensagens
CREATE POLICY "Institution admins can view messages" ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
                AND (
                    auth.uid()::text = c.user_id
                    OR EXISTS (
                        SELECT 1 FROM public.institution_admins ia
                        JOIN public.institution_users iu ON ia.institution_id = iu.institution_id
                        WHERE ia.user_id = auth.uid()
                            AND iu.user_id::text = c.user_id
                            AND ia.is_active = true
                            AND iu.is_active = true
                            AND (ia.permissions->>'view_conversations')::boolean = true
                    )
                )
        )
    );

-- ==========================================
-- 8. FUNÇÕES DE SEGURANÇA AUXILIARES
-- ==========================================

-- Função para verificar se usuário pertence a uma instituição
CREATE OR REPLACE FUNCTION user_belongs_to_institution(user_uuid UUID, institution_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.institution_users
        WHERE user_id = user_uuid
            AND institution_id = institution_uuid
            AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissões de admin
CREATE OR REPLACE FUNCTION user_has_institution_permission(user_uuid UUID, institution_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.institution_admins
        WHERE user_id = user_uuid
            AND institution_id = institution_uuid
            AND is_active = true
            AND (permissions->>permission_name)::boolean = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter instituições de um usuário
CREATE OR REPLACE FUNCTION get_user_institutions(user_uuid UUID)
RETURNS TABLE (
    institution_id UUID,
    institution_slug VARCHAR,
    institution_name VARCHAR,
    user_role VARCHAR,
    is_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.slug,
        i.name,
        iu.role,
        EXISTS (
            SELECT 1 FROM public.institution_admins ia
            WHERE ia.institution_id = i.id
                AND ia.user_id = user_uuid
                AND ia.is_active = true
        ) as is_admin
    FROM public.institution_users iu
    JOIN public.institutions i ON iu.institution_id = i.id
    WHERE iu.user_id = user_uuid
        AND iu.is_active = true
        AND i.is_active = true
    ORDER BY iu.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 9. PERMISSÕES PARA FUNÇÕES
-- ==========================================

GRANT EXECUTE ON FUNCTION user_belongs_to_institution TO authenticated;
GRANT EXECUTE ON FUNCTION user_belongs_to_institution TO service_role;
GRANT EXECUTE ON FUNCTION user_has_institution_permission TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_institution_permission TO service_role;
GRANT EXECUTE ON FUNCTION get_user_institutions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_institutions TO service_role;

-- ==========================================
-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==========================================

COMMENT ON POLICY "Public can view active institutions" ON public.institutions
    IS 'Permite descobrir slugs de instituições ativas para login';

COMMENT ON POLICY "Institution members can view institution assistants" ON public.institution_assistants
    IS 'Usuários só podem ver assistentes das instituições que pertencem';

COMMENT ON POLICY "Institution admins can manage non-admin users" ON public.institution_users
    IS 'Subadmins podem gerenciar usuários não-admin da sua instituição';

COMMENT ON FUNCTION user_belongs_to_institution
    IS 'Verifica se um usuário pertence a uma instituição específica';

COMMENT ON FUNCTION user_has_institution_permission
    IS 'Verifica se um usuário tem uma permissão específica em uma instituição';

COMMENT ON FUNCTION get_user_institutions
    IS 'Retorna todas as instituições que um usuário pertence com seus papéis';

-- ==========================================
-- 11. LOGS E AUDITORIA
-- ==========================================

-- Habilitar log de mudanças em tabelas críticas (opcional, para auditoria)
-- Isso pode ser implementado futuramente se necessário para compliance

-- Log de criação/modificação de admins
CREATE OR REPLACE FUNCTION log_institution_admin_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir log em tabela de auditoria (a ser criada se necessário)
    INSERT INTO audit_logs (table_name, operation, old_data, new_data, changed_by, changed_at)
    VALUES (
        'institution_admins',
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
        auth.uid(),
        NOW()
    ) ON CONFLICT DO NOTHING; -- Ignora se tabela de auditoria não existir

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoria (comentado até criar tabela audit_logs)
-- CREATE TRIGGER trigger_audit_institution_admins
--     AFTER INSERT OR UPDATE OR DELETE ON public.institution_admins
--     FOR EACH ROW
--     EXECUTE FUNCTION log_institution_admin_changes();