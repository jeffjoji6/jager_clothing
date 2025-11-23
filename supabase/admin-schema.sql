-- Admin Panel Additional Schema
-- Run this after the main schema.sql

-- First, update orders table to support order types and new statuses
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'collection' CHECK (order_type IN ('collection', 'basic_custom', 'pro_custom')),
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update order status enum to match admin requirements
-- Note: You may need to drop and recreate the constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'orders_status_check'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

ALTER TABLE orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('new', 'pending_print', 'printing', 'quality_check', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'pending', 'confirmed', 'processing'));

-- Admin Users Table (extends auth.users with role)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'staff', 'designer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jager Pro Custom Design Requests
CREATE TABLE IF NOT EXISTS jager_pro_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  quantity INTEGER,
  brief TEXT NOT NULL,
  status TEXT DEFAULT 'new_request' CHECK (status IN ('new_request', 'brief_review', 'assigned_to_designer', 'design_in_progress', 'waiting_for_approval', 'approved', 'rejected', 'converted_to_order')),
  assigned_designer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_files TEXT[], -- URLs to customer uploaded files
  designer_files TEXT[], -- URLs to designer draft files
  approved_mockup_url TEXT,
  notes TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- When converted to order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jager Basic Custom Requests (from CustomLabBasic form)
CREATE TABLE IF NOT EXISTS jager_basic_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  quantity INTEGER,
  uploaded_image_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processing', 'completed', 'cancelled')),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order History/Activity Log
CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- e.g., 'status_changed', 'tracking_added', 'note_added'
  description TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Email Log (for tracking sent emails)
CREATE TABLE IF NOT EXISTS customer_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  email_type TEXT, -- 'order_confirmation', 'shipping_update', 'promotional', etc.
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[], -- Available variables like {{customer_name}}, {{order_id}}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_jager_pro_requests_status ON jager_pro_requests(status);
CREATE INDEX IF NOT EXISTS idx_jager_pro_requests_assigned_designer ON jager_pro_requests(assigned_designer_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_emails_customer_id ON customer_emails(customer_id);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jager_pro_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE jager_basic_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (only admins can view)
CREATE POLICY "Admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for orders (admins can view and update all orders)
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
    OR auth.uid() = user_id -- Users can still see their own orders
  );

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- RLS Policies for jager_pro_requests (admins can view all)
CREATE POLICY "Admins can view all pro requests" ON jager_pro_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'designer')
    )
  );

CREATE POLICY "Admins can update pro requests" ON jager_pro_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'designer')
    )
  );

-- RLS Policies for jager_basic_requests
CREATE POLICY "Admins can view all basic requests" ON jager_basic_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can update basic requests" ON jager_basic_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- RLS Policies for order_history (admins can view all)
CREATE POLICY "Admins can view all order history" ON order_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can insert order history" ON order_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- RLS Policies for customer_emails (admins can view all)
CREATE POLICY "Admins can view all customer emails" ON customer_emails
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can insert customer emails" ON customer_emails
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- RLS Policies for email_templates (admins only)
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update trigger for order_history
CREATE OR REPLACE FUNCTION log_order_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_history (order_id, action, description, performed_by, metadata)
  VALUES (
    NEW.id,
    'status_changed',
    'Status changed from ' || COALESCE(OLD.status, 'new') || ' to ' || NEW.status,
    auth.uid(),
    jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS order_status_change_log ON orders;
CREATE TRIGGER order_status_change_log
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_order_history();

-- Add updated_at trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for jager_pro_requests
CREATE TRIGGER update_jager_pro_requests_updated_at BEFORE UPDATE ON jager_pro_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for jager_basic_requests
CREATE TRIGGER update_jager_basic_requests_updated_at BEFORE UPDATE ON jager_basic_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
