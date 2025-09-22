-- Add assistant_ids field to user_packages table
-- This field stores the array of assistant IDs selected in each package

-- Add the assistant_ids column as UUID array
ALTER TABLE public.user_packages
ADD COLUMN assistant_ids UUID[] NOT NULL DEFAULT '{}';

-- Add constraint to ensure package_3 has exactly 3 assistants and package_6 has exactly 6
ALTER TABLE public.user_packages
ADD CONSTRAINT check_assistant_count
CHECK (
  (package_type = 'package_3' AND array_length(assistant_ids, 1) = 3) OR
  (package_type = 'package_6' AND array_length(assistant_ids, 1) = 6)
);

-- Create GIN index for efficient array operations on assistant_ids
CREATE INDEX IF NOT EXISTS idx_user_packages_assistant_ids
ON public.user_packages USING GIN(assistant_ids);

-- Create index for combined package_type and assistant_ids lookups
CREATE INDEX IF NOT EXISTS idx_user_packages_type_assistants
ON public.user_packages(package_type, assistant_ids);

-- Add comment for documentation
COMMENT ON COLUMN public.user_packages.assistant_ids IS 'Array of assistant UUIDs included in this package';

-- Update RLS policies to include assistant_ids in allowed operations
DROP POLICY IF EXISTS "Users can view own packages" ON public.user_packages;
CREATE POLICY "Users can view own packages" ON public.user_packages
    FOR SELECT USING (auth.uid() = user_id);

-- Grant necessary permissions for assistant_ids operations
GRANT SELECT ON public.user_packages TO authenticated;
GRANT INSERT, UPDATE ON public.user_packages TO service_role;

-- Create function to validate assistant_ids format and count
CREATE OR REPLACE FUNCTION validate_package_assistants()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure assistant_ids is not NULL or empty
  IF NEW.assistant_ids IS NULL OR array_length(NEW.assistant_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'assistant_ids cannot be null or empty';
  END IF;

  -- Validate count based on package type
  IF NEW.package_type = 'package_3' AND array_length(NEW.assistant_ids, 1) != 3 THEN
    RAISE EXCEPTION 'package_3 must have exactly 3 assistants, got %', array_length(NEW.assistant_ids, 1);
  END IF;

  IF NEW.package_type = 'package_6' AND array_length(NEW.assistant_ids, 1) != 6 THEN
    RAISE EXCEPTION 'package_6 must have exactly 6 assistants, got %', array_length(NEW.assistant_ids, 1);
  END IF;

  -- Check for duplicate assistant IDs
  IF array_length(NEW.assistant_ids, 1) != (SELECT COUNT(DISTINCT unnest) FROM unnest(NEW.assistant_ids)) THEN
    RAISE EXCEPTION 'assistant_ids cannot contain duplicates';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate assistant_ids on insert/update
DROP TRIGGER IF EXISTS trigger_validate_package_assistants ON public.user_packages;
CREATE TRIGGER trigger_validate_package_assistants
  BEFORE INSERT OR UPDATE ON public.user_packages
  FOR EACH ROW EXECUTE FUNCTION validate_package_assistants();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 014: Successfully added assistant_ids field to user_packages table with validation';
END $$;