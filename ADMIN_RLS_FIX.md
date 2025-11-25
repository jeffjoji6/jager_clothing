# Fix Admin RLS 500 Error

## Problem
Getting 500 error when accessing `/admin` due to circular dependency in RLS policies.

## Solution

Run this SQL in Supabase SQL Editor:

```sql
-- Drop ALL existing policies on admin_users
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin record" ON admin_users;

-- CRITICAL: Allow users to view their own admin_users record
-- This breaks the circular dependency
CREATE POLICY "Users can view their own admin record" ON admin_users
  FOR SELECT USING (auth.uid() = id);
```

## Why This Works

The original policy tried to check if a user is an admin by querying `admin_users`, but that query itself needed admin access - creating a circular dependency.

By allowing users to view **only their own record**, the app can:
1. Query `admin_users` where `id = auth.uid()` ✅
2. Check if that record exists and what role it has ✅
3. Grant access based on the role ✅

## After Running The Fix

1. Refresh your app
2. Try accessing `/admin` again
3. The 500 error should be resolved

## Optional: View All Admins

If you need to view all admin users (for the Settings page), you can:

1. Run `supabase/admin-view-all-function.sql` to create a helper function
2. Or temporarily disable RLS when needed
3. Or query all admins only after confirming the current user is an admin

## Verification

After running the fix, verify it works:

```sql
-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'admin_users';

-- Test query (should work if you're logged in)
SELECT * FROM admin_users WHERE id = auth.uid();
```

