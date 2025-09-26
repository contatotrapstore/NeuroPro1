-- RPC Function to get institution users for admin panel
-- This function returns users associated with a specific institution
-- Used by the InstitutionUsersManagement component

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_institution_users(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_institution_users(TEXT) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_institution_users(TEXT) IS 'Returns users associated with a specific institution by slug. Used by admin panels to manage institution users.';