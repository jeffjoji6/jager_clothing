-- Optional: Function to view all admin users (bypasses RLS circular dependency)
-- Use this if you need to view all admin users from the admin panel
-- This function uses SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION get_all_admin_users()
RETURNS TABLE (
  id UUID,
  role TEXT,
  permissions JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin access required.';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.role,
    au.permissions,
    au.created_at,
    au.updated_at
  FROM admin_users au;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_admin_users() TO authenticated;

