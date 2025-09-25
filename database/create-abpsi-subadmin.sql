-- ABPSI Subadmin User Creation Script
-- Execute this in Supabase SQL Editor

-- 1. Create user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'academiabrasileirapsicanalise@gmail.com',
  crypt('ABPsi@2025', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NULL,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

-- 2. Get the ABPSI institution ID and user ID
WITH user_info AS (
  SELECT id as user_id
  FROM auth.users
  WHERE email = 'academiabrasileirapsicanalise@gmail.com'
),
institution_info AS (
  SELECT id as institution_id
  FROM institutions
  WHERE slug = 'abpsi'
)
-- 3. Create institution_users relationship
INSERT INTO institution_users (
  user_id,
  institution_id,
  role,
  is_active,
  enrolled_at,
  created_at
)
SELECT
  u.user_id,
  i.institution_id,
  'subadmin',
  true,
  NOW(),
  NOW()
FROM user_info u, institution_info i;

-- 4. Create user profile (if needed)
INSERT INTO profiles (
  id,
  email,
  name,
  created_at,
  updated_at
)
SELECT
  id,
  email,
  'ABPSI Administrator',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'academiabrasileirapsicanalise@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verification queries
SELECT 'User created successfully' as status;
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'academiabrasileirapsicanalise@gmail.com';
SELECT iu.role, iu.is_active, i.name as institution_name
FROM institution_users iu
JOIN institutions i ON iu.institution_id = i.id
JOIN auth.users u ON iu.user_id = u.id
WHERE u.email = 'academiabrasileirapsicanalise@gmail.com';