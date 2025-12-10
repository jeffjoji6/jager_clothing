-- Allow admins to update orders (needed for status updates)
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Reload schema cache
NOTIFY pgrst, 'reload config';
