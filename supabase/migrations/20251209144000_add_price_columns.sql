-- Add missing price columns to products and variants tables
-- This fixes the "Could not find column" errors when editing products

-- 1. Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2);

-- 2. Add missing columns to product_variants table
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS actual_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- 3. Reload schema cache to apply changes immediately
NOTIFY pgrst, 'reload config';
