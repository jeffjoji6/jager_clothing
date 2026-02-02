-- Add tracking_token column
ALTER TABLE custom_design_requests 
ADD COLUMN IF NOT EXISTS tracking_token TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_design_requests_tracking_token 
ON custom_design_requests(tracking_token);

-- Secure RPC function to get request status by ID and Token
-- This bypasses RLS for this specific lookup, allowing anon users to check their own status
CREATE OR REPLACE FUNCTION get_request_status(
  request_id UUID,
  secret_token TEXT
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  brief TEXT,
  user_email TEXT, -- renaming to avoid ambiguity, returning 'email' column
  admin_notes TEXT -- assuming we might add this, or just return status
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres/admin)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cdr.id,
    cdr.status,
    cdr.created_at,
    cdr.brief,
    cdr.email,
    NULL::TEXT -- Placeholder for notes if we don't have a column yet
  FROM custom_design_requests cdr
  WHERE cdr.id = request_id 
  AND cdr.tracking_token = secret_token
  -- Ensure token is not null/empty to prevent accidental matches
  AND secret_token IS NOT NULL 
  AND length(secret_token) > 0;
END;
$$;

-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION get_request_status(UUID, TEXT) TO anon, authenticated;

-- Reload schema
NOTIFY pgrst, 'reload schema';
