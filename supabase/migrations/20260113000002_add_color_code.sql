-- Add color_code column to product_variants table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'color_code') THEN
        ALTER TABLE product_variants ADD COLUMN color_code TEXT;
    END IF;
END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
