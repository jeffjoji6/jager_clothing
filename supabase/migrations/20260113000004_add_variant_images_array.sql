-- Add images array column to product_variants
-- This allows multiple images per color (shared across all sizes)

-- Add new column
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS images TEXT[];

-- Migrate existing image_url to images array
UPDATE product_variants 
SET images = ARRAY[image_url]::TEXT[]
WHERE image_url IS NOT NULL AND image_url != '' AND images IS NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
