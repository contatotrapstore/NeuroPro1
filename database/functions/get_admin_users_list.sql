-- Function to get users list for admin panel
-- Returns user data without direct auth.users exposure

CREATE OR REPLACE FUNCTION public.get_admin_users_list(
  page_limit INT DEFAULT 20,
  page_offset INT DEFAULT 0
)
RETURNS json
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  users_data json;
  total_count INT;
  admin_emails TEXT[] := ARRAY['gouveiarx@gmail.com', 'psitales@gmail.com', 'psitales.sales@gmail.com'];
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM auth.users;

  -- Get paginated user data
  SELECT json_agg(
    json_build_object(
      'id', u.id,
      'email', u.email,
      'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'email_confirmed_at', u.email_confirmed_at,
      'is_admin', LOWER(u.email) = ANY(admin_emails),
      'name', COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
    )
  ) INTO users_data
  FROM auth.users u
  ORDER BY u.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;

  RETURN json_build_object(
    'users', COALESCE(users_data, '[]'::json),
    'total_count', total_count,
    'page_limit', page_limit,
    'page_offset', page_offset,
    'timestamp', NOW()
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_admin_users_list(INT, INT) TO authenticated;

-- Comment
COMMENT ON FUNCTION public.get_admin_users_list(INT, INT) IS 'Securely retrieves paginated user list for admin panel';