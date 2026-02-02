-- Fix Custom Design Requests Schema
-- This migration ensures the image_url column exists and policies are correct

DO $$
BEGIN
    -- Check if image_url column exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'custom_design_requests'
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE custom_design_requests ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Re-apply RLS policies just to be safe
ALTER TABLE custom_design_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can insert custom requests" ON custom_design_requests;
DROP POLICY IF EXISTS "Anon users can only insert" ON custom_design_requests;
DROP POLICY IF EXISTS "Admins can manage all custom requests" ON custom_design_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON custom_design_requests;

-- 1. INSERT Policy (Anyone, including anon)
CREATE POLICY "Anyone can insert custom requests"
  ON custom_design_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. SELECT Policy for Admins (View all)
CREATE POLICY "Admins can view all custom requests"
  ON custom_design_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- 3. UPDATE Policy for Admins (Update status)
CREATE POLICY "Admins can update custom requests"
  ON custom_design_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- 4. DELETE Policy for Admins
CREATE POLICY "Admins can delete custom requests"
  ON custom_design_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
