-- =====================================================
-- MIGRATION 025: Fix Institution User Triggers Conflict
-- =====================================================
-- This migration resolves the conflict between two triggers that were
-- attempting to insert the same record into institution_users, causing
-- "Database error saving new user" during ABPSI registration.
--
-- Problem:
-- - trigger_auto_link_user_to_institution (complete, with all fields)
-- - trigger_handle_new_user_institution_link (incomplete, missing required fields)
--
-- Solution:
-- - Remove the incomplete trigger
-- - Update the complete function to auto-approve ABPSI users
-- - Keep all required fields (registration_number, department, semester)

-- 1. Remove the conflicting trigger and function
DROP TRIGGER IF EXISTS trigger_handle_new_user_institution_link ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_institution_link();

-- 2. Also remove the old auto_approve trigger on institution_users table
DROP TRIGGER IF EXISTS trigger_auto_approve_institution_user ON public.institution_users;
DROP FUNCTION IF EXISTS auto_approve_institution_user();

-- 3. Remove duplicate trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_link_user_to_institution ON auth.users;

-- 4. Update the main function to auto-approve ABPSI users
CREATE OR REPLACE FUNCTION public.auto_link_user_to_institution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_institution_slug TEXT;
    v_institution_id UUID;
    v_registration_number TEXT;
    v_department TEXT;
    v_semester INTEGER;
    v_role TEXT;
    v_is_active BOOLEAN;
BEGIN
    -- Extract institution data from user metadata
    v_institution_slug := NEW.raw_user_meta_data->>'institution_slug';
    v_registration_number := NEW.raw_user_meta_data->>'institution_registration_number';
    v_department := NEW.raw_user_meta_data->>'institution_department';

    -- Handle semester as text first to avoid conversion errors
    BEGIN
        v_semester := (NEW.raw_user_meta_data->>'institution_semester')::INTEGER;
    EXCEPTION
        WHEN OTHERS THEN
            v_semester := NULL;
    END;

    v_role := COALESCE(NEW.raw_user_meta_data->>'institution_role', 'student');

    -- If no institution_slug in metadata, skip
    IF v_institution_slug IS NULL OR v_institution_slug = '' THEN
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
        -- Auto-approve for ABPSI institution (slug = 'abpsi')
        v_is_active := (v_institution_slug = 'abpsi');

        BEGIN
            INSERT INTO public.institution_users (
                institution_id,
                user_id,
                role,
                registration_number,
                department,
                semester,
                is_active,
                enrolled_at,
                created_at,
                updated_at
            ) VALUES (
                v_institution_id,
                NEW.id,
                v_role::institution_user_role,
                v_registration_number,
                v_department,
                v_semester,
                v_is_active, -- Auto-approve for ABPSI, pending for others
                NOW(),
                NOW(),
                NOW()
            )
            ON CONFLICT (user_id, institution_id) DO UPDATE SET
                updated_at = NOW(),
                role = EXCLUDED.role,
                registration_number = EXCLUDED.registration_number,
                department = EXCLUDED.department,
                semester = EXCLUDED.semester,
                is_active = EXCLUDED.is_active;

            IF v_is_active THEN
                RAISE LOG 'User % automatically linked and APPROVED to institution % (%)', NEW.id, v_institution_slug, v_institution_id;
            ELSE
                RAISE LOG 'User % automatically linked to institution % (%) - PENDING APPROVAL', NEW.id, v_institution_slug, v_institution_id;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to link user % to institution %: %', NEW.id, v_institution_slug, SQLERRM;
        END;
    ELSE
        RAISE WARNING 'Institution with slug % not found for user %', v_institution_slug, NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Unexpected error in auto_link_user_to_institution for user %: %', NEW.id, SQLERRM;
        RETURN NEW; -- Don't fail user registration
END;
$function$;

-- 5. Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS trigger_auto_link_institution_user ON auth.users;
CREATE TRIGGER trigger_auto_link_institution_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_link_user_to_institution();

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_link_user_to_institution() TO service_role;
GRANT EXECUTE ON FUNCTION auto_link_user_to_institution() TO authenticated;

-- 7. Add comment for documentation
COMMENT ON FUNCTION auto_link_user_to_institution() IS 'Automatically links users to institutions when they register with institution metadata. Auto-approves ABPSI users.';
COMMENT ON TRIGGER trigger_auto_link_institution_user ON auth.users IS 'Trigger to auto-link and auto-approve new users to ABPSI institution based on registration metadata';

-- Log completion
SELECT 'Migration 025 completed: Fixed institution user triggers conflict' as result;