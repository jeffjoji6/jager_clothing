-- Add image_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'custom_design_requests'
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE custom_design_requests ADD COLUMN image_url TEXT;
    END IF;
END $$;
