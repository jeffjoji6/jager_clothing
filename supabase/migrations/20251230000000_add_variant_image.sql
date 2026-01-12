-- Add image_url column to product_variants table
ALTER TABLE product_variants ADD COLUMN image_url TEXT;

-- Update RLS policies if necessary (usually existing policies cover all columns, but good to be safe)
-- Assuming existing policies allow read public, write admin.
