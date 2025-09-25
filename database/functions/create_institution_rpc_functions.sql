-- Create RPC functions for institution authentication and access verification
-- These functions allow secure access to institution data without requiring service_role key

-- Function 1: Get public information about an institution
CREATE OR REPLACE FUNCTION get_institution_public_info(p_institution_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_institution_record RECORD;
BEGIN
    -- Find institution by slug
    SELECT * INTO v_institution_record
    FROM institutions
    WHERE slug = p_institution_slug AND is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Instituição não encontrada'
        );
    END IF;

    -- Return public institution data
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'institution', json_build_object(
                'id', v_institution_record.id,
                'name', v_institution_record.name,
                'slug', v_institution_record.slug,
                'logo_url', v_institution_record.logo_url,
                'primary_color', v_institution_record.primary_color,
                'secondary_color', v_institution_record.secondary_color,
                'settings', v_institution_record.settings
            )
        )
    );
END;
$$;

-- Function 2: Verify user access to an institution
CREATE OR REPLACE FUNCTION verify_institution_access(p_institution_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_institution_id UUID;
    v_user_id UUID;
    v_user_record RECORD;
    v_institution_record RECORD;
    v_access_record RECORD;
    v_assistants JSON;
BEGIN
    -- Get current user ID from auth.jwt()
    SELECT auth.uid() INTO v_user_id;

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;

    -- Find institution by slug
    SELECT * INTO v_institution_record
    FROM institutions
    WHERE slug = p_institution_slug AND is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Instituição não encontrada'
        );
    END IF;

    v_institution_id := v_institution_record.id;

    -- Check if user has access to this institution
    SELECT * INTO v_access_record
    FROM institution_users
    WHERE institution_id = v_institution_id
    AND user_id = v_user_id
    AND is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não tem acesso a esta instituição'
        );
    END IF;

    -- Get user info
    SELECT * INTO v_user_record
    FROM auth.users
    WHERE id = v_user_id;

    -- Get available assistants for this institution
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'description', description,
            'icon', icon,
            'color_theme', color_theme,
            'openai_assistant_id', openai_assistant_id,
            'is_simulator', is_simulator,
            'is_primary', is_primary,
            'display_order', display_order
        ) ORDER BY display_order
    ), '[]'::json) INTO v_assistants
    FROM institution_assistants
    WHERE institution_id = v_institution_id AND is_active = true;

    -- Return success with all data
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'institution', json_build_object(
                'id', v_institution_record.id,
                'name', v_institution_record.name,
                'slug', v_institution_record.slug,
                'logo_url', v_institution_record.logo_url,
                'primary_color', v_institution_record.primary_color,
                'secondary_color', v_institution_record.secondary_color,
                'settings', v_institution_record.settings
            ),
            'user_access', json_build_object(
                'role', v_access_record.role,
                'is_admin', v_access_record.is_admin,
                'permissions', json_build_object(
                    'manage_users', v_access_record.is_admin,
                    'view_reports', v_access_record.is_admin,
                    'manage_assistants', v_access_record.is_admin,
                    'manage_settings', v_access_record.is_admin,
                    'view_conversations', v_access_record.is_admin,
                    'export_data', v_access_record.is_admin
                ),
                'joined_at', v_access_record.created_at
            ),
            'available_assistants', v_assistants
        )
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_institution_public_info(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_institution_public_info(TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION verify_institution_access(TEXT) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION get_institution_public_info(TEXT) IS 'Returns public information about an institution by slug';
COMMENT ON FUNCTION verify_institution_access(TEXT) IS 'Verifies if the current authenticated user has access to the specified institution';