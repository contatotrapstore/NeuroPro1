-- Function to get user statistics securely without exposing auth.users directly
-- This resolves the SECURITY DEFINER view issues and provides real user data

CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS json
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  total_users INT;
  admin_count INT;
  admin_emails TEXT[] := ARRAY['gouveiarx@gmail.com', 'psitales@gmail.com', 'psitales.sales@gmail.com'];
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO total_users FROM auth.users;

  -- Count admin users
  SELECT COUNT(*) INTO admin_count
  FROM auth.users
  WHERE LOWER(email) = ANY(admin_emails);

  RETURN json_build_object(
    'total_users', total_users,
    'non_admin_users', total_users - admin_count,
    'admin_users', admin_count,
    'timestamp', NOW()
  );
END;
$$;

-- Grant permissions to authenticated users (for admin access)
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO authenticated;

-- Comment on function
COMMENT ON FUNCTION public.get_user_stats() IS 'Securely retrieves user statistics without exposing auth.users data directly';