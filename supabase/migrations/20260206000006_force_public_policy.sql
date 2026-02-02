-- FORCE FIX for RLS "42501" Error
-- This script deletes ALL existing policies and creates the simplest possible allow-all policy for Inserts.

-- 1. Reset RLS on the table
ALTER TABLE custom_design_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_design_requests ENABLE ROW LEVEL SECURITY;

-- 2. Drop EVERY existing policy to avoid conflicts
DROP POLICY IF EXISTS "Public Insert" ON custom_design_requests;
DROP POLICY IF EXISTS "Anyone can insert custom requests" ON custom_design_requests;
DROP POLICY IF EXISTS "Anon users can only insert" ON custom_design_requests;
DROP POLICY IF EXISTS "Enable insert for all users" ON custom_design_requests;
DROP POLICY IF EXISTS "Admin Full Access" ON custom_design_requests;

-- 3. Create the SINGLE "Allow Insert" policy
CREATE POLICY "Enable insert for all users"
ON custom_design_requests
FOR INSERT
TO public
WITH CHECK (true);

-- 4. Re-create Admin Access (optional, but good to have)
CREATE POLICY "Enable all access for admins"
ON custom_design_requests
FOR ALL
TO authenticated
USING (
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'service_role' OR
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
);

NOTIFY pgrst, 'reload schema';
