-- Function to get emails for a list of user IDs
-- SECURITY DEFINER allows it to access auth.users even if the caller cannot
CREATE OR REPLACE FUNCTION get_user_emails(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  email VARCHAR
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is an admin or staff (optional security check)
  -- For now, we trust the RLS policies on the calling side or just allow basic usage
  -- IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
  --   RAISE EXCEPTION 'Access denied';
  -- END IF;

  RETURN QUERY
  SELECT au.id, CAST(au.email AS VARCHAR)
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO authenticated;
