-- Migration to allow admins to view all admin users
-- Drop existing policy that restricts to own record
DROP POLICY IF EXISTS "Users can view their own admin record" ON admin_users;

-- Create new policy allowing admins (admin or staff) to view all admin users
CREATE POLICY "Admins can view all admin users"
ON admin_users
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

-- Grant select permission to authenticated role (already granted but ensure)
GRANT SELECT ON admin_users TO authenticated;
