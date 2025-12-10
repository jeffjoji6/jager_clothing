-- Add missing UPDATE, INSERT, DELETE policies for admins on products and product_variants
-- This fixes the issue where admins cannot edit or delete products

-- =============================================
-- PRODUCTS TABLE POLICIES
-- =============================================

-- Allow admins to update products (needed for editing and soft delete)
DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products"
ON products FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Allow admins to insert new products
DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products"
ON products FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Allow admins to delete products (hard delete if ever needed)
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
ON products FOR DELETE
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- =============================================
-- PRODUCT_VARIANTS TABLE POLICIES
-- =============================================

-- Allow admins to update product variants
DROP POLICY IF EXISTS "Admins can update product variants" ON product_variants;
CREATE POLICY "Admins can update product variants"
ON product_variants FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Allow admins to insert new product variants
DROP POLICY IF EXISTS "Admins can insert product variants" ON product_variants;
CREATE POLICY "Admins can insert product variants"
ON product_variants FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Allow admins to delete product variants
DROP POLICY IF EXISTS "Admins can delete product variants" ON product_variants;
CREATE POLICY "Admins can delete product variants"
ON product_variants FOR DELETE
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);
