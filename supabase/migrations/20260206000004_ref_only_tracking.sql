-- Create a function for "Ref Only" tracking (No Token Required)
CREATE OR REPLACE FUNCTION get_status_by_ref(
  ref_input TEXT
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
    cdr.request_ref, 
    cdr.status,
    cdr.created_at,
    cdr.brief,
    cdr.email,
    NULL::TEXT
  FROM custom_design_requests cdr
  WHERE cdr.request_ref = ref_input
  AND ref_input IS NOT NULL 
  AND length(ref_input) > 0;
END;
$$;

-- Grant access to public
GRANT EXECUTE ON FUNCTION get_status_by_ref(TEXT) TO public;

NOTIFY pgrst, 'reload schema';
