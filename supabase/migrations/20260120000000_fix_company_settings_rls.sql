-- Fix RLS policies for company_settings to allow public read access
-- This ensures customers can read tax rates and shipping settings

-- Drop the old restrictive policy if it exists
DROP POLICY IF EXISTS "Admins can read company settings" ON company_settings;

-- Create new policy allowing everyone to read (authenticated and anonymous)
-- This is safe because company_settings only contains public info (Address, Tax Rate, etc.)
CREATE POLICY "Everyone can read company settings"
  ON company_settings FOR SELECT
  USING (true);

-- Ensure the update policy for admins remains (or create if missing, but usually we just leave it)
-- We don't need to touch the UPDATE policy as usage didn't report issues there.
