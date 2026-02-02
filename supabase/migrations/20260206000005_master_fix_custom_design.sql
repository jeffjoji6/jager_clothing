-- MASTER FIX: Custom Design Requests
-- Run this script to fix "DB Insert Errors" and ensure everything works.

-- 1. Ensure Table and ALL Columns Exist
CREATE TABLE IF NOT EXISTS custom_design_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT,
    email TEXT,
    phone TEXT,
    whatsapp_number TEXT,
    brief TEXT,
    quantity INTEGER,
    budget_range TEXT,
    status TEXT DEFAULT 'new',
    image_url TEXT,
    tracking_token TEXT,
    request_ref TEXT
);

-- Add columns if they are missing (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_design_requests' AND column_name = 'request_ref') THEN
        ALTER TABLE custom_design_requests ADD COLUMN request_ref TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_design_requests' AND column_name = 'tracking_token') THEN
        ALTER TABLE custom_design_requests ADD COLUMN tracking_token TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_design_requests' AND column_name = 'image_url') THEN
        ALTER TABLE custom_design_requests ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 2. Fix Permissions (RLS)
ALTER TABLE custom_design_requests ENABLE ROW LEVEL SECURITY;

-- Drop verify policies to ensure clean slate
DROP POLICY IF EXISTS "Anyone can insert custom requests" ON custom_design_requests;
DROP POLICY IF EXISTS "Public Insert" ON custom_design_requests;
DROP POLICY IF EXISTS "Admin Full Access" ON custom_design_requests;

-- Allow ANYONE (Public/Guest) to Insert
CREATE POLICY "Public Insert"
ON custom_design_requests FOR INSERT
TO public
WITH CHECK (true);

-- Allow Admins full access
CREATE POLICY "Admin Full Access"
ON custom_design_requests FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
);

-- 3. Create/Update Tracking Functions
-- Function for tracking by Reference ID (CD-XXXXXX)
CREATE OR REPLACE FUNCTION get_status_by_ref(ref_input TEXT)
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
  WHERE cdr.request_ref = ref_input;
END;
$$;

GRANT EXECUTE ON FUNCTION get_status_by_ref(TEXT) TO public;

NOTIFY pgrst, 'reload schema';
