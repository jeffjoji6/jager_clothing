-- Function to add an admin by email
-- SECURITY DEFINER allows lookup in auth.users
CREATE OR REPLACE FUNCTION add_admin_by_email(user_email TEXT, admin_role TEXT DEFAULT 'staff')
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 1. Find the user ID by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not found with this email');
  END IF;

  -- 2. Check if already an admin
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = target_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'User is already an admin');
  END IF;

  -- 3. Insert into admin_users
  INSERT INTO admin_users (id, role, permissions, created_at, updated_at)
  VALUES (target_user_id, admin_role, '{}', NOW(), NOW());

  RETURN jsonb_build_object('success', true, 'message', 'Admin added successfully', 'user_id', target_user_id);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_admin_by_email(TEXT, TEXT) TO authenticated;
