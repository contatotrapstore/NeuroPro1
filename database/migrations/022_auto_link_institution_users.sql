-- =====================================================
-- MIGRATION 022: Auto-Link Institution Users Trigger
-- =====================================================
-- This migration creates a trigger that automatically links users to institutions
-- when they register with institution metadata, fixing the issue where new users
-- don't appear in the admin approval panel.

-- Function to automatically link users to institutions after registration
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
    -- Extract institution data from metadata
    v_institution_slug := NEW.raw_user_meta_data->>'institution_slug';
    v_registration_number := NEW.raw_user_meta_data->>'institution_registration_number';
    v_department := NEW.raw_user_meta_data->>'institution_department';
    v_semester := (NEW.raw_user_meta_data->>'institution_semester')::INTEGER;
    v_role := COALESCE(NEW.raw_user_meta_data->>'institution_role', 'student');

    -- If no institution_slug in metadata, do nothing
    IF v_institution_slug IS NULL THEN
        RAISE LOG 'User % has no institution_slug in metadata, skipping auto-link', NEW.id;
        RETURN NEW;
    END IF;

    -- Find institution ID by slug
    SELECT id INTO v_institution_id
    FROM public.institutions
    WHERE slug = v_institution_slug
    AND is_active = true;

    -- If institution exists, create link
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
            false, -- Start as inactive (pending approval)
            NOW()
        )
        ON CONFLICT (user_id, institution_id) DO NOTHING;

        RAISE LOG 'User % automatically linked to institution % (%)', NEW.id, v_institution_slug, v_institution_id;
    ELSE
        RAISE WARNING 'Institution with slug % not found for user %', v_institution_slug, NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to auto-link user % to institution %: %', NEW.id, v_institution_slug, SQLERRM;
        RETURN NEW; -- Don't fail user registration
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_link_institution_user ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER trigger_auto_link_institution_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_link_user_to_institution();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_link_user_to_institution() TO service_role;
GRANT EXECUTE ON FUNCTION auto_link_user_to_institution() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION auto_link_user_to_institution() IS 'Automatically links users to institutions when they register with institution metadata';
COMMENT ON TRIGGER trigger_auto_link_institution_user ON auth.users IS 'Trigger to auto-link new users to institutions based on registration metadata';

-- Log completion
DO $$
BEGIN
    RAISE LOG 'Migration 022 completed: Auto-link institution users trigger created';
END
$$;