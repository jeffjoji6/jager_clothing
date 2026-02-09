-- Add shipment tracking fields to orders table
-- This extends the existing tracking_number field with URL and shipped date

DO $$
BEGIN
    -- Add shipped_on column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipped_on'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN shipped_on TIMESTAMPTZ;
    END IF;

    -- Add tracking_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'tracking_url'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN tracking_url TEXT;
    END IF;
END $$;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
