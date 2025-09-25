# 🔧 SQL Setup Required for Real User Data

## Current Status
- ✅ ABPSI users load successfully
- ⚠️ Showing temporary IDs instead of real emails
- 📧 Email format: `99ee2c10@abpsi.org.br` (user ID + domain)

## To Show Real Emails and Names

### Execute this SQL in Supabase SQL Editor:

```sql
-- Function to get institution users with real email and name data
CREATE OR REPLACE FUNCTION public.get_institution_users_with_details(
  institution_id_param UUID
)
RETURNS json
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  users_data json;
  admin_emails TEXT[] := ARRAY['gouveiarx@gmail.com', 'psitales@gmail.com', 'psitales.sales@gmail.com'];
BEGIN
  -- Get institution users with real auth.users data
  SELECT json_agg(
    json_build_object(
      'id', iu.id,
      'user_id', iu.user_id,
      'role', iu.role,
      'is_active', iu.is_active,
      'enrolled_at', iu.enrolled_at,
      'last_access', iu.last_access,
      'email', u.email,
      'name', COALESCE(
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1)
      ),
      'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'is_admin', LOWER(u.email) = ANY(admin_emails)
    )
  ) INTO users_data
  FROM public.institution_users iu
  JOIN auth.users u ON u.id = iu.user_id
  WHERE iu.institution_id = institution_id_param
  ORDER BY iu.enrolled_at DESC;

  RETURN COALESCE(users_data, '[]'::json);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_institution_users_with_details(UUID) TO authenticated;
```

### After SQL Execution:
1. System will automatically detect the function
2. Real emails will replace temporary IDs
3. Real names will be extracted from user metadata

### System Design:
- ✅ **Fallback working**: Shows temporary data if SQL not executed
- ✅ **Auto-upgrade**: Uses real data when SQL function is available
- ✅ **No downtime**: System works immediately, improves when SQL is added