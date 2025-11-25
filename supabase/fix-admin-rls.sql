-- Fix RLS Policies for admin_users
-- This resolves the circular dependency issue

-- Drop ALL existing policies on admin_users
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin record" ON admin_users;

-- CRITICAL: Allow users to view their own admin_users record first
-- This breaks the circular dependency - users can check if they're admin
CREATE POLICY "Users can view their own admin record" ON admin_users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own record (if needed)
-- This might not be necessary depending on your setup
CREATE POLICY "Users can insert their own admin record" ON admin_users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Note: "View all admin users" policy creates circular dependency
-- For now, we only allow viewing own record. 
-- If you need "view all", use a SECURITY DEFINER function instead
-- or disable RLS temporarily when querying all admins from admin panel
