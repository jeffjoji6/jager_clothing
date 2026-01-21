-- Allow admins to read order_items
-- This fixes the issue where Order Details and Invoices are empty for Admins

DROP POLICY IF EXISTS "Admins can read order_items" ON order_items;

CREATE POLICY "Admins can read order_items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Also ensure admins can read orders (just in case)
DROP POLICY IF EXISTS "Admins can read orders" ON orders;

CREATE POLICY "Admins can read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );
