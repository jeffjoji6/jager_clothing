-- Add missing columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS amazon_asin TEXT,
ADD COLUMN IF NOT EXISTS amazon_url TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS material TEXT,
ADD COLUMN IF NOT EXISTS care_instructions TEXT;

-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_amazon_asin ON products(amazon_asin);
