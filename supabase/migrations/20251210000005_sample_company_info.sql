-- Insert sample Jager Clothing company information
INSERT INTO company_settings (
  id,
  company_name,
  address,
  city,
  state,
  zip,
  phone,
  email,
  website,
  gstin,
  bank_name,
  account_number,
  ifsc_code,
  account_holder_name,
  invoice_prefix,
  default_tax_rate
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Jager Clothing',
  'Shop No. 12, Fashion Plaza, MG Road',
  'Mumbai',
  'Maharashtra',
  '400001',
  '+91 98765 43210',
  'info@jagerclothing.com',
  'www.jagerclothing.com',
  '27AABCU9603R1ZM',
  'HDFC Bank',
  '50200012345678',
  'HDFC0001234',
  'Jager Clothing Pvt Ltd',
  'INV',
  0
)
ON CONFLICT (id) 
DO UPDATE SET
  company_name = EXCLUDED.company_name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  zip = EXCLUDED.zip,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  gstin = EXCLUDED.gstin,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  ifsc_code = EXCLUDED.ifsc_code,
  account_holder_name = EXCLUDED.account_holder_name,
  invoice_prefix = EXCLUDED.invoice_prefix,
  default_tax_rate = EXCLUDED.default_tax_rate,
  updated_at = NOW();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
