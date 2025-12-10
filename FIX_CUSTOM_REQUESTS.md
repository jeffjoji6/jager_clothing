# Fix for Custom Design Requests Not Appearing

## Problem Identified

The `custom_design_requests` table exists in your database, but the RLS (Row Level Security) policy is blocking anonymous users from inserting records.

**Error**: `new row violates row-level security policy for table "custom_design_requests"`

## Root Cause

The INSERT policy was created with `TO public` which doesn't include the `anon` role that unauthenticated users use when submitting the custom design form.

## Solution

You need to update the RLS policy to explicitly allow the `anon` role to insert records.

### Option 1: Run SQL in Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the following SQL:

```sql
-- Fix RLS policy for custom_design_requests to allow anonymous insertions
DROP POLICY IF EXISTS "Anyone can insert custom requests" ON custom_design_requests;

CREATE POLICY "Anyone can insert custom requests"
  ON custom_design_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
```

4. Click **Run** to execute the SQL
5. You should see a success message

### Option 2: Use Migration File

The migration file has been created at:
`supabase/migrations/20251211000003_fix_custom_requests_rls.sql`

To apply it, you would need to:
1. Get your Supabase service role key (not the anon key)
2. Add it to your `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`
3. Run the fix script: `npx tsx fix_rls.ts`

## Verification

After applying the fix, test the form:

1. Navigate to `http://localhost:5173/custom-design`
2. Fill out the form with test data
3. Submit the form
4. Go to `http://localhost:5173/admin/design-requests`
5. You should see your test submission!

## Why This Happened

The original migration used `TO public` which in PostgreSQL/Supabase means the `public` role, but anonymous users in Supabase use the `anon` role. By changing it to `TO anon, authenticated`, we allow both anonymous and authenticated users to insert records.
