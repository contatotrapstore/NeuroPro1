-- Fix the verify_institution_access RPC function to eliminate function ambiguity
-- Resolve duplicate functions causing 403 Forbidden errors
-- Support user approval workflow (allow inactive users to login)

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

    -- Check if user has access to this institution (including inactive users for approval flow)
    SELECT * INTO v_access_record
    FROM institution_users
    WHERE institution_id = v_institution_id
    AND user_id = v_user_id;

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

    -- Get available assistants for this institution (only show for active users)
    -- JOIN with assistants table to get proper OpenAI IDs and ensure assistants exist
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', ia.id,
            'name', COALESCE(ia.custom_name, a.name),
            'description', COALESCE(ia.custom_description, a.description),
            'icon', COALESCE(a.icon, 'brain'),
            'color_theme', COALESCE(a.color_theme, '#6366F1'),
            'openai_assistant_id', a.openai_assistant_id,
            'is_simulator', COALESCE(a.name LIKE '%Simulador%' OR a.name LIKE '%ClinReplay%' OR a.name LIKE '%Treinador%', false),
            'is_primary', COALESCE(ia.is_default, false),
            'display_order', COALESCE(ia.display_order, 999)
        ) ORDER BY COALESCE(ia.display_order, 999)
    ), '[]'::json) INTO v_assistants
    FROM institution_assistants ia
    JOIN assistants a ON ia.assistant_id = a.id
    WHERE ia.institution_id = v_institution_id
      AND ia.is_enabled = true
      AND a.is_active = true
      AND a.openai_assistant_id IS NOT NULL
      AND v_access_record.is_active = true; -- Only show assistants if user is active/approved

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
                'settings', json_build_object(
                    'welcome_message', v_institution_record.custom_message,
                    'subtitle', NULL,
                    'features', '[]'::json,
                    'theme', json_build_object(
                        'font_family', NULL,
                        'border_radius', NULL,
                        'gradient', NULL
                    ),
                    'contact', json_build_object(
                        'email', v_institution_record.contact_email,
                        'phone', v_institution_record.phone,
                        'website', v_institution_record.website_url
                    ),
                    'branding', json_build_object(
                        'show_neurolab_footer', true,
                        'custom_favicon', NULL,
                        'meta_description', NULL
                    )
                )
            ),
            'user_access', json_build_object(
                'role', v_access_record.role,
                'is_admin', (v_access_record.role = 'subadmin'),
                'is_active', v_access_record.is_active,
                'permissions', json_build_object(
                    'manage_users', (v_access_record.role = 'subadmin'),
                    'view_reports', (v_access_record.role = 'subadmin'),
                    'manage_assistants', (v_access_record.role = 'subadmin'),
                    'manage_settings', (v_access_record.role = 'subadmin'),
                    'view_conversations', (v_access_record.role = 'subadmin'),
                    'export_data', (v_access_record.role = 'subadmin')
                ),
                'joined_at', v_access_record.created_at
            ),
            'available_assistants', v_assistants
        )
    );
END;
$$;