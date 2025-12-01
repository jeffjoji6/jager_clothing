-- Create a verified test user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'verified@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Verified User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"verified@example.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
