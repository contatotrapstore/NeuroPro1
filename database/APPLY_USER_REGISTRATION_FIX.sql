-- =====================================================
-- APLICAR CORREÇÃO REGISTRO DE USUÁRIOS INSTITUCIONAIS
-- =====================================================
-- Este arquivo corrige o problema onde usuários que se registram
-- através do portal institucional (como testefn@gmail.com) não
-- aparecem no painel de administração para aprovação.
--
-- EXECUTAR NO SUPABASE SQL EDITOR:
-- 1. Copie todo o conteúdo deste arquivo
-- 2. Cole no SQL Editor do Supabase
-- 3. Clique em "Run" para executar
-- =====================================================

-- PASSO 1: Criar função para auto-vincular usuários às instituições
CREATE OR REPLACE FUNCTION auto_link_user_to_institution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_institution_slug TEXT;
    v_institution_id UUID;
    v_registration_number TEXT;
    v_department TEXT;
    v_semester INTEGER;
    v_role TEXT;
BEGIN
    -- Extrair dados da instituição do metadata do usuário
    v_institution_slug := NEW.raw_user_meta_data->>'institution_slug';
    v_registration_number := NEW.raw_user_meta_data->>'institution_registration_number';
    v_department := NEW.raw_user_meta_data->>'institution_department';
    v_semester := (NEW.raw_user_meta_data->>'institution_semester')::INTEGER;
    v_role := COALESCE(NEW.raw_user_meta_data->>'institution_role', 'student');

    -- Se não tem institution_slug no metadata, não fazer nada
    IF v_institution_slug IS NULL THEN
        RETURN NEW;
    END IF;

    -- Buscar ID da instituição pelo slug
    SELECT id INTO v_institution_id
    FROM public.institutions
    WHERE slug = v_institution_slug
    AND is_active = true;

    -- Se instituição existe, criar vínculo
    IF v_institution_id IS NOT NULL THEN
        INSERT INTO public.institution_users (
            institution_id,
            user_id,
            role,
            registration_number,
            department,
            semester,
            is_active,
            enrolled_at
        ) VALUES (
            v_institution_id,
            NEW.id,
            v_role,
            v_registration_number,
            v_department,
            v_semester,
            false, -- Começa inativo (pendente aprovação)
            NOW()
        )
        ON CONFLICT (user_id, institution_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Não falhar o registro do usuário se houver erro
        RETURN NEW;
END;
$$;

-- PASSO 2: Criar/Recriar trigger
DROP TRIGGER IF EXISTS trigger_auto_link_institution_user ON auth.users;
CREATE TRIGGER trigger_auto_link_institution_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_link_user_to_institution();

-- PASSO 3: Corrigir usuários existentes (como testefn@gmail.com)
INSERT INTO public.institution_users (
    institution_id,
    user_id,
    role,
    registration_number,
    department,
    semester,
    is_active,
    enrolled_at
)
SELECT
    i.id as institution_id,
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'institution_role', 'student') as role,
    u.raw_user_meta_data->>'institution_registration_number' as registration_number,
    u.raw_user_meta_data->>'institution_department' as department,
    CASE
        WHEN u.raw_user_meta_data->>'institution_semester' IS NOT NULL
        THEN (u.raw_user_meta_data->>'institution_semester')::INTEGER
        ELSE NULL
    END as semester,
    false as is_active, -- Inativo (pendente aprovação)
    u.created_at as enrolled_at
FROM auth.users u
INNER JOIN public.institutions i ON i.slug = u.raw_user_meta_data->>'institution_slug'
WHERE u.raw_user_meta_data->>'institution_slug' IS NOT NULL
AND i.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM public.institution_users iu
    WHERE iu.user_id = u.id
    AND iu.institution_id = i.id
);

-- PASSO 4: Criar/Atualizar função get_institution_users para o painel admin
CREATE OR REPLACE FUNCTION get_institution_users(p_institution_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_institution_id UUID;
    v_result JSON;
BEGIN
    -- Buscar instituição pelo slug
    SELECT id INTO v_institution_id
    FROM public.institutions
    WHERE slug = p_institution_slug
    AND is_active = true;

    IF v_institution_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Instituição não encontrada'
        );
    END IF;

    -- Buscar usuários com dados do auth.users
    SELECT json_build_object(
        'success', true,
        'data', COALESCE(json_agg(
            json_build_object(
                'id', iu.user_id,
                'email', u.email,
                'name', COALESCE(
                    u.raw_user_meta_data->>'name',
                    u.raw_user_meta_data->>'full_name',
                    split_part(u.email, '@', 1)
                ),
                'role', iu.role,
                'is_active', iu.is_active,
                'registration_number', iu.registration_number,
                'department', iu.department,
                'semester', iu.semester,
                'enrolled_at', iu.enrolled_at,
                'last_access', iu.last_access,
                'created_at', u.created_at,
                'last_sign_in_at', u.last_sign_in_at,
                'email_confirmed_at', u.email_confirmed_at
            ) ORDER BY iu.enrolled_at DESC
        ), '[]'::json)
    ) INTO v_result
    FROM public.institution_users iu
    INNER JOIN auth.users u ON u.id = iu.user_id
    WHERE iu.institution_id = v_institution_id;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao buscar usuários: ' || SQLERRM
        );
END;
$$;

-- PASSO 5: Criar funções auxiliares para aprovação/rejeição
CREATE OR REPLACE FUNCTION approve_institution_user(
    p_institution_slug TEXT,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_institution_id UUID;
BEGIN
    -- Buscar instituição
    SELECT id INTO v_institution_id
    FROM public.institutions
    WHERE slug = p_institution_slug
    AND is_active = true;

    IF v_institution_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Instituição não encontrada'
        );
    END IF;

    -- Ativar usuário
    UPDATE public.institution_users
    SET is_active = true,
        last_access = NOW()
    WHERE institution_id = v_institution_id
    AND user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado na instituição'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Usuário aprovado com sucesso'
    );
END;
$$;

CREATE OR REPLACE FUNCTION reject_institution_user(
    p_institution_slug TEXT,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_institution_id UUID;
BEGIN
    -- Buscar instituição
    SELECT id INTO v_institution_id
    FROM public.institutions
    WHERE slug = p_institution_slug
    AND is_active = true;

    IF v_institution_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Instituição não encontrada'
        );
    END IF;

    -- Desativar usuário
    UPDATE public.institution_users
    SET is_active = false
    WHERE institution_id = v_institution_id
    AND user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado na instituição'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Usuário desativado com sucesso'
    );
END;
$$;

-- PASSO 6: Conceder permissões
GRANT EXECUTE ON FUNCTION get_institution_users(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_institution_user(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_institution_user(TEXT, UUID) TO authenticated;

-- PASSO 7: Verificar se funcionou
-- Esta query deve retornar testefn@gmail.com se ele se registrou para ABPSI
SELECT
    u.email,
    u.raw_user_meta_data->>'name' as name,
    u.raw_user_meta_data->>'institution_slug' as institution,
    iu.is_active,
    iu.enrolled_at
FROM auth.users u
LEFT JOIN public.institution_users iu ON iu.user_id = u.id
LEFT JOIN public.institutions i ON i.id = iu.institution_id
WHERE u.raw_user_meta_data->>'institution_slug' IS NOT NULL
ORDER BY u.created_at DESC;

-- =====================================================
-- RESULTADO ESPERADO:
-- - testefn@gmail.com deve aparecer na consulta acima
-- - is_active deve ser false (pendente aprovação)
-- - No painel admin, o usuário deve aparecer para aprovação
-- =====================================================