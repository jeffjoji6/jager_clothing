/*
  SQL Script to Clear Test Data
  
  WARNING: This will permanently delete data from the following tables (if they exist):
  - custom_design_requests
  - notifications
  - order_items
  - invoices
  - orders
  
  It will PRESERVE:
  - products
  - product_variants
  - admin_users (Login credentials)
  - profiles / users
  - stocks
*/

DO $$ 
BEGIN

  -- 1. Clear Notifications (if exists)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    DELETE FROM "notifications";
    RAISE NOTICE 'Cleared notifications';
  END IF;

  -- 2. Clear Custom Design Requests
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_design_requests') THEN
    DELETE FROM "custom_design_requests";
    RAISE NOTICE 'Cleared custom_design_requests';
  END IF;

  -- 3. Clear Order Items first (FK dependency on orders)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    DELETE FROM "order_items";
    RAISE NOTICE 'Cleared order_items';
  END IF;

  -- 4. Clear Invoices (FK dependency on orders)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    DELETE FROM "invoices";
    RAISE NOTICE 'Cleared invoices';
  END IF;

  -- 5. Clear Orders
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    DELETE FROM "orders";
    RAISE NOTICE 'Cleared orders';
  END IF;

END $$;

-- Verify counts
SELECT 
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') as has_notifications_table,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_design_requests') as has_custom_requests_table,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') as has_orders_table;
