-- Function to check if an email already exists in auth.users
-- This allows the frontend to explicitly check for existing users and show a "Sign In" prompt.
-- SECURITY WARNING: This allows email enumeration. Only use if this trade-off is acceptable.

create or replace function check_email_exists(email_check text)
returns boolean
language plpgsql
security definer -- Runs with privileges of the creator (postgres), allowing access to auth.users
set search_path = public -- Secure search path
as $$
begin
  return exists (select 1 from auth.users where email = email_check);
end;
$$;

-- Grant execute permission to anon and authenticated users
grant execute on function check_email_exists(text) to anon, authenticated;
