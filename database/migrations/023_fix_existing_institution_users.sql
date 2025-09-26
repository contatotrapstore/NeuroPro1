-- =====================================================
-- MIGRATION 023: Fix Existing Institution Users
-- =====================================================
-- This migration links existing users who have institution metadata
-- but are not yet in the institution_users table.
-- This fixes users like testefn@gmail.com who registered but don't appear in the admin panel.

-- Insert existing users who have institution metadata but are not linked
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
    false as is_active, -- Start as inactive (pending approval)
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

-- Count and log the number of users fixed
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Count users that were just linked
    SELECT COUNT(*) INTO v_count
    FROM auth.users u
    INNER JOIN public.institutions i ON i.slug = u.raw_user_meta_data->>'institution_slug'
    INNER JOIN public.institution_users iu ON iu.user_id = u.id AND iu.institution_id = i.id
    WHERE u.raw_user_meta_data->>'institution_slug' IS NOT NULL
    AND i.is_active = true
    AND iu.enrolled_at >= NOW() - INTERVAL '1 minute'; -- Recently created

    RAISE LOG 'Migration 023 completed: % existing users linked to institutions', v_count;
END
$$;

-- Ensure the get_institution_users function is properly created for the API
-- This ensures the admin panel can fetch users correctly
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
    -- Find institution by slug
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

    -- Get users with auth.users data
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

-- Also create approve and reject functions if they don't exist
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
    -- Find institution
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

    -- Update user to active
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
    -- Find institution
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

    -- Update user to inactive
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

CREATE OR REPLACE FUNCTION get_institution_pending_count(p_institution_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_institution_id UUID;
    v_count INTEGER;
BEGIN
    -- Find institution
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

    -- Count pending users
    SELECT COUNT(*) INTO v_count
    FROM public.institution_users
    WHERE institution_id = v_institution_id
    AND is_active = false;

    RETURN json_build_object(
        'success', true,
        'count', v_count
    );
END;
$$;

-- Grant permissions to all functions
GRANT EXECUTE ON FUNCTION get_institution_users(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_institution_user(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_institution_user(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_institution_pending_count(TEXT) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION approve_institution_user(TEXT, UUID) IS 'Approves a pending institution user';
COMMENT ON FUNCTION reject_institution_user(TEXT, UUID) IS 'Rejects/deactivates an institution user';
COMMENT ON FUNCTION get_institution_pending_count(TEXT) IS 'Returns count of pending users for an institution';