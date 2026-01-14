-- Ensure image_url column exists in product_variants
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'image_url') THEN
        ALTER TABLE product_variants ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
