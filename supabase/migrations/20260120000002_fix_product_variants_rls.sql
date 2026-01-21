-- Allow admins to read product_variants and products
-- This ensures that image URLs and descriptions can be fetched in Order Details

-- Product Variants
DROP POLICY IF EXISTS "Admins can read product_variants" ON product_variants;

CREATE POLICY "Admins can read product_variants"
  ON product_variants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Products
DROP POLICY IF EXISTS "Admins can read products" ON products;

CREATE POLICY "Admins can read products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );
