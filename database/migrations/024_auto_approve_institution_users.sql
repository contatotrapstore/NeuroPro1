-- Migration 024: Auto-approve institution users
-- Remove the approval requirement for ABPSI institution users
-- Users will be automatically approved upon registration

-- 1. Update default value for is_active to true
ALTER TABLE institution_users
ALTER COLUMN is_active SET DEFAULT true;

-- 2. Auto-approve all existing pending users for ABPSI
UPDATE institution_users SET is_active = true
WHERE institution_id = (
    SELECT id FROM institutions WHERE slug = 'abpsi'
) AND is_active = false;

-- 3. Create or replace trigger function to auto-approve new institution users
CREATE OR REPLACE FUNCTION auto_approve_institution_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Automatically set is_active to true for all new institution users
    NEW.is_active = true;
    RETURN NEW;
END;
$$;

-- 4. Create trigger for auto-approval on INSERT
DROP TRIGGER IF EXISTS trigger_auto_approve_institution_user ON institution_users;
CREATE TRIGGER trigger_auto_approve_institution_user
    BEFORE INSERT ON institution_users
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_institution_user();

-- 5. Update the auth.users trigger to automatically link ABPSI users
CREATE OR REPLACE FUNCTION handle_new_user_institution_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_institution_id UUID;
    v_user_metadata JSONB;
BEGIN
    -- Get user metadata
    v_user_metadata := NEW.raw_user_meta_data;

    -- Check if this user is registering for an institution
    IF v_user_metadata ? 'institution_slug' THEN
        -- Get institution ID
        SELECT id INTO v_institution_id
        FROM institutions
        WHERE slug = v_user_metadata->>'institution_slug'
        AND is_active = true;

        -- If institution exists, create link automatically with approval
        IF v_institution_id IS NOT NULL THEN
            INSERT INTO institution_users (
                user_id,
                institution_id,
                role,
                is_active  -- Will be set to true by trigger
            ) VALUES (
                NEW.id,
                v_institution_id,
                COALESCE(v_user_metadata->>'institution_role', 'student'),
                true  -- Automatically approved
            ) ON CONFLICT (user_id, institution_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 6. Create trigger on auth.users for automatic institution linking
DROP TRIGGER IF EXISTS trigger_handle_new_user_institution_link ON auth.users;
CREATE TRIGGER trigger_handle_new_user_institution_link
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_institution_link();

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_approve_institution_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user_institution_link() TO service_role;

-- Migration completed successfully
SELECT 'Migration 024: Auto-approve institution users completed' as result;