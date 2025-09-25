-- Migration: Create user_profiles view for admin fallback functionality
-- This view provides access to user data without requiring Service Role Key

-- Drop view if it exists
DROP VIEW IF EXISTS public.user_profiles;

-- Create user_profiles view
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  u.raw_user_meta_data as user_metadata,
  u.updated_at
FROM auth.users u;

-- Grant permissions
GRANT SELECT ON public.user_profiles TO anon, authenticated;

-- Create RLS policy for the view
ALTER VIEW public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see all profiles (needed for admin functionality)
CREATE POLICY "Allow read access to user profiles" ON public.user_profiles
    FOR SELECT USING (true);

-- Comment on the view
COMMENT ON VIEW public.user_profiles IS 'View to access user data for admin functionality without Service Role Key';