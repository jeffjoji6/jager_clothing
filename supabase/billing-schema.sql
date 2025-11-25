-- Billing and Invoice System Schema
-- Run this after admin-schema.sql

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Billing details
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 18.00, -- GST rate in percentage
  cgst DECIMAL(10,2) DEFAULT 0, -- Central GST (half of total GST)
  sgst DECIMAL(10,2) DEFAULT 0, -- State GST (half of total GST)
  total_tax DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Invoice dates
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Payment info
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'cancelled')),
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Company GST info (can be stored per invoice or in settings)
  company_gstin TEXT,
  
  -- Customer billing address
  billing_address JSONB,
  
  -- Invoice notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice line items (detailed breakdown)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 18.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company settings for billing
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL DEFAULT 'JÄGER CLOTHING',
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  email TEXT,
  gstin TEXT,
  pan TEXT,
  bank_name TEXT,
  bank_account TEXT,
  ifsc_code TEXT,
  default_tax_rate DECIMAL(5,2) DEFAULT 18.00,
  invoice_prefix TEXT DEFAULT 'INV',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- RLS Policies for invoice_items
CREATE POLICY "Users can view their invoice items" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND (
        invoices.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
      )
    )
  );

CREATE POLICY "Admins can manage invoice items" ON invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- RLS Policies for company_settings (admins only)
CREATE POLICY "Admins can manage company settings" ON company_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'INV';
  today DATE := CURRENT_DATE;
  year_month TEXT := TO_CHAR(today, 'YYYYMM');
  last_num INTEGER := 0;
  new_num INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get the last invoice number for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + LENGTH(year_month) + 3) AS INTEGER)), 0)
  INTO last_num
  FROM invoices
  WHERE invoice_number LIKE prefix || '-' || year_month || '-%';
  
  -- Increment
  new_num := last_num + 1;
  
  -- Format: INV-YYYYMM-001
  invoice_num := prefix || '-' || year_month || '-' || LPAD(new_num::TEXT, 3, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate GST breakdown
CREATE OR REPLACE FUNCTION calculate_gst(
  subtotal_amount DECIMAL,
  tax_rate DECIMAL DEFAULT 18.00
)
RETURNS TABLE (
  taxable_amount DECIMAL,
  cgst DECIMAL,
  sgst DECIMAL,
  total_gst DECIMAL,
  grand_total DECIMAL
) AS $$
DECLARE
  total_with_shipping DECIMAL;
  calc_taxable DECIMAL;
  calc_cgst DECIMAL;
  calc_sgst DECIMAL;
  calc_total_gst DECIMAL;
BEGIN
  -- Calculate GST on subtotal (assuming GST is included in price)
  -- If GST is inclusive: taxable = total / (1 + rate/100)
  -- GST split equally between CGST and SGST
  calc_taxable := subtotal_amount * 100 / (100 + tax_rate);
  calc_total_gst := subtotal_amount - calc_taxable;
  calc_cgst := calc_total_gst / 2;
  calc_sgst := calc_total_gst / 2;
  
  RETURN QUERY SELECT
    calc_taxable,
    calc_cgst,
    calc_sgst,
    calc_total_gst,
    subtotal_amount;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default company settings (optional)
INSERT INTO company_settings (id, company_name, default_tax_rate)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'JÄGER CLOTHING',
  18.00
)
ON CONFLICT (id) DO NOTHING;

