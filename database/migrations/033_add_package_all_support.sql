-- Migration: Add package_all support for Black Friday
-- Purpose: Enable "All Assistants" package with annual subscription

-- 1. Update package_type constraint to include 'package_all'
ALTER TABLE public.user_packages
DROP CONSTRAINT IF EXISTS user_packages_package_type_check;

ALTER TABLE public.user_packages
ADD CONSTRAINT user_packages_package_type_check
CHECK (package_type IN ('package_3', 'package_6', 'package_all'));

-- 2. Update subscription_type constraint to include 'annual' for packages
ALTER TABLE public.user_packages
DROP CONSTRAINT IF EXISTS user_packages_subscription_type_check;

ALTER TABLE public.user_packages
ADD CONSTRAINT user_packages_subscription_type_check
CHECK (subscription_type IN ('monthly', 'semester', 'annual'));

-- 3. Create validation function for package assistant counts
-- This ensures package_3 has 3, package_6 has 6, and package_all can have any amount
CREATE OR REPLACE FUNCTION validate_package_assistants()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation for package_all (allows any count)
  IF NEW.package_type = 'package_all' THEN
    -- Ensure at least 1 assistant is selected
    IF array_length(NEW.assistant_ids, 1) IS NULL OR array_length(NEW.assistant_ids, 1) < 1 THEN
      RAISE EXCEPTION 'package_all must have at least 1 assistant';
    END IF;
    RETURN NEW;
  END IF;

  -- Validate package_3 has exactly 3 assistants
  IF NEW.package_type = 'package_3' THEN
    IF array_length(NEW.assistant_ids, 1) IS NULL OR array_length(NEW.assistant_ids, 1) != 3 THEN
      RAISE EXCEPTION 'package_3 must have exactly 3 assistants, got %', COALESCE(array_length(NEW.assistant_ids, 1), 0);
    END IF;
  END IF;

  -- Validate package_6 has exactly 6 assistants
  IF NEW.package_type = 'package_6' THEN
    IF array_length(NEW.assistant_ids, 1) IS NULL OR array_length(NEW.assistant_ids, 1) != 6 THEN
      RAISE EXCEPTION 'package_6 must have exactly 6 assistants, got %', COALESCE(array_length(NEW.assistant_ids, 1), 0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS validate_package_assistants_trigger ON public.user_packages;

CREATE TRIGGER validate_package_assistants_trigger
BEFORE INSERT OR UPDATE ON public.user_packages
FOR EACH ROW
EXECUTE FUNCTION validate_package_assistants();

-- 5. Create index for package_all queries
CREATE INDEX IF NOT EXISTS idx_user_packages_package_all
ON public.user_packages(user_id, package_type)
WHERE package_type = 'package_all';

-- 6. Add comment for documentation
COMMENT ON CONSTRAINT user_packages_package_type_check ON public.user_packages IS
'Allows package_3 (3 assistants), package_6 (6 assistants), or package_all (all available assistants)';

COMMENT ON CONSTRAINT user_packages_subscription_type_check ON public.user_packages IS
'Supports monthly, semester, and annual billing cycles for packages';
