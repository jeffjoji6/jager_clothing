-- Add shipment tracking fields to custom_design_requests
-- This allows tracking when custom design orders were shipped and their tracking URLs

DO $$
BEGIN
    -- Add shipped_on column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_design_requests' 
        AND column_name = 'shipped_on'
    ) THEN
        ALTER TABLE custom_design_requests 
        ADD COLUMN shipped_on TIMESTAMPTZ;
    END IF;

    -- Add tracking_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_design_requests' 
        AND column_name = 'tracking_url'
    ) THEN
        ALTER TABLE custom_design_requests 
        ADD COLUMN tracking_url TEXT;
    END IF;

    -- Add tracking_number column if it doesn't exist (for AWB number)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_design_requests' 
        AND column_name = 'tracking_number'
    ) THEN
        ALTER TABLE custom_design_requests 
        ADD COLUMN tracking_number TEXT;
    END IF;
END $$;

-- Update the tracking function to include new fields
-- First drop the existing function to allow changing return type
DROP FUNCTION IF EXISTS get_status_by_ref(text);

CREATE FUNCTION get_status_by_ref(ref_input TEXT)
RETURNS TABLE (
  id UUID,
  request_ref TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  brief TEXT,
  user_email TEXT,
  admin_notes TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipped_on TIMESTAMPTZ
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
    NULL::TEXT as admin_notes,
    cdr.tracking_number,
    cdr.tracking_url,
    cdr.shipped_on
  FROM custom_design_requests cdr
  WHERE cdr.request_ref = ref_input;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_status_by_ref(TEXT) TO public;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
