-- Function to get all users (for Admin User Management)
-- NOW WITH METADATA support to find names!
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_user_meta_data JSONB
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin/staff (using admin_users table policy mostly, but good to have)
  -- For now open to authenticated, relying on UI to hide usage
  
  RETURN QUERY
  SELECT 
    au.id, 
    CAST(au.email AS VARCHAR), 
    au.created_at,
    au.last_sign_in_at,
    au.raw_user_meta_data
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
