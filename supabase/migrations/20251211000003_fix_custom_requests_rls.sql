-- Fix RLS policy for custom_design_requests to allow anonymous insertions
-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can insert custom requests" ON custom_design_requests;

-- Create a new policy that explicitly allows anon role
CREATE POLICY "Anyone can insert custom requests"
  ON custom_design_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Also ensure anon users can't read other people's requests
-- They should only be able to insert
DROP POLICY IF EXISTS "Anon users can only insert" ON custom_design_requests;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
