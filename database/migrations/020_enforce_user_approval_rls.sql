-- Aplicar controle de aprovação nas políticas RLS existentes
-- Autor: Claude Code
-- Data: 2025-01-26
-- Descrição: Garantir que usuários não aprovados não tenham acesso aos recursos

-- ==========================================
-- 1. ATUALIZAR POLÍTICA DE CONVERSAS
-- ==========================================

-- Garantir que apenas usuários aprovados possam acessar conversas via instituição
DROP POLICY IF EXISTS "Institution users can view conversations" ON public.conversations;
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
                AND iu.is_active = true  -- Usuário conversante deve estar aprovado
                AND (ia.permissions->>'view_conversations')::boolean = true
        )
    );

-- ==========================================
-- 2. ATUALIZAR POLÍTICA DE MENSAGENS
-- ==========================================

-- Garantir que apenas usuários aprovados possam ver mensagens via instituição
DROP POLICY IF EXISTS "Institution admins can view messages" ON public.messages;
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
                            AND iu.is_active = true  -- Usuário conversante deve estar aprovado
                            AND (ia.permissions->>'view_conversations')::boolean = true
                    )
                )
        )
    );

-- ==========================================
-- 3. NOVA POLÍTICA PARA CRIAÇÃO DE CONVERSAS
-- ==========================================

-- Apenas usuários aprovados podem criar novas conversas institucionais
CREATE POLICY "Only active institution users can create conversations" ON public.conversations
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = user_id
        AND (
            -- Se não é usuário institucional, pode criar (usuários regulares)
            NOT EXISTS (
                SELECT 1 FROM public.institution_users iu
                WHERE iu.user_id = auth.uid()
            )
            OR
            -- Se é usuário institucional, deve estar ativo/aprovado
            EXISTS (
                SELECT 1 FROM public.institution_users iu
                WHERE iu.user_id = auth.uid()
                    AND iu.is_active = true
            )
        )
    );

-- ==========================================
-- 4. POLÍTICA PARA CRIAÇÃO DE MENSAGENS
-- ==========================================

-- Apenas usuários aprovados podem criar mensagens em conversas institucionais
CREATE POLICY "Only active institution users can create messages" ON public.messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
                AND auth.uid()::text = c.user_id
                AND (
                    -- Se não é usuário institucional, pode criar (usuários regulares)
                    NOT EXISTS (
                        SELECT 1 FROM public.institution_users iu
                        WHERE iu.user_id = auth.uid()
                    )
                    OR
                    -- Se é usuário institucional, deve estar ativo/aprovado
                    EXISTS (
                        SELECT 1 FROM public.institution_users iu
                        WHERE iu.user_id = auth.uid()
                            AND iu.is_active = true
                    )
                )
        )
    );

-- ==========================================
-- 5. FUNÇÃO DE SEGURANÇA ATUALIZADA
-- ==========================================

-- Atualizar função para incluir verificação de aprovação
CREATE OR REPLACE FUNCTION user_belongs_to_institution(user_uuid UUID, institution_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.institution_users
        WHERE user_id = user_uuid
            AND institution_id = institution_uuid
            AND is_active = true  -- Deve estar aprovado
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nova função para verificar se usuário está pendente de aprovação
CREATE OR REPLACE FUNCTION user_pending_approval_in_institution(user_uuid UUID, institution_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.institution_users
        WHERE user_id = user_uuid
            AND institution_id = institution_uuid
            AND is_active = false  -- Está pendente
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. GRANT PERMISSIONS
-- ==========================================

GRANT EXECUTE ON FUNCTION user_pending_approval_in_institution TO authenticated;
GRANT EXECUTE ON FUNCTION user_pending_approval_in_institution TO service_role;

-- ==========================================
-- 7. COMENTÁRIOS
-- ==========================================

COMMENT ON POLICY "Only active institution users can create conversations" ON public.conversations
    IS 'Apenas usuários institucionais aprovados podem criar conversas';

COMMENT ON POLICY "Only active institution users can create messages" ON public.messages
    IS 'Apenas usuários institucionais aprovados podem criar mensagens';

COMMENT ON FUNCTION user_pending_approval_in_institution
    IS 'Verifica se um usuário está pendente de aprovação em uma instituição';