-- Create a new function for simpler "Token Only" tracking
CREATE OR REPLACE FUNCTION get_status_by_token(
  token_input TEXT
)
RETURNS TABLE (
  id UUID,
  request_ref TEXT,
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
    cdr.request_ref, -- Also return the ref so user can see it
    cdr.status,
    cdr.created_at,
    cdr.brief,
    cdr.email,
    NULL::TEXT
  FROM custom_design_requests cdr
  WHERE cdr.tracking_token = token_input
  AND token_input IS NOT NULL 
  AND length(token_input) > 0;
END;
$$;

-- Grant access to public (guest users)
GRANT EXECUTE ON FUNCTION get_status_by_token(TEXT) TO public;

NOTIFY pgrst, 'reload schema';
