-- Add is_hidden column to products table
-- This allows admins to temporarily hide products from public view without deleting them

DO $$
BEGIN
    -- Add is_hidden column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_hidden'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_is_hidden ON products(is_hidden);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
