-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Jager Clothing',
  address TEXT NOT NULL DEFAULT 'Your Address',
  city TEXT NOT NULL DEFAULT 'City',
  state TEXT NOT NULL DEFAULT 'State',
  zip TEXT NOT NULL DEFAULT 'ZIP',
  phone TEXT NOT NULL DEFAULT '+91 XXXXX XXXXX',
  email TEXT NOT NULL DEFAULT 'info@jagerclothing.com',
  website TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  
  -- Bank Account Details
  bank_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  ifsc_code TEXT DEFAULT '',
  account_holder_name TEXT DEFAULT '',
  
  -- Invoice Settings
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO company_settings (id, company_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Jager Clothing')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and update
CREATE POLICY "Admins can read company settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update company settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
