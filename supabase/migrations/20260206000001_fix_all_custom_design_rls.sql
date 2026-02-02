-- Comprehensive Fix for Custom Design Requests
-- This script ensures columns exist and RLS policies are 100% correct for Guest Access

-- 1. Ensure Columns Exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_design_requests' AND column_name = 'image_url') THEN
        ALTER TABLE custom_design_requests ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_design_requests' AND column_name = 'tracking_token') THEN
        ALTER TABLE custom_design_requests ADD COLUMN tracking_token TEXT;
    END IF;
END $$;

-- 2. Create Index for Token Lookups
CREATE INDEX IF NOT EXISTS idx_custom_design_requests_tracking_token 
ON custom_design_requests(tracking_token);

-- 3. Reset RLS Policies
ALTER TABLE custom_design_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts or stale bad policies
DROP POLICY IF EXISTS "Anyone can insert custom requests" ON custom_design_requests;
DROP POLICY IF EXISTS "Anon users can only insert" ON custom_design_requests;
DROP POLICY IF EXISTS "Admins can manage all custom requests" ON custom_design_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON custom_design_requests;
DROP POLICY IF EXISTS "Admins can view all custom requests" ON custom_design_requests;
DROP POLICY IF EXISTS "Admins can update custom requests" ON custom_design_requests;
DROP POLICY IF EXISTS "Admins can delete custom requests" ON custom_design_requests;

-- Policy A: INSERT (Public - Anon & Auth)
CREATE POLICY "Public Insert"
  ON custom_design_requests FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy B: ADMINS (Full Access)
CREATE POLICY "Admin Full Access"
  ON custom_design_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- Policy C: USERS (View own by ID)
-- This is optional if we rely on RPC for tracking, but good for logged-in users
CREATE POLICY "User View Own"
  ON custom_design_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Secure RPC Function for Guest Tracking
CREATE OR REPLACE FUNCTION get_request_status(
  request_id UUID,
  secret_token TEXT
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  brief TEXT,
  user_email TEXT,
  admin_notes TEXT -- Returning NULL for now as we don't have a column, but keeping interface consistent
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cdr.id,
    cdr.status,
    cdr.created_at,
    cdr.brief,
    cdr.email,
    NULL::TEXT
  FROM custom_design_requests cdr
  WHERE cdr.id = request_id 
  AND cdr.tracking_token = secret_token
  AND secret_token IS NOT NULL 
  AND length(secret_token) > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION get_request_status(UUID, TEXT) TO public;

-- Reload schema
NOTIFY pgrst, 'reload schema';
