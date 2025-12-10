-- Migration to update admin_users RLS policy
-- Drop any existing select policy
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin record" ON admin_users;

-- Create a new policy that allows any user with role admin or staff to select all rows
CREATE POLICY "Admins can view all admin users"
ON admin_users
FOR SELECT
USING (
  role IN ('admin', 'staff')
);

-- Ensure SELECT privilege for authenticated role
GRANT SELECT ON admin_users TO authenticated;
