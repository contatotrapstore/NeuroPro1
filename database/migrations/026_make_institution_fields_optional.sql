-- =====================================================
-- MIGRATION 026: Make Institution User Fields Optional
-- =====================================================
-- This migration makes registration_number, department, and semester
-- optional fields in the institution_users table to simplify registration.
--
-- Changes requested by client (Tales Sales):
-- - Remove mandatory requirement for registration number and course/department
-- - Make the registration process more practical for students and affiliates
-- - Users can still provide this information optionally

-- First, check if the columns exist and add them if they don't
-- (They should exist based on the triggers, but we ensure they're properly defined)

-- Add columns if they don't exist (with NULL allowed)
DO $$
BEGIN
    -- Add registration_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'institution_users'
        AND column_name = 'registration_number'
    ) THEN
        ALTER TABLE public.institution_users
        ADD COLUMN registration_number TEXT NULL;
        RAISE LOG 'Added registration_number column to institution_users';
    END IF;

    -- Add department column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'institution_users'
        AND column_name = 'department'
    ) THEN
        ALTER TABLE public.institution_users
        ADD COLUMN department TEXT NULL;
        RAISE LOG 'Added department column to institution_users';
    END IF;

    -- Add semester column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'institution_users'
        AND column_name = 'semester'
    ) THEN
        ALTER TABLE public.institution_users
        ADD COLUMN semester INTEGER NULL;
        RAISE LOG 'Added semester column to institution_users';
    END IF;

    -- Add enrolled_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'institution_users'
        AND column_name = 'enrolled_at'
    ) THEN
        ALTER TABLE public.institution_users
        ADD COLUMN enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE LOG 'Added enrolled_at column to institution_users';
    END IF;

    -- Add last_access column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'institution_users'
        AND column_name = 'last_access'
    ) THEN
        ALTER TABLE public.institution_users
        ADD COLUMN last_access TIMESTAMP WITH TIME ZONE NULL;
        RAISE LOG 'Added last_access column to institution_users';
    END IF;
END $$;

-- Ensure the columns allow NULL (remove NOT NULL constraint if exists)
ALTER TABLE public.institution_users
    ALTER COLUMN registration_number DROP NOT NULL,
    ALTER COLUMN department DROP NOT NULL,
    ALTER COLUMN semester DROP NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.institution_users.registration_number IS 'Optional student registration/enrollment number';
COMMENT ON COLUMN public.institution_users.department IS 'Optional department or course name';
COMMENT ON COLUMN public.institution_users.semester IS 'Optional current semester (1-12)';

-- Create index for optional fields (for faster queries when they are filled)
CREATE INDEX IF NOT EXISTS idx_institution_users_registration_number
    ON public.institution_users(registration_number)
    WHERE registration_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_institution_users_department
    ON public.institution_users(department)
    WHERE department IS NOT NULL;

-- Log completion
DO $$
BEGIN
    RAISE LOG 'Migration 026 completed: Institution user fields are now optional';
    RAISE LOG 'Users can register without providing registration number, department, or semester';
END $$;
