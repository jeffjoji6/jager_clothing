-- Products Enhancement Schema
-- Run this to add new fields for detailed product management

-- Add new columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS amazon_url TEXT,
  ADD COLUMN IF NOT EXISTS amazon_asin TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS care_instructions TEXT;

-- Update product_variants to include actual price and discounted price per variant
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS actual_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock);

-- Update function to calculate discount percentage
CREATE OR REPLACE FUNCTION calculate_discount_percentage(actual_price DECIMAL, discounted_price DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF actual_price <= 0 OR discounted_price IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(((actual_price - discounted_price) / actual_price) * 100, 2);
END;
$$ LANGUAGE plpgsql;

