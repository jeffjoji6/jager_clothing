-- Add request_ref column for simple user-facing IDs
ALTER TABLE custom_design_requests 
ADD COLUMN IF NOT EXISTS request_ref TEXT;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_custom_design_requests_ref 
ON custom_design_requests(request_ref);

-- Update RPC to search by request_ref (TEXT) instead of id (UUID)
CREATE OR REPLACE FUNCTION get_request_status(
  search_ref TEXT, -- Now takes the simple Ref string
  secret_token TEXT
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  brief TEXT,
  user_email TEXT,
  admin_notes TEXT
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
  WHERE cdr.request_ref = search_ref 
  AND cdr.tracking_token = secret_token
  AND secret_token IS NOT NULL 
  AND length(secret_token) > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION get_request_status(TEXT, TEXT) TO public;

NOTIFY pgrst, 'reload schema';
