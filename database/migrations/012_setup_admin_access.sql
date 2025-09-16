-- Migration: Setup Admin Access
-- Purpose: Give permanent access to all assistants for admin users
-- Date: 2024-01-01

-- Function to setup admin subscriptions for all assistants
CREATE OR REPLACE FUNCTION setup_admin_subscriptions()
RETURNS VOID AS $$
DECLARE
    admin_emails TEXT[] := ARRAY['gouveiarx@gmail.com', 'psitales@gmail.com', 'psitales.sales@gmail.com'];
    admin_email TEXT;
    assistant_record RECORD;
    admin_user_id UUID;
BEGIN
    -- Loop through each admin email
    FOREACH admin_email IN ARRAY admin_emails
    LOOP
        -- Get the user ID for this admin email
        SELECT id INTO admin_user_id
        FROM auth.users
        WHERE email = admin_email
        LIMIT 1;

        -- If admin user exists, create subscriptions for all assistants
        IF admin_user_id IS NOT NULL THEN
            RAISE NOTICE 'Setting up admin access for: %', admin_email;

            -- Loop through all active assistants
            FOR assistant_record IN
                SELECT id FROM assistants WHERE is_active = true
            LOOP
                -- Insert or update subscription for this admin + assistant combination
                INSERT INTO user_subscriptions (
                    user_id,
                    assistant_id,
                    subscription_type,
                    amount,
                    status,
                    expires_at,
                    created_at,
                    updated_at
                )
                VALUES (
                    admin_user_id,
                    assistant_record.id,
                    'semester',
                    0.00,
                    'active',
                    '2099-12-31 23:59:59+00'::timestamp with time zone,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (user_id, assistant_id)
                DO UPDATE SET
                    subscription_type = 'semester',
                    amount = 0.00,
                    status = 'active',
                    expires_at = '2099-12-31 23:59:59+00'::timestamp with time zone,
                    updated_at = NOW()
                WHERE user_subscriptions.status != 'active' OR user_subscriptions.expires_at < '2050-01-01'::timestamp;

            END LOOP;

            RAISE NOTICE 'Admin access setup completed for: %', admin_email;
        ELSE
            RAISE NOTICE 'Admin user not found: %', admin_email;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically setup admin access for new assistants
CREATE OR REPLACE FUNCTION auto_setup_admin_for_new_assistant()
RETURNS TRIGGER AS $$
DECLARE
    admin_emails TEXT[] := ARRAY['gouveiarx@gmail.com', 'psitales@gmail.com', 'psitales.sales@gmail.com'];
    admin_email TEXT;
    admin_user_id UUID;
BEGIN
    -- Only proceed if the assistant is active
    IF NEW.is_active = true THEN
        -- Loop through each admin email
        FOREACH admin_email IN ARRAY admin_emails
        LOOP
            -- Get the user ID for this admin email
            SELECT id INTO admin_user_id
            FROM auth.users
            WHERE email = admin_email
            LIMIT 1;

            -- If admin user exists, create subscription for new assistant
            IF admin_user_id IS NOT NULL THEN
                INSERT INTO user_subscriptions (
                    user_id,
                    assistant_id,
                    subscription_type,
                    amount,
                    status,
                    expires_at,
                    created_at,
                    updated_at
                )
                VALUES (
                    admin_user_id,
                    NEW.id,
                    'semester',
                    0.00,
                    'active',
                    '2099-12-31 23:59:59+00'::timestamp with time zone,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (user_id, assistant_id)
                DO UPDATE SET
                    subscription_type = 'semester',
                    amount = 0.00,
                    status = 'active',
                    expires_at = '2099-12-31 23:59:59+00'::timestamp with time zone,
                    updated_at = NOW();

                RAISE NOTICE 'Auto-setup admin access for new assistant % to admin %', NEW.name, admin_email;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic admin setup on new assistants
DROP TRIGGER IF EXISTS trigger_auto_setup_admin_for_new_assistant ON assistants;
CREATE TRIGGER trigger_auto_setup_admin_for_new_assistant
    AFTER INSERT OR UPDATE ON assistants
    FOR EACH ROW
    EXECUTE FUNCTION auto_setup_admin_for_new_assistant();

-- Execute the function to setup admin access for existing assistants
SELECT setup_admin_subscriptions();

-- Add comment for documentation
COMMENT ON FUNCTION setup_admin_subscriptions IS
'Sets up permanent subscriptions for admin users to all active assistants';

COMMENT ON FUNCTION auto_setup_admin_for_new_assistant IS
'Automatically gives admin users access to newly created assistants via trigger';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION setup_admin_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION auto_setup_admin_for_new_assistant TO authenticated;