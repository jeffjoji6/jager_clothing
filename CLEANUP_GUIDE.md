# How to Clear Test Data for Production

To prepare your application for production, you need to clear the test data (orders, custom requests, invoices) while preserving your login credentials, products, and inventory.

## ⚠️ Warning
This operation is **irreversible**. It will permanently delete:
- All Order history
- All Order Items
- All Invoices
- All Custom Design Requests
- All Notifications

It will **KEEP**:
- Admin Users & Login Credentials
- Products & Variants
- Stock levels
- Company Settings

## Instructions

### Method 1: Supabase Dashboard (Recommended)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to the **SQL Editor** section (in the left sidebar)
4. Click **New Query**
5. Copy and paste the entire content of the `clear_test_data.sql` file provided below
6. Click **Run**

### SQL Script to Run

```sql
DO $$ 
BEGIN

  -- 1. Clear Notifications (Check if exists first)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    DELETE FROM "notifications";
    RAISE NOTICE 'Cleared notifications';
  END IF;

  -- 2. Clear Custom Design Requests
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_design_requests') THEN
    DELETE FROM "custom_design_requests";
    RAISE NOTICE 'Cleared custom_design_requests';
  END IF;

  -- 3. Clear Order Items (must be before orders)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    DELETE FROM "order_items";
    RAISE NOTICE 'Cleared order_items';
  END IF;

  -- 4. Clear Invoices (must be before orders)
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
```

### Method 2: Command Line (If you have service role key)

If you have configured your `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, you can run a script locally, but the Dashboard method is simpler.
