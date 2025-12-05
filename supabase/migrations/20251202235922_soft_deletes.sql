-- Add is_archived flag for Soft Deletes
-- This prevents data loss and foreign key constraint errors

-- 1. Add is_archived to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- 2. Add is_archived to product_variants
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- 3. Update RLS Policies to hide archived products from public
-- First, drop existing policies to avoid conflicts (safest approach)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON product_variants;

-- Re-create policies with archive check
CREATE POLICY "Products are viewable by everyone" 
ON products FOR SELECT 
USING (is_archived = FALSE);

CREATE POLICY "Product variants are viewable by everyone" 
ON product_variants FOR SELECT 
USING (is_archived = FALSE);

-- 4. Admin Policies (Admins should see everything, including archived)
-- Assuming admin policies already exist or admins bypass RLS via service role in some contexts.
-- But for the Admin UI which uses the authenticated user, we need explicit policies.

CREATE POLICY "Admins can view all products" 
ON products FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

CREATE POLICY "Admins can view all variants" 
ON product_variants FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_variants_archived ON product_variants(is_archived);
