-- Migration 022: Corrigir função RPC de verificação de assinatura institucional
-- Autor: Claude Code
-- Data: 2025-09-26
-- Descrição: Criar alias para compatibilidade e adicionar bypass para admins

-- PASSO 1: Criar função alias para compatibilidade com código existente
CREATE OR REPLACE FUNCTION check_user_institution_subscription(
    p_user_id UUID,
    p_institution_slug TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_access RECORD;
    v_subscription_check RECORD;
    v_result JSON;
BEGIN
    -- 1. Verificar se o usuário é admin/subadmin da instituição
    SELECT iu.role, iu.is_active, iu.is_admin
    INTO v_user_access
    FROM public.institution_users iu
    JOIN public.institutions i ON iu.institution_id = i.id
    WHERE iu.user_id = p_user_id
    AND i.slug = p_institution_slug
    AND iu.is_active = true;

    -- 2. Se é subadmin ou admin, bypass da verificação de assinatura
    IF v_user_access.role = 'subadmin' OR v_user_access.is_admin = true THEN
        v_result := json_build_object(
            'success', true,
            'has_subscription', true,
            'error_type', null,
            'error_message', null,
            'expires_at', null,
            'subscription_status', 'admin_bypass',
            'is_admin_bypass', true
        );
        RETURN v_result;
    END IF;

    -- 3. Para usuários normais, verificar assinatura usando a função existente
    SELECT has_subscription, subscription_status, expires_at, days_remaining
    INTO v_subscription_check
    FROM check_institution_user_subscription(p_user_id, p_institution_slug);

    -- 4. Construir resposta baseada no resultado
    IF v_subscription_check.has_subscription = true THEN
        v_result := json_build_object(
            'success', true,
            'has_subscription', true,
            'error_type', null,
            'error_message', null,
            'expires_at', v_subscription_check.expires_at,
            'subscription_status', v_subscription_check.subscription_status,
            'days_remaining', v_subscription_check.days_remaining,
            'is_admin_bypass', false
        );
    ELSE
        v_result := json_build_object(
            'success', true,
            'has_subscription', false,
            'error_type', 'no_subscription',
            'error_message', 'Você precisa de uma assinatura ativa para acessar os recursos desta instituição',
            'expires_at', v_subscription_check.expires_at,
            'subscription_status', COALESCE(v_subscription_check.subscription_status, 'none'),
            'days_remaining', null,
            'is_admin_bypass', false
        );
    END IF;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar resposta estruturada
    v_result := json_build_object(
        'success', false,
        'has_subscription', false,
        'error_type', 'database_error',
        'error_message', 'Erro ao verificar assinatura: ' || SQLERRM,
        'expires_at', null,
        'subscription_status', 'error',
        'is_admin_bypass', false
    );
    RETURN v_result;
END;
$$;

-- PASSO 2: Atualizar função existente get_institution_subscription_status para usar a nova
CREATE OR REPLACE FUNCTION get_institution_subscription_status(p_institution_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Usar auth.uid() automaticamente e chamar função corrigida
    SELECT check_user_institution_subscription(auth.uid(), p_institution_slug) INTO v_result;
    RETURN v_result;
END;
$$;

-- PASSO 3: Conceder permissões
GRANT EXECUTE ON FUNCTION check_user_institution_subscription(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_institution_subscription_status(TEXT) TO authenticated;

-- PASSO 4: Comentários para documentação
COMMENT ON FUNCTION check_user_institution_subscription(UUID, TEXT) IS 'Verifica assinatura do usuário com bypass automático para admins/subadmins';
COMMENT ON FUNCTION get_institution_subscription_status(TEXT) IS 'Wrapper que usa auth.uid() para verificar assinatura do usuário atual';

-- Log da migration
INSERT INTO public.migration_log (version, description, executed_at)
VALUES ('022', 'Fix subscription RPC function compatibility and admin bypass', NOW())
ON CONFLICT (version) DO UPDATE SET
    executed_at = NOW(),
    description = EXCLUDED.description;