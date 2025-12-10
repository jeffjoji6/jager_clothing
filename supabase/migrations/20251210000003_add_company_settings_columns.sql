-- Add missing columns to company_settings table
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS account_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ifsc_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS account_holder_name TEXT DEFAULT '';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
